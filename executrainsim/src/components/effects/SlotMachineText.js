import React, { useState, useEffect, useRef, useCallback } from 'react';

const SpinningReel = ({ content, isRevealed, characterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' }) => {
    const [displayContent, setDisplayContent] = useState(content);

    useEffect(() => {
        if (!isRevealed) {
            const interval = setInterval(() => {
                setDisplayContent(
                    Array(content.length)
                        .fill()
                        .map(() => characterSet[Math.floor(Math.random() * characterSet.length)])
                        .join('')
                );
            }, 50);
            return () => clearInterval(interval);
        } else {
            setDisplayContent(content);
        }
    }, [isRevealed, content, characterSet]);

    return (
        <span className={`slot-machine-text ${isRevealed ? 'revealed' : 'spinning'}`}>
            {displayContent}
        </span>
    );
};

const SlotMachineText = ({
    texts = [], // Expecting an array of strings, one for each button
    isSpinning = false,
    revealSpeed = 100,
    characterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    standardizedSize = false,
    onComplete = () => { }
}) => {
    const [reelsRevealed, setReelsRevealed] = useState([]);
    const animationTimeoutRef = useRef(null);

    const revealReel = useCallback((index) => {
        setReelsRevealed(prev => {
            const nextRevealed = [...prev];
            nextRevealed[index] = true;
            return nextRevealed;
        });
    }, []);

    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
        .slot-machine-container {
            display: flex;
            gap: 10px; /* Adjust gap between reels (buttons) as needed */
            width: 100%;
        }
        .slot-machine-reel-container {
            flex-grow: 1; /* Allow reels to take up equal space */
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative; /* For positioning the spinning text */
            overflow: hidden; /* Clip overflowing text during spin */
            min-height: 50px; /* Ensure consistent height */
        }
        .slot-machine-text {
            display: block;
            transition: all 0.3s ease;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            white-space: nowrap;
            font-weight: bold;
            font-family: 'Arial', sans-serif;
        }
        .slot-machine-text.spinning {
            filter: blur(2px);
            transform: translate(-50%, -50%) translateY(2px);
            font-family: monospace;
            animation: spin-animation 0.2s linear infinite;
        }
        .slot-machine-text.revealed {
            filter: blur(0);
            animation: reveal-animation 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes spin-animation {
            0% { transform: translate(-50%, -50%) translateY(0px); }
            50% { transform: translate(-50%, -50%) translateY(2px); }
            100% { transform: translate(-50%, -50%) translateY(0px); }
        }
        @keyframes reveal-animation {
            0% { transform: translate(-50%, -50%) translateY(-15px); opacity: 0; }
            60% { transform: translate(-50%, -50%) translateY(3px); opacity: 1; }
            80% { transform: translate(-50%, -50%) translateY(-2px); }
            100% { transform: translate(-50%, -50%) translateY(0); }
        }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => {
        if (isSpinning) {
            setReelsRevealed(Array(texts.length).fill(false));
        } else {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }

            texts.forEach((text, index) => {
                animationTimeoutRef.current = setTimeout(() => {
                    revealReel(index);
                    if (index === texts.length - 1) {
                        setTimeout(onComplete, revealSpeed + 100);
                    }
                }, index * revealSpeed);
            });
        }
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, [isSpinning, texts, revealSpeed, revealReel, onComplete]);

    return (
        <div className="slot-machine-container">
            {texts.map((text, index) => (
                <div key={index} className="slot-machine-reel-container">
                    <SpinningReel
                        content={text}
                        isRevealed={reelsRevealed[index]}
                        characterSet={characterSet}
                    />
                </div>
            ))}
        </div>
    );
};

export default SlotMachineText;