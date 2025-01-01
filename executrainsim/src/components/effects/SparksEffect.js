import React, { useEffect, useRef } from 'react';

function SparksEffect() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const particles = Array(100).fill().map(() => ({
            x: canvas.width / 2,
            y: canvas.height / 2,
            dx: (Math.random() - 0.5) * 5,
            dy: (Math.random() - 0.5) * 5,
            life: Math.random() * 100 + 50,
        }));

        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 200, 0, ${p.life / 100})`;
                ctx.fill();
                p.x += p.dx;
                p.y += p.dy;
                p.life -= 1;
            });
        }

        function animate() {
            drawParticles();
            requestAnimationFrame(animate);
        }

        animate();
    }, []);

    return <canvas ref={canvasRef} className="sparks-canvas"></canvas>;
}

export default SparksEffect;

/* CSS for SparksEffect */
.sparks-canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    pointer-events: none;
}
