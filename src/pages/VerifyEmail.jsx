import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { Mail, CheckCircle, ArrowRight, Loader } from 'lucide-react';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setEmail(user.email);
                if (user.emailVerified) {
                    setIsVerified(true);
                    // Redirect to intro or dashboard after verification
                    // Force reload to update App.jsx state
                    setTimeout(() => window.location.reload(), 2000);
                }
            } else {
                // If no user, redirect to login
                navigate('/login', { replace: true });
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Auto-check verification status every 3 seconds
    useEffect(() => {
        if (isVerified) return;

        const interval = setInterval(async () => {
            if (auth.currentUser) {
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                    setIsVerified(true);
                    setMessage('Email verified! Redirecting...');
                    // Force reload to update App.jsx state (since we locked it out)
                    setTimeout(() => window.location.reload(), 2000);
                    clearInterval(interval);
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isVerified, navigate]);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleResendVerification = async () => {
        if (!auth.currentUser || resendCooldown > 0) return;

        setError('');
        setMessage('');
        setIsChecking(true);

        try {
            await sendEmailVerification(auth.currentUser);
            setMessage('Verification email sent! Check your inbox.');
            setResendCooldown(60); // 60 second cooldown
        } catch (err) {
            console.error('Resend error:', err);
            setError(err.message || 'Failed to resend verification email');
        } finally {
            setIsChecking(false);
        }
    };

    const handleCheckVerification = async () => {
        if (!auth.currentUser) return;

        setError('');
        setIsChecking(true);

        try {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
                setIsVerified(true);
                setMessage('Email verified! Redirecting...');
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setError('Email not yet verified. Please check your inbox and click the verification link.');
            }
        } catch (err) {
            console.error('Check verification error:', err);
            setError('Failed to check verification status');
        } finally {
            setIsChecking(false);
        }
    };

    if (isVerified) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.successIcon}>
                        <CheckCircle size={64} color="#10b981" />
                    </div>
                    <h1 style={styles.title}>Email Verified!</h1>
                    <p style={styles.subtitle}>Redirecting you to get started...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.iconContainer}>
                    <Mail size={64} color="#7C4DFF" />
                </div>

                <h1 style={styles.title}>Verify Your Email</h1>
                <p style={styles.subtitle}>
                    We've sent a verification link to:<br />
                    <strong>{email}</strong>
                </p>

                <div style={styles.instructions}>
                    <p>1. Check your email inbox</p>
                    <p>2. Click the verification link</p>
                    <p>3. Return here and click "I've Verified"</p>
                </div>

                {message && (
                    <div style={styles.successMessage}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={styles.errorMessage}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCheckVerification}
                    disabled={isChecking}
                    style={{
                        ...styles.button,
                        ...styles.primaryButton,
                        ...(isChecking ? styles.disabledButton : {})
                    }}
                >
                    {isChecking ? (
                        <>
                            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            Checking...
                        </>
                    ) : (
                        <>
                            I've Verified
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>

                <button
                    onClick={handleResendVerification}
                    disabled={isChecking || resendCooldown > 0}
                    style={{
                        ...styles.button,
                        ...styles.secondaryButton,
                        ...((isChecking || resendCooldown > 0) ? styles.disabledButton : {})
                    }}
                >
                    {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend Verification Email'}
                </button>

                <button
                    onClick={async () => {
                        await auth.signOut();
                        navigate('/login');
                    }}
                    style={{
                        ...styles.button,
                        background: 'none',
                        color: '#6b7280',
                        marginTop: '8px',
                        fontSize: '14px'
                    }}
                >
                    Log Out / Switch Account
                </button>

                <p style={styles.helpText}>
                    Didn't receive the email? Check your spam folder or try resending.
                </p>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    card: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
    },
    iconContainer: {
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center',
    },
    successIcon: {
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '10px',
    },
    subtitle: {
        fontSize: '16px',
        color: '#6b7280',
        marginBottom: '30px',
        lineHeight: '1.6',
    },
    instructions: {
        background: '#f3f4f6',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        textAlign: 'left',
    },
    button: {
        width: '100%',
        padding: '14px 24px',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.3s ease',
        marginBottom: '12px',
    },
    primaryButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
    },
    secondaryButton: {
        background: 'transparent',
        color: '#667eea',
        border: '2px solid #667eea',
    },
    disabledButton: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    successMessage: {
        background: '#d1fae5',
        color: '#065f46',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
    },
    errorMessage: {
        background: '#fee2e2',
        color: '#991b1b',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
    },
    helpText: {
        fontSize: '14px',
        color: '#9ca3af',
        marginTop: '20px',
    },
};
