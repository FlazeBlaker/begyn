
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, canonicalUrl, ogType = 'website' }) => {
    const siteTitle = 'Begyn – AI Social Media Guide to Become an Influencer Faster';
    const siteDescription = 'Begyn is an AI-powered social media guide that helps creators and influencers grow faster with step-by-step strategies for Instagram, YouTube, and more.';
    const siteUrl = 'https://begyn.in';

    const fullTitle = title ? `${title}` : siteTitle;
    const metaDescription = description || siteDescription;
    const url = canonicalUrl || siteUrl;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:site_name" content="Begyn AI" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={metaDescription} />
        </Helmet>
    );
};

export default SEO;
