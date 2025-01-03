import React, { useState, useEffect, useRef } from 'react';

const SpinningUnit = ({ content, isRevealed, characterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' }) => {
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
    text = "",
    isSpinning = false,
    revealSpeed = 100,
    characterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    stagger = false,
    standardizedSize = false,
    onComplete = () => { }
}) => {
    const [revealed, setRevealed] = useState(false);
    const animationTimeoutRef = useRef(null);
    const revealTimeoutRef = useRef(null);


    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
        .slot-machine-container {
            display: flex;
            flex-wrap: wrap;
          gap: 0.15em;
            font-family: monospace;
            width: 100%;
          line-height: 1.2;
        }
         .slot-machine-container.standard-size {
            justify-content: space-between; /* Evenly space items */
           align-items: stretch;  /* Ensure items stretch to fill the height */
         }
         .slot-machine-container.standard-size button{
             width: calc(100%/4 - 0.15em);
              display: flex;
              align-items: center;
              justify-content: center;
            min-height: 50px;
         }
        .slot-machine-text {
            display: inline-block;
            transition: all 0.3s ease;
            position: relative;
            white-space: normal;
             word-break: break-word;
        }
        .slot-machine-text.spinning {
           filter: blur(2px);
            transform: translateY(2px);
          animation: spin-animation 0.2s linear infinite;
        }
        .slot-machine-text.revealed {
            filter: blur(0);
          animation: reveal-animation 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes spin-animation {
            0% { transform: translateY(0px); }
          50% { transform: translateY(2px); }
            100% { transform: translateY(0px); }
        }
        @keyframes reveal-animation {
          0% { transform: translateY(-15px); opacity: 0; }
            60% { transform: translateY(3px); opacity: 1; }
           80% { transform: translateY(-2px); }
            100% { transform: translateY(0); }
        }
      `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => {
         if (isSpinning) {
             setRevealed(false);
         } else {
            if(animationTimeoutRef.current){
                clearTimeout(animationTimeoutRef.current)
            }
             if (revealTimeoutRef.current) {
                 clearTimeout(revealTimeoutRef.current);
             }

             revealTimeoutRef.current = setTimeout(() => {
               setRevealed(true);
                 onComplete();
            }, text.split(/(\s+)/).length * (revealSpeed + 75)); // Use a longer duration with revealSpeed
        }
     return () => {
            if(animationTimeoutRef.current){
                clearTimeout(animationTimeoutRef.current)
            }
            if(revealTimeoutRef.current){
                clearTimeout(revealTimeoutRef.current)
            }
        }

    }, [isSpinning, text, revealSpeed, onComplete]);



  return (
      <div className={`slot-machine-container ${standardizedSize ? 'standard-size' : ''}`}>
        {text.split(/(\s+)/).map((word, index) =>
            word.match(/^\s+$/) ? (
               <span key={index} style={{ width: '0.25em' }}></span>
           ) : (
                <SpinningUnit
                    key={index}
                    content={word}
                    isRevealed={revealed}
                    characterSet={characterSet}
                />
            )
        )}
      </div>
  );
};

export default SlotMachineText;