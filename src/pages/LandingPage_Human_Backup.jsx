import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import {
    Sparkles, ArrowRight, LayoutTemplate, PenTool,
    Users, ChevronRight, Play, CheckCircle2,
    Instagram, Linkedin, Twitter, MessageSquareHeart
} from 'lucide-react';

// --- COMPONENTS ---

const Navbar = ({ user }) => {
    const navigate = useNavigate();
    const handleLogout = () => auth.signOut();

    return (
        <nav style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '24px 40px', maxWidth: '1200px', margin: '0 auto',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white'
                }}>
                    <Sparkles size={20} fill="white" />
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Begyn</span>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                {user ? (
                    <button onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'var(--text-primary)', color: 'var(--bg-primary)',
                            padding: '10px 24px', borderRadius: '99px',
                            fontWeight: '600', border: 'none'
                        }}>
                        Go to Dashboard
                    </button>
                ) : (
                    <>
                        <Link to="/login" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '500' }}>Log in</Link>
                        <button onClick={() => navigate('/login')}
                            style={{
                                background: 'var(--text-primary)', color: 'var(--bg-primary)',
                                padding: '10px 24px', borderRadius: '99px',
                                fontWeight: '600', border: 'none'
                            }}>
                            Sign up free
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

const SocialCard = ({ username, handle, content, likes, type = "twitter" }) => (
    <div className="hover-lift-glow" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '24px',
        maxWidth: '320px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex', flexDirection: 'column', gap: '16px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: type === 'instagram' ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' : '#1DA1F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
                {type === 'instagram' ? <Instagram size={20} /> : <Twitter size={20} />}
            </div>
            <div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{username}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@{handle}</div>
            </div>
        </div>
        <div style={{ fontSize: '1rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
            {content}
        </div>
        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: 'auto' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquareHeart size={16} /> {Math.floor(likes / 10)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} /> {likes}
            </span>
        </div>
    </div>
);

const Hero = ({ user }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const handleCta = () => {
        if (user) navigate('/dashboard');
        else navigate('/login', { state: { email } });
    };

    return (
        <section style={{
            padding: '80px 24px', maxWidth: '1200px', margin: '0 auto',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '6px 16px', borderRadius: '99px', background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '24px'
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                        Available for everyone
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                        fontWeight: '800',
                        lineHeight: '1.1',
                        letterSpacing: '-1.5px',
                        color: 'var(--text-primary)',
                        marginBottom: '24px'
                    }}>
                        Social media that feels <span style={{ color: 'var(--text-tertiary)' }}>human again.</span>
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)',
                        maxWidth: '540px'
                    }}>
                        Tell your story, not an algorithm's. We help you create authentic content that connects, without the burnout.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button onClick={handleCta} style={{
                        background: 'var(--text-primary)', color: 'var(--bg-primary)',
                        padding: '16px 32px', borderRadius: '99px', fontSize: '1.1rem',
                        fontWeight: '600', border: 'none', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        Start creating free <ArrowRight size={20} />
                    </button>
                    <button style={{
                        background: 'transparent', color: 'var(--text-primary)',
                        padding: '16px 32px', borderRadius: '99px', fontSize: '1.1rem',
                        fontWeight: '600', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <Play size={20} fill="currentColor" /> Watch how it works
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', paddingLeft: '12px' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{
                                width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--bg-primary)',
                                background: `url(https://i.pravatar.cc/100?img=${i + 10}) center/cover`,
                                marginLeft: '-12px'
                            }} />
                        ))}
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>10,000+ Creators</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Trust Begyn daily</div>
                    </div>
                </div>
            </div>

            {/* Visual Side */}
            <div style={{ position: 'relative', height: '600px', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                    position: 'absolute', top: '10%', right: '10%', zIndex: 2,
                    transform: 'rotate(6deg)'
                }}>
                    <SocialCard
                        type="instagram"
                        username="Sarah Designer"
                        handle="design.sarah"
                        content="Finally found a workflow that doesn't feel like a second job. Consistent posting is actually fun now! 🎨✨ #designlife #creative"
                        likes="1,240"
                    />
                </div>
                <div style={{
                    position: 'absolute', top: '30%', left: '5%', zIndex: 3,
                    transform: 'rotate(-4deg)'
                }}>
                    <SocialCard
                        type="twitter"
                        username="Alex | Startup Founder"
                        handle="alexbuilds"
                        content="Productivity isn't about doing more, it's about doing what matters. Today's deep work session was fueled by coffee and clear goals. 🚀"
                        likes="482"
                    />
                </div>
                {/* Background Blob */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%)',
                    zIndex: 0, filter: 'blur(60px)'
                }} />
            </div>
        </section>
    );
};

const ValueProp = () => {
    const features = [
        {
            icon: <PenTool size={24} />,
            title: "Write like you",
            desc: "Our AI learns your specific tone and voice, so you never sound robotic."
        },
        {
            icon: <LayoutTemplate size={24} />,
            title: "Plan in minutes",
            desc: "Drag, drop, and organize your entire month of content in one simple view."
        },
        {
            icon: <Users size={24} />,
            title: "Grow your tribe",
            desc: "Focus on engaging with your audience while we handle the heavy lifting."
        }
    ];

    return (
        <section style={{ padding: '100px 24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                    Less management, more creativity.
                </h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    We stripped away the complex dashboards and confusing metrics.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                {features.map((f, i) => (
                    <div key={i} style={{
                        padding: '32px', borderRadius: '24px', background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)', transition: 'transform 0.2s'
                    }} className="hover-lift-glow">
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '24px', color: 'var(--text-primary)', border: '1px solid var(--border-color)'
                        }}>
                            {f.icon}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
                            {f.title}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            {f.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

const Footer = () => (
    <footer style={{
        padding: '80px 24px', borderTop: '1px solid var(--border-color)',
        textAlign: 'center', color: 'var(--text-secondary)'
    }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.8 }}>
                <Sparkles size={24} color="var(--text-primary)" />
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>Begyn</span>
            </div>
            <div style={{ display: 'flex', gap: '32px', fontSize: '0.95rem' }}>
                <Link to="/terms" style={{ color: 'var(--text-secondary)' }}>Terms</Link>
                <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy</Link>
                <a href="mailto:support@begyn.ai" style={{ color: 'var(--text-secondary)' }}>Contact</a>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>
                &copy; {new Date().getFullYear()} Begyn AI. All rights reserved.
            </p>
        </div>
    </footer>
);

export default function LandingPage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: "'Inter', sans-serif" // Ensure clean font
        }}>
            <Navbar user={user} />
            <Hero user={user} />
            <ValueProp />
            <Footer />
        </div>
    );
}
