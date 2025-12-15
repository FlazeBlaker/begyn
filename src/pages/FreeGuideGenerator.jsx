import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Target, BarChart, CheckCircle } from 'lucide-react';

const FreeGuideGenerator = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        platform: '',
        niche: '',
        goal: ''
    });

    const platforms = [
        { id: 'instagram', label: 'Instagram', icon: '📸' },
        { id: 'youtube', label: 'YouTube', icon: '▶️' },
        { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
        { id: 'tiktok', label: 'TikTok', icon: '🎵' }
    ];

    const goals = [
        { id: 'followers', label: 'Get Followers', icon: <Users size={18} /> },
        { id: 'clients', label: 'Get Clients', icon: <Target size={18} /> },
        { id: 'engagement', label: 'Boost Engagement', icon: <BarChart size={18} /> }
    ];

    const handleGenerate = () => {
        if (!formData.platform || !formData.niche || !formData.goal) return;

        // "Dummy" generation - logic removed as requested.
        // Just animate or simulate a bit then redirect.

        navigate('/login', {
            state: {
                authMode: 'signup',
                message: "Create your free account to view your AI-generated roadmap."
            }
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050507',
            color: 'white',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header */}
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: '700', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="aurora-text">Begyn</span> <span style={{ color: '#64748b' }}>/ Free Guide Generator</span>
                </div>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Content */}
                <div className="stagger-1">
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', marginBottom: '16px' }}>
                        Let's build your <span className="gradient-text">Viral Roadmap</span>
                    </h1>
                    <p style={{ textAlign: 'center', color: '#a0a0b0', marginBottom: '40px', fontSize: '1.1rem' }}>
                        Answer 3 quick questions. (Demo Mode)
                    </p>

                    <div className="glass-premium" style={{ padding: '32px', borderRadius: '24px' }}>

                        {/* Question 1: Platform */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#e2e8f0' }}>1. Which platform is your focus?</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                {platforms.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setFormData({ ...formData, platform: p.id })}
                                        style={{
                                            padding: '16px', borderRadius: '12px', border: formData.platform === p.id ? '1px solid #7c4dff' : '1px solid rgba(255,255,255,0.1)',
                                            background: formData.platform === p.id ? 'rgba(124, 77, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                                            color: 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                                        }}
                                    >
                                        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{p.icon}</div>
                                        <div style={{ fontWeight: '500' }}>{p.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question 2: Niche */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#e2e8f0' }}>2. What is your niche?</label>
                            <input
                                type="text"
                                placeholder="e.g. Fitness, Digital Marketing, vlogging..."
                                value={formData.niche}
                                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '1rem', outline: 'none'
                                }}
                            />
                        </div>

                        {/* Question 3: Goal */}
                        <div style={{ marginBottom: '40px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#e2e8f0' }}>3. What is your main goal?</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                {goals.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setFormData({ ...formData, goal: g.id })}
                                        style={{
                                            padding: '16px', borderRadius: '12px', border: formData.goal === g.id ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                                            background: formData.goal === g.id ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255,255,255,0.03)',
                                            color: 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        <div style={{ color: formData.goal === g.id ? '#34d399' : '#a0a0b0' }}>{g.icon}</div>
                                        <div style={{ fontWeight: '500' }}>{g.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!formData.platform || !formData.niche || !formData.goal}
                            className="cyber-button"
                            style={{ width: '100%', padding: '18px', fontSize: '1.1rem', borderRadius: '16px', opacity: (!formData.platform || !formData.niche || !formData.goal) ? 0.5 : 1 }}
                        >
                            Generate My Free Guide <ArrowRight size={20} style={{ display: 'inline', marginLeft: '8px' }} />
                        </button>

                    </div>
                </div>

            </div>

        </div>
    );
};

export default FreeGuideGenerator;
