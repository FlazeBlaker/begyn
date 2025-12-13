const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroqText(prompt, systemInstruction = "You are a helpful assistant.") {
    console.log("Calling Groq Text (Llama 3.3)...");
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 4096,
        });
        return completion.choices[0]?.message?.content || "";
    } catch (e) {
        console.error("Groq Text API Error:", e.message);
        throw e;
    }
}

// Mimic the cleanup logic from functions/index.js
function cleanJsonOutput(text) {
    return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

async function runTests() {
    // --- TEST 1: Tweet Generation (JSON) ---
    console.log("\n--- TEST: Tweet Generation (Llama 3.3) ---");
    const tweetPrompt = `
    You are a witty and viral-style Twitter/X copywriter. Generate 3 short, punchy tweets.
    **Topic:** AI is changing the world
    **IMPORTANT: Return ONLY a valid JSON object with this exact structure:**
    {
      "tweets": [
        { "text": "Tweet option 1..." },
        { "text": "Tweet option 2..." },
        { "text": "Tweet option 3..." }
      ]
    }
    `;

    try {
        const tweetRes = await callGroqText(tweetPrompt, "You are a social media expert who outputs ONLY JSON.");
        const cleaned = cleanJsonOutput(tweetRes);
        console.log("Cleaned Output Head:", cleaned.substring(0, 50) + "...");

        const parsed = JSON.parse(cleaned);
        console.log("✅ Valid JSON Parsed!");
        if (parsed.tweets && parsed.tweets.length > 0) {
            console.log("Tweet 1:", parsed.tweets[0].text);
        } else {
            console.error("❌ JSON Parsed but structure missing 'tweets'");
        }
    } catch (e) {
        console.error("❌ Tweet Generation Failed:", e.message);
    }

    // --- TEST 2: Guide Generation (Complex JSON) ---
    console.log("\n--- TEST: Guide Generation (Llama 3.3) ---");
    const guidePrompt = `
      You are an expert social media manager. Create a "Zero to Hero" roadmap timeline.
      **Instructions:**
      - Generate **1 high-impact step** (keeping it short for test).
      - **Schema:** Return a JSON object with ONLY "roadmapSteps":
        "roadmapSteps": [
          {
            "title": "Short Action Title",
            "description": "Brief 1-sentence summary",
            "detailedDescription": "Specific instructions on WHAT and HOW.",
            "subNodes": [
              { "title": "Sub-Task 1", "steps": ["Step 1.1", "Step 1.2"] }
            ],
            "phase": "Foundation",
            "timeEstimate": "15 mins",
            "suggestions": ["Suggestion 1"],
            "resources": [{ "name": "Tool Name", "url": "https://..." }],
            "generatorLink": null
          }
        ]
      - Return ONLY the JSON object.
    `;

    try {
        const guideRes = await callGroqText(guidePrompt, "You are a social media expert who outputs ONLY JSON.");
        const cleaned = cleanJsonOutput(guideRes);
        // console.log("Cleaned Guide:", cleaned);
        const parsedGuide = JSON.parse(cleaned);
        console.log("✅ Valid JSON Parsed!");
        if (parsedGuide.roadmapSteps && parsedGuide.roadmapSteps.length > 0) {
            console.log("Step 1 Title:", parsedGuide.roadmapSteps[0].title);
        } else {
            console.error("❌ JSON Parsed but structure missing 'roadmapSteps'");
        }

    } catch (e) {
        console.error("❌ Guide Generation Failed:", e.message);
    }
}

runTests();
