import React from 'react';  
  
const Select = ({ children, onValueChange, value, disabled }) => {  
  return (  
    <select  
      className="Select"  
      onChange={(e) => onValueChange(e.target.value)}  
      value={value}  
      disabled={disabled}  
    >  
      {children}  
    </select>  
  );  
};  
  
export const SelectItem = ({ children, value }) => (  
  <option value={value}>{children}</option>  
);  
  
export default Select;  
