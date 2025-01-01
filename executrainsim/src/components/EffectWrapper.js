import React from 'react';
import './EffectWrapper.css'; // Optional CSS for positioning

function EffectWrapper({ children, effects = [] }) {
    return (
        <div className="effect-wrapper">
            {children}
            {effects.map((EffectComponent, index) => (
                <EffectComponent key={index} />
            ))}
        </div>
    );
}

export default EffectWrapper;
