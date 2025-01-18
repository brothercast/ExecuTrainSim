// src/components/effects/SevenSegmentDisplay.js  
  
import React from 'react';  
import PropTypes from 'prop-types';  
import './SevenSegmentDisplay.css'; // Import the CSS file  
  
const SevenSegmentDisplay = ({ value }) => {  
  // Define which segments are active for each digit  
  const segmentState = [  
    { a: true, b: true, c: true, d: true, e: true, f: true, g: false }, // 0  
    { a: false, b: true, c: true, d: false, e: false, f: false, g: false }, // 1  
    { a: true, b: true, c: false, d: true, e: true, f: false, g: true }, // 2  
    { a: true, b: true, c: true, d: true, e: false, f: false, g: true }, // 3  
    { a: false, b: true, c: true, d: false, e: false, f: true, g: true }, // 4  
    { a: true, b: false, c: true, d: true, e: false, f: true, g: true }, // 5  
    { a: true, b: false, c: true, d: true, e: true, f: true, g: true }, // 6  
    { a: true, b: true, c: true, d: false, e: false, f: false, g: false }, // 7  
    { a: true, b: true, c: true, d: true, e: true, f: true, g: true }, // 8  
    { a: true, b: true, c: true, d: true, e: false, f: true, g: true }, // 9  
  ];  
  
  const segments = segmentState[value] || segmentState[0];  
  
  return (  
    <div className="seven-segment-container">  
      {/* Horizontal Segments */}  
      <div className={`segment segment-horizontal ${segments.a ? 'segment-active' : ''}`} style={{ top: '0px', left: '5px' }} />  
      <div className={`segment segment-horizontal ${segments.d ? 'segment-active' : ''}`} style={{ bottom: '0px', left: '5px' }} />  
      <div className={`segment segment-horizontal ${segments.g ? 'segment-active' : ''}`} style={{ top: '42px', left: '5px' }} />  
  
      {/* Vertical Segments */}  
      <div className={`segment segment-vertical ${segments.f ? 'segment-active' : ''}`} style={{ top: '2px', left: '0px' }} />  
      <div className={`segment segment-vertical ${segments.b ? 'segment-active' : ''}`} style={{ top: '2px', right: '0px' }} />  
      <div className={`segment segment-vertical ${segments.e ? 'segment-active' : ''}`} style={{ bottom: '2px', left: '0px' }} />  
      <div className={`segment segment-vertical ${segments.c ? 'segment-active' : ''}`} style={{ bottom: '2px', right: '0px' }} />  
    </div>  
  );  
};  
  
SevenSegmentDisplay.propTypes = {  
  value: PropTypes.number.isRequired,  
};  
  
export default SevenSegmentDisplay;  