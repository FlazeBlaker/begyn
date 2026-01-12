import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
    Zap, Layout, PenTool, Image as ImageIcon, CheckCircle,
    MessageSquare, ArrowRight, Shield, Globe, Star, LayoutDashboard, LogIn, Cpu, Video, Plus, Minus
} from 'lucide-react';


// --- COMPONENTS ---

const Navbar = ({ user }) => {
    const handleLogout = () => auth.signOut();

    return (
        <nav className="glass-premium" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 40px', maxWidth: '1200px', margin: '20px auto', borderRadius: '99px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/logos/logo.png" alt="Begyn" style={{ height: '40px' }} />
                <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-1px' }}>Begyn</span>
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                {user ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '6px 16px',
                        borderRadius: '99px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7C4DFF 0%, #CE93D8 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.9rem', fontWeight: '700', color: '#fff'
                        }}>
                            {user.displayName?.charAt(0) || 'U'}
                        </div>
                        <span style={{ color: '#e0e0e0', fontWeight: '500', fontSize: '0.95rem' }}>
                            Hi, <span style={{ color: '#fff', fontWeight: '600' }}>{user.displayName?.split(' ')[0]}</span>
                        </span>
                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#a0a0b0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#ff4444'}
                            onMouseLeave={(e) => e.target.style.color = '#a0a0b0'}
                            title="Logout"
                        >
                            <LogIn size={18} />
                        </button>
                    </div>
                ) : (
                    <Link to="/login" style={{ textDecoration: 'none', color: '#fff', fontWeight: '600' }}>Login</Link>
                )}
            </div>
        </nav>
    );
};

const Hero = ({ user }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const handleCtaClick = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            // Pass email and force signup mode
            navigate('/login', { state: { email, authMode: 'signup' } });
        }
    };

    return (
        <section style={{
            textAlign: 'center', padding: '100px 20px', maxWidth: '1000px', margin: '0 auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
            <div className="stagger-1" style={{
                display: 'inline-block', padding: '6px 16px', borderRadius: '99px',
                background: 'rgba(124, 77, 255, 0.1)', color: '#CE93D8', marginBottom: '24px',
                border: '1px solid rgba(124, 77, 255, 0.2)', fontSize: '0.9rem', fontWeight: '600'
            }}>
                ✨ The #1 AI Content Suite
            </div>
            <div className="stagger-2" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                marginBottom: '32px', position: 'relative'
            }}>
                <div className="glass-premium hover-lift-glow" style={{
                    padding: '24px 48px', borderRadius: '32px',
                    display: 'flex', alignItems: 'center', gap: '24px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 50px -10px rgba(124, 77, 255, 0.3)'
                }}>
                    <img
                        src="/logos/logo.png"
                        alt="Begyn Logo"
                        style={{
                            height: 'clamp(60px, 10vw, 100px)',
                            filter: 'drop-shadow(0 0 20px rgba(124, 77, 255, 0.5))'
                        }}
                    />
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        {/* SEO H1 (Hidden but present for crawlers) */}
                        <h1 style={{
                            position: 'absolute',
                            width: '1px',
                            height: '1px',
                            padding: 0,
                            margin: -1,
                            overflow: 'hidden',
                            clip: 'rect(0, 0, 0, 0)',
                            whiteSpace: 'nowrap',
                            borderWidth: 0
                        }}>
                            AI Social Media Guide to Become an Influencer
                        </h1>

                        {/* Visual Title */}
                        <div style={{
                            fontSize: 'clamp(3.5rem, 8vw, 6rem)',
                            fontWeight: '900',
                            lineHeight: '1',
                            margin: 0,
                            letterSpacing: '-2px',
                            color: '#fff'
                        }}>
                            <span className="aurora-text">Begyn</span>
                        </div>
                    </div>
                </div>
            </div>
            <p className="stagger-3" style={{ fontSize: '1.2rem', color: '#a0a0b0', maxWidth: '700px', margin: '0 auto 40px' }}>
                Don't know where to start from?
                <br />
                Follow our step-by-step guide to master your social media journey.
            </p>
            <div className="stagger-3" style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                {!user && (
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            padding: '16px 24px',
                            borderRadius: '99px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none',
                            minWidth: '280px'
                        }}
                    />
                )}
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

const MacWindowPreview = () => (
    <section style={{ padding: '0 20px 80px', maxWidth: '1000px', margin: '0 auto', transform: 'translateY(-40px)', position: 'relative', zIndex: 10 }}>
        <div className="glass-premium hover-lift-glow" style={{
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.7)',
            background: '#0a0a0a'
        }}>
            {/* Title Bar */}
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
                </div>
                <div style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', fontWeight: '500' }}>
                    Begyn Mission Control
                </div>
            </div>

            {/* Content Split */}
            <div className="mac-window-content" style={{ display: 'flex', minHeight: '400px' }}>
                {/* Left Side: Text */}
                <div style={{
                    flex: 1,
                    padding: '48px',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: 'linear-gradient(to bottom right, rgba(255,255,255,0.01), transparent)'
                }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        color: '#CE93D8', fontSize: '0.9rem', marginBottom: '20px', fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        <Cpu size={16} /> AI Strategy Engine
                    </div>
                    <h3 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '20px', color: '#fff', lineHeight: '1.2' }}>
                        Your Daily Roadmap to <span className="gradient-text">Success</span>
                    </h3>
                    <p style={{ color: '#a0a0b0', lineHeight: '1.7', fontSize: '1.1rem', marginBottom: '32px' }}>
                        Forget the guesswork. Get a tailored plan every single day based on your niche.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', padding: '4px' }}><CheckCircle size={16} color="#4ade80" /></div>
                            <span style={{ color: '#e0e0e0' }}>Step-by-step generic tasks</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', padding: '4px' }}><CheckCircle size={16} color="#4ade80" /></div>
                            <span style={{ color: '#e0e0e0' }}>Viral hooks & scripts generated for you</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', padding: '4px' }}><CheckCircle size={16} color="#4ade80" /></div>
                            <span style={{ color: '#e0e0e0' }}>Monitor growth & streaks</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Guide Visual */}
                <div style={{
                    flex: 1.2,
                    background: '#050507',
                    padding: '40px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    {/* Background Grid */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '24px 24px', opacity: 0.5
                    }}></div>

                    {/* Simulated Chat/Guide Interface */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
                        <div className="stagger-1" style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', gap: '16px', alignItems: 'flex-start'
                        }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7C4DFF, #CE93D8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Define Your Niche</div>
                                <div style={{ fontSize: '0.85rem', color: '#a0a0b0' }}>Identifying your target audience is the first step to viral growth.</div>
                            </div>
                        </div>

                        <div className="stagger-2" style={{
                            background: 'rgba(124, 77, 255, 0.05)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid rgba(124, 77, 255, 0.2)',
                            display: 'flex', gap: '16px', alignItems: 'flex-start',
                            boxShadow: '0 10px 30px -10px rgba(124, 77, 255, 0.1)'
                        }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={18} color="#000" /></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Post a "Hook" Twist</div>
                                <div style={{ fontSize: '0.85rem', color: '#e0e0e0', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                                    "I tried AI for 30 days and here's what happened..."
                                </div>
                            </div>
                        </div>

                        <div className="stagger-3" style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', gap: '16px', alignItems: 'flex-start',
                            opacity: 0.6
                        }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', border: '2px dashed rgba(255,255,255,0.2)' }}></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ height: '10px', width: '50%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px' }} />
                                <div style={{ height: '8px', width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                            </div>
                        </div>
                    </div>

                    {/* Floating Badge */}
                    <div style={{
                        position: 'absolute', bottom: '20px', right: '20px',
                        background: 'rgba(5, 5, 7, 0.8)',
                        backdropFilter: 'blur(10px)',
                        padding: '8px 16px',
                        borderRadius: '99px',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        zIndex: 10
                    }}>
                        <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4ade80' }}>AI Active</span>
                    </div>
                </div>
            </div>
        </div>
        <style>
            {`
            @media (max-width: 900px) {
                .mac-window-content {
                    flex-direction: column !important;
                }
            }
        `}
        </style>
    </section>
);

const HowItWorks = ({ user }) => {
    const navigate = useNavigate();

    const handleCtaClick = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const steps = [
        {
            num: "01",
            title: "Connect Your Brand",
            desc: "Tell us about your niche and audience. We build a unique AI profile that speaks exactly like you.",
            icon: "🧬"
        },
        {
            num: "02",
            title: "Generate Magic",
            desc: "Use our 'Mission Control' to get daily viral ideas, scripts, and captions in one click.",
            icon: "✨"
        },
        {
            num: "03",
            title: "Watch It Grow",
            desc: "Post consistently with our roadmap and watch your engagement skyrocket.",
            icon: "🚀"
        }
    ];

    return (
        <section style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="glass-premium" style={{
                borderRadius: '32px',
                padding: '60px 40px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decoration */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(124, 77, 255, 0.5), transparent)'
                }} />

                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>
                        How It Works
                    </h2>
                    <p style={{ color: '#a0a0b0', fontSize: '1.1rem' }}>
                        Go from zero to influencer in 3 simple steps.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '40px',
                    position: 'relative'
                }}>


                    {steps.map((step, index) => (
                        <div key={index} className="glass-premium hover-lift-glow" style={{
                            position: 'relative',
                            zIndex: 1,
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(124, 77, 255, 0.05) 100%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '24px',
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{
                                width: '80px', height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(206, 147, 216, 0.1))',
                                border: '1px solid rgba(124, 77, 255, 0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2rem',
                                marginBottom: '24px',
                                boxShadow: '0 0 30px rgba(124, 77, 255, 0.1)'
                            }}>
                                {step.icon}
                            </div>
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                fontSize: '3rem',
                                fontWeight: '900',
                                color: 'rgba(255,255,255,0.03)',
                                lineHeight: 1
                            }}>
                                {step.num}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>
                                {step.title}
                            </h3>
                            <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <button onClick={handleCtaClick} className="cyber-button" style={{
                        padding: '14px 32px',
                        fontSize: '1rem',
                        borderRadius: '99px',
                        cursor: 'pointer'
                    }}>
                        {user ? "Go to Dashboard" : "Get Started Free"}
                    </button>
                </div>
            </div>
        </section>
    );
};

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="glass-premium hover-lift-glow tech-corners" style={{ padding: '32px', borderRadius: '16px' }}>
        <div style={{
            width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(124, 77, 255, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#7C4DFF'
        }}>
            <Icon size={28} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>{title}</h3>
        <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>{desc}</p>
    </div>
);

// --- DRAGGABLE MARQUEE COMPONENT ---
const DraggableMarquee = ({ children, speed = 0.5 }) => {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState(0);
    const [singleWidth, setSingleWidth] = useState(0);
    const animationRef = useRef(null);
    const lastX = useRef(0);

    // Measure width and set initial position
    useEffect(() => {
        const measure = () => {
            if (contentRef.current) {
                const total = contentRef.current.scrollWidth;
                const single = total / 3;
                setSingleWidth(single);
                // Start at the middle set to allow bidirectional scrolling immediately
                setOffset(-single);
            }
        };

        measure();
        window.addEventListener('resize', measure);
        // Small delay to ensure fonts/icons loaded
        setTimeout(measure, 100);

        return () => window.removeEventListener('resize', measure);
    }, [children]);

    // Animation Loop
    useEffect(() => {
        if (isDragging || singleWidth === 0) return;

        const animate = () => {
            setOffset(prev => {
                let newOffset = prev - speed;

                // Seamless Loop Logic
                // If we scroll past the start of the first set (moving right), jump to start of second set
                if (newOffset > 0) {
                    newOffset = -singleWidth;
                }
                // If we scroll past the end of the third set (moving left), jump to end of second set
                else if (newOffset < -2 * singleWidth) {
                    newOffset = -singleWidth;
                }

                return newOffset;
            });
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [isDragging, speed, singleWidth]);

    // Drag handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        lastX.current = e.pageX;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const handleTouchStart = (e) => {
        setIsDragging(true);
        lastX.current = e.touches[0].pageX;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX;
        const walk = x - lastX.current;
        lastX.current = x;

        setOffset(prev => {
            let newOffset = prev + walk;
            // Apply same wrap logic during drag
            if (singleWidth > 0) {
                if (newOffset > 0) newOffset -= singleWidth;
                else if (newOffset < -2 * singleWidth) newOffset += singleWidth;
            }
            return newOffset;
        });
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const x = e.touches[0].pageX;
        const walk = x - lastX.current;
        lastX.current = x;

        setOffset(prev => {
            let newOffset = prev + walk;
            if (singleWidth > 0) {
                if (newOffset > 0) newOffset -= singleWidth;
                else if (newOffset < -2 * singleWidth) newOffset += singleWidth;
            }
            return newOffset;
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            className="marquee-container"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleDragEnd}
            onMouseUp={handleDragEnd}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
        >
            <div
                className="marquee-track"
                ref={contentRef}
                style={{ transform: `translateX(${offset}px)` }}
            >
                {/* Triplicate children for seamless loop */}
                {children}
                {children}
                {children}
            </div>
        </div>
    );
};

const Features = () => (
    <section style={{ padding: '80px 0', maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px', padding: '0 20px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>Everything You Need</h2>
            <p style={{ color: '#a0a0b0', fontSize: '1.1rem' }}>A complete suite of tools to grow your brand.</p>
        </div>

        <DraggableMarquee speed={0.8}>
            <div style={{ display: 'flex', gap: '32px' }}>
                <FeatureCard
                    icon={PenTool}
                    title="Smart Captions"
                    desc="Generate high-converting captions for Instagram, LinkedIn, and Twitter tailored to your audience."
                />
                <FeatureCard
                    icon={Video}
                    title="Video Scripts"
                    desc="Create viral video scripts for TikTok, Reels, and YouTube Shorts in seconds."
                />
                <FeatureCard
                    icon={Star}
                    title="Brand Voice"
                    desc="Train AI on your unique brand voice so every post sounds exactly like you."
                />
                <FeatureCard
                    icon={Zap}
                    title="Endless Ideas"
                    desc="Never run out of inspiration. Get trending content ideas customized for your niche."
                />
                <FeatureCard
                    icon={Globe}
                    title="Multi-Platform"
                    desc="Write once, publish everywhere. Automatically reformat content for LinkedIn, Twitter, and more."
                />
                <FeatureCard
                    icon={Shield}
                    title="Safe & Secure"
                    desc="Your data is used solely to generate your content. We never sell your personal information to third parties."
                />
            </div>
        </DraggableMarquee>
    </section>
);

const DeepDive = () => {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll('.deep-dive-section');
            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
                    setActiveStep(index);
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const steps = [
        {
            id: 0,
            title: "Your Personal Roadmap",
            desc: "Stop guessing what to post. Our interactive guide gives you daily tasks tailored to your brand goals. From setting up your profile to your first viral hit, we walk you through every step.",
            icon: "🗺️",
            image: "/assets/guide_preview.png",
            placeholderColor: "rgba(124, 77, 255, 0.1)"
        },
        {
            id: 1,
            title: "Command Center",
            desc: "Track your growth, monitor your streaks, and manage your content pipeline all in one place. The dashboard keeps you focused and motivated to create consistently.",
            icon: "📊",
            image: "/assets/dashboard_preview.png",
            placeholderColor: "rgba(74, 20, 140, 0.1)"
        },
        {
            id: 2,
            title: "AI Powerhouse",
            desc: "Need a caption? A video script? A brand new idea? Our suite of AI generators creates high-quality, brand-safe content in seconds. It's like having a pro marketing team in your pocket.",
            icon: "⚡",
            image: "/assets/generator_preview.png",
            placeholderColor: "rgba(206, 147, 216, 0.1)"
        }
    ];

    return (
        <section style={{ padding: '100px 20px', position: 'relative' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '80px', textAlign: 'center' }}>
                    Master Your Social Game
                </h2>

                <div className="deep-dive-wrapper">
                    {/* Left: Scrolling Text */}
                    <div style={{ flex: 1 }}>
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className="deep-dive-section"
                                style={{
                                    opacity: activeStep === index ? 1 : 0.3,
                                }}
                            >
                                <div style={{
                                    fontSize: '4rem', marginBottom: '24px',
                                    filter: activeStep === index ? 'drop-shadow(0 0 20px rgba(124, 77, 255, 0.5))' : 'none',
                                    transition: 'all 0.5s ease'
                                }}>
                                    {step.icon}
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>
                                    {step.title}
                                </h3>
                                <p style={{ fontSize: '1.2rem', color: '#a0a0b0', lineHeight: '1.8', marginBottom: '24px' }}>
                                    {step.desc}
                                </p>

                                {/* Mobile Image */}
                                <div className="mobile-only" style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        borderRadius: '16px', overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: step.placeholderColor,
                                        aspectRatio: '16/9',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <img
                                            src={step.image}
                                            alt={step.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div style={{ display: 'none', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                            {step.title} Preview
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Sticky Image (Desktop Only) */}
                    <div className="desktop-only" style={{ flex: 1, position: 'relative' }}>
                        <div style={{
                            position: 'sticky',
                            top: '20vh',
                            height: '60vh',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: '#0f0f13',
                            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)'
                        }}>
                            {steps.map((step, index) => (
                                <div
                                    key={step.id}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: activeStep === index ? 1 : 0,
                                        transition: 'opacity 0.5s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: step.placeholderColor
                                    }}
                                >
                                    {/* Placeholder if image fails or missing */}
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        padding: step.id === 1 ? '10px' : '40px', // Less padding for Command Center (id: 1)
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <img
                                            src={step.image}
                                            alt={step.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                borderRadius: '12px',
                                                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
                                                display: 'block'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div style={{ display: 'none', fontSize: '1.5rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)' }}>
                                            {step.title} Preview
                                            <div style={{ fontSize: '0.9rem', marginTop: '8px', fontWeight: '400' }}>
                                                (Add {step.image.split('/').pop()} to assets)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FAQItem = ({ question, answer, isOpen, onClick }) => (
    <div
        onClick={onClick}
        className="glass-premium hover-lift-glow"
        style={{
            borderRadius: '16px',
            marginBottom: '16px',
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        }}
    >
        <div style={{
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#fff' }}>{question}</h3>
            <div style={{
                color: '#7C4DFF',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
            }}>
                {isOpen ? <Minus size={20} /> : <Plus size={20} />}
            </div>
        </div>
        <div style={{
            maxHeight: isOpen ? '200px' : '0',
            opacity: isOpen ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            padding: isOpen ? '0 24px 24px' : '0 24px'
        }}>
            <p style={{ color: '#a0a0b0', lineHeight: '1.6', margin: 0 }}>{answer}</p>
        </div>
    </div>
);

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "Is it free to use?",
            answer: "Yes! You get 10 free credits when you sign up to try out all the features. After that, you can purchase credit packs as needed."
        },

        {
            question: "What AI model do you use?",
            answer: "We use the latest Meta's top models. These are state-of-the-art models designed for speed and high-quality creative output."
        },
        {
            question: "How do you use my data?",
            answer: "Your data is used solely to generate your requested content. We do not use your inputs or data to train our AI models, ensuring your brand strategy remains private."
        },
        {
            question: "Do my credits expire?",
            answer: "No, your credits never expire. Begyn operates on a pay-as-you-go model, so there are no monthly subscriptions or hidden fees. You only pay for what you use."
        }
    ];

    return (
        <section style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '40px', textAlign: 'center' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {faqs.map((faq, index) => (
                    <FAQItem
                        key={index}
                        question={faq.question}
                        answer={faq.answer}
                        isOpen={openIndex === index}
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    />
                ))}
            </div>


        </section>
    );
};

const Footer = () => (
    <footer style={{ padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#a0a0b0', fontSize: '0.9rem' }}>
        <div style={{ marginBottom: '20px' }}>
            <Link to="/terms" className="text-glow-blue" style={{ color: '#e0e0e0', margin: '0 10px', textDecoration: 'none' }}>Terms of Service</Link>
            <Link to="/privacy" className="text-glow-blue" style={{ color: '#e0e0e0', margin: '0 10px', textDecoration: 'none' }}>Privacy Policy</Link>
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
            <MacWindowPreview />
            <HowItWorks user={user} />
            <Features />

            <DeepDive />
            <FAQ />
            <Footer />
        </div>
    );
}
