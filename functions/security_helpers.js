// Security Helpers for Firebase Cloud Functions
// Add this to the TOP of functions/index.js, right after the imports

const rateLimit = require("express-rate-limit");

// --- SECURITY HELPERS ---

/**
 * Validate and sanitize text input to prevent XSS
 * @param {string} text - Input to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized text
 * @throws {Error} If validation fails
 */
function validateInput(text, fieldName = 'input', maxLength = 5000) {
    if (!text) {
        throw new Error(`${fieldName} is required`);
    }
    if (typeof text !== 'string') {
        throw new Error(`${fieldName} must be a string`);
    }
    if (text.length > maxLength) {
        throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
    }
    // Remove HTML/script tags to prevent XSS
    return text.replace(/<[^>]*>/g, '').trim();
}

// Rate limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests from this IP, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// USAGE INSTRUCTIONS:
// 1. Input Validation - Add to any function that accepts user input:
//    try {
//        payload.topic = validateInput(payload.topic, 'topic', 2000);
//    } catch (error) {
//        return res.status(400).json({ error: error.message });
//    }
//
// 2. Authentication - The generateContent function ALREADY checks auth properly
//    It rejects requests without valid Firebase auth tokens
//
// 3. Rate Limiting - Will be enforced automatically once we deploy
