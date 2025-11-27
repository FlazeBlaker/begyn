import React, { useEffect, useRef } from 'react';
import './ImmersiveBackground.css';

const ImmersiveBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width, height;

        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // --- NEBULA ENGINE ---
        const stars = [];
        const starCount = 150; // Slightly fewer but bigger
        const shootingStars = [];

        class Star {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.z = Math.random() * 2 + 0.5; // More depth
                this.size = Math.random() * 2 + 1; // BIGGER stars (was 1.5)
                this.alpha = Math.random() * 0.5 + 0.3; // BRIGHTER (was 0.1)
                this.twinkleSpeed = Math.random() * 0.02 + 0.005;
                this.vx = (Math.random() - 0.5) * 0.2; // Add horizontal drift
                this.vy = (Math.random() - 0.5) * 0.2; // Add vertical drift
            }

            update() {
                // Parallax + Drift (Hybrid movement)
                this.y -= 0.1 * this.z;
                this.x += this.vx;
                this.y += this.vy;

                if (this.y < 0) this.reset();
                if (this.x < 0 || this.x > width) this.reset();

                // Twinkle
                this.alpha += this.twinkleSpeed;
                if (this.alpha > 0.9 || this.alpha < 0.2) this.twinkleSpeed *= -1;
            }

            draw() {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class ShootingStar {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height * 0.5;
                this.len = Math.random() * 80 + 10;
                this.speed = Math.random() * 10 + 6;
                this.size = Math.random() * 1 + 0.1;
                this.waitTime = new Date().getTime() + Math.random() * 3000 + 500;
                this.active = false;
            }

            update() {
                if (this.active) {
                    this.x -= this.speed;
                    this.y += this.speed;
                    if (this.x < 0 || this.y >= height) {
                        this.active = false;
                        this.reset();
                    }
                } else {
                    if (this.waitTime < new Date().getTime()) {
                        this.active = true;
                    }
                }
            }

            draw() {
                if (this.active) {
                    ctx.strokeStyle = "rgba(255, 255, 255, .8)"; // Brighter shooting stars
                    ctx.lineWidth = this.size;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + this.len, this.y - this.len);
                    ctx.stroke();
                }
            }
        }

        // Init Stars
        for (let i = 0; i < starCount; i++) {
            stars.push(new Star());
        }

        // Init Shooting Stars
        for (let i = 0; i < 3; i++) {
            shootingStars.push(new ShootingStar());
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw Stars & Constellations
            stars.forEach(star => {
                star.update();
                star.draw();
            });

            // Draw Constellation Lines (Connect close stars)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; // Much more visible lines (was 0.05)
            ctx.lineWidth = 0.8; // Thicker lines
            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    const dx = stars[i].x - stars[j].x;
                    const dy = stars[i].y - stars[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) { // Longer connection distance (was 80)
                        ctx.beginPath();
                        ctx.moveTo(stars[i].x, stars[i].y);
                        ctx.lineTo(stars[j].x, stars[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw Shooting Stars
            shootingStars.forEach(star => {
                star.update();
                star.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="immersive-background">
            <div className="noise-overlay"></div>
            <div className="vignette"></div>
            <div className="nebula-layer" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.2), transparent 70%)',
                filter: 'blur(60px)', zIndex: -1
            }}></div>
            <div className="nebula-layer-2" style={{
                position: 'absolute', bottom: 0, right: 0, width: '80%', height: '80%',
                background: 'radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15), transparent 60%)',
                filter: 'blur(80px)', zIndex: -1
            }}></div>
            <canvas ref={canvasRef} className="particles-canvas" style={{ position: 'absolute', top: 0, left: 0 }} />
        </div>
    );
};

export default ImmersiveBackground;
