// src/components/ui/TextArea.js
import React from 'react';
import '../../styles/PitchModule.css'; // Import CSS for TextArea styles

const TextArea = React.forwardRef(({
    placeholder,
    value,
    onValueChange,
    rows = 3,
    className = '',
    style: customStyle = {}, // Allow custom styles to be passed and merged
    ...props
}, ref) => {
    const handleChange = (event) => {
        if (onValueChange) {
            onValueChange(event.target.value);
        }
    };

    return (
        <textarea
            ref={ref}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            rows={rows}
            className={`textarea-component ${className}`} // Use class name for base styles and allow extra classNames
            style={customStyle} // Apply custom styles inline if needed
            {...props}
        />
    );
});

TextArea.displayName = 'TextArea';

export default TextArea;