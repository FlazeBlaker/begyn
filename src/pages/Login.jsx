import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    auth, db, doc, getDoc, GoogleAuthProvider, signInWithPopup,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendSignInLinkToEmail, sendPasswordResetEmail, isSignInWithEmailLink, signInWithEmailLink,
    sendEmailVerification
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Sparkles, ArrowRight, CheckCircle, Shield, Cpu, Mail } from 'lucide-react';
import SEO from '../components/SEO';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation(); // Needed for redirect state
    const [loading, setLoading] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [needsVerification, setNeedsVerification] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'magic'

    // Check for redirection state (e.g. from ProtectedRoute or Landing Page)
    useEffect(() => {
        if (location.state?.needsVerification) {
            setNeedsVerification(true);
            setMessage("Please verify your email to access that page.");
        }
        if (location.state?.email) {
            setEmail(location.state.email);
        }
        if (location.state?.authMode) {
            setAuthMode(location.state.authMode);
        }
    }, [location]);

    // Robust Auth Check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.emailVerified) {
                    // Check onboard status logic moved here or kept in checkUserOnboardStatus
                    // We let the flow continue usually, but auto-redirect if verified
                    checkUserOnboardStatus(user);
                } else {
                    // Logged in but not verified.
                    // DO NOT redirect to dashboard yet.
                    setAuthChecking(false);
                    // Optionally setNeedsVerification(true) if you want to force it immediately,
                    // but usually we wait for them to try an action or if they just signed up.
                }
            } else {
                setAuthChecking(false);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Initial Magic Link Check
    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let emailForLink = window.localStorage.getItem('emailForSignIn');
            if (!emailForLink) {
                emailForLink = window.prompt('Please provide your email for confirmation');
            }
            signInWithEmailLink(auth, emailForLink, window.location.href)
                .then(async (result) => {
                    window.localStorage.removeItem('emailForSignIn');
                    // Magic link users are verified by definition
                    await checkUserOnboardStatus(result.user);
                })
                .catch((error) => {
                    setError("Error signing in with link: " + error.message);
                });
        }
    }, [navigate]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            // Google users are verified by default
            await checkUserOnboardStatus(result.user);
        } catch (err) {
            console.error("Login failed:", err);
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(`Login failed: ${err.message || "Unknown error"}`);
            }
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            let userCredential;
            if (authMode === 'signup') {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                setNeedsVerification(true);
                setLoading(false);
                setMessage("Verification link sent! Please check your email.");
            } else if (authMode === 'login') {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                if (!userCredential.user.emailVerified) {
                    setNeedsVerification(true);
                    setLoading(false);
                    setMessage("Please verify your email first.");
                    // Optionally resend: await sendEmailVerification(userCredential.user);
                    return;
                }
                await checkUserOnboardStatus(userCredential.user);
            } else if (authMode === 'magic') {
                const actionCodeSettings = {
                    url: window.location.href, // Redirect back to here
                    handleCodeInApp: true,
                };
                await sendSignInLinkToEmail(auth, email, actionCodeSettings);
                window.localStorage.setItem('emailForSignIn', email);
                setMessage('Magic link sent to your email! Click it to login.');
                setLoading(false);
                return;
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError("Please enter your email first.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent!");
            setError(null);
        } catch (err) {
            setError("Error sending reset email: " + err.message);
        }
    };

    const checkUserOnboardStatus = async (user) => {
        if (!user.emailVerified) {
            setNeedsVerification(true);
            return; // Stop redirection if not verified
        }

        const userRef = doc(db, "brands", user.uid);
        const snap = await getDoc(userRef);
        const introSeen = snap.exists() && snap.data()?.introSeen;
        const onboarded = snap.exists() && snap.data()?.onboarded;

        if (!introSeen) {
            navigate('/intro', { replace: true });
        } else {
            navigate(onboarded ? '/dashboard' : '/flow', { replace: true });
        }
    };

    const checkVerification = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
                setNeedsVerification(false);
                await checkUserOnboardStatus(auth.currentUser);
            } else {
                setMessage("Not verified yet. Please click the link in your email and try again.");
                // Optionally resend logic here
            }
        }
    };

    const resendVerification = async () => {
        if (auth.currentUser) {
            try {
                await sendEmailVerification(auth.currentUser);
                setMessage("New verification link sent!");
            } catch (e) {
                setError("Error sending link: " + e.message);
            }
        }
    };


    if (authChecking) return null;

    if (authChecking) return null;

    return (
        <div className="login-container" style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden', background: '#050507' }}>
            <SEO
                title="Login - Begyn"
                description="Sign in to Begyn AI to access your social media growth roadmap and content generators."
                canonicalUrl="https://begyn.in/login"
            />
            <style>
                {`
                @media (max-width: 1024px) {
                    .login-left-panel {
                        display: none !important;
                    }
                    .login-right-panel {
                        width: 100% !important;
                        padding: 24px !important;
                    }
                }
                `}
            </style>

            {/* VERIFICATION OVERLAY */}
            {needsVerification && (
                <div className="glass-premium" style={{
                    position: 'absolute', inset: '24px', zIndex: 50,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(5, 5, 7, 0.95)', padding: '40px', textAlign: 'center', borderRadius: '16px'
                }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'rgba(124, 77, 255, 0.2)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '24px', animation: 'pulse-glow 2s infinite'
                    }}>
                        <Mail size={40} color="#7C4DFF" />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '16px' }}>Verify Your Email</h2>
                    <p style={{ color: '#a0a0b0', maxWidth: '400px', marginBottom: '32px', lineHeight: '1.6' }}>
                        We've sent a verification link to <strong>{auth.currentUser?.email || email}</strong>.<br />
                        Please check your inbox (and spam folder) to activate your account.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '300px' }}>
                        <button onClick={checkVerification} className="cyber-button" style={{ padding: '16px', borderRadius: '12px' }}>
                            I've Verified My Email
                        </button>
                        <button onClick={resendVerification} style={{ background: 'transparent', border: 'none', color: '#7C4DFF', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Resend Verification Link
                        </button>
                        <button onClick={() => { setNeedsVerification(false); }} style={{ background: 'transparent', border: 'none', color: '#a0a0b0', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Back to Login
                        </button>
                    </div>
                </div>
            )}

            {/* LEFT SIDE: Visuals */}
            <div className="login-left-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px',
                position: 'relative',
                background: 'radial-gradient(circle at bottom left, rgba(124, 77, 255, 0.15) 0%, #050507 100%)',
                borderRight: '1px solid var(--border-color)'
            }}>
                {/* Background Effects */}
                <div className="orb-glowing" style={{ top: '-10%', left: '-10%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)' }}></div>
                <div className="orb-glowing" style={{ bottom: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)' }}></div>
                <div className="scan-line" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}></div>

                <div className="stagger-1" style={{ maxWidth: '600px', position: 'relative', zIndex: 10 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '99px',
                        background: 'rgba(124, 77, 255, 0.1)', border: '1px solid rgba(124, 77, 255, 0.2)',
                        color: 'var(--neon-pink)', marginBottom: '32px', fontWeight: '600'
                    }} className="reflection">
                        <Cpu size={16} /> AI-Powered Creation Engine
                    </div>
                    <h1 style={{
                        fontSize: '4rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px',
                        color: '#ffffff'
                    }}>
                        Turn Ideas into <br />
                        <span className="aurora-text">Viral Content.</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#a0a0b0', marginBottom: '40px', lineHeight: '1.6' }} className="shimmer-text">
                        Join thousands of creators using Begyn AI to dominate LinkedIn, Twitter, and Instagram.
                        No design skills needed.
                    </p>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div className="hover-lift-glow" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '12px 20px', borderRadius: '12px' }}>
                            <div className="status-dot"></div>
                            <span style={{ color: '#ffffff', fontWeight: '500' }}>Free Forever Plan</span>
                        </div>
                        <div className="hover-lift-glow" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '12px 20px', borderRadius: '12px' }}>
                            <Shield size={20} color="#22c55e" />
                            <span style={{ color: '#ffffff', fontWeight: '500' }}>No Credit Card</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Login Form */}
            <div className="login-right-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px',
                position: 'relative',
                background: '#050507'
            }}>
                {/* Background Orb for Right Panel */}
                <div className="orb-glowing" style={{ top: '10%', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(124, 77, 255, 0.2) 0%, transparent 70%)' }}></div>

                <div className="glass-premium" style={{ width: '100%', maxWidth: '480px', padding: '40px', borderRadius: '24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <img src="/logos/logo.png" alt="Logo" style={{ height: '48px', marginBottom: '24px' }} />
                        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '12px', color: '#ffffff' }}>Welcome Back</h2>
                        <p style={{ color: '#a0a0b0' }}>Sign in to continue to your dashboard</p>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Auth Mode Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
                        <button
                            onClick={() => { setAuthMode('login'); setError(null); setMessage(null); }}
                            style={{
                                flex: 1,
                                background: authMode === 'login' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: '8px',
                                fontSize: '0.9rem'
                            }}>
                            Login
                        </button>
                        <button
                            onClick={() => { setAuthMode('signup'); setError(null); setMessage(null); }}
                            style={{
                                flex: 1,
                                background: authMode === 'signup' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: '8px',
                                fontSize: '0.9rem'
                            }}>
                            Sign Up
                        </button>
                        <button
                            onClick={() => { setAuthMode('magic'); setError(null); setMessage(null); }}
                            style={{
                                flex: 1,
                                background: authMode === 'magic' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: '8px',
                                fontSize: '0.9rem'
                            }}>
                            Magic Link
                        </button>
                    </div>

                    {message && (
                        <div style={{
                            background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)',
                            color: '#4ade80', padding: '12px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem'
                        }}>
                            {message}
                        </div>
                    )}

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="hover-lift-glow"
                        style={{
                            width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            background: '#fff', color: '#000', border: 'none',
                            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.8 : 1,
                            marginBottom: '24px'
                        }}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: '20px' }} />
                        Continue with Google
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <span style={{ color: '#a0a0b0', fontSize: '0.8rem' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    </div>

                    <form onSubmit={handleEmailAuth}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '8px' }}>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)' }}
                            />
                        </div>

                        {authMode !== 'magic' && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <label style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Password</label>
                                    {authMode === 'login' && (
                                        <button
                                            type="button"
                                            onClick={handlePasswordReset}
                                            style={{ background: 'none', border: 'none', color: '#7C4DFF', fontSize: '0.8rem', padding: 0 }}
                                        >
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)' }}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="cyber-button"
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.8 : 1,
                            }}
                        >
                            {loading ? 'Processing...' : (
                                authMode === 'login' ? 'Sign In' : (authMode === 'signup' ? 'Create Account' : 'Send Magic Link')
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '32px' }}>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                            By continuing, you agree to our <Link to="/terms" className="text-glow-purple" style={{ color: '#a0a0b0' }}>Terms</Link> and <Link to="/privacy" className="text-glow-purple" style={{ color: '#a0a0b0' }}>Privacy Policy</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}