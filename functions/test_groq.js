const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const Groq = require('groq-sdk');

// --- 1. Check Key ---
const key = process.env.GROQ_API_KEY;
console.log("\n--- API KEY CHECK ---");
if (!key) {
    console.error("CRITICAL: GROQ_API_KEY is missing.");
    process.exit(1);
}
console.log(`Key found. Prefix: "${key.substring(0, 4)}..." Length: ${key.length}`);

if (key.startsWith('xai-')) {
    console.warn("WARNING: Key starts with 'xai-'. This looks like an xAI (Grok) key, not Groq Cloud (gsk_). Connection will likely fail.");
} else if (key.startsWith('gsk_')) {
    console.log("Key looks like a valid Groq API key.");
} else {
    console.log("Key prefix unrecognized (neither xai- nor gsk_), attempting anyway...");
}

const groq = new Groq({ apiKey: key });

// --- 2. Test Models ---
async function main() {

    // Model 1: Llama 3.3 70B
    // User string: "groq/llama-3.3-70b-versatile" -> Clean to "llama-3.3-70b-versatile"
    const textModel = "llama-3.3-70b-versatile";
    console.log(`\n--- Testing Text Model: ${textModel} ---`);
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Test." }],
            model: textModel,
        });
        console.log("✅ Success! Response:", completion.choices[0]?.message?.content?.substring(0, 50));
    } catch (error) {
        console.error("❌ Failed:", error.error?.code || error.message);
    }

    // Model 2: Llama 4 Maverick (Vision)
    // User string: "meta-llama/llama-4-maverick-17b-128e-instruct"
    // This looks like an internal or HuggingFace ID. On Groq, it might be mapped or require a specific ID.
    // We will try the exact string, then fallback to standard Vision.
    const visionCandidates = [
        "meta-llama/llama-4-maverick-17b-128e-instruct", // User specific
        "llama-4-maverick-17b-128e-instruct", // Stripped vendor
        "llama-3.2-90b-vision-preview" // Fallback standard
    ];

    for (const modelId of visionCandidates) {
        console.log(`\n--- Testing Vision Candidate: ${modelId} ---`);
        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: "Test." }],
                model: modelId,
            });
            console.log(`✅ Success! Selected Vision Model: ${modelId}`);
            console.log("Response:", completion.choices[0]?.message?.content?.substring(0, 50));
            break; // Stop after first success
        } catch (error) {
            console.error(`❌ Failed (${modelId}):`, error.error?.code || error.message);
        }
    }
}

main();
