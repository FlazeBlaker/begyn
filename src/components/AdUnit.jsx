import React, { useEffect, useRef } from 'react';

const AdUnit = ({ slotId, format = "auto", style = {} }) => {
    const adRef = useRef(null);

    useEffect(() => {
        try {
            if (window.adsbygoogle && adRef.current && !adRef.current.querySelector('iframe')) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, []);

    return (
        <div className="ad-container" style={{
            margin: '40px auto',
            textAlign: 'center',
            maxWidth: '100%',
            overflow: 'hidden',
            ...style
        }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Advertisement
            </div>
            <div ref={adRef} style={{ minHeight: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <ins className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-client="ca-pub-6551511547225605"
                    data-ad-slot={slotId || "1234567890"} // Default slot if none provided
                    data-ad-format={format}
                    data-full-width-responsive="true"></ins>
            </div>
        </div>
    );
};

export default AdUnit;
