// Select.js (Modified for Debugging - Version 2)
import React from 'react';

const Select = ({ children, onChange, value, disabled }) => {
    console.log("Select Component: onChange prop =", typeof onChange);
    return (
        <div className="select-container">
            <select
                className="Select"
                onChange={(e) => {
                    console.log("Select Component: onChange event =", e); // Log the entire event
                    if (!e) {
                        console.error("Select Component: Event object is UNDEFINED!");
                        return; // Stop further execution if event is undefined
                    }
                    if (!e.target) {
                        console.error("Select Component: event.target is UNDEFINED!", e);
                        return; // Stop if event.target is undefined
                    }
                    if (typeof e.target.value === 'undefined') {
                        console.error("Select Component: e.target.value is UNDEFINED!", e.target);
                        return; // Stop if e.target.value is undefined
                    }

                    onChange(e.target.value);
                }}
                value={value}
                disabled={disabled}
            >
                {children}
            </select>
         </div>
    );
};

export const SelectItem = ({ children, value }) => (
    <option value={value}>{children}</option>
);

export default Select;