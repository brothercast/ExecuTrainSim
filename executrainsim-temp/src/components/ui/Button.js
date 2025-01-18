import React from 'react';  
  
const Button = ({ children, onClick, disabled, className = "Button" }) => {  
  return (  
    <button  
      className={className}  
      onClick={onClick}  
      disabled={disabled}  
    >  
      {children}  
    </button>  
  );  
};  
  
export default Button;  
