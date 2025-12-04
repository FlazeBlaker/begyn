import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #4A148C 0%, #2a0a55 100%)',
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
                        Privacy Policy
                    </h1>
                    <p style={{ color: '#a0a0b0', fontSize: '1.1rem' }}>
                        Last Updated: December 2, 2025
                    </p>
                </div>

                {/* Content */}
                <div className="glass-premium" style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    padding: 'clamp(24px, 5vw, 48px)'
                }}>
                    <Section title="1. Introduction">
                        <p>
                            At Begyn AI ("we", "our", or "us"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered social media management platform ("Service"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Service.
                        </p>
                    </Section>

                    <Section title="2. Information We Collect">
                        <p>We collect information that you provide directly to us, including:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '12px', color: '#cbd5e1' }}>
                            <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
                            <li><strong>Profile Data:</strong> Brand name, industry, audience, tone preferences, and other customization data.</li>
                            <li><strong>Content Data:</strong> Text, images, and other content you create or upload using our Service.</li>
                            <li><strong>Payment Information:</strong> Billing details processed securely through third-party payment processors (we do not store credit card information).</li>
                            <li><strong>Usage Data:</strong> Information about how you interact with our Service, including features used, time spent, and actions taken.</li>
                        </ul>
                    </Section>

                    <Section title="3. How We Use Your Information">
                        <p>We use the information we collect to:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '12px', color: '#cbd5e1' }}>
                            <li>Provide, maintain, and improve our Service.</li>
                            <li>Process your transactions and send you related information, including confirmations and invoices.</li>
                            <li>Send you technical notices, updates, security alerts, and support messages.</li>
                            <li>Respond to your comments, questions, and customer service requests.</li>
                            <li>Generate AI-powered content tailored to your preferences and brand.</li>
                            <li>Monitor and analyze trends, usage, and activities in connection with our Service.</li>
                            <li>Detect, prevent, and address technical issues and fraudulent activity.</li>
                        </ul>
                    </Section>

                    <Section title="4. Data Storage & Security">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(168, 85, 247, 0.1)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                            <Lock size={24} color="#a855f7" style={{ flexShrink: 0 }} />
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>Your Data is Secure</h4>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                    We use industry-standard encryption and security measures to protect your data. Your content is stored securely using Firebase Cloud Services with end-to-end encryption for data in transit and at rest.
                                </p>
                            </div>
                        </div>
                        <p>
                            We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please note that no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
                        </p>
                    </Section>

                    <Section title="5. AI & Third-Party Services">
                        <p>Our Service uses AI technology powered by Google's Gemini API to generate content. When you use AI features:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '12px', color: '#cbd5e1' }}>
                            <li>Your prompts and inputs are sent to Google's AI services for processing.</li>
                            <li>We do not sell or share your data with third parties for marketing purposes.</li>
                            <li>Google may use aggregated, anonymized data to improve their AI models.</li>
                            <li>You retain full ownership of all content generated using our Service.</li>
                        </ul>
                        <p style={{ marginTop: '12px' }}>
                            For more information about how Google processes data, please review <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7', textDecoration: 'underline' }}>Google's Privacy Policy</a>.
                        </p>
                    </Section>

                    <Section title="6. Cookies & Tracking">
                        <p>
                            We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data that are sent to your browser from a website and stored on your device. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
                        </p>
                    </Section>

                    <Section title="7. Your Data Rights">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(168, 85, 247, 0.1)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                            <Shield size={24} color="#a855f7" style={{ flexShrink: 0 }} />
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>You Have Control</h4>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                    You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.
                                </p>
                            </div>
                        </div>
                        <p>Depending on your location, you may have the following rights:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '12px', color: '#cbd5e1' }}>
                            <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
                            <li><strong>Correction:</strong> Request that we correct any inaccurate or incomplete data.</li>
                            <li><strong>Deletion:</strong> Request that we delete your personal information.</li>
                            <li><strong>Portability:</strong> Request a copy of your data in a structured, machine-readable format.</li>
                            <li><strong>Objection:</strong> Object to our processing of your personal information.</li>
                        </ul>
                    </Section>

                    <Section title="8. Data Retention">
                        <p>
                            We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain certain information for legal or regulatory purposes.
                        </p>
                    </Section>

                    <Section title="9. Children's Privacy">
                        <p>
                            Our Service is not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information from our systems.
                        </p>
                    </Section>

                    <Section title="10. Changes to This Policy">
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                        </p>
                    </Section>

                    <Section title="11. Contact Us">
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;
