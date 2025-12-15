// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
require("dotenv").config();
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

admin.initializeApp();
const db = admin.firestore();

const rateLimit = require("express-rate-limit");
// --- SECURITY: Input Validation Helper ---
function validateInput(text, fieldName = 'input', maxLength = 5000) {
    if (!text) throw new Error(`${fieldName} is required`);
    if (typeof text !== 'string') throw new Error(`${fieldName} must be a string`);
    if (text.length > maxLength) throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
    return text.replace(/<[^>]*>/g, '').trim(); // Remove HTML tags
}
// --- SECURITY: Rate Limiter (100 requests per 15 minutes) ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- GEMINI SETUP ---
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
// Initialize Gemini with the provided API Key (env var)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY);

// --- GROQ SETUP ---
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GROQ_TEXT_MODEL = "groq/llama-3.3-70b-versatile"; // Or just "llama-3.3-70b-versatile" if using standard Groq ID, assume user provided ID is valid or mapped
// Note: Groq SDK uses "llama-3.3-70b-versatile" usually. The user provided "groq/llama-3.3-70b-versatile" which might be OpenRouter style, but we'll try to strip or use as is. 
// If using official Groq Cloud, IDs are usually sans "groq/".
// Let's use a helper to clean it if needed or try both.
const GROQ_VISION_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct"; // As requested

async function callGroqText(prompt, systemInstruction = "You are a helpful assistant.", model = "llama-3.3-70b-versatile") {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            model: model,
            temperature: 0.7,
            max_tokens: 4096,
        });
        return completion.choices[0]?.message?.content || "";
    } catch (e) {
        console.error("Groq Text API Error:", e);
        throw e;
    }
}

async function callGroqVision(prompt, base64Image) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            model: GROQ_VISION_MODEL,
        });
        return completion.choices[0]?.message?.content || "";
    } catch (e) {
        // Fallback to standard vision model if custom one fails
        console.warn(`Groq Vision (${GROQ_VISION_MODEL}) failed, trying fallback...`);
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                model: "llama-3.2-90b-vision-preview",
            });
            return completion.choices[0]?.message?.content || "";
        } catch (e2) {
            console.error("Groq Vision Fallback Error:", e2);
            throw e;
        }
    }
}

const STRATEGIST_SYSTEM_PROMPT = `You are an elite, MrBeast-level, top-0.1% thumbnail strategist and visual director.

Your job is to generate HIGHLY CLICKABLE thumbnails for:
YouTube, Instagram, Twitter/X, Facebook, and LinkedIn.

This system must work for ANY topic, including topics never seen before.

ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CORE RESPONSIBILITIES
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

1. Automatically analyze the given topic/title and infer:
   - Content type
   - Emotional hook
   - Scale (personal / group / massive)
   - Environment (game, studio, street, challenge, tech, lifestyle, business, education, etc.)
   - Realism level required (real photo, cinematic realism, stylized, game art, CGI)
   - Target audience intent (shock, curiosity, learning, dominance, money, fun, controversy, inspiration)

2. From this analysis, YOU MUST:
   - Derive a suitable THUMBNAIL ARCHETYPE
   - Create one if it does not already exist

Thumbnail archetypes are NOT limited.
You may invent new archetypes dynamically when needed.

ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
ARCHETYPE LEARNING RULE (CRITICAL)
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

Reference images provided by the user define CANONICAL visual archetypes.

When a new topic resembles:
- the scale
- structure
- emotion
- or visual logic of any reference image

ΓåÆ You MUST adapt that visual language EVEN FOR NEW TOPICS.

Do NOT copy visuals.
Do NOT reuse faces.
DO replicate:
- composition logic
- subject hierarchy
- repetition patterns
- emotion framing
- background cleanliness or chaos
- realism vs exaggeration

If no reference matches, create a NEW archetype using proven high-CTR YouTube logic.

ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
THUMBNAIL CREATION RULES
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

ΓÇó Thumbnails must be understandable in < 0.3 seconds
ΓÇó One clear idea only
ΓÇó Extreme clarity with minimal clutter
ΓÇó Emotion MUST be visible
ΓÇó Composition must guide the eye instantly
ΓÇó If numbers are used, they must feel LARGE-SCALE or HIGH-STAKES

Never design a ΓÇ£prettyΓÇ¥ thumbnail.
Design a CURIOSITY WEAPON.

ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
TEXT RENDERING RULES (CRITICAL)
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

If text is absolutely necessary (e.g., for a sign, UI element, or title):
- Keep it UNDER 5 WORDS.
- Spelling must be PERFECT.
- Font must be LARGE and LEGIBLE.
- If the concept works without text, prefer NO TEXT.
- Do NOT include "gibberish" or small unreadable text.

ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
PLATFORM ADAPTATION (IMPORTANT)
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

For EVERY topic, generate thumbnails adapted for:

YouTube:
- Highest exaggeration
- Boldest composition
- Max curiosity

Instagram:
- Clean crop
- Less text
- Strong focal subject

Twitter/X:
- Minimal text
- One visual idea
- Clear contrast

Facebook:
- Emotion-driven
- Easy to understand instantly

LinkedIn:
- Professional tone ONLY if suitable
- Still curiosity-based, never boring
- No cringe or clickbait language

The ARCHETYPE stays the same.
Only framing, polish, and text aggressiveness change.

ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
OUTPUT FORMAT (MANDATORY)
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

For each request, output a JSON object with these keys:

{
  "analysis": "Detected Topic Breakdown...",
  "archetype": "Chosen or Created Thumbnail Archetype...",
  "composition": "Visual Composition Description...",
  "subjectPlacement": "Subject Placement...",
  "emotion": "Emotion & Body Language...",
  "background": "Background Style...",
  "textStrategy": "Text Strategy...",
  "platformPrompts": {
    "YouTube": "Full prompt for YouTube...",
    "Instagram": "Full prompt for Instagram...",
    "Twitter/X": "Full prompt for Twitter/X...",
    "Facebook": "Full prompt for Facebook...",
    "LinkedIn": "Full prompt for LinkedIn..."
  }
}

Each platform prompt must be ready to use directly with an image generation model.

ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
QUALITY BAR
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

Assume thumbnails will compete against:
- MrBeast
- PewDiePie
- PopularMMOs
- Top gaming creators
- Top business and tech creators

If the thumbnail would NOT beat them in attention,
ITERATE internally until it does.

No safe answers.
No generic designs.
Only viral-grade output.`;

const VERIFIED_TOOLS = [
    { name: "Video Script Generator", url: "/generate?type=videoScript", description: "Generate viral scripts with hooks." },
    { name: "Tweet Generator", url: "/generate?type=tweet", description: "Create engaging threads." },
    { name: "Caption Generator", url: "/generate?type=caption", description: "Write perfect captions." },
    { name: "Content Idea Generator", url: "/generate?type=idea", description: "Brainstorm viral topics." },
    { name: "CapCut", url: "https://www.capcut.com", description: "Video editing." },
    { name: "Canva", url: "https://www.canva.com", description: "Graphic design." },
    { name: "OBS Studio", url: "https://obsproject.com", description: "Streaming software." }
];

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
                generateRoadmapBatch: 0,
                generateGuideOutline: 0,
                generateModuleSteps: 0,
                generatePillars: 0,
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
                type !== "generateRoadmapBatch" &&
                type !== "generateGuideOutline" &&
                type !== "generateModuleSteps" &&
                type !== "generatePillars" &&
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
            // CRITICAL: If useBrandData is false, ignore any tone/brand info from payload
            const toneInstruction = useBrandData
                ? createToneInstruction(payload.tone || payload.tones)
                : "Use a neutral, engaging, and professional tone.";
            const captionAdvancedInstruction = createCaptionAdvancedInstructions(options || {});
            const ideaAdvancedInstruction = createIdeaAdvancedInstructions(options || {});
            const jsonOutputFormat = getJsonFormat(options || {});
            const imageInstruction = image ? "**CRITICAL:** Analyze the attached image. Use the visual details, mood, and context of the image as the PRIMARY source for your content generation." : "";

            const prompts = {
                caption: `
          You are an expert social media strategist. Generate ${options?.numOutputs || 3} unique, high-energy Instagram captions.
          ${useBrandData ? `**Brand Details:** ${brand.brandName || 'Unknown'}, ${brand.industry || 'General'}, ${brand.tone || 'Professional'}, ${brand.audience || 'Everyone'}` : ''}
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
          ${useBrandData ? `**Brand Details:** ${brand.brandName || 'Unknown'}, ${brand.industry || 'General'}, ${brand.tone || 'Professional'}, ${brand.audience || 'Everyone'}` : ''}
          **Topic:** ${topic || "See attached image"}
          ${imageInstruction}
          **Tone Instructions:** ${toneInstruction}
          **Advanced Instructions:** ${ideaAdvancedInstruction}
          - Language: ${options?.language || "English"}
          
          **CRITICAL DIVERSITY REQUIREMENTS:**
          - Each idea MUST use a DIFFERENT content format/approach
          - FORBIDDEN: Repeating similar patterns (e.g., multiple "showcase X" ideas)
          - REQUIRED: Use varied formats such as:
            * Tutorial/How-To
            * Showcase/Demo
            * Challenge
            * Top Tips/List
            * Behind-the-Scenes
            * Q&A/FAQ
            * Transformation/Before-After
            * Story/Narrative
            * Comparison/Review
            * Myth-Busting/Facts
          - Each idea should have a DISTINCT angle, hook, and structure
          - Avoid repetitive language patterns across ideas
          
          **OUTPUT FORMAT - MANDATORY JSON:**
          Return ONLY a valid JSON object with this EXACT structure:
          {
            "contentIdeas": [
              {
                "title": "Catchy, Unique Video Title",
                "length": "30-60 seconds",
                "idea": "One sentence summary",
                "explanation": ["Point 1", "Point 2", "Point 3"]
              }
            ]
          }
          
          **CRITICAL:**
          - Return ONLY the JSON object, NO markdown, NO explanations
          - Use lowercase field names: "title", "length", "idea", "explanation"
          - Ensure each idea has ALL four fields
          - explanation must be an array of strings
        `,
                post: `
          You are an expert social media copywriter. Write a full, engaging social media post.
          ${useBrandData ? `**Brand Details:** ${brand.brandName || 'Unknown'}, ${brand.industry || 'General'}, ${brand.tone || 'Professional'}, ${brand.audience || 'Everyone'}` : ''}
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
          ${useBrandData ? `**Brand Details:** ${brand.brandName || 'Unknown'}, ${brand.industry || 'General'}, ${brand.tone || 'Professional'}, ${brand.audience || 'Everyone'}` : ''}
          **Video Topic:** ${topic || "See attached image"}
          ${imageInstruction}
          **Tone Instructions:** ${toneInstruction}
          - Language: ${options?.language || "English"}
          
          **IMPORTANT: Return ONLY a valid JSON object with this exact structure:**
          {
            "intro": [
              "Hook line 1: Attention-grabbing opening...",
              "Setup line 2: Introduce the topic...",
              "Promise line 3: What viewers will learn..."
            ],
            "mainContent": [
              "Point 1: First key topic or scene...",
              "Point 2: Second key topic or scene...",
              "Point 3: Third key topic or scene...",
              "Point 4: Fourth key topic (if needed)...",
              "Point 5: Fifth key topic (if needed)..."
            ],
            "outro": [
              "Recap line 1: Summarize key takeaways...",
              "CTA line 2: Call to action (like, subscribe, comment)...",
              "Closing line 3: Final thought or teaser for next video..."
            ]
          }
          
          **Instructions:**
          - **intro**: 2-4 dialogue points for the hook and setup
          - **mainContent**: 3-7 dialogue points, each a clear talking point or scene
          - **outro**: 2-4 dialogue points for closing and CTA
          - Each point should be 1-2 sentences max
          - Write in natural, spoken-word style
          - Points should flow logically
          - NO markdown formatting outside the JSON.
        `,
                tweet: `
          You are an expert Twitter/X copywriter. Generate ${options?.numOutputs || 3} tweets that EXACTLY match the specified word count.
          
          **MANDATORY WORD COUNT: ${options?.outputSize || 40} WORDS PER TWEET**
          
          **THIS IS A STRICT REQUIREMENT. YOU MUST:**
          - Generate tweets with EXACTLY ${options?.outputSize || 40} words (±3 words tolerance)
          - Acceptable range: ${Math.max(7, (options?.outputSize || 40) - 3)} to ${(options?.outputSize || 40) + 3} words
          - Count every single word including hashtags and emojis as separate words
          - NEVER generate tweets shorter than ${Math.max(7, (options?.outputSize || 40) - 3)} words
          
          ${useBrandData ? `**Brand Context:**
          - Brand: ${brand.brandName || 'Unknown'}
          - Tone: ${brand.tone || 'Professional'}
          - Industry: ${brand.industry || 'General'}
          - Audience: ${brand.audience || 'General'}
          ` : ''}
          **Topic:** ${topic || "See attached image"}
          ${imageInstruction}
          
          **Tone Instructions:** ${toneInstruction}
          - Language: ${options?.language || "English"}
          ${options?.includeHashtags ? "- Include 1-2 hashtags (count as words)." : "- DO NOT include hashtags."}
          ${options?.includeEmojis ? "- **MANDATORY: Include 2-4 emojis** naturally integrated throughout the tweet (count each emoji as 1 word). DO NOT just add emojis at the end - weave them into the message." : "- **STRICTLY FORBIDDEN: DO NOT use any emojis.**"}
          
          **EXAMPLES OF CORRECT LENGTH:**
          
          ${options?.outputSize === 10 ? `
          [10-WORD EXAMPLE${options?.includeEmojis ? " WITH EMOJIS" : ""}]:
          ${options?.includeEmojis
                            ? '"Master 📱 social media in just 10 minutes daily using this 🚀"'
                            : '"Master social media in just 10 minutes daily using this."'}
          (Word count: 10 ✓${options?.includeEmojis ? ' | Emojis: 2 ✓' : ''})
          ` : options?.outputSize === 20 ? `
          [20-WORD EXAMPLE${options?.includeEmojis ? " WITH EMOJIS" : ""}]:
          ${options?.includeEmojis
                            ? '"Stop ✋ overthinking your content strategy. The secret 🔑 to viral posts isn\'t perfection, it\'s consistency. Post daily 📆, analyze weekly, improve monthly. That\'s it. 💯"'
                            : '"Stop overthinking your content strategy. The secret to viral posts isn\'t perfection, it\'s consistency. Post daily, analyze weekly, improve monthly. That\'s it."'}
          (Word count: 20 ✓${options?.includeEmojis ? ' | Emojis: 4 ✓' : ''})
          ` : `
          [40-WORD EXAMPLE${options?.includeEmojis ? " WITH EMOJIS" : ""}]:
          ${options?.includeEmojis
                        ? '"Just hit 10K followers 🎉 using a simple 3-step system: 1) Post daily at 8am ⏰ when your audience is most active 2) Use storytelling 📖 instead of selling in every post 3) Engage with 10 comments 💬 before posting your own content. Took me 90 days. You can do it faster. 🚀"'
                        : '"Just hit 10K followers using a simple 3-step system: 1) Post daily at 8am when your audience is most active 2) Use storytelling instead of selling in every post 3) Engage with 10 comments before posting your own content. Took me 90 days. You can do it faster."'}
          (Word count: 40 ✓${options?.includeEmojis ? ' | Emojis: 4 ✓' : ''})
          `}
          
          **UNACCEPTABLE - TOO SHORT (REJECT THESE):**
          ❌ "Great content here" (3 words - TOO SHORT)
          ❌ "Love this post" (3 words - TOO SHORT)
          ❌ "Amazing tips for growth" (4 words - TOO SHORT)
          
          **JSON OUTPUT FORMAT (MANDATORY):**
          {
            "tweets": [
              { "text": "Your ${options?.outputSize || 40}-word tweet here..." },
              { "text": "Another ${options?.outputSize || 40}-word tweet..." },
              { "text": "Third ${options?.outputSize || 40}-word tweet..." }
            ]
          }
          
          **CRITICAL VALIDATION BEFORE RETURNING:**
          - Count the words in EACH tweet
          - Verify EACH tweet has ${Math.max(7, (options?.outputSize || 40) - 3)}-${(options?.outputSize || 40) + 3} words
          ${options?.includeEmojis ? "- Verify EACH tweet has 2-4 emojis naturally integrated (NOT just at the end)" : "- Verify EACH tweet has ZERO emojis"}
          - If any tweet is too short, REWRITE it to meet the word count
          - ONLY return tweets that meet ALL requirements
          
          **FINAL INSTRUCTION:**
          Return ONLY the JSON object. NO explanations, NO markdown formatting, NO extra text.
        `,
                dynamicGuide: `
          You are an expert **Content Director**.
          **Your Goal:** Narrow down the exact **Sub-Niche** and **Format** for this creator.
          
          **KNOWN CONTEXT (DO NOT ASK ABOUT THESE):**
          - Niche: ${payload?.coreData?.niche || 'General'}
          - Tone: ${(payload?.coreData?.tone || []).join(', ')}
          - Commitment: ${payload?.coreData?.commitment || 'Unknown'}
          - Target Audience: ${payload?.coreData?.audience || 'General'}
          - Primary Goal: ${payload?.coreData?.goal || 'Growth'}
          - Content Preference: ${(payload?.coreData?.preference || []).join(', ')}
          
          **Goal:** Generate 3-5 DEEP follow-up questions to exactly define their content. 
          **Constraint:** 
          - **Focus on Narrowing:** Convert broad niches into specific sub-genres.
            - *If Gaming:* Ask "FPS, RPG, or Horror?" AND "Live Streaming or Produced Videos?"
            - *If Cooking:* Ask "Quick Recipes, ASMR, or Educational Science?"
            - *If Vlogging:* Ask "Daily Life, Travel, or Tech Reviews?"
          - **Focus on Production Style:** Ask about "Faceless vs On-Camera" or "Voiceover vs Music Only".
          - **DO NOT** ask about "Challenges", "Feelings", or "Broad Goals".
          
          **Schema:** You MUST return a valid JSON object matching this schema: ${JSON.stringify(payload?.schema || {})}
          **Instructions:**
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
                generateGuideOutline: `
          You are an expert **Agent Orchestrator** for YouTube creators.
          **Your Goal:** Design a multi-agent production workflow for a creator in the **${payload?.formData?.coreTopic || 'General'}** niche.
          
          **Inputs:**
          - Niche: ${payload?.formData?.coreTopic}
          - Goal: ${payload?.formData?.primaryGoal}
          - Experience: ${payload?.formData?.experienceLevel || 'Beginner'}
          
          **Instructions:**
          1.  **Analyze the Niche:** What specific skills are needed? (e.g. Gaming needs "OBS Technician", Makeup needs "Lighting Specialist").
          2.  **Define 6-8 Modules:** Break the lifecycle into phases.
          3.  **Appoint Agents:** For EACH module, assign a specific **Expert Persona** to handle it.
          
          **Schema:** Return a JSON object with ONLY "modules":
          {
            "modules": [
               { 
                 "title": "Module 1: [Specific Phase Name]", 
                 "agentPersona": "e.g. 'OBS Specialist' or 'Beauty Lighting Expert'",
                 "goal": "Brief description of what this agent should achieve."
               },
               ...
            ]
          }
        `,
                generateModuleSteps: `
          You are an expert **${payload?.agentPersona || 'Technical Specialist'}**.
          **Task:** Write the "Instruction Manual" for **${payload?.moduleTitle}**.
          
          **Context:**
          - Niche: ${payload?.formData?.coreTopic}
          - Current Phase: ${payload?.moduleTitle}
          - **Your Role:** ${payload?.agentPersona}
          - **Verified Tools List:** ${JSON.stringify(VERIFIED_TOOLS)}
          
          **CRITICAL INSTRUCTION: ATOMIC GRANULARITY**
          - Act purely as the **${payload?.agentPersona}**. Use your specific jargon and tools.
          - You are NOT giving advice. You are giving **COMMANDS**.
          - **Micro-Steps:** Break down this single phase into **6-10 atomic actions**.
          - **Sequential Logic:** Step 2 must be physically impossible without Step 1.
          
          **TOOL SUGGESTION RULE (MANDATORY):**
          - You **MUST** populate the "resources" array for at least 80% of the steps.
          - **PRIORITY:** If a step involves writing, brainstorming, or planning, YOU MUST recommend one of these internal tools:
            * "Video Script Generator" (for scripts)
            * "Content Idea Generator" (for topics)
            * "Tweet Generator" (for text/threads)
            * "Caption Generator" (for posts)
          - **SECONDARY:** Use CapCut, OBS, Canva for production tasks.
          - **Example:** { "name": "Video Script Generator", "url": "/generate?type=videoScript" }
          
          **Schema:** Return a JSON object with ONLY "steps":
          {
            "steps": [
              {
                "title": "Action Verb Title",
                "description": "Direct command.",
                "detailedDescription": "Exact physical/digital action required.",
                "subNodes": [],
                "phase": "${payload?.moduleTitle}",
                "timeEstimate": "e.g. 5 mins",
                "suggestions": ["Tip 1"],
                "resources": []
              }
            ]
          }
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
        `,
                generateRoadmapBatch: `
          You are the **Head of Content Strategy (The Orchestrator)**. 
          You lead a team of elite specialized agents to build a "Zero to Hero" roadmap.
          
          **THE MISSION:** Generate steps ${payload?.startStep} to ${payload?.endStep} of 30.
          
          **YOUR AGENT TEAM:**
          1. ⚡ **The Viral Engineer:** Obsessed with hooks, retention, algorithms, and trends. Handles high-views content.
          2. ❤️ **The Community Builder:** Obsessed with trust, engagement, DMs, and psychology. Handles loyalty tasks.
          3. 💰 **The Monetization Architect:** Obsessed with funnels, sales, offers, and ROI. Handles business tasks.
          4. 🏗️ **The Systems Engineer:** Obsessed with efficiency, batching, and tools. Handles setup and workflow.
          
          **CONTEXT:**
          - **Niche/Category:** "${payload?.formData?.coreTopic}" (e.g., Gaming, Vlogging, Cooking, Animation).
          - **Goal:** ${payload?.formData?.primaryGoal}
          - **Experience:** ${payload?.formData?.experienceLevel || 'Beginner'}
          - **Previous Steps Context:** ${JSON.stringify(payload?.previousSteps || [])}
          
          **CRITICAL INSTRUCTION: "UNIVERSAL GROUPING PROTOCOL"**
          - **GROUP RELATED ACTIONS:** Do not fragment a single logical task.
            - *Bad:* "1. Buy Flour. 2. Buy Eggs. 3. Buy Milk."
            - *Good:* "1. Gather All Ingredients." (Detailed Desc: 1. Buy Flour. 2. Buy Eggs...)
            - *Bad:* "1. Download App. 2. Install App."
            - *Good:* "1. Install & Configure Software." (Detailed Desc: 1. Download. 2. Install. 3. Open.)
          
          - **PACING GUIDE (THE "ZERO TO HERO" ARC):**
            - **Steps 1-6 (Foundation):** SETUP & ENVIRONMENT.
               - *Gaming:* Install OBS, Steam, Discord.
               - *Cooking:* Buy knives, organize kitchen, set up tripod.
               - *Vlogging:* Clear phone storage, clean lens, find lighting.
            - **Steps 7-15 (The Content Lab):** FIRST CREATION CYCLE.
               - Ideation -> Scripting/Planning -> Recording -> Editing -> Thumbnail.
            - **Steps 16-25 (Growth Engine):** PUBLISHING & OPTIMIZATION.
               - Uploading, Titles, Tags, Analytics Review, Reply to Comments.
            - **Steps 26-30 (Monetization & Scaling):**
               - Affiliates, Sponsorship preparation, Workflow batching.
          
          **CRITICAL:** IF YOU ARE ON STEP 10 AND STILL DOING "SETUP", YOU HAVE FAILED. MOVE TO CREATION.
          
          **INSTRUCTIONS:**
           1. **Analyze Niche:** Adapt purely to "${payload?.formData?.coreTopic}". Use the correct tools for THAT niche.
           2. **Cluster Actions:** Combine small physical actions into ONE roadmap step.
           3. **Baby-Step Descriptions:** The 'Detailed Description' must still list the specific micro-actions/clicks.
          
          **Schema:** Return a JSON object with ONLY "steps":
          {
            "steps": [
              {
                "title": "Action-Oriented Title (e.g., 'Setup Filming Environment')",
                "description": "One sentence summary of the goal.",
                "detailedDescription": "1. Clear a space on your counter.\n2. Set up your tripod/phone stand.\n3. Position your lights 45 degrees to the subject.",
                "phase": "Foundation" | "Content Creation" | "Growth" | "Monetization",
                "timeEstimate": "e.g., 10 mins",
                "suggestions": ["Specific Technical Tip"],
                "resources": [{ "name": "Tool Name", "url": "https://..." }], 
                "agentAssigned": "Viral Engineer" | "Community Builder" | "Monetization Architect" | "Systems Engineer",
                "generatorLink": null
              }
            ]
          }
          
          **CRITICAL TOOL RULE:** 
          - POPULATE "resources" AGGRESSIVELY. Always link the tool being used in that step.
          - Verified List: ${JSON.stringify(VERIFIED_TOOLS || [])}.
          - Return ONLY the JSON object.
        `
            };

            // --- HELPER: Composite Face on Thumbnail (YouTube Style) ---
            async function compositeFaceOnThumbnail(baseImageBase64, faceImageBase64, position = "bottom-right") {
                try {
                    // Remove base64 prefix if present
                    const baseData = baseImageBase64.replace(/^data:image\/\w+;base64,/, "");
                    const faceData = faceImageBase64.replace(/^data:image\/\w+;base64,/, "");

                    // Convert base64 to buffers
                    const baseBuffer = Buffer.from(baseData, "base64");
                    const faceBuffer = Buffer.from(faceData, "base64");

                    // Get base image dimensions
                    const base = sharp(baseBuffer);
                    const baseMetadata = await base.metadata();
                    const baseWidth = baseMetadata.width;
                    const baseHeight = baseMetadata.height;

                    // Calculate face overlay size (20% of base image height for MrBeast style)
                    const faceSize = Math.round(baseHeight * 0.35); // Larger for impact

                    // Process face: circular crop with border
                    const processedFace = await sharp(faceBuffer)
                        .resize(faceSize, faceSize, { fit: 'cover' })
                        .composite([
                            {
                                input: Buffer.from(
                                    `< svg width = "${faceSize}" height = "${faceSize}" >
                <circle cx="${faceSize / 2}" cy="${faceSize / 2}" r="${faceSize / 2}" fill="white" />
                                    </svg > `
                                ),
                                blend: 'dest-in'
                            }
                        ])
                        .extend({
                            top: 8,
                            bottom: 8,
                            left: 8,
                            right: 8,
                            background: { r: 255, g: 255, b: 255, alpha: 1 } // White border
                        })
                        .toBuffer();

                    // Calculate position
                    let left, top;
                    const margin = 30; // Margin from edges

                    if (position === "bottom-left") {
                        left = margin;
                        top = baseHeight - faceSize - margin - 16; // -16 for border
                    } else if (position === "bottom-right") {
                        left = baseWidth - faceSize - margin - 16;
                        top = baseHeight - faceSize - margin - 16;
                    } else if (position === "top-left") {
                        left = margin;
                        top = margin;
                    } else { // top-right
                        left = baseWidth - faceSize - margin - 16;
                        top = margin;
                    }

                    // Composite face onto base image
                    const result = await base
                        .composite([{
                            input: processedFace,
                            left: left,
                            top: top
                        }])
                        .toBuffer();

                    // Convert back to base64
                    return `data: image / png; base64, ${result.toString('base64')} `;
                } catch (e) {
                    console.error("Face compositing error:", e);
                    throw e;
                }
            }

            // --- SMART IMAGE GENERATION (Elite Strategist Logic) ---
            if (type === "smartImage") {


                try {
                    const userPlatform = (payload?.platform || "Social Media").toLowerCase();
                    const userIdea = payload?.topic || "Content";
                    const userImage = payload?.image;
                    let finalAspectRatio = payload?.aspectRatio || "1:1";

                    // 1. CALL STRATEGIST (Gemini 1.5 Flash)

                    const strategy = await generateThumbnailStrategy(userIdea, userPlatform, userImage, finalAspectRatio);

                    let finalPrompt = "";

                    if (strategy && strategy.platformPrompts) {
                        // Extract prompt for the specific platform
                        let pKey = "YouTube"; // Default
                        if (userPlatform.includes("insta")) pKey = "Instagram";
                        else if (userPlatform.includes("twitter") || userPlatform.includes("x")) pKey = "Twitter/X";
                        else if (userPlatform.includes("facebook")) pKey = "Facebook";
                        else if (userPlatform.includes("linkedin")) pKey = "LinkedIn";

                        finalPrompt = strategy.platformPrompts[pKey] || strategy.platformPrompts["YouTube"];

                    } else {
                        // Fallback if strategist fails
                        console.warn("Strategist failed, using fallback prompt.");
                        finalPrompt = `Create a high - quality ${userPlatform} image for topic: ${userIdea}. Aspect Ratio: ${finalAspectRatio} `;
                    }

                    // Append Aspect Ratio instruction strictly
                    // We also add pixel dimensions for clarity
                    let pixelDims = "1024x1024";
                    let ratioKeywords = "Square";
                    if (finalAspectRatio === "16:9") { pixelDims = "1920x1080"; ratioKeywords = "Wide Landscape"; }
                    else if (finalAspectRatio === "9:16") { pixelDims = "1080x1920"; ratioKeywords = "Tall Vertical"; }
                    else if (finalAspectRatio === "4:5") { pixelDims = "1080x1350"; ratioKeywords = "Vertical Portrait"; }
                    else if (finalAspectRatio === "1.91:1") { pixelDims = "1200x628"; ratioKeywords = "Wide Link"; }

                    // PREPEND to make it the first thing the model sees
                    finalPrompt = `${ratioKeywords} image(${finalAspectRatio}, ${pixelDims}).${finalPrompt} \n\nEnsure the image is ${ratioKeywords} with aspect ratio ${finalAspectRatio}.`;

                    // TEXT ACCURACY INSTRUCTION
                    finalPrompt += `\n\nCRITICAL TEXT RULE: If any text appears in the image, the spelling MUST BE PERFECT.No typos, no gibberish.If you cannot render the text perfectly, do not include it.`;



                    // 2. GENERATE IMAGE (Gemini 2.5 Flash Image)
                    const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

                    // We pass ONLY the prompt to the image model to let it generate from scratch based on the Strategist's description.
                    // This avoids "copying" the reference image directly.
                    let parts = [{ text: finalPrompt }];

                    const result = await imageModel.generateContent(parts);
                    const response = await result.response;

                    // --- COST TRACKING ---
                    try {
                        const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
                        await logSystemCost(uid, "gemini-2.5-flash-image", usage.promptTokenCount, usage.candidatesTokenCount, type);
                    } catch (logErr) {
                        console.error("Failed to log cost:", logErr);
                    }
                    // ---------------------

                    if (response.candidates && response.candidates[0]) {
                        const parts = response.candidates[0].content.parts;
                        for (const part of parts) {
                            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                                let finalImage = `data:${part.inlineData.mimeType}; base64, ${part.inlineData.data} `;
                                res.status(200).json({
                                    result: finalImage,
                                    creditsDeducted: requiredCredits,
                                    remainingCredits: currentCredits - requiredCredits
                                });
                                return;
                            }
                        }
                    }
                    throw new Error("No image returned");

                } catch (e) {
                    console.error("Error:", e);
                    return res.status(500).json({ error: e.message });
                }
            }

            // --- IMAGE GENERATION (Nano Banana / Gemini 2.5 Flash Image) ---
            if (type === "image") {
                try {
                    const imageModel = genAI.getGenerativeModel({
                        model: "gemini-2.5-flash-image"
                    });

                    const imagePrompt = `Create a high - quality, professional social media image.

Brand Context:
            - Industry: ${brand.industry || "general business"}
            - Brand Name: ${brand.brandName || ""}
            - Tone: ${brand.tone || "modern and professional"}
            - Target Audience: ${brand.audience || "general audience"}

Post Topic: "${topic}"

            Requirements:
            - Professional, eye - catching design suitable for social media
                - High quality, vibrant colors
                    - Modern aesthetic
                        - 1024x1024 resolution`;

                    const result = await imageModel.generateContent(imagePrompt);
                    const response = await result.response;

                    if (response.candidates && response.candidates[0]) {
                        const parts = response.candidates[0].content.parts;

                        for (const part of parts) {
                            if (part.text) {

                            }

                            if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
                                const imageData = part.inlineData.data;
                                const mimeType = part.inlineData.mimeType;

                                res.status(200).json({ result: `data:${mimeType}; base64, ${imageData} ` });
                                return;
                            }
                        }
                    }

                    console.error("No image data in response. Full response:", JSON.stringify(response, null, 2));
                    return res.status(500).json({ error: "Image generation returned no inline data" });

                } catch (e) {
                    console.error("Image Generation Error:", e);
                    console.error("Error details:", e && e.message ? e.message : "");
                    if (e && e.stack) console.error("Stack:", e.stack);
                    return res.status(500).json({ error: `Failed to generate image with Imagen 3: ${e && e.message ? e.message : "Unknown error"} ` });
                }
            }

            // --- TEXT GENERATION (Model Selection) ---
            const selectedPrompt = prompts[type];
            if (!selectedPrompt) return res.status(404).json({ error: `Invalid prompt type: ${type} ` });

            try {
                let generatedText = "";
                let usage = { promptTokenCount: 0, candidatesTokenCount: 0 }; // Approx for now

                // BRANCH 1: IMAGE + TEXT (Vision -> Text Pipeline)
                if (image) {
                    // Step 1: Llama 4 Maverick (Maverick part)
                    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

                    console.log("Analyzing image with Llama 4 Maverick...");
                    const visionPrompt = `Analyze this image in extreme detail. 
                    Describe the subject, mood, colors, composition, text(if any), and potential viral angles. 
                    Write a "Creative Brief" that a content writer can use to generate: ${type} related to topic '${topic || 'General'}'.`;

                    const creativeBrief = await callGroqVision(visionPrompt, base64Data);

                    // Step 2: Llama 3.3 70B (Creative Writing part)
                    console.log("Generating final creative content with Llama 3.3 70B...");
                    const finalSystemPrompt = "You are an elite, MrBeast-level social media strategist. Use the provided CREATIVE BRIEF to write the final content.";
                    const finalUserPrompt = `${selectedPrompt} \n\n[CONTEXT FROM IMAGE ANALYSIS]: \n${creativeBrief} `;

                    generatedText = await callGroqText(finalUserPrompt, finalSystemPrompt, "llama-3.3-70b-versatile");

                }
                // BRANCH 2: TEXT ONLY (Standard Llama 3.3 70B Flow)
                else {
                    // --- HYBRID MODEL SELECTION ---
                    // Strategy/Roadmap = 70B (High Quality) | Content = 8B (Low Cost, High Speed)
                    let selectedModel = "llama-3.1-8b-instant"; // Default to cheap/fast

                    if (
                        type === "generateRoadmapSteps" ||
                        type === "generatePillars" ||
                        type === "dynamicGuide" ||
                        type === "dynamicGuideIterative" ||
                        type === "finalGuide" ||
                        type === "generateChecklist" ||
                        type === "generateRoadmapBatch"
                    ) {
                        selectedModel = "llama-3.3-70b-versatile"; // Keep High Quality for Strategy
                    }

                    console.log(`Generating content with ${selectedModel}...`);
                    generatedText = await callGroqText(selectedPrompt, "You are an expert social media strategist who ONLY responds in the requested detailed JSON format.", selectedModel);
                }

                // --- COST TRACKING (Approximate) ---
                // Groq usage metadata might differ, ensuring safe access
                // await logSystemCost(uid, "llama-groq", 0, 0, type); // TODO: Parse real usage if needed

                // Clean up markdown formatting (```json, ```)
                const cleanText = generatedText.replace(/```json/g, "").replace(/```/g, "").trim();

                // Attempt to parse JSON to ensure validity before returning, if applicable
                // (Optional but good practice since Llama can be chatty)

                res.status(200).json({
                    result: cleanText,
                    creditsDeducted: requiredCredits,
                    remainingCredits: currentCredits - requiredCredits
                });
                return;

            } catch (e) {
                console.error("Groq Generation Error:", e);
                // Fallback to Gemini if Groq fails entirely? 
                // For now, return error as requested to switch TO Groq.
                return res.status(500).json({ error: `Generation Failed: ${e && e.message ? e.message : "Unknown error"}` });
            }

        } catch (e) {
            console.error("Unhandled generateContent error:", e);
            const msg = e && e.message ? e.message : "Server Error";
            if (typeof msg === "string" && msg.startsWith("resource-exhausted")) {
                return res.status(429).json({ error: msg.replace("resource-exhausted:", "").trim() });
            }
            return res.status(500).json({ error: msg });
        }
    }
);

// --- The rest of your functions (unchanged) ---
// Note: these remain onCall in this file. If you want them to be HTTP,
// we can convert them too (createStripeCheckout, createRazorpayOrder, verifyRazorpayPayment).

const { onCall } = require("firebase-functions/v2/https");
exports.createStripeCheckout = onCall(
    { timeoutSeconds: 60 },
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) throw new Error("unauthenticated: User must be logged in.");

        const { packageId, price, credits, successUrl, cancelUrl } = request.data;
        const stripe = require("stripe")(process.env.STRIPE_KEY);

        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: `${credits} Credits Package`,
                                description: `One-time purchase of ${credits} AI credits.`,
                            },
                            unit_amount: Math.round(price * 100),
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    uid: uid,
                    packageId: packageId,
                    credits: credits.toString()
                },
                success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&packageId=${packageId}&credits=${credits}`,
                cancel_url: cancelUrl,
            });

            return { sessionId: session.id, url: session.url };
        } catch (error) {
            console.error("Stripe Error:", error);
            throw new Error(error.message || "Stripe failure");
        }
    }
);

exports.createRazorpayOrder = onCall(
    { timeoutSeconds: 60 },
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) throw new Error("unauthenticated: User must be logged in.");

        const { packageId, price, credits } = request.data;
        if (!packageId || !price || !credits) {
            throw new Error("invalid-argument: Missing required fields: packageId, price, or credits");
        }

        console.log("Debug: Checking Env Vars");
        console.log("RAZORPAY_KEY_ID exists:", !!process.env.RAZORPAY_KEY_ID);
        console.log("RAZORPAY_KEY_SECRET exists:", !!process.env.RAZORPAY_KEY_SECRET);

        if (!process.env.RAZORPAY_KEY_SECRET) {
            console.error("CRITICAL: RAZORPAY_KEY_SECRET is missing!");
            throw new Error("internal: Server configuration error: Missing Payment Keys");
        }

        try {
            const Razorpay = require("razorpay");
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });

            const options = {
                amount: Math.round(price * 100),
                currency: "INR",
                receipt: `rcpt_${Date.now().toString().slice(-8)}_${uid.slice(0, 5)}`,
                notes: {
                    uid: uid,
                    packageId: packageId,
                    credits: credits.toString()
                }
            };

            const order = await razorpay.orders.create(options);
            console.log(`Razorpay order created: ${order.id} for user ${uid}`);

            return {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID || "rzp_test_RiqljtmPi9aTaS"
            };
        } catch (error) {
            console.error("Razorpay Order Creation Error Full:", error);
            throw new Error(`Failed to create Razorpay order: ${error.message || JSON.stringify(error)}`);
        }
    }
);

exports.verifyRazorpayPayment = onCall(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) throw new Error("unauthenticated: User must be logged in.");

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId, credits } = request.data;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !packageId || !credits) {
            throw new Error("invalid-argument: Missing required payment verification fields");
        }

        try {
            const crypto = require("crypto");
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                console.error(`Payment verification failed for user ${uid}. Invalid signature.`);
                throw new Error("permission-denied: Payment verification failed. Invalid signature.");
            }

            console.log(`Payment verified successfully: ${razorpay_payment_id} for user ${uid}`);

            const brandsRef = db.collection("brands").doc(uid);

            // CRITICAL: Check if payment already processed (idempotency)
            const paymentRef = brandsRef.collection("payments").doc(razorpay_payment_id);
            const existingPayment = await paymentRef.get();

            if (existingPayment.exists) {
                console.log(`Payment ${razorpay_payment_id} already processed for user ${uid}. Skipping duplicate.`);
                return {
                    success: true,
                    message: `Payment already processed. Credits were previously added.`,
                    paymentId: razorpay_payment_id,
                    duplicate: true
                };
            }

            await db.runTransaction(async (t) => {
                const brandDoc = await t.get(brandsRef);

                if (!brandDoc.exists) {
                    t.set(brandsRef, {
                        credits: parseInt(credits, 10),
                        creditsUsed: 0,
                        createdAt: FieldValue.serverTimestamp()
                    });
                } else {
                    const currentCredits = brandDoc.data().credits || 0;
                    const newCredits = currentCredits + parseInt(credits, 10);
                    t.update(brandsRef, { credits: newCredits });
                }

                // Store payment record to prevent future duplicates
                t.set(paymentRef, {
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                    signature: razorpay_signature,
                    packageId: packageId,
                    credits: parseInt(credits, 10),
                    status: "success",
                    timestamp: FieldValue.serverTimestamp()
                });
            });

            console.log(`Credits added successfully: ${credits} credits for user ${uid}`);

            return {
                success: true,
                message: `Successfully added ${credits} credits to your account.`,
                paymentId: razorpay_payment_id
            };
        } catch (error) {
            console.error("Payment Verification Error:", error);
            throw new Error(`Failed to verify payment: ${error.message}`);
        }
    }
);

// Guide Completion Reward - Award 10 credits on first-time completion
exports.completeGuide = onCall(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) throw new Error("unauthenticated: User must be logged in.");

        console.log(`Guide completion request from user: ${uid}`);

        const brandRef = db.collection("brands").doc(uid);

        try {
            const result = await db.runTransaction(async (transaction) => {
                const brandDoc = await transaction.get(brandRef);

                if (!brandDoc.exists) {
                    throw new Error("Brand profile not found. Please complete brand setup first.");
                }

                const brandData = brandDoc.data();
                const alreadyCompleted = brandData.guideCompleted || false;

                // Check if guide was already completed before
                if (alreadyCompleted) {
                    console.log(`User ${uid} already completed guide. No credits awarded.`);
                    return {
                        success: true,
                        creditsAwarded: 0,
                        message: "Guide completion recorded. You've already received the completion bonus.",
                        alreadyCompleted: true
                    };
                }

                // First-time completion: Mark as completed but DO NOT award credits
                const currentCredits = brandData.credits || 0;
                // const newCredits = currentCredits + 10; // REMOVED: No credits for guide completion

                transaction.update(brandRef, {
                    // credits: newCredits,
                    guideCompleted: true,
                    guideCompletedAt: FieldValue.serverTimestamp()
                });

                console.log(`Marked guide as completed for user ${uid}. No credits awarded.`);

                return {
                    success: true,
                    creditsAwarded: 0,
                    newBalance: currentCredits,
                    message: "Guide completed successfully!",
                    alreadyCompleted: false
                };
            });

            return result;
        } catch (error) {
            console.error("Guide completion error:", error);
            throw new Error(`Failed to process guide completion: ${error.message}`);
        }
    }
);

// 4. User Creation Trigger - Initialize Credits
exports.onUserSignup = require("firebase-functions/v1").auth.user().onCreate(async (user) => {
    const uid = user.uid;
    const email = user.email;
    const displayName = user.displayName || "New Creator";

    console.log(`New user signed up: ${uid}, initializing brand...`);

    try {
        const brandRef = db.collection("brands").doc(uid);
        const userRef = db.collection("users").doc(uid);

        const docSnap = await brandRef.get();
        if (docSnap.exists) {
            console.log(`Brand already exists for ${uid}, skipping.`);
            return;
        }

        const initialData = {
            uid: uid,
            email: email,
            brandName: displayName,
            credits: 10,
            creditsUsed: 0,
            plan: "free",
            onboarded: false,
            createdAt: FieldValue.serverTimestamp()
        };

        await brandRef.set(initialData);
        await userRef.set(initialData);

        console.log(`Initialized brand for ${uid} with 10 credits.`);
    } catch (error) {
        console.error(`Error initializing user ${uid}:`, error);
    }
});

// --- HELPER FUNCTIONS ---
function createToneInstruction(tones) {
    if (!tones) return "Use a professional and engaging tone.";
    if (typeof tones === 'string') return `Use the following tone: ${tones}.`;
    if (Array.isArray(tones) && tones.length === 0) return "Use a professional and engaging tone.";
    return `Use the following tones: ${tones.join(", ")}.`;
}

function createCaptionAdvancedInstructions(options) {
    return "Make it engaging and encourage interaction.";
}

function createIdeaAdvancedInstructions(options) {
    let instructions = [];
    if (options.includeReels) instructions.push("Focus on video/Reel ideas.");
    if (options.includeCarousels) instructions.push("Focus on Carousel post ideas.");
    if (options.includeStatic) instructions.push("Focus on static image post ideas.");
    return instructions.join(" ");
}

function getJsonFormat(options) {
    return `[{"caption": "Caption text here", "hashtags": ["#tag1", "#tag2"]}]`;
}

// --- HELPER FUNCTIONS ---

async function generateThumbnailStrategy(topic, platform, image, aspectRatio) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: STRATEGIST_SYSTEM_PROMPT
        });

        let prompt = `Analyze this request and generate a thumbnail strategy.
Topic: "${topic}"
Target Platform: "${platform}"
Aspect Ratio: "${aspectRatio}"

${image ? "REFERENCE IMAGE PROVIDED: Analyze the style, composition, and subject of the attached image. Adapt this archetype for the new topic." : "NO REFERENCE IMAGE: Create a new high-CTR archetype."}

OUTPUT JSON ONLY.`;

        let parts = [{ text: prompt }];
        if (image) {
            const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
            parts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        let text = response.text();

        // Clean JSON
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("Strategist Error:", e);
        return null;
    }
}
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getStorage } = require("firebase-admin/storage");

exports.cleanupOldImages = onSchedule("every 24 hours", async (event) => {
    const bucket = getStorage().bucket();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    try {
        console.log("Starting cleanup of images older than 30 days...");

        const [files] = await bucket.getFiles({ prefix: 'users/' });
        let deletedCount = 0;
        const deletePromises = [];

        for (const file of files) {
            const [metadata] = await file.getMetadata();
            const createdTime = new Date(metadata.timeCreated).getTime();

            if (createdTime < thirtyDaysAgo && file.name.includes('generated_images/')) {
                console.log(`Deleting old image: ${file.name}`);
                deletePromises.push(file.delete());
                deletedCount++;
            }
        }

        await Promise.all(deletePromises);

        console.log(`Cleanup completed. Deleted ${deletedCount} images.`);
        return { success: true, deletedCount };
    } catch (error) {
        console.error("Error during cleanup:", error);
        throw error;
    }
});

// --- HELPER: Cost Calculation & Logging ---
async function logSystemCost(userId, model, inputTokens, outputTokens, featureType) {
    // Pricing (Estimated per 1M tokens)
    // Gemini 1.5 Flash: $0.075 Input / $0.30 Output
    // Gemini 1.5 Pro: $3.50 Input / $10.50 Output
    // Gemini 2.5 Flash: Assuming similar to 1.5 Flash for now (safe estimate)

    const pricing = {
        "gemini-1.5-flash": { input: 0.075, output: 0.30 },
        "gemini-2.5-flash": { input: 0.075, output: 0.30 }, // Placeholder
        "gemini-2.5-flash-image": { input: 0.075, output: 0.30 }, // Placeholder
        "gemini-1.5-pro": { input: 3.50, output: 10.50 },
        "gemini-2.5-pro": { input: 3.50, output: 10.50 } // Placeholder
    };

    const rates = pricing[model] || pricing["gemini-1.5-flash"]; // Default to Flash

    const inputCost = (inputTokens / 1000000) * rates.input;
    const outputCost = (outputTokens / 1000000) * rates.output;
    const totalCost = inputCost + outputCost;

    await db.collection("system_logs").add({
        userId: userId,
        timestamp: FieldValue.serverTimestamp(),
        type: "api_cost",
        featureType: featureType,
        model: model,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        costUSD: totalCost,
        details: `Input: ${inputTokens} ($${inputCost.toFixed(6)}) | Output: ${outputTokens} ($${outputCost.toFixed(6)})`
    });

    console.log(`[COST] User: ${userId} | Model: ${model} | Cost: $${totalCost.toFixed(6)}`);
}
