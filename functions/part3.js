
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
                        `<svg width="${faceSize}" height="${faceSize}">
        <circle cx="${faceSize / 2}" cy="${faceSize / 2}" r="${faceSize / 2}" fill="white" />
                                    </svg>`
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
        return `data:image/png;base64,${result.toString('base64')}`;
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
            finalPrompt = `Create a high-quality ${userPlatform} image for topic: ${userIdea}. Aspect Ratio: ${finalAspectRatio}`;
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
        finalPrompt = `${ratioKeywords} image (${finalAspectRatio}, ${pixelDims}). ${finalPrompt}\n\nEnsure the image is ${ratioKeywords} with aspect ratio ${finalAspectRatio}.`;

        // TEXT ACCURACY INSTRUCTION
        finalPrompt += `\n\nCRITICAL TEXT RULE: If any text appears in the image, the spelling MUST BE PERFECT. No typos, no gibberish. If you cannot render the text perfectly, do not include it.`;



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
                    let finalImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
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

        const imagePrompt = `Create a high-quality, professional social media image.

Brand Context:
- Industry: ${brand.industry || "general business"}
- Brand Name: ${brand.brandName || ""}
- Tone: ${brand.tone || "modern and professional"}
- Target Audience: ${brand.audience || "general audience"}

Post Topic: "${topic}"

Requirements:
- Professional, eye-catching design suitable for social media
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

                    res.status(200).json({ result: `data:${mimeType};base64,${imageData}` });
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
        return res.status(500).json({ error: `Failed to generate image with Imagen 3: ${e && e.message ? e.message : "Unknown error"}` });
    }
}

// --- TEXT GENERATION (Model Selection) ---
const selectedPrompt = prompts[type];
if (!selectedPrompt) return res.status(404).json({ error: `Invalid prompt type: ${type}` });

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
        const finalUserPrompt = `${selectedPrompt}\n\n[CONTEXT FROM IMAGE ANALYSIS]:\n${creativeBrief}`;

        generatedText = await callGroqText(finalUserPrompt, finalSystemPrompt);

    }
    // BRANCH 2: TEXT ONLY (Standard Llama 3.3 70B Flow)
    else {
        console.log("Generating content with Llama 3.3 70B...");
        generatedText = await callGroqText(selectedPrompt, "You are an expert social media strategist who ONLY responds in the requested detailed JSON format.");
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

                const paymentRef = brandsRef.collection("payments").doc(razorpay_payment_id);
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
