import React from "react";
import { auth } from "../services/firebase";
import { Link, useLocation } from "react-router-dom";

export default function Navbar({ isTestActive, userInfo, isMobile, onMenuClick }) {
    const location = useLocation();
    const user = auth.currentUser;
    const credits = userInfo?.credits || 0;
    // Helper to get page title based on route
    const getPageTitle = (pathname) => {
        if (pathname === "/dashboard") return "Dashboard";
        if (pathname === "/brand-setup") return "Brand Setup";
        if (pathname === "/generate") return "Generator Hub";
        if (pathname === "/history") return "History";
        if (pathname === "/settings") return "Settings";
        if (pathname === "/pricing") return "Buy Credits";
        if (pathname === "/download") return "Downloads";
        if (pathname.includes("generator")) return "Create Content";
        return "Dashboard";
    };

    const pageTitle = getPageTitle(location.pathname);

    return (
        <nav style={{
            height: "70px",
            borderBottom: "1px solid rgba(139, 92, 246, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            background: "#0a0118", /* Solid background to prevent bleed-through issues */
            position: "sticky",
            top: 0,
            zIndex: 9999, /* Force top layer */
            flexShrink: 0, /* Prevent navbar from shrinking */
        }}>
            {/* Left: Page Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                {isMobile && (
                    <button
                        onClick={onMenuClick}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "white",
                            fontSize: "1.5rem",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "8px",
                            transition: "background 0.2s"
                        }}
                    >
                        ☰
                    </button>
                )}
                <h2 style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: "white",
                    letterSpacing: "-0.02em"
                }}>
                    {pageTitle}
                </h2>
            </div>

            {/* Right: Credits & Upgrade */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0, zIndex: 10000 }}>
                {/* Credits Counter */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255, 255, 255, 0.08)",
                    padding: "8px 16px",
                    borderRadius: "100px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "white",
                    whiteSpace: "nowrap"
                }}>
                    <span style={{ fontSize: "1rem", color: "#fbbf24" }}>⚡</span>
                    <span>{credits} Credits</span>
                </div>

                {/* Buy Credits Button */}
                <Link to="/pricing" style={{ textDecoration: "none" }}>
                    <button style={{
                        background: "linear-gradient(135deg, #7C4DFF, #CE93D8)",
                        border: "none",
                        borderRadius: "100px",
                        padding: "10px 24px",
                        color: "white",
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(124, 77, 255, 0.4)",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}>
                        <span>+</span>
                        <span>Get Credits</span>
                    </button>
                </Link>
            </div>
        </nav>
    );
}
