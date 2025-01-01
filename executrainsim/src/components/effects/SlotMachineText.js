import React, { useState, useEffect } from 'react';  
  
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
    <span className={`slot-machine-word ${isRevealed ? 'revealed' : 'spinning'}`}>  
      {displayContent}  
    </span>  
  );  
};  
  
const SlotMachineText = ({ text = "", isSpinning = false, revealSpeed = 100, characterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' }) => {  
  const [revealedIndices, setRevealedIndices] = useState(new Set());  
  
  useEffect(() => {  
    const style = document.createElement('style');  
    style.textContent = `  
      .slot-machine-container {  
        display: inline-flex;  
        flex-wrap: wrap;  
        gap: 0.15em;  
        font-family: monospace;  
        width: 100%;
        line-height: 1.2;
        justify-content: center;
      }  
      .slot-machine-word {  
        display: inline-block;  
        transition: all 0.3s ease;  
        position: relative;
        white-space: normal;
        word-break: break-word;
      }  
      .slot-machine-word.spinning {  
        filter: blur(2px);  
        transform: translateY(2px);  
        animation: spin-animation 0.2s linear infinite;  
      }  
      .slot-machine-word.revealed {  
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
    if (!isSpinning) {  
      setRevealedIndices(new Set());  
      const words = text.split(/(\s+)/);  
      words.forEach((_, index) => {  
        setTimeout(() => {  
          setRevealedIndices((prev) => new Set([...prev, index]));  
        }, index * revealSpeed);  
      });  
    } else {  
      setRevealedIndices(new Set());  
    }  
  }, [isSpinning, text, revealSpeed]);  
  
  const words = text.split(/(\s+)/);  
  return (  
    <div className="slot-machine-container">  
      {words.map((word, index) => (  
        word.match(/^\s+$/) ? (  
          <span key={index} style={{ width: '0.25em' }}></span>  
        ) : (  
          <SpinningUnit  
            key={index}  
            content={word}  
            isRevealed={revealedIndices.has(index)}  
            characterSet={characterSet}  
          />  
        )  
      ))}  
    </div>  
  );  
};  
  
export default SlotMachineText;