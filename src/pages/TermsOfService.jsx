import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Scale, AlertCircle } from 'lucide-react';

const TermsOfService = () => {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%)',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            padding: '40px 20px'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '60px' }}>
                    <Link to="/" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        color: '#a0a0b0', textDecoration: 'none', marginBottom: '32px',
                        fontSize: '0.9rem', fontWeight: '500', transition: 'color 0.2s'
                    }}>
                        <ArrowLeft size={18} /> Back to Home
                    </Link>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: '800',
                        marginBottom: '16px',
                        background: 'linear-gradient(135deg, #fff 0%, #a855f7 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Terms of Service
                    </h1>
                    <p style={{ color: '#a0a0b0', fontSize: '1.1rem' }}>
                        Last Updated: December 1, 2025
                    </p>
                </div>

                {/* Content */}
                <div className="glass-premium" style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    padding: 'clamp(24px, 5vw, 48px)'
                }}>
                    <Section title="1. Acceptance of Terms">
                        <p>
                            By accessing or using the Begyn AI platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service. These Terms constitute a legally binding agreement between you and Begyn AI regarding your use of the Service.
                        </p>
                    </Section>

                    <Section title="2. Description of Service">
                        <p>
                            Begyn AI provides an AI-powered content creation suite designed for social media management. The Service includes but is not limited to:
                        </p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '12px', color: '#cbd5e1' }}>
                            <li>AI-driven text generation for captions, scripts, and posts.</li>
                            <li>Strategic roadmap and guide generation.</li>
                            <li>Content management and scheduling tools.</li>
                            <li>Analytics and performance tracking dashboards.</li>
                        </ul>
                        <p style={{ marginTop: '12px' }}>
                            We reserve the right to modify, suspend, or discontinue any part of the Service at any time without prior notice.
                        </p>
                    </Section>

                    <Section title="3. User Accounts & Security">
                        <p>
                            To access certain features, you must register for an account. You agree to:
                        </p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '12px', color: '#cbd5e1' }}>
                            <li>Provide accurate, current, and complete information during registration.</li>
                            <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
                            <li>Notify us immediately if you discover or suspect any security breaches related to the Service.</li>
                        </ul>
                        <p style={{ marginTop: '12px' }}>
                            You are solely responsible for all activities that occur under your account. Begyn AI will not be liable for any loss or damage arising from your failure to comply with this section.
                        </p>
                    </Section>

                    <Section title="4. Intellectual Property Rights">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(168, 85, 247, 0.1)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                            <Shield size={24} color="#a855f7" style={{ flexShrink: 0 }} />
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>Your Content Ownership</h4>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                    You retain full ownership of all content generated by you using our Service ("User Content"). We claim no intellectual property rights over the material you provide or the output generated specifically for you.
                                </p>
                            </div>
                        </div>
                        <p>
                            <strong>Our IP:</strong> The Service itself, including its original content, features, and functionality (excluding User Content), is and will remain the exclusive property of Begyn AI and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                        </p>
                    </Section>

                    <Section title="5. Prohibited Uses">
                        <p>You agree not to use the Service:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '12px', color: '#cbd5e1' }}>
                            <li>In any way that violates any applicable national or international law or regulation.</li>
                            <li>To generate content that is sexually explicit, hateful, violent, or illegal.</li>
                            <li>To impersonate or attempt to impersonate Begyn AI, a Begyn AI employee, another user, or any other person or entity.</li>
                            <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service.</li>
                            <li>To use any robot, spider, or other automatic device, process, or means to access the Service for any purpose, including monitoring or copying any of the material on the Service.</li>
                        </ul>
                    </Section>

                    <Section title="6. Subscription & Payments">
                        <p>
                            Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a Subscription.
                        </p>
                        <p style={{ marginTop: '12px' }}>
                            <strong>Cancellation:</strong> You may cancel your Subscription renewal either through your online account management page or by contacting our customer support team. You will not receive a refund for the fees you already paid for your current Subscription period.
                        </p>
                        <p style={{ marginTop: '12px' }}>
                            <strong>Fee Changes:</strong> Begyn AI, in its sole discretion and at any time, may modify the Subscription fees. Any Subscription fee change will become effective at the end of the then-current Billing Cycle.
                        </p>
                    </Section>

                    <Section title="7. Limitation of Liability">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                            <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>Disclaimer</h4>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                    In no event shall Begyn AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section title="8. Governing Law">
                        <p>
                            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                        </p>
                    </Section>

                    <Section title="9. Changes to Terms">
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                        </p>
                    </Section>

                    <Section title="10. Contact Us">
                        <p>
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <p style={{ marginTop: '12px', color: '#a855f7', fontWeight: '600' }}>
                            begynai@gmail.com
                        </p>
                    </Section>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div style={{ marginBottom: '40px' }}>
        <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        }}>
            {title}
        </h2>
        <div style={{
            fontSize: '1rem',
            lineHeight: '1.7',
            color: '#a0a0b0'
        }}>
            {children}
        </div>
    </div>
);

export default TermsOfService;
