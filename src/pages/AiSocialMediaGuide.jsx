import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowRight, CheckCircle, Star, Zap, Layout, Globe, Shield } from 'lucide-react';
import AdUnit from '../components/AdUnit';

// Reusing Navbar from LandingPage (simplified for this page)
const Navbar = ({ user }) => {
    const handleLogout = () => auth.signOut();

    return (
        <nav className="glass-premium" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 40px', maxWidth: '1200px', margin: '20px auto', borderRadius: '99px'
        }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff' }}>
                <img src="/logos/logo.png" alt="Begyn" style={{ height: '40px' }} />
                <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-1px' }}>Begyn</span>
            </Link>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                {user ? (
                    <Link to="/dashboard" className="cyber-button" style={{ padding: '10px 24px', borderRadius: '99px', textDecoration: 'none', fontSize: '0.9rem' }}>
                        Dashboard
                    </Link>
                ) : (
                    <Link to="/login" style={{ textDecoration: 'none', color: '#fff', fontWeight: '600' }}>Login</Link>
                )}
            </div>
        </nav>
    );
};

const Footer = () => (
    <footer style={{ padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#a0a0b0', fontSize: '0.9rem', marginTop: '80px' }}>
        <div style={{ marginBottom: '20px' }}>
            <Link to="/" style={{ color: '#e0e0e0', margin: '0 10px', textDecoration: 'none' }}>Home</Link>
            <Link to="/terms" style={{ color: '#e0e0e0', margin: '0 10px', textDecoration: 'none' }}>Terms</Link>
            <Link to="/privacy" style={{ color: '#e0e0e0', margin: '0 10px', textDecoration: 'none' }}>Privacy</Link>
        </div>
        <p>© 2025 Begyn AI. All rights reserved.</p>
    </footer>
);

export default function AiSocialMediaGuide() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div style={{ minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', background: '#050507' }}>
            <Navbar user={user} />

            <main style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px' }}>

                {/* Header Section */}
                <header style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <div style={{
                        display: 'inline-block', padding: '6px 16px', borderRadius: '99px',
                        background: 'rgba(124, 77, 255, 0.1)', color: '#CE93D8', marginBottom: '24px',
                        border: '1px solid rgba(124, 77, 255, 0.2)', fontSize: '0.9rem', fontWeight: '600'
                    }}>
                        The Ultimate Roadmap
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: '900',
                        lineHeight: '1.2',
                        marginBottom: '24px',
                        letterSpacing: '-1px'
                    }}>
                        The Complete <span className="aurora-text">AI Social Media Guide</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#a0a0b0', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
                        Learn how to become an influencer using AI. A step-by-step strategy to grow your audience on Instagram, YouTube, and LinkedIn.
                    </p>
                </header>

                {/* Content Section 1: What is it? */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>What is an AI Social Media Guide?</h2>
                    <p style={{ color: '#b0b0c0', lineHeight: '1.8', fontSize: '1.1rem', marginBottom: '20px' }}>
                        An AI social media guide is more than just a list of tips. It's a dynamic, data-driven roadmap generated specifically for your brand. Unlike generic advice, AI analyzes your niche, audience, and goals to create a personalized plan.
                    </p>
                    <p style={{ color: '#b0b0c0', lineHeight: '1.8', fontSize: '1.1rem' }}>
                        With Begyn, you don't just get advice; you get a <strong>30-day actionable checklist</strong>, content ideas, and scripts tailored to your voice. It's like having a personal marketing strategist working for you 24/7.
                    </p>
                </section>

                {/* Content Section 2: How AI Helps */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '30px', color: '#fff' }}>How AI Helps Influencers Grow Faster</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                        <div className="glass-premium" style={{ padding: '24px', borderRadius: '16px' }}>
                            <Zap size={32} color="#7C4DFF" style={{ marginBottom: '16px' }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '12px' }}>Consistency</h3>
                            <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>AI generates endless content ideas so you never face writer's block, ensuring you post consistently.</p>
                        </div>
                        <div className="glass-premium" style={{ padding: '24px', borderRadius: '16px' }}>
                            <Star size={32} color="#7C4DFF" style={{ marginBottom: '16px' }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '12px' }}>Quality</h3>
                            <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>Create professional-grade captions, scripts, and images that stand out in crowded feeds.</p>
                        </div>
                        <div className="glass-premium" style={{ padding: '24px', borderRadius: '16px' }}>
                            <Layout size={32} color="#7C4DFF" style={{ marginBottom: '16px' }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '12px' }}>Strategy</h3>
                            <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>Move beyond random posting. Follow a structured roadmap designed to build authority and engagement.</p>
                        </div>
                    </div>
                </section>

                {/* Content Section 3: The Roadmap */}
                <section style={{ marginBottom: '80px', background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>Your Step-by-Step Roadmap</h2>
                    <p style={{ textAlign: 'center', color: '#a0a0b0', marginBottom: '40px' }}>Here is what a typical journey looks like with Begyn:</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <div style={{ background: '#7C4DFF', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '8px' }}>Foundation (Days 1-7)</h3>
                                <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>Optimize your profiles, define your brand voice, and identify your target audience. AI helps you write the perfect bio and content pillars.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <div style={{ background: '#7C4DFF', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '8px' }}>Content Creation (Days 8-20)</h3>
                                <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>Start posting high-value content. Use our AI tools to generate scripts for Reels, captions for Instagram, and threads for Twitter.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <div style={{ background: '#7C4DFF', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '8px' }}>Growth & Engagement (Days 21-30)</h3>
                                <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>Analyze what's working. Engage with your community using AI-suggested responses. Scale your best-performing content.</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <button
                            onClick={() => navigate(user ? '/dashboard' : '/login')}
                            className="cyber-button"
                            style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '99px' }}
                        >
                            Start Your AI Guide Now <ArrowRight size={18} />
                        </button>
                    </div>
                </section>

                {/* Platforms */}
                <section>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '30px', textAlign: 'center' }}>Supported Platforms</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                        {['Instagram', 'YouTube', 'LinkedIn', 'Twitter / X', 'TikTok'].map(platform => (
                            <div key={platform} className="glass-premium" style={{ padding: '12px 24px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {platform}
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            <AdUnit slotId="9876543210" />
            <Footer />
        </div>
    );
}
