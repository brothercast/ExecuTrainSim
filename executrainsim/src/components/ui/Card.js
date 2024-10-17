import React from 'react';  
  
export const Card = ({ children, className = '' }) => {  
  return (  
    <div className={`Card ${className}`}>  
      {children}  
    </div>  
  );  
};  
  
export const CardHeader = ({ children }) => (  
  <div className="Card-header">  
    {children}  
  </div>  
);  
  
export const CardContent = ({ children }) => (  
  <div className="Card-content">  
    {children}  
  </div>  
);  
  
export const CardTitle = ({ children }) => (  
  <h2 className="Card-title">  
    {children}  
  </h2>  
);  
