import React from 'react';
import Button from './Button';
import './ActionCard.css'; // Make sure to create this CSS file

const ActionCard = ({ card, onClick, disabled, loading }) => {
  return (
    <div className={`action-card ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''}`} >
      <div className="action-card-content">
      <h3>{card.name}</h3>
        <p>{card.description}</p>
          </div>
        <div className="action-card-footer">
            <span className="action-card-cost">Resource Cost: {card.resourceCost}</span>
      <Button  onClick={onClick} disabled={disabled}
        className={`action-button ${loading ? 'loading' : ''}`}>
           Use Action Card
        </Button>
        </div>
    </div>
  );
};

export default ActionCard;