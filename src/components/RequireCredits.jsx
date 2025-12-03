import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { getUserCredits } from "../services/credits";
import { Link } from "react-router-dom";

export default function RequireCredits({ cost = 1, children }) {
    const [credits, setCredits] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCredits = async () => {
            if (auth.currentUser) {
                const data = await getUserCredits(auth.currentUser.uid);
                setCredits(data.credits);
            }
            setLoading(false);
        };

        fetchCredits();
    }, []);

    if (loading) return <div>Loading...</div>;

    if (credits < cost) {
        return (
            <div style={{
                padding: "20px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "12px",
                textAlign: "center",
                color: "#fca5a5"
            }}>
                <h3>Insufficient Credits</h3>
                <p>You need {cost} credits for this action, but you only have {credits}.</p>
                <Link to="/pricing" style={{
                    display: "inline-block",
                    marginTop: "10px",
                    padding: "8px 16px",
                    background: "#ef4444",
                    color: "white",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600"
                }}>
                    Get More Credits
                </Link>
            </div>
        );
    }

    // Allowed - we expose the children.
    // NOTE: Actual credit deduction happens securely on the backend.
    return children;
}
