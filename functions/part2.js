
// --- MAIN FUNCTION (HTTP) ---
// Converted to HTTP onRequest for Cloud Run / Firebase HTTP functions + CORS + long timeout
exports.generateContent = onRequest(
    { timeoutSeconds: 540, memory: "1GiB" },
    async (req, res) => {
        // ---------- CORS ----------
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

        if (req.method === "OPTIONS") {
            return res.status(204).send("");
        }
        // ---------- end CORS ----------

        try {


            // Authenticate: expect Firebase ID token in Authorization Bearer header
            let uid = null;
            let authTokenDecoded = null;
            try {
                const authHeader = req.get("Authorization") || req.get("authorization") || "";
                if (authHeader && authHeader.startsWith("Bearer ")) {
                    const idToken = authHeader.split("Bearer ")[1].trim();
                    authTokenDecoded = await admin.auth().verifyIdToken(idToken);
                    uid = authTokenDecoded.uid;
                }
            } catch (err) {
                console.warn("Token verification failed:", err && err.message ? err.message : err);
            }

            if (!uid) {
                return res.status(401).json({ error: "unauthenticated: You must be logged in." });
            }

            // Parse request body
            let body = req.body;


            if (Buffer.isBuffer(body)) {

                try {
                    body = JSON.parse(body.toString());
                } catch (e) {
                    console.error("DEBUG: Failed to parse Buffer body:", e);
                }
            } else if (typeof body === 'string') {
                try {
                    body = JSON.parse(body);

                } catch (e) {
                    console.error("DEBUG: Failed to parse body string:", e);
                }
            }

            // Handle "data" wrapper (common in Firebase Callable or manual wrapping)
            if (body && body.data && !body.type) {

                body = body.data;
            }



            const { type, payload } = body || {};

            // Extract variables from payload
            const { topic, image, options: rawOptions, videoLength } = payload || {};

            // Fix: Frontend sends options at payload root, not nested.
            // We construct 'options' from payload root if 'rawOptions' is missing.
            const options = rawOptions || {
                numOutputs: payload?.numOutputs,
                numIdeas: payload?.numIdeas,
                length: payload?.length,
                language: payload?.language,
                includeHashtags: payload?.includeHashtags,
                includeEmojis: payload?.includeEmojis,
                outputSize: payload?.outputSize,
                videoLength: payload?.videoLength || videoLength,
                numVariations: payload?.numVariations
            };



            // --- SECURITY: Validate and sanitize user inputs ---
            if (topic) {
                try {
                    payload.topic = validateInput(topic, 'topic', 2000);
                } catch (error) {
                    return res.status(400).json({ error: error.message });
                }
            }
            if (payload?.prompt) {
                try {
                    payload.prompt = validateInput(payload.prompt, 'prompt', 3000);
                } catch (error) {
                    return res.status(400).json({ error: error.message });
                }
            }

            // --- 1. CREDIT CALCULATION & DEDUCTION ---
            let requiredCredits = 0;
            let currentCredits = 0; // Fix: Declare currentCredits in outer scope
            const baseCosts = {
                caption: 1,
                idea: 1,
                tweet: 1,
                videoScript: 1,
                post: 1,        // Base cost for 1 variation
                image: 2,       // Standalone image generation
                smartImage: 1,  // Reduced from 2 to 1
                dynamicGuide: 0,
                dynamicGuideIterative: 0,
                finalGuide: 0,
                payForGuideReset: 10 // Cost for resetting the guide
            };

            if (type && baseCosts.hasOwnProperty(type)) {
                requiredCredits = baseCosts[type];
            }

            // Dynamic cost for 'post' type based on variations
            if (type === "post") {
                const vars = options?.numVariations || 1;
                requiredCredits = vars * 1; // 1 credit per text variation
            }

            // Additional credit for vision API (when image is uploaded as input)
            // if (image) {
            //     requiredCredits += 1;
            // }



            // Hashtags and CTA are now FREE (removed additional cost logic)

            // Transaction for credit deduction
            if (requiredCredits > 0) {
                // Use 'brands' collection as the primary source of truth for credits
                const brandRef = db.collection("brands").doc(uid);

                try {
                    await db.runTransaction(async (transaction) => {
                        const brandSnap = await transaction.get(brandRef);

                        // Use outer scope currentCredits

                        if (!brandSnap.exists) {
                            console.log(`Brand profile missing for ${uid}, creating default...`);
                            const initialData = {
                                uid: uid,
                                email: authTokenDecoded?.email || "",
                                brandName: authTokenDecoded?.name || "New Creator",
                                credits: 5,
                                creditsUsed: 0,
                                plan: "free",
                                onboarded: false,
                                createdAt: FieldValue.serverTimestamp()
                            };
                            transaction.set(brandRef, initialData);
                            currentCredits = 5;
                        } else {
                            const brandData = brandSnap.data();
                            currentCredits = brandData.credits || 0;
                        }

                        if (currentCredits < requiredCredits) {
                            throw new Error(`resource-exhausted: Insufficient credits. You need ${requiredCredits} credits but have ${currentCredits}.`);
                        }

                        transaction.update(brandRef, {
                            credits: currentCredits - requiredCredits,
                            creditsUsed: FieldValue.increment(requiredCredits)
                        });
                    });
                } catch (err) {
                    const m = err && err.message ? err.message : String(err);
                    if (m.includes("resource-exhausted")) {
                        return res.status(429).json({ error: m.replace("resource-exhausted: ", "") });
                    }
                    console.error("Transaction error:", err);
                    return res.status(500).json({ error: "Credit deduction failed." });
                }
            }

            // --- SPECIAL HANDLER: Guide Reset ---
            if (type === "payForGuideReset") {
                return res.status(200).json({ success: true, message: "Guide reset paid successfully." });
            }

            // Validation: Most types need a topic or image, but guides use other payload data
            if (!topic && !image &&
                type !== "dynamicGuide" &&
                type !== "finalGuide" &&
                type !== "dynamicGuideIterative" &&
                type !== "generateRoadmapSteps" &&
                type !== "generateChecklist" &&
                type !== "generatePillars" &&
                type !== "generateRoadmapBatch"
            ) {
                return res.status(400).json({
                    error: "invalid-argument: The function must be called with a 'topic' or an 'image'.",
                    debug: {
                        receivedType: type,
                        receivedBody: body,
                        contentType: req.get('content-type')
                    }
                });
            }

            let brand = {};
            const useBrandData = payload?.useBrandData !== false;
            if (useBrandData) {
                try {
                    const brandSnap = await db.collection("brands").doc(uid).get();
                    if (brandSnap.exists) brand = brandSnap.data();
                } catch (e) {
                    console.error("Could not fetch brand data:", e);
                }
            }

            // --- HELPER: Construct Prompts ---
            const toneInstruction = createToneInstruction(payload.tone || payload.tones);
            const captionAdvancedInstruction = createCaptionAdvancedInstructions(options || {});
            const ideaAdvancedInstruction = createIdeaAdvancedInstructions(options || {});
            const jsonOutputFormat = getJsonFormat(options || {});
            const imageInstruction = image ? "**CRITICAL:** Analyze the attached image. Use the visual details, mood, and context of the image as the PRIMARY source for your content generation." : "";

            const prompts = {
                caption: `
          You are an expert social media strategist. Generate ${options?.numOutputs || 3} unique, high-energy Instagram captions.
          **Brand Details:** ${brand.brandName || 'Generic Brand'}, ${brand.industry || 'General'}, ${brand.tone || 'Professional'}, ${brand.audience || 'Everyone'}
          **Post Topic:** ${topic || "See attached image"}
          ${imageInstruction}
          **Tone Instructions:** ${toneInstruction}
          **Advanced Instructions:** ${captionAdvancedInstruction}
          - Length: ${options?.length || "Medium"}
          - Language: ${options?.language || "English"}
          ${options?.includeHashtags ? "- Include 5-7 relevant hashtags." : "- DO NOT include hashtags."}
          ${options?.includeEmojis ? "- Use emojis to make it engaging." : "- DO NOT use emojis."}
          
          **Format Instructions:**
          - DO NOT include any introductory text.
          - You MUST return ONLY a valid JSON array matching this exact structure: ${jsonOutputFormat}
        `,
                idea: `
          You are an expert social media strategist. Give ${options?.numOutputs || options?.numIdeas || 10} unique, "viral-style" content ideas.
          **Brand Details:** ${brand.brandName || 'Generic Brand'}, ${brand.industry || 'General'}, ${brand.tone || 'Professional'}, ${brand.audience || 'Everyone'}
          **Topic:** ${topic || "See attached image"}
          ${imageInstruction}
          **Tone Instructions:** ${toneInstruction}
          **Advanced Instructions:** ${ideaAdvancedInstruction}
          - Language: ${options?.language || "English"}
          
          **Instructions:**
          - Format each idea EXACTLY as follows:
            Video Title: [Catchy Title]
            Length: [Approximate time, e.g., 30-60 seconds]
            Idea: [One sentence summary]
            Explanation:
            - [Point 1]
            - [Point 2]
            - [Point 3]
          - Separate each idea with a blank line.
          - DO NOT include any introductory text.
        `,
                post: `
          You are an expert social media copywriter. Write a full, engaging social media post.
          **Brand Details:** ${brand.brandName || 'Generic Brand'}, ${brand.industry || 'General'}, ${brand.tone || 'Professional'}, ${brand.audience || 'Everyone'}
          **Post Topic:** ${topic || "See attached image"}
          ${imageInstruction}
          **Tone Instructions:** ${toneInstruction}
          **Advanced Instructions:**
          - Length: ${options?.length || "Medium"} (Approx ${options?.length === 'Short' ? '50-100' : options?.length === 'Long' ? '200-300' : '100-150'} words).
          - Language: ${options?.language || "English"}
          - Strong hook, valuable content, clear CTA.
          ${options?.includeHashtags ? "- Include 5-7 relevant hashtags." : "- DO NOT include hashtags."}
          ${options?.includeEmojis ? "- Use emojis." : "- DO NOT use emojis."}
          - DO NOT include any introductory text.
        `,
                videoScript: `
          You are a professional YouTube and TikTok scriptwriter. Write a script for a video.
          **Target Length:** ${options?.videoLength || videoLength || 'Medium'} (${(options?.videoLength || videoLength) === 'Short' ? '30s-1min' : (options?.videoLength || videoLength) === 'Long' ? '10-15min' : '2-5min'})
          **Brand Details:** ${brand.brandName || 'Generic Brand'}, ${brand.industry || 'General'}, ${brand.tone || 'Professional'}, ${brand.audience || 'Everyone'}
          **Video Topic:** ${topic || "See attached image"}
          ${imageInstruction}
          **Tone Instructions:** ${toneInstruction}
          - Language: ${options?.language || "English"}
          
          **IMPORTANT: Return ONLY a valid JSON object with this exact structure:**
          {
            "intro": [
              { "text": "Option 1: Hook and intro..." },
              { "text": "Option 2: Alternative hook and intro..." }
            ],
            "mainContent": "The main body of the script...",
            "outro": [
              { "text": "Option 1: Call to action..." },
              { "text": "Option 2: Alternative call to action..." }
            ]
          }
          
          **Instructions:**
          - Provide 2 distinct options for the Intro (Hook).
          - Provide 2 distinct options for the Outro (CTA).
          - Provide 1 solid Main Content section that fits the target length.
          - Natural, spoken-word style.
          - NO markdown formatting outside the JSON.
        `,
                tweet: `
          You are a witty and viral-style Twitter/X copywriter. Generate ${options?.numOutputs || 3} short, punchy tweets.
          **Brand Details:** ${brand.brandName || 'Generic Brand'}, ${brand.tone || 'Professional'}
          **Topic:** ${topic || "See attached image"}
          ${imageInstruction}
          **Tone Instructions:** ${toneInstruction}
          - Language: ${options?.language || "English"}
          ${options?.includeHashtags ? "- Include 1-2 hashtags." : "- DO NOT include hashtags."}
          ${options?.includeEmojis ? "- Use emojis." : "- DO NOT use emojis."}
          - Length: ${options?.length || "Medium"}
          - Max Length: ${options?.outputSize ? options.outputSize : options?.length === 'Long' ? 1000 : options?.length === 'Short' ? 140 : 280} characters per tweet.
          
          **IMPORTANT: Return ONLY a valid JSON object with this exact structure:**
          {
            "tweets": [
              { "text": "Tweet option 1..." },
              { "text": "Tweet option 2..." },
              { "text": "Tweet option 3..." }
            ]
          }

          **Instructions:**
          - DO NOT include any introductory text.
          - Return ONLY the JSON object.
        `,
                dynamicGuide: `
          You are an expert brand strategist. Create a dynamic onboarding flow for a new creator.
          **Niche:** ${payload?.coreData?.niche || 'General'}
          **Tone:** ${(payload?.coreData?.tone || []).join(', ')}
          **Commitment:** ${payload?.coreData?.commitment || 'Unknown'}
          
          **Goal:** Generate 3-5 follow-up questions to refine their strategy.
          **Schema:** You MUST return a valid JSON object matching this schema: ${JSON.stringify(payload?.schema || {})}
          **Instructions:**
          - Questions should be specific to their niche.
          - Return ONLY the JSON object. No markdown formatting.
        `,
                dynamicGuideIterative: `
          You are an expert brand strategist. Conduct a deep-dive interview to build a perfect social media strategy.
          **Core Context:**
          - Niche: ${payload?.coreData?.niche || 'General'}
          - Goal: ${payload?.coreData?.goal || 'Growth'}
          - Tone: ${(payload?.coreData?.tone || []).join(', ')}
          
          **Conversation History:**
          ${(payload?.history || []).map((h, i) => `Q${i + 1}: ${h.question}\nA: ${h.answer}`).join('\n\n')}
          
          **Goal:** Ask ONE single follow-up question to clarify their strategy, audience, or resources.
          **Constraint:** 
          - Stop asking questions when you have a clear picture (usually 3-5 questions total).
          - **Minimalist Style:** Keep questions short, simple, and easy to understand. Avoid jargon.
          - **Simple Options:** If providing options, keep them short (1-3 words).
          
          **Schema:** Return a JSON object:
          {
            "ready": boolean, // true if you have enough info
            "question": { // Required if ready is false
               "text": "Short, simple question string",
               "type": "text" | "radio" | "select",
               "options": ["Short Opt 1", "Short Opt 2"] // Only for radio/select
            }
          }
        `,
                generateRoadmapSteps: `
          You are an expert social media manager. Create a "Zero to Hero" roadmap timeline.
          **Core Data:** ${JSON.stringify(payload?.formData || {})}
          **Dynamic Answers:** ${JSON.stringify(payload?.dynamicAnswers || [])}
          **Verified Tools List:** ${JSON.stringify(VERIFIED_TOOLS)}
          
          **Instructions:**
          - Generate **30-50 high-impact steps** from "Day 1" to "Day 30+".
          - **Schema:** Return a JSON object with ONLY "roadmapSteps":
            "roadmapSteps": [
              {
                "title": "Short Action Title",
                "description": "Brief 1-sentence summary",
                "detailedDescription": "Specific instructions on WHAT and HOW.",
                "subNodes": [
                  { "title": "Sub-Task 1", "steps": ["Step 1.1", "Step 1.2"] },
                  { "title": "Sub-Task 2", "steps": ["Step 2.1", "Step 2.2"] }
                ],
                "phase": "Foundation" | "Content Creation" | "Growth" | "Monetization",
                "timeEstimate": "e.g., 15 mins",
                "suggestions": ["Suggestion 1", "Suggestion 2"],
                "resources": [{ "name": "Tool Name", "url": "https://..." }],
                "generatorLink": "/video-script-generator" | "/post-generator" | "/idea-generator" | null
              }
            ]
          - **CRITICAL TOOL RULE:** For the "resources" field, YOU MUST ONLY SELECT TOOLS FROM THE PROVIDED "Verified Tools List". 
          - Do NOT invent tools. Do NOT use tools like "Gaming Forms".
          - If a relevant tool exists in the Verified List, include it.
          - If NO relevant tool exists in the Verified List, return an empty array [] for "resources".
          - Return ONLY the JSON object.
        `,
                generateChecklist: `
          You are an expert social media manager. Create a 7-Day Launchpad Checklist.
          **Core Data:** ${JSON.stringify(payload?.formData || {})}
          
          **Instructions:**
          - Generate exactly 7 actionable tasks for the first week.
          - **Schema:** Return a JSON object with ONLY "sevenDayChecklist":
            "sevenDayChecklist": ["Day 1 Task", "Day 2 Task", ..., "Day 7 Task"]
          - Return ONLY the JSON object.
        `,
                generatePillars: `
          You are an expert social media manager. Define Core Content Pillars.
          **Core Data:** ${JSON.stringify(payload?.formData || {})}
          
          **Instructions:**
          - Generate 3-5 core content themes/pillars.
          - **Schema:** Return a JSON object with ONLY "contentPillars":
            "contentPillars": ["Pillar 1", "Pillar 2", "Pillar 3"]
          - Return ONLY the JSON object.
        `,
                generateRoadmapBatch: `
          You are an expert social media manager. Create a batch of roadmap steps.
          **Core Data:** ${JSON.stringify(payload?.formData || {})}
          **Dynamic Answers:** ${JSON.stringify(payload?.dynamicAnswers || [])}
          **Previous Steps Context:** ${JSON.stringify(payload?.previousSteps || [])}. Ensure new steps logically follow these.
          **Batch Context:** Generating steps ${payload?.startStep} to ${payload?.endStep} (Total ${payload?.numSteps} steps in this batch).
          **Verified Tools List:** ${JSON.stringify(VERIFIED_TOOLS)}
          
          **Instructions:**
          - Generate exactly ${payload?.numSteps} high-impact, **extremely granular** steps.
          - **Granularity Rule:** Break down every major task into "baby steps". 
            - Example: Instead of just "Create a Video", break it down: "Download OBS", "Configure Audio Settings", "Find Background Music", "Record Raw Footage", "Import to Editor", etc.
          - **Scope:** Ensure the steps cover the full journey: Foundation -> Setup -> Creation -> Distribution -> Growth -> Monetization.
          - These steps should logically follow previous steps and fit into the overall "Zero to Hero" journey.
          - **Schema:** Return a JSON object with ONLY "steps":
            "steps": [
              {
                "title": "Short Action Title",
                "description": "Brief 1-sentence summary",
                "detailedDescription": "Specific instructions on WHAT and HOW.",
                "subNodes": [
                  { "title": "Sub-Task 1", "steps": ["Step 1.1", "Step 1.2"] },
                  { "title": "Sub-Task 2", "steps": ["Step 2.1", "Step 2.2"] }
                ],
                "phase": "Foundation" | "Content Creation" | "Growth" | "Monetization",
                "timeEstimate": "e.g., 15 mins",
                "suggestions": ["Suggestion 1", "Suggestion 2"],
                "resources": [{ "name": "Tool Name", "url": "https://..." }],
                "generatorLink": "/video-script-generator" | "/post-generator" | "/idea-generator" | null
              }
            ]
          - **CRITICAL TOOL RULE:** For the "resources" field, YOU MUST ONLY SELECT TOOLS FROM THE PROVIDED "Verified Tools List". 
          - Do NOT invent tools. Do NOT use tools like "Gaming Forms".
          - If a relevant tool exists in the Verified List, include it.
          - If NO relevant tool exists in the Verified List, return an empty array [] for "resources".
          - Return ONLY the JSON object.
        `,
                finalGuide: `
          You are an expert social media manager. Create a comprehensive "Zero to Hero" action plan.
          **Core Data:** ${JSON.stringify(payload?.formData || {})}
          **Dynamic Answers:** ${JSON.stringify(payload?.dynamicAnswers || [])}
          **Verified Tools List:** ${JSON.stringify(VERIFIED_TOOLS)}
          
          **Instructions:**
          - Analyze the user's goal and generate **60+ high-impact, extremely granular steps**. Focus on quality and detail.
          - **Granularity Rule:** Break down every major task into "baby steps".
          - The steps should take the user from "Day 1" (Setup) to "Day 60+" (Monetization/Growth).
          - **Schema:** You MUST return a JSON object with the following keys:
            1. "roadmapSteps": An array of objects (as defined below).
            2. "sevenDayChecklist": An array of 7 strings, representing a specific actionable checklist for the first week.
            3. "contentPillars": An array of 3-5 strings, representing the core content themes.

          - "roadmapSteps" must be an array of objects, each with:
            - "title": Short action title (e.g., "Create Instagram Bio").
            - "description": Brief 1-sentence summary.
            - "detailedDescription": A detailed explanation of WHAT to do and HOW to do it. Be specific.
            - "subNodes": An array of 2-4 sub-nodes. Each sub-node object must have:
              - "title": Title of the sub-task.
              - "steps": An array of 2-3 very short, easy strings explaining how to do it.
            - "phase": One of ["Foundation", "Content Creation", "Growth", "Monetization"].
            - "timeEstimate": ACCURATE and PRECISE time estimate (e.g., "15 mins", "2 hours", "45 mins"). Do NOT use ranges like "1-2 days". Be specific.
            - "suggestions": An array of **3-5 specific suggestions** (e.g., video ideas, hook examples, tools to try) where applicable.
            - "resources": An array of objects { "name": "Tool Name", "url": "https://..." } for relevant tools/software.
            - **CRITICAL:** For "resources", ONLY use tools from the Verified Tools List: ${JSON.stringify(VERIFIED_TOOLS.map(t => t.name))}.
            - If no verified tool is relevant, use an empty array [].
            - "generatorLink": IF the step can be done by our AI tools, return one of: ["/video-script-generator", "/post-generator", "/idea-generator", "/caption-generator", "/tweet-generator", "/image-generator"].Otherwise null.
          - Return ONLY the JSON object.No markdown formatting.
        `
            };
