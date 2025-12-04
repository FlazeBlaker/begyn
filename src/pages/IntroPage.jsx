import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const IntroPage = ({ setIntroSeenStatus }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        setLoading(true);
        try {
            const uid = auth.currentUser?.uid;
            if (uid) {
                // Mark intro as seen in Firestore
                await updateDoc(doc(db, "brands", uid), {
                    introSeen: true
                });

                // Update local state if provided
                if (setIntroSeenStatus) {
                    setIntroSeenStatus(true);
                }
            }
            // Navigate to the Guide Flow
            navigate('/flow', { replace: true });
        } catch (error) {
            console.error("Error updating intro status:", error);
            // Even if error, try to navigate
            navigate('/flow', { replace: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #2a0a55 0%, #0b1020 100%)',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '20%',
                width: '300px',
                height: '300px',
                background: 'rgba(124, 77, 255, 0.15)',
                filter: 'blur(80px)',
                borderRadius: '50%',
                animation: 'pulse 8s infinite ease-in-out'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '20%',
                right: '20%',
                width: '400px',
                height: '400px',
                background: 'rgba(74, 20, 140, 0.2)',
                filter: 'blur(100px)',
                borderRadius: '50%',
                animation: 'pulse 10s infinite ease-in-out reverse'
            }} />

            <style>
                {`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>

            <div style={{
                textAlign: 'center',
                maxWidth: '600px',
                padding: '40px',
                zIndex: 1,
                animation: 'fadeInUp 1s ease-out'
            }}>
                <h1 style={{
                    fontSize: '3.5rem',
                    fontWeight: '800',
                    marginBottom: '20px',
                    background: 'linear-gradient(135deg, #fff 0%, #a0a0b0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px'
                }}>
                    Welcome to Studio
                </h1>

                <p style={{
                    fontSize: '1.2rem',
                    color: '#b0b0c0',
                    lineHeight: '1.6',
                    marginBottom: '40px'
                }}>
                    Your journey to AI-powered content creation starts here.
                    We've built a personalized workspace to help you grow your brand.
                </p>

                <button
                    onClick={handleStart}
                    disabled={loading}
                    style={{
                        padding: '16px 48px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'white',
                        background: 'linear-gradient(135deg, #7C4DFF 0%, #4A148C 100%)',
                        border: 'none',
                        borderRadius: '30px',
                        cursor: loading ? 'wait' : 'pointer',
                        boxShadow: '0 10px 30px rgba(124, 77, 255, 0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        opacity: loading ? 0.8 : 1
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(124, 77, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(124, 77, 255, 0.4)';
                    }}
                >
                    {loading ? 'Initializing...' : 'Get Started'}
                </button>
            </div>
        </div>
    );
};

export default IntroPage;
