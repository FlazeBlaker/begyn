import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./LandingPage.css";
import { Zap, Layout, PenTool, CheckCircle, ArrowRight, MousePointer2 } from 'lucide-react';
import SEO from "../components/SEO";

// --- COMPONENTS ---

const Navbar = ({ user }) => {
    const handleLogout = () => auth.signOut();

    return (
        <nav className="minimal-nav">
            <div className="nav-brand">
                <img src="/logos/logo.png" alt="Begyn" />
                <span>Begyn</span>
            </div>

            <div className="nav-links">
                {user ? (
                    <>
                        <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Sign Out</button>
                    </>
                ) : (
                    <Link to="/login" className="nav-link">Sign In</Link>
                )}
                <Link to={user ? "/dashboard" : "/login"} className="cta-button">
                    {user ? "Open App" : "Get Started"}
                </Link>
            </div>
        </nav>
    );
};

// Abstract Phone UI for Parallax Demo (CSS Shapes only)
const AbstractPhoneUI = () => (
    <div className="glass-card" style={{ width: '100%', maxWidth: '360px', height: '600px', margin: '0 auto', position: 'relative', overflow: 'hidden', borderRadius: '40px', border: '4px solid rgba(255,255,255,0.1)' }}>
        {/* Notch */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '24px', background: '#000', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', zIndex: 10 }}></div>

        {/* Content Skeleton */}
        <div style={{ padding: '60px 24px 24px' }}>
            <div style={{ width: '40%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '32px' }}></div>

            <div style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px' }}>
                Your Daily<br />
                <span className="aurora-text">Growth Plan.</span>
            </div>

            {/* Simulated List Items */}
            {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(124, 77, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={18} color="#ce93d8" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ width: '80%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '6px' }}></div>
                        <div style={{ width: '50%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                    </div>
                </div>
            ))}

            {/* Floating Card */}
            <div style={{
                marginTop: '40px',
                background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.4), rgba(124, 77, 255, 0.1))',
                padding: '20px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600' }}>VIRAL HOOK GENERATED</div>
                    <Zap size={14} color="#fff" />
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.5', opacity: 0.9 }}>
                    "Thinking about starting a channel? Here is exactly why you should start TODAY..."
                </div>
            </div>
        </div>
    </div>
);

const FeatureSection = ({ title, subtitle, align = 'left', children }) => (
    <div className="content-section">
        <div className="content-grid" style={{ direction: align === 'right' ? 'rtl' : 'ltr' }}>
            <div className="text-block" style={{ textAlign: 'left', direction: 'ltr' }}>
                <h2>{title}</h2>
                <p>{subtitle}</p>
            </div>
            <div style={{ direction: 'ltr', display: 'flex', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    </div>
);

export default function LandingPage() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState("");
    const navigate = useNavigate();

    // Scroll Logic for Parallax
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY;
            document.body.style.setProperty('--scroll-y', `${scrolled}px`);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auth Check
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setUser);
        return () => unsub();
    }, []);

    const handleCTA = () => {
        if (user) navigate("/dashboard");
        else navigate("/login", { state: { email, authMode: "signup" } });
    };

    return (
        <div className="parallax-viewport">
            <SEO
                title="Begyn – AI Social Media Guide to Become an Influencer Faster"
                canonicalUrl="https://begyn.in/"
            />
            {/* BACKGROUND BLOBS */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />

            <Navbar user={user} />

            {/* HERO */}
            <section className="section-hero">
                <div className="hero-content">
                    <div className="hero-eyebrow">The Future of Content Creation</div>
                    <h1 className="hero-title">
                        Create. Grow.<br />
                        <span className="gradient-text">Dominate.</span>
                    </h1>
                    <p className="hero-subtitle">
                        The all-in-one AI suite that builds your personal brand, <br />
                        plans your content, and writes your scripts.
                    </p>

                    <div className="hero-floating-ui">
                        {!user ? (
                            <div className="hero-input-group">
                                <input
                                    className="hero-input"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button className="hero-btn" onClick={handleCTA}>Get Started</button>
                            </div>
                        ) : (
                            <button className="hero-btn" onClick={handleCTA}>Go to Dashboard</button>
                        )}
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>No credit card required.</p>
                    </div>
                </div>
            </section>

            {/* FEATURES 1: Roadmap */}
            <FeatureSection
                title="Your Personal Strategy."
                subtitle="Stop guessing. Begyn analyzes your niche and generates a day-by-day roadmap tailored exactly to your goals."
            >
                <AbstractPhoneUI />
            </FeatureSection>

            {/* FEATURES 2: AI Generators */}
            <FeatureSection
                title="Supercharged Creativity."
                subtitle="Never face writer's block again. Generate high-performing hooks, scripts, and captions in seconds."
                align="right"
            >
                <div className="glass-card" style={{ width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                    {[
                        { icon: PenTool, label: "Script Writer", color: "#CE93D8" },
                        { icon: Layout, label: "Thumbnail Ideas", color: "#90CAF9" },
                        { icon: MousePointer2, label: "Viral Hooks", color: "#A5D6A7" }
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <item.icon size={24} color="#000" />
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>{item.label}</div>
                            <div style={{ marginLeft: 'auto' }}><ArrowRight size={16} opacity={0.5} /></div>
                        </div>
                    ))}
                </div>
            </FeatureSection>

            {/* FOOTER */}
            <footer className="minimal-footer">
                <div>© 2025 Begyn. All rights reserved.</div>
                <div className="footer-links">
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/terms">Terms</Link>
                </div>
            </footer>
        </div>
    );
}
