"use client";

import { useRef, useEffect } from "react";

interface Props {
    isExtracting: boolean;
}

/**
 * A Canvas-based particle effect simulating WebGL shader functionality
 * to dissolve the Boss icon into CSS-style particles.
 */
export default function BossParticleEffect({ isExtracting }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        let animationFrameId: number;

        // Set internal resolution
        canvas.width = 300;
        canvas.height = 300;

        // Boss Silhouette definition (a simple stylized skull/knight shape for placeholder)
        const drawBossSilhouette = (context: CanvasRenderingContext2D, alpha: number) => {
            context.save();
            context.translate(150, 150);

            // A glowing aura
            context.shadowBlur = 30;
            context.shadowColor = "#A480F2";

            // Main body
            context.fillStyle = `rgba(164, 128, 242, ${alpha})`;
            context.beginPath();
            context.moveTo(0, -80);
            context.lineTo(50, -20);
            context.lineTo(40, 80);
            context.lineTo(-40, 80);
            context.lineTo(-50, -20);
            context.closePath();
            context.fill();

            // Eyes
            context.fillStyle = `rgba(2, 2, 11, ${alpha})`;
            context.shadowBlur = 0;
            context.beginPath();
            context.arc(-15, -10, 8, 0, Math.PI * 2);
            context.arc(15, -10, 8, 0, Math.PI * 2);
            context.fill();

            context.restore();
        };

        let particles: Array<{ x: number, y: number, vx: number, vy: number, life: number, maxLife: number, size: number }> = [];

        // Pre-draw standard state
        if (!isExtracting) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBossSilhouette(ctx, 1);
            return;
        }

        // When extraction starts, generate particles from the silhouette's pixels
        const initParticles = () => {
            // Draw temporarily to read pixels
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBossSilhouette(ctx, 1);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Sample pixels to create particles
            for (let y = 0; y < canvas.height; y += 4) {
                for (let x = 0; x < canvas.width; x += 4) {
                    const index = (y * canvas.width + x) * 4;
                    const alpha = data[index + 3];

                    if (alpha > 128) {
                        // It's part of the silhouette
                        particles.push({
                            x: x,
                            y: y,
                            vx: (Math.random() - 0.5) * 2,
                            vy: (Math.random() * -3) - 1, // Move upwards
                            life: 1,
                            maxLife: Math.random() * 100 + 50,
                            size: Math.random() * 2 + 1
                        });
                    }
                }
            }
        };

        initParticles();

        // Animation Loop
        let time = 0;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.05;

            // Draw fading body outline
            const baseAlpha = Math.max(0, 1 - (time / 3));
            if (baseAlpha > 0) {
                drawBossSilhouette(ctx, baseAlpha);
            }

            // Draw particles
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy -= 0.02; // Gravity pulling up slightly (dissipating into smoke)
                p.life++;

                const pAlpha = 1 - (p.life / p.maxLife);

                if (pAlpha > 0) {
                    ctx.fillStyle = `rgba(17, 210, 239, ${pAlpha})`; // Turn to Neon Light Blue upon extraction
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "#11D2EF";
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Filter dead particles
            particles = particles.filter(p => p.life < p.maxLife);

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isExtracting]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full drop-shadow-[0_0_30px_rgba(164,128,242,0.4)]"
            style={{
                filter: isExtracting ? "contrast(1.2)" : "none"
            }}
        />
    );
}
