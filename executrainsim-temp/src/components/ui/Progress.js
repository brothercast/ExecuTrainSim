import React from 'react';  
  
const Progress = ({ value, className = '' }) => {  
  return (  
    <div className={`Progress ${className}`}>  
      <div  
        className="Progress-bar"  
        style={{ width: `${value}%` }}  
      ></div>  
    </div>  
  );  
};  
  
export default Progress;  
