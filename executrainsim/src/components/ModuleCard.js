// src/components/ModuleCard.js  
  
import React from 'react';  
import '../styles/ModuleCards.css'; // Import the CSS file  
  
const ModuleCard = ({ title, description, imageUrl, onClick }) => {  
  return (  
    <div className="card-wrap" onClick={onClick}>  
      <div className="card">  
        <div className="card-bg" style={{ backgroundImage: `url(${imageUrl})` }}></div>  
        <div className="card-info">  
          <h1>{title}</h1>  
          <p>{description}</p>  
        </div>  
      </div>  
    </div>  
  );  
};  
  
export default ModuleCard;  