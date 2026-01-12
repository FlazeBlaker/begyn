import React, { useRef, useEffect, useState } from 'react';

const StickyScroll = ({ content }) => {
    const [activeCard, setActiveCard] = useState(0);
    const ref = useRef(null);
    const { length } = content;

    useEffect(() => {
        const handleScroll = () => {
            if (ref.current) {
                const { top } = ref.current.getBoundingClientRect();
                const vh = window.innerHeight;
                // Calculate which card should be active based on scroll position relative to the container
                // We want the change to happen when the section is in the middle of the viewport
                const offset = 200;
                const index = Math.abs(Math.floor((top - offset) / (vh * 0.7)));

                // Clamp index
                const clampedIndex = Math.min(Math.max(index, 0), length - 1);
                setActiveCard(clampedIndex);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [length]);

    return (
        <div ref={ref} className="relative flex justify-center w-full max-w-7xl mx-auto px-6 py-20 gap-10">
            {/* Left Side: Sticky Text Content (Actually it scrolls, images stick) 
                Wait, Antigravity usually has Sticky Images and Scrolling Text. 
                Let's implement: Sticky Right, Scrolling Left.
            */}

            <div className="w-1/2 relative z-10">
                {content.map((item, index) => (
                    <div key={item.title + index} className="min-h-[80vh] flex flex-col justify-center my-10 group">
                        <h2 className={`text-4xl font-bold mb-6 transition-colors duration-300 ${activeCard === index ? 'text-[var(--theme-on-surface)]' : 'text-[var(--text-tertiary)]'
                            }`}>
                            {item.title}
                        </h2>
                        <p className={`text-xl leading-relaxed max-w-md transition-colors duration-300 ${activeCard === index ? 'text-[var(--theme-on-surface)]' : 'text-[var(--text-tertiary)]'
                            }`}>
                            {item.description}
                        </p>

                        {/* Mobile Image Fallback */}
                        <div className="md:hidden mt-8 rounded-xl overflow-hidden shadow-lg border border-[var(--glass-border)]">
                            {item.content || <img src={item.image} alt={item.title} className="w-full h-auto object-cover" />}
                        </div>
                    </div>
                ))}
            </div>

            {/* Right Side: Sticky Visuals */}
            <div className="hidden md:block w-1/2 relative h-[80vh] sticky top-20">
                {content.map((item, index) => (
                    <div
                        key={item.title + index}
                        className={`absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-500 transform ${activeCard === index ? 'opacity-100 translate-y-0 scale-100 z-10' : 'opacity-0 translate-y-10 scale-95 z-0'
                            }`}
                    >
                        <div className="w-full h-full rounded-2xl overflow-hidden glass-premium shadow-2xl border border-[var(--glass-border)] bg-[var(--bg-card)]">
                            {/* Gradient Background for Card */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] opacity-50"></div>

                            {/* Visual Content */}
                            <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
                                {item.content || (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-contain rounded-lg shadow-lg"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StickyScroll;
