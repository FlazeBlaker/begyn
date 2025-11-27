import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
    Zap, Layout, PenTool, Image as ImageIcon, CheckCircle,
    MessageSquare, ArrowRight, Shield, Globe, Star, LayoutDashboard, LogIn, Cpu
} from 'lucide-react';
import AdUnit from '../components/AdUnit';

// --- COMPONENTS ---

const Navbar = ({ user }) => {
    const handleLogout = () => auth.signOut();

    return (
        <nav className="glass-premium" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 40px', maxWidth: '1200px', margin: '20px auto', borderRadius: '99px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/logos/logo.png" alt="Begyn Logo" style={{ height: '32px' }} />
                <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }} className="text-glow-purple">Begyn</span>
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                {user ? (
                    <>
                        <Link to="/dashboard" className="cyber-button" style={{
                            padding: '8px 24px', borderRadius: '99px', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem'
                        }}>
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>
                        <button onClick={handleLogout} style={{ color: '#a0a0b0', fontWeight: '500', fontSize: '0.9rem', background: 'transparent', border: 'none', cursor: 'pointer' }} className="hover-lift-glow">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="glitch-hover" style={{ color: '#e0e0e0', textDecoration: 'none', fontWeight: '500' }}>Login</Link>
                        <Link to="/login" className="cyber-button" style={{
                            padding: '8px 24px', borderRadius: '99px', textDecoration: 'none', fontSize: '0.9rem'
                        }}>
                            Get Started
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

const Hero = ({ user }) => {
    const navigate = useNavigate();

    const handleCtaClick = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <section style={{
            textAlign: 'center', padding: '100px 20px', maxWidth: '1000px', margin: '0 auto',
            position: 'relative'
        }}>
            <div className="orb-glowing" style={{ top: '20%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>

            <div className="stagger-1" style={{
                display: 'inline-block', padding: '6px 16px', borderRadius: '99px',
                background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe', marginBottom: '24px',
                border: '1px solid rgba(168, 85, 247, 0.2)', fontSize: '0.9rem', fontWeight: '600'
            }}>
                ✨ The #1 AI Content Suite
            </div>
            <h1 className="stagger-2" style={{
                fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px',
                color: '#fff'
            }}>
                Supercharge Your <br /> Social Media with <span className="aurora-text">AI</span>
            </h1>
            <p className="stagger-3" style={{ fontSize: '1.2rem', color: '#a0a0b0', maxWidth: '700px', margin: '0 auto 40px' }}>
                Generate viral posts, stunning images, and engaging threads in seconds.
                Stop staring at a blank screen and start creating.
            </p>
            <div className="stagger-3" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button onClick={handleCtaClick} className="cyber-button" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '99px' }}>
                    {user ? (
                        <>Go to Dashboard <ArrowRight size={18} /></>
                    ) : (
                        <>Start Creating Free <ArrowRight size={18} /></>
                    )}
                </button>
            </div>
        </section>
    );
};

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="glass-premium hover-lift-glow tech-corners" style={{ padding: '32px', borderRadius: '16px' }}>
        <div style={{
            width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#a855f7'
        }}>
            <Icon size={28} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>{title}</h3>
        <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>{desc}</p>
    </div>
);

const Features = () => (
    <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>Everything You Need</h2>
            <p style={{ color: '#a0a0b0', fontSize: '1.1rem' }}>A complete suite of tools to grow your brand.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <FeatureCard
                icon={PenTool}
                title="AI Writer"
                desc="Generate high-converting captions for Instagram, LinkedIn, and Twitter. Our AI understands your tone and audience."
            />
            <FeatureCard
                icon={ImageIcon}
                title="Image Generator"
                desc="Create royalty-free, stunning visuals in seconds. No design skills required. Perfect for thumbnails and posts."
            />
            <FeatureCard
                icon={Layout}
                title="Carousel Maker"
                desc="Turn any topic into a viral carousel. We handle the structure, hooks, and slide content for you."
            />
            <FeatureCard
                icon={Zap}
                title="Idea Generator"
                desc="Never run out of content ideas. Get endless inspiration based on trending topics in your niche."
            />
            <FeatureCard
                icon={Globe}
                title="Multi-Platform"
                desc="Write once, publish everywhere. Automatically reformat content for LinkedIn, Twitter, and more."
            />
            <FeatureCard
                icon={Shield}
                title="Brand Safety"
                desc="Your content is safe with us. We ensure all generations are unique and plagiarism-free."
            />
        </div>
    </section>
);

const HowItWorks = () => (
    <section style={{ padding: '100px 20px', position: 'relative' }}>
        <div className="retro-grid" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}></div>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '60px', textAlign: 'center' }}>How It Works</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
                <div style={{ textAlign: 'center' }} className="hover-lift-glow">
                    <div className="text-glow-purple" style={{ fontSize: '5rem', fontWeight: '800', color: 'rgba(168, 85, 247, 0.2)', marginBottom: '16px' }}>01</div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>Select a Tool</h3>
                    <p style={{ color: '#a0a0b0' }}>Choose from Post, Tweet, Image, or Blog generators.</p>
                </div>
                <div style={{ textAlign: 'center' }} className="hover-lift-glow">
                    <div className="text-glow-purple" style={{ fontSize: '5rem', fontWeight: '800', color: 'rgba(168, 85, 247, 0.2)', marginBottom: '16px' }}>02</div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>Enter Topic</h3>
                    <p style={{ color: '#a0a0b0' }}>Describe what you want to create in a few words.</p>
                </div>
                <div style={{ textAlign: 'center' }} className="hover-lift-glow">
                    <div className="text-glow-purple" style={{ fontSize: '5rem', fontWeight: '800', color: 'rgba(168, 85, 247, 0.2)', marginBottom: '16px' }}>03</div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>Generate & Publish</h3>
                    <p style={{ color: '#a0a0b0' }}>Get results in seconds. Edit, copy, and go viral.</p>
                </div>
            </div>
        </div>
    </section>
);

const FAQ = () => (
    <section style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '40px', textAlign: 'center' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-premium" style={{ padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>Is it free to use?</h3>
                <p style={{ color: '#a0a0b0' }}>Yes! You get free credits every day to generate content. You can upgrade for unlimited access.</p>
            </div>
            <div className="glass-premium" style={{ padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>Can I use the images commercially?</h3>
                <p style={{ color: '#a0a0b0' }}>Absolutely. All images generated are royalty-free and yours to use.</p>
            </div>
            <div className="glass-premium" style={{ padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>What AI model do you use?</h3>
                <p style={{ color: '#a0a0b0' }}>We use advanced models like Gemini Pro and GPT-4 to ensure high-quality, human-like content.</p>
            </div>
        </div>

        <AdUnit slotId="1234567890" />
    </section>
);

const Footer = () => (
    <footer style={{ padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#a0a0b0', fontSize: '0.9rem' }}>
        <div style={{ marginBottom: '20px' }}>
            <Link to="/login" className="text-glow-blue" style={{ color: '#e0e0e0', margin: '0 10px', textDecoration: 'none' }}>Login</Link>
            <Link to="/privacy" className="text-glow-blue" style={{ color: '#e0e0e0', margin: '0 10px', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" className="text-glow-blue" style={{ color: '#e0e0e0', margin: '0 10px', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
        <p>© 2025 Begyn AI. All rights reserved.</p>
    </footer>
);

export default function LandingPage() {
    const [user, setUser] = useState(null);

    // Check auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div style={{ minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            <Navbar user={user} />
            <Hero user={user} />
            <Features />
            <AdUnit slotId="1234567890" />
            <HowItWorks />
            <FAQ />
            <Footer />
        </div>
    );
}
