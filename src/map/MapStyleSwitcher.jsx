import React from 'react';
import { STYLE_MODES } from '../mapStyles';

export default function MapStyleSwitcher({ value, onChange }) {
    return (
        <div className="map-style-switcher" role="group" aria-label="Map style">
            {STYLE_MODES.map(mode => (
                <button
                    key={mode.id}
                    type="button"
                    className={`mss-btn ${value === mode.id ? 'is-active' : ''}`}
                    onClick={() => onChange(mode.id)}
                    aria-pressed={value === mode.id}
                >
                    {mode.label}
                </button>
            ))}
        </div>
    );
}
