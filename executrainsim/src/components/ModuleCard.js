// src/components/ModuleCard.js
import React from 'react';
import '../styles/ModuleCards.css';

const ModuleCard = ({ title, description, onClick, colorIndex }) => {
    // Array of jewel tone colors
      const jewelToneColors = [
          '#2E3192', // Sapphire
          '#1A5276',  // Lapis Lazuli
          '#00A86B', // Emerald
          '#C0392B',  // Ruby
          '#8E44AD',  // Amethyst
          '#D35400',  // Citrine
          '#1E8449',   // Jade
          '#641E16',  // Garnet
      ];
    // Create gradient string for background
    const backgroundColor = jewelToneColors[colorIndex % jewelToneColors.length];

  return (
    <div className="card-wrap" onClick={onClick} style={{ '--card-color': backgroundColor }}>
        <div className="card">
             <div className="card-bg" style={{ '--card-color': backgroundColor }}></div>
                <div className="card-info">
                   <h1>{title}</h1>
                   <p>{description}</p>
              </div>
         </div>
      </div>
    );
};

export default ModuleCard;