import React, { useEffect, useRef } from 'react';

function FlamesEffect() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const particles = Array(50).fill().map(() => ({
            x: Math.random() * canvas.width,
            y: canvas.height,
            dx: Math.random() * 2 - 1,
            dy: -Math.random() * 2 - 2,
            size: Math.random() * 3 + 2,
            life: Math.random() * 100 + 50,
        }));

        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, ${Math.random() * 100}, 0, ${p.life / 100})`;
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

    return <canvas ref={canvasRef} className="flames-canvas"></canvas>;
}

export default FlamesEffect;

/* CSS for FlamesEffect */
.flames-canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    pointer-events: none;
}
