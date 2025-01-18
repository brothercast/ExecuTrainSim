import React, { useState, useEffect, useRef } from 'react';

const SlotMachineText = ({
    text = "",
    isSpinning = false,
    revealSpeed = 100,
    characterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    standardizedSize = false,
    onComplete = () => { }
}) => {
    const [displayContent, setDisplayContent] = useState('');
    const [isRevealed, setIsRevealed] = useState(false);
    const intervalRef = useRef(null);
    const revealTimeoutRef = useRef(null);

    useEffect(() => {
        if (isSpinning) {
            setIsRevealed(false);
            let currentIndex = 0;
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setDisplayContent(
                    Array(text.length)
                        .fill()
                        .map(() => characterSet[Math.floor(Math.random() * characterSet.length)])
                        .join('')
                );
                currentIndex = (currentIndex + 1) % characterSet.length;
            }, 50);
        } else if (!isSpinning && !isRevealed) {
            clearInterval(intervalRef.current);
            revealTimeoutRef.current = setTimeout(() => {
                setDisplayContent(text);
                setIsRevealed(true);
                onComplete();
            }, revealSpeed);
        }

        return () => {
            clearInterval(intervalRef.current);
            clearTimeout(revealTimeoutRef.current);
        };
    }, [isSpinning, text, revealSpeed, characterSet, onComplete, isRevealed]);

    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
        .slot-machine-text-container {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }
        .slot-machine-text {
            display: inline-block;
            transition: all 0.3s ease;
            white-space: nowrap;
            font-family: inherit; /* Inherit font from the button */
            font-weight: inherit; /* Inherit font weight from the button */
            font-size: inherit; /* Inherit font size from the button */
            line-height: 1;
        }
        .slot-machine-text.spinning {
            filter: blur(2px);
            opacity: 0.8;
            animation: spin-animation 0.1s linear infinite;
        }
        .slot-machine-text.revealed {
            filter: blur(0);
            opacity: 1;
            animation: reveal-animation 0.3s ease-out;
        }
        @keyframes spin-animation {
            0% { transform: translateY(0); }
            100% { transform: translateY(2px); }
        }
        @keyframes reveal-animation {
            0% { transform: translateY(-10px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    return (
        <div className="slot-machine-text-container">
            <span className={`slot-machine-text ${isSpinning ? 'spinning' : isRevealed ? 'revealed' : ''}`}>
                {isSpinning ? displayContent : text}
            </span>
        </div>
    );
};

export default SlotMachineText;