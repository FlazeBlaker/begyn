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

async function callGroqText(prompt, systemInstruction = "You are a helpful assistant.") {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile", // Hardcoding the known working ID from test
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

────────────────────────────
CORE RESPONSIBILITIES
────────────────────────────

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

────────────────────────────
ARCHETYPE LEARNING RULE (CRITICAL)
────────────────────────────

Reference images provided by the user define CANONICAL visual archetypes.

When a new topic resembles:
- the scale
- structure
- emotion
- or visual logic of any reference image

→ You MUST adapt that visual language EVEN FOR NEW TOPICS.

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

────────────────────────────
THUMBNAIL CREATION RULES
────────────────────────────

• Thumbnails must be understandable in < 0.3 seconds
• One clear idea only
• Extreme clarity with minimal clutter
• Emotion MUST be visible
• Composition must guide the eye instantly
• If numbers are used, they must feel LARGE-SCALE or HIGH-STAKES

Never design a “pretty” thumbnail.
Design a CURIOSITY WEAPON.

────────────────────────────
TEXT RENDERING RULES (CRITICAL)
────────────────────────────

If text is absolutely necessary (e.g., for a sign, UI element, or title):
- Keep it UNDER 5 WORDS.
- Spelling must be PERFECT.
- Font must be LARGE and LEGIBLE.
- If the concept works without text, prefer NO TEXT.
- Do NOT include "gibberish" or small unreadable text.

────────────────────────────
PLATFORM ADAPTATION (IMPORTANT)
────────────────────────────

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

────────────────────────────
OUTPUT FORMAT (MANDATORY)
────────────────────────────

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

────────────────────────────
QUALITY BAR
────────────────────────────

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
    { name: "Canva", url: "https://www.canva.com" },
    { name: "CapCut", url: "https://www.capcut.com" },
    { name: "ChatGPT", url: "https://chat.openai.com" },
    { name: "Buffer", url: "https://buffer.com" },
    { name: "Notion", url: "https://www.notion.so" },
    { name: "Trello", url: "https://trello.com" },
    { name: "Google Sheets", url: "https://sheets.google.com" },
    { name: "Google Docs", url: "https://docs.google.com" },
    { name: "Meta Business Suite", url: "https://business.facebook.com" },
    { name: "YouTube Studio", url: "https://studio.youtube.com" },
    { name: "OBS Studio", url: "https://obsproject.com" },
    { name: "Audacity", url: "https://www.audacityteam.org" },
    { name: "DaVinci Resolve", url: "https://www.blackmagicdesign.com/products/davinciresolve" },
    { name: "AnswerThePublic", url: "https://answerthepublic.com" },
    { name: "Google Trends", url: "https://trends.google.com" },
    { name: "Hootsuite", url: "https://hootsuite.com" },
    { name: "Later", url: "https://later.com" },
    { name: "Linktree", url: "https://linktr.ee" }
];
