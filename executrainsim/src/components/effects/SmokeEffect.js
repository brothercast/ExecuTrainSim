import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

function SmokeEffect() {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;

        for (let i = 0; i < 5; i++) {
            const smoke = document.createElement('div');
            smoke.className = 'smoke-puff';
            container.appendChild(smoke);

            gsap.to(smoke, {
                x: Math.random() * 50 - 25,
                y: -150,
                opacity: 0,
                duration: 3 + Math.random() * 2,
                repeat: -1,
                delay: i * 0.5,
                onComplete: () => container.removeChild(smoke),
            });
        }
    }, []);

    return <div ref={containerRef} className="smoke-container"></div>;
}

export default SmokeEffect;

/* CSS for SmokeEffect */
.smoke-container {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.smoke-puff {
    width: 20px;
    height: 20px;
    background: rgba(128, 128, 128, 0.6);
    border-radius: 50%;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    animation: float 3s infinite ease-out;
}
