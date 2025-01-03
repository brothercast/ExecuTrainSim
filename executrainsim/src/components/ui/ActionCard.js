import React from 'react';
import Button from './Button';
import './ActionCard.css'; // Make sure to create this CSS file
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css' 

const ActionCard = ({ card, onClick, disabled, loading }) => {
    console.log('ActionCard render - props:', card);
    const handleClick = () => {
        if (card.state !== 'used' && !disabled && !loading) {
            onClick();
        }
    };
    return (
      <div className={`action-card ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''} ${card.state === 'used' ? 'used' : ''}`}>
         <div className="action-card-content">
               <h3 data-tooltip-id={card.name + '-tooltip'}>{card.name}</h3>
                <Tooltip
                   id={card.name + '-tooltip'}
                    place="right"
                   content={`Resource Cost: ${card.resourceCost} | ${card.description} `}
                  />
                 <p>{card.description}</p>
                 {card.message && <p className="card-message" >{card.message}</p>}
          </div>
           <div className="action-card-footer">
               <span className="action-card-cost">Resource Cost: {card.resourceCost}</span>
                <Button
                    onClick={handleClick}
                    disabled={disabled}
                   className={`action-button ${loading ? 'loading' : ''}`}>
                     Use Action Card
               </Button>
            </div>
      </div>
    );
};

export default ActionCard;