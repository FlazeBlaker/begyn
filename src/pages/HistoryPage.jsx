// src/pages/HistoryPage.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../services/firebase";
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import ReactMarkdown from 'react-markdown';

// Helper function to format text (convert **text** to bold)
const formatText = (text) => {
    if (!text) return "";
    const parts = text.split("**");
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            return <strong key={index} style={{ fontWeight: "700" }}>{part}</strong>;
        }
        return part;
    });
};

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                // Fetch from users/{uid}/history
                const q = query(
                    collection(db, "users", user.uid, "history"),
                    orderBy("timestamp", "desc")
                );
                const querySnapshot = await getDocs(q);
                const historyData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setHistory(historyData);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await deleteDoc(doc(db, "users", auth.currentUser.uid, "history", id));
                setHistory(history.filter(item => item.id !== id));
            } catch (error) {
                console.error("Error deleting item:", error);
            }
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getIconForType = (type) => {
        if (!type) return '📄';
        const t = type.toLowerCase();
        if (t.includes('caption')) return '✨';
        if (t.includes('idea')) return '💡';
        if (t.includes('post')) return '📝';
        if (t.includes('hashtag')) return '#️⃣';
        if (t.includes('script')) return '🎬';
        if (t.includes('tweet')) return '🐦';
        if (t.includes('image')) return '🖼️';
        return '📄';
    };

    const handleCopy = (text, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const handleCopyAll = (item, e) => {
        e.stopPropagation();
        const contentText = typeof item.content === 'string'
            ? item.content
            : JSON.stringify(item.content, null, 2);
        navigator.clipboard.writeText(contentText);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDownloadImage = async (imageUrl, caption, e) => {
        e.stopPropagation();
        try {
            let baseFilename = caption
                ? caption.substring(0, 30)
                    .replace(/[^a-z0-9]/gi, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .toLowerCase()
                : 'post-image';
            if (!baseFilename) baseFilename = 'post-image';

            // Ensure filename always ends with .png
            const filename = baseFilename.endsWith('.png') ? baseFilename : `${baseFilename}.png`;

            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'image/png' });

            // Use different approach for IE/Edge vs modern browsers
            if (window.navigator.msSaveBlob) {
                window.navigator.msSaveBlob(blob, filename);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                a.setAttribute('download', filename); // Explicitly set download attribute
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            }
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download image.");
        }
    };

    // Video Script Tabs Component (Copied from Generators.jsx)
    const VideoScriptTabs = ({ data }) => {
        const [activeTab, setActiveTab] = useState('intro');

        const tabs = [
            { id: 'intro', label: 'Intro', icon: '🎬' },
            { id: 'main', label: 'Main Content', icon: '📝' },
            { id: 'outro', label: 'Outro', icon: '🎯' }
        ];

        return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Tab Navigation */}
                <div style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "24px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    paddingBottom: "16px"
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); }}
                            style={{
                                padding: "12px 24px",
                                borderRadius: "12px",
                                background: activeTab === tab.id
                                    ? "linear-gradient(135deg, rgba(124, 77, 255, 0.2), rgba(206, 147, 216, 0.15))"
                                    : "transparent",
                                border: activeTab === tab.id ? "1px solid rgba(124, 77, 255, 0.4)" : "1px solid transparent",
                                cursor: "pointer",
                                fontWeight: activeTab === tab.id ? "700" : "500",
                                color: activeTab === tab.id ? "#ffffff" : "#94a3b8",
                                fontSize: "0.95rem",
                                transition: "all 0.2s",
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px"
                            }}
                        >
                            <span style={{ fontSize: "1.2rem" }}>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }} className="custom-scrollbar">
                    {activeTab === 'intro' && data.intro && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {data.intro.map((option, idx) => (
                                <div key={idx} style={{
                                    background: "rgba(30, 32, 45, 0.6)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    borderRadius: "20px",
                                    padding: "28px",
                                    position: "relative",
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                                }}>
                                    <div style={{
                                        position: "absolute",
                                        top: "-14px",
                                        left: "24px",
                                        background: "linear-gradient(135deg, #7C4DFF, #CE93D8)",
                                        color: "white",
                                        padding: "6px 16px",
                                        borderRadius: "20px",
                                        fontSize: "0.8rem",
                                        fontWeight: "700",
                                        boxShadow: "0 4px 10px rgba(124, 77, 255, 0.3)",
                                        textTransform: "uppercase",
                                        letterSpacing: "1px"
                                    }}>
                                        Option {idx + 1}
                                    </div>
                                    <div style={{
                                        whiteSpace: "pre-wrap",
                                        lineHeight: "1.8",
                                        fontSize: "1.1rem",
                                        color: "#e2e8f0",
                                        marginTop: "12px",
                                        fontFamily: "'Inter', sans-serif",
                                        letterSpacing: "0.01em"
                                    }}>
                                        {formatText(option.text)}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(option.text); }}
                                        style={{
                                            marginTop: "24px",
                                            padding: "12px 20px",
                                            borderRadius: "12px",
                                            background: "rgba(124, 77, 255, 0.1)",
                                            border: "1px solid rgba(124, 77, 255, 0.3)",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            color: "#CE93D8",
                                            width: "100%",
                                            fontSize: "0.95rem",
                                            transition: "all 0.2s",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px"
                                        }}
                                    >
                                        📋 Copy Intro {idx + 1}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'main' && data.mainContent && (
                        <div style={{
                            background: "rgba(30, 32, 45, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "20px",
                            padding: "32px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                        }}>
                            <div style={{
                                whiteSpace: "pre-wrap",
                                lineHeight: "1.9",
                                fontSize: "1.15rem",
                                color: "#e2e8f0",
                                fontFamily: "'Inter', sans-serif",
                                letterSpacing: "0.01em"
                            }}>
                                {formatText(data.mainContent)}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(data.mainContent); }}
                                style={{
                                    marginTop: "32px",
                                    padding: "14px 24px",
                                    borderRadius: "14px",
                                    background: "linear-gradient(135deg, #7C4DFF, #CE93D8)",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: "700",
                                    color: "white",
                                    width: "100%",
                                    fontSize: "1rem",
                                    boxShadow: "0 4px 15px rgba(124, 77, 255, 0.3)",
                                    transition: "all 0.2s"
                                }}
                            >
                                📋 Copy Main Content
                            </button>
                        </div>
                    )}

                    {activeTab === 'outro' && data.outro && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {data.outro.map((option, idx) => (
                                <div key={idx} style={{
                                    background: "rgba(30, 32, 45, 0.6)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    borderRadius: "20px",
                                    padding: "28px",
                                    position: "relative",
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                                }}>
                                    <div style={{
                                        position: "absolute",
                                        top: "-14px",
                                        left: "24px",
                                        background: "linear-gradient(135deg, #7C4DFF, #CE93D8)",
                                        color: "white",
                                        padding: "6px 16px",
                                        borderRadius: "20px",
                                        fontSize: "0.8rem",
                                        fontWeight: "700",
                                        boxShadow: "0 4px 10px rgba(124, 77, 255, 0.3)",
                                        textTransform: "uppercase",
                                        letterSpacing: "1px"
                                    }}>
                                        Option {idx + 1}
                                    </div>
                                    <div style={{
                                        whiteSpace: "pre-wrap",
                                        lineHeight: "1.8",
                                        fontSize: "1.1rem",
                                        color: "#e2e8f0",
                                        marginTop: "12px",
                                        fontFamily: "'Inter', sans-serif",
                                        letterSpacing: "0.01em"
                                    }}>
                                        {formatText(option.text)}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(option.text); }}
                                        style={{
                                            marginTop: "24px",
                                            padding: "12px 20px",
                                            borderRadius: "12px",
                                            background: "rgba(124, 77, 255, 0.1)",
                                            border: "1px solid rgba(124, 77, 255, 0.3)",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            color: "#CE93D8",
                                            width: "100%",
                                            fontSize: "0.95rem",
                                            transition: "all 0.2s",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px"
                                        }}
                                    >
                                        📋 Copy Outro {idx + 1}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderContent = (item) => {
        const { content, type } = item;

        // 1. Handle Image Content (Post/SmartImage)
        if (content.image) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {content.prompt && (
                        <div style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            paddingBottom: '8px',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            <strong>Prompt:</strong> {content.prompt}
                        </div>
                    )}
                    <div style={{ position: 'relative' }}>
                        <img
                            src={content.image}
                            alt="Generated Content"
                            style={{
                                width: '100%',
                                maxHeight: '500px',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: '#000'
                            }}
                        />
                        <button
                            onClick={(e) => handleDownloadImage(content.image, content.prompt, e)}
                            style={{
                                marginTop: '8px',
                                background: 'rgba(124, 77, 255, 0.1)',
                                border: '1px solid rgba(124, 77, 255, 0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                padding: '8px 16px',
                                fontSize: '0.9rem',
                                color: '#CE93D8',
                                fontWeight: '500',
                                width: '100%'
                            }}
                        >
                            ⬇️ Download Image
                        </button>
                    </div>
                </div>
            );
        }

        // 2. Handle Text Content
        let parsed = content;
        // If content is wrapped in a 'text' property (common in Generators.jsx output)
        if (content.text) parsed = content.text;

        // Try to parse stringified JSON
        if (typeof parsed === 'string') {
            try {
                const cleanText = parsed.replace(/```json\n?|\n?```/g, "").trim();
                parsed = JSON.parse(cleanText);
            } catch (e) {
                // If parsing fails, treat as markdown string
            }
        }

        // --- RENDER BASED ON PARSED STRUCTURE ---

        // A. Video Script (Intro/Main/Outro)
        if (parsed.intro && parsed.mainContent && parsed.outro) {
            return <VideoScriptTabs data={parsed} />;
        }

        // B. Tweets (Array of objects with 'text')
        if (parsed.tweets && Array.isArray(parsed.tweets)) {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {parsed.tweets.map((tweet, idx) => (
                        <div key={idx} style={{
                            background: "rgba(30, 32, 45, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "20px",
                            padding: "24px",
                            position: "relative",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                        }}>
                            <div style={{
                                position: "absolute",
                                top: "-12px",
                                left: "24px",
                                background: "linear-gradient(135deg, #1da1f2, #0ea5e9)",
                                color: "white",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                boxShadow: "0 4px 10px rgba(29, 161, 242, 0.3)"
                            }}>
                                Tweet {idx + 1}
                            </div>
                            <div style={{
                                whiteSpace: "pre-wrap",
                                lineHeight: "1.6",
                                fontSize: "1.1rem",
                                color: "#e2e8f0",
                                marginTop: "12px",
                                fontFamily: "'Inter', sans-serif"
                            }}>
                                {formatText(tweet.text)}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(tweet.text); }}
                                style={{
                                    marginTop: "20px",
                                    padding: "10px 16px",
                                    borderRadius: "10px",
                                    background: "rgba(29, 161, 242, 0.1)",
                                    border: "1px solid rgba(29, 161, 242, 0.3)",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    color: "#7dd3fc",
                                    width: "100%",
                                    fontSize: "0.9rem",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px"
                                }}
                            >
                                📋 Copy Tweet
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        // C. Generic Array (Ideas, Captions)
        if (Array.isArray(parsed)) {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {parsed.map((item, idx) => {
                        // Check if it's an Idea Object
                        const isIdea = item.title && item.idea && item.explanation;
                        const textContent = typeof item === 'string' ? item : (item.caption || item.text || JSON.stringify(item));

                        return (
                            <div key={idx} style={{
                                background: isIdea ? "linear-gradient(145deg, rgba(30, 32, 45, 0.8), rgba(20, 22, 35, 0.9))" : "rgba(255, 255, 255, 0.03)",
                                border: isIdea ? "1px solid rgba(124, 77, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.05)",
                                borderRadius: "20px",
                                padding: "24px",
                                position: "relative",
                                boxShadow: isIdea ? "0 4px 20px rgba(0,0,0,0.2)" : "none"
                            }}>
                                {isIdea ? (
                                    <>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "12px" }}>
                                            <h3 style={{ margin: 0, color: "white", fontSize: "1.2rem", lineHeight: "1.4", fontWeight: "700", letterSpacing: "-0.02em" }}>{item.title}</h3>
                                            <span style={{ background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", color: "#cbd5e1", whiteSpace: "nowrap" }}>{item.length}</span>
                                        </div>
                                        <div style={{ marginBottom: "16px" }}>
                                            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "#CE93D8", marginBottom: "6px", fontWeight: "700" }}>The Concept</div>
                                            <p style={{ margin: 0, color: "#e2e8f0", lineHeight: "1.6", fontSize: "1rem" }}>{item.idea}</p>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "#38bdf8", marginBottom: "6px", fontWeight: "700" }}>Why It Works</div>
                                            <ul style={{ margin: 0, paddingLeft: "20px", color: "#94a3b8", lineHeight: "1.6", fontSize: "0.95rem" }}>
                                                {Array.isArray(item.explanation) ? item.explanation.map((exp, i) => (
                                                    <li key={i} style={{ marginBottom: "4px" }}>{exp}</li>
                                                )) : <li>{item.explanation}</li>}
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    // Simple Text/Caption
                                    <>
                                        <strong style={{ display: 'block', marginBottom: '8px', color: '#CE93D8' }}>Option {idx + 1}</strong>
                                        <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "var(--text-primary)" }}>
                                            <ReactMarkdown>{textContent}</ReactMarkdown>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(textContent); }}
                                            style={{
                                                marginTop: "12px",
                                                background: "transparent",
                                                border: "1px solid var(--border-color)",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                padding: "6px 12px",
                                                fontSize: "0.85rem",
                                                color: "var(--text-primary)"
                                            }}
                                        >
                                            📋 Copy
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }

        // D. Fallback: Markdown String
        if (typeof parsed === 'string') {
            return <ReactMarkdown>{parsed}</ReactMarkdown>;
        }

        // E. Fallback: Raw JSON
        return (
            <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', color: 'var(--text-primary)' }}>
                {JSON.stringify(content, null, 2)}
            </pre>
        );
    };

    return (
        <div style={{
            padding: "clamp(16px, 5vw, 40px)",
            maxWidth: "800px",
            margin: "0 auto",
            minHeight: "100vh",
            color: "var(--text-primary)"
        }}>
            <h1 style={{
                fontSize: "clamp(2rem, 6vw, 2.5rem)",
                marginBottom: "10px",
                background: "linear-gradient(90deg, var(--text-primary), #94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
            }}>
                History
            </h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "clamp(24px, 5vw, 40px)", fontSize: "clamp(0.9rem, 3vw, 1rem)" }}>
                Your previously generated content.
            </p>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading history...</div>
            ) : history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px" }}>📭</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>No history yet</h3>
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>Generate some content to see it here!</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => toggleExpand(item.id)}
                            style={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "16px",
                                padding: "clamp(16px, 4vw, 24px)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                position: "relative",
                                overflow: "hidden",
                                boxShadow: "var(--shadow-sm)"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: expandedId === item.id ? "16px" : "0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        fontSize: "24px",
                                        background: "var(--bg-secondary)",
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "10px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        {getIconForType(item.type)}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: "0 0 4px 0", fontSize: "clamp(1rem, 4vw, 1.1rem)", color: "var(--text-primary)" }}>
                                            {item.type ? item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Content"}
                                        </h3>
                                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                            {item.timestamp?.toDate().toLocaleDateString()} • {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={(e) => handleCopyAll(item, e)}
                                        style={{
                                            background: copiedId === item.id ? "rgba(34, 197, 94, 0.2)" : "transparent",
                                            border: "1px solid var(--border-color)",
                                            color: copiedId === item.id ? "#4ade80" : "var(--text-primary)",
                                            cursor: "pointer",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            minHeight: "44px",
                                            fontSize: "0.85rem",
                                            fontWeight: "500",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {copiedId === item.id ? "✓ Copied" : "📋 Copy"}
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(item.id, e)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "#ef4444",
                                            cursor: "pointer",
                                            padding: "8px",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            minHeight: "44px",
                                            minWidth: "44px"
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {expandedId === item.id && (
                                <div style={{
                                    borderTop: "1px solid var(--border-color)",
                                    paddingTop: "16px",
                                    marginTop: "16px",
                                    animation: "fadeIn 0.3s ease-out"
                                }}>
                                    <div style={{
                                        background: "var(--bg-input)",
                                        padding: "16px",
                                        borderRadius: "8px",
                                        fontSize: "0.95rem",
                                        lineHeight: "1.6",
                                        color: "var(--text-primary)",
                                        overflowX: "auto"
                                    }}>
                                        {renderContent(item)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}