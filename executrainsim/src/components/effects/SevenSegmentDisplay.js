// src/components/effects/SevenSegmentDisplay.js

import React from 'react';
import PropTypes from 'prop-types';
import './SevenSegmentDisplay.css';

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

const Segment = ({ active, segmentType, style }) => (
    <div className={`segment ${segmentType} ${active ? 'segment-active' : ''}`} style={style} />
);

const SevenSegmentDisplay = ({ value, digits = 6, suffix = "" }) => {
    const paddedValue = String(value).padStart(digits, '0');
    const segments = [];

    for (let i = 0; i < digits; i++) {
        const digit = parseInt(paddedValue[i]);
        const digitSegments = segmentState[digit] || segmentState[0];
        segments.push(<DigitDisplay segments={digitSegments} key={i} />);
    }

    return (
        <div className="seven-segment-container">
            <div className="digits-container">
                {segments}
            </div>
            {suffix && <span className="display-suffix">{suffix}</span>}
        </div>
    );
};

const DigitDisplay = ({ segments }) => (
    <div className="digit-container">
        <Segment active={segments.a} segmentType="segment-horizontal" style={{ top: '0px', left: '5px' }} />
        <Segment active={segments.d} segmentType="segment-horizontal" style={{ bottom: '0px', left: '5px' }} />
        <Segment active={segments.g} segmentType="segment-horizontal" style={{ top: '42px', left: '5px' }} />
        <Segment active={segments.f} segmentType="segment-vertical" style={{ top: '2px', left: '0px' }} />
        <Segment active={segments.b} segmentType="segment-vertical" style={{ top: '2px', right: '0px' }} />
        <Segment active={segments.e} segmentType="segment-vertical" style={{ bottom: '2px', left: '0px' }} />
        <Segment active={segments.c} segmentType="segment-vertical" style={{ bottom: '2px', right: '0px' }} />
    </div>
);

SevenSegmentDisplay.propTypes = {
    value: PropTypes.number.isRequired,
    digits: PropTypes.number,
    suffix: PropTypes.string,
};

export default SevenSegmentDisplay;