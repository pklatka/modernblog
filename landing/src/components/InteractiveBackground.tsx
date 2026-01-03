import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
}

export function InteractiveBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize particles
        const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 15000);
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
        }));

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('mousemove', handleMouseMove);

        let animationId: number;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const particles = particlesRef.current;
            const mouse = mouseRef.current;
            const connectionDistance = 150;
            const mouseInfluenceRadius = 200;

            particles.forEach((particle, i) => {
                // Mouse interaction
                const dx = mouse.x - particle.x;
                const dy = mouse.y - particle.y;
                const distToMouse = Math.sqrt(dx * dx + dy * dy);

                if (distToMouse < mouseInfluenceRadius) {
                    const force = (mouseInfluenceRadius - distToMouse) / mouseInfluenceRadius;
                    particle.vx -= (dx / distToMouse) * force * 0.02;
                    particle.vy -= (dy / distToMouse) * force * 0.02;
                }

                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Boundary bounce
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                // Keep in bounds
                particle.x = Math.max(0, Math.min(canvas.width, particle.x));
                particle.y = Math.max(0, Math.min(canvas.height, particle.y));

                // Damping
                particle.vx *= 0.99;
                particle.vy *= 0.99;

                // Add small random movement
                particle.vx += (Math.random() - 0.5) * 0.02;
                particle.vy += (Math.random() - 0.5) * 0.02;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
                ctx.fill();

                // Draw connections
                for (let j = i + 1; j < particles.length; j++) {
                    const other = particles[j];
                    const connDx = particle.x - other.x;
                    const connDy = particle.y - other.y;
                    const distance = Math.sqrt(connDx * connDx + connDy * connDy);

                    if (distance < connectionDistance) {
                        const opacity = (1 - distance / connectionDistance) * 0.3;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{
                background: 'radial-gradient(ellipse at 50% 50%, #1e1b4b 0%, #0f0a1e 50%, #030014 100%)',
            }}
        />
    );
}
