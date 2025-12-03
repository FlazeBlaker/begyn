// src/services/credits.js
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * getUserCredits(uid)
 * returns { credits: number, planId: string|null, planType: "monthly"|"yearly"|null }
 */
export async function getUserCredits(uid) {
    const ref = doc(db, "brands", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { credits: 0, planId: null, planType: null };
    const data = snap.data();
    return {
        credits: data.credits ?? 0,
        planId: data.planId ?? null,
        planType: data.planType ?? null,
    };
}

/**
 * grantCredits(uid, amount, planId = null, planType = null)
 * DEPRECATED: Credits must be managed server-side only.
 */
export async function grantCredits(uid, amount, planId = null, planType = null) {
    console.error("Security Warning: grantCredits called on client. This function is deprecated and disabled.");
    throw new Error("Security Violation: Credits cannot be modified from the client.");
}

/**
 * consumeCredits(uid, amount)
 * DEPRECATED: Credits must be consumed server-side only.
 */
export async function consumeCredits(uid, amount) {
    console.error("Security Warning: consumeCredits called on client. This function is deprecated and disabled.");
    return false;
}
