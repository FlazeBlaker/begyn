import React, { useEffect, useRef } from "react";
import "./ImmersiveBackground.css";

const ImmersiveBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let width, height;
        let raf;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        resize();
        window.addEventListener("resize", resize);

        const stars = [];
        const STAR_COUNT = 110 + Math.floor(Math.random() * 30);

        class Star {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.r = Math.random() * 1.2 + 0.3;
                this.alpha = Math.random() * 0.4 + 0.2;
                this.drift = (Math.random() - 0.5) * 0.03;
            }

            update() {
                this.y += this.drift;
                if (this.y < 0 || this.y > height) this.reset();
            }

            draw() {
                ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star());
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            stars.forEach((s) => {
                s.update();
                s.draw();
            });

            raf = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <div className="background-root">
            <div className="nebula-soft" />
            <div className="vignette" />
            <canvas ref={canvasRef} className="stars-canvas" />
        </div>
    );
};

export default ImmersiveBackground;
