import React, { useState, useCallback, useMemo, memo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Annotation } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import { STATE_AUCTION_INFO } from '../data';

/**
 * USChoropleth — Premium SVG-based US state map powered by react-simple-maps.
 * Pure SVG: no WebGL, no canvas, no pointer-event conflicts.
 * Uses Albers USA projection (includes Alaska & Hawaii).
 */

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const LIEN_STATES = new Set([
    "Alabama", "Arizona", "Colorado", "Connecticut", "Florida", "Georgia",
    "Illinois", "Indiana", "Iowa", "Kentucky", "Louisiana", "Maryland",
    "Massachusetts", "Mississippi", "Missouri", "Montana", "Nebraska",
    "New Hampshire", "New Jersey", "Oklahoma", "Rhode Island", "South Carolina",
    "South Dakota", "West Virginia", "Wyoming", "District of Columbia"
]);

const STATE_ABBREV = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
    "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH",
    "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
    "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA",
    "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN",
    "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
};

// Score data for color grading
const STATE_SCORES = {
    FL: 95, TX: 92, GA: 89, AZ: 85, NC: 87, IL: 78, CA: 72, NY: 81, 
    OH: 72, MI: 68, TN: 83, CO: 84, IN: 76, NV: 82, WA: 88, SC: 86,
    MD: 79, AL: 74, PA: 71, MO: 70, CT: 75, IA: 73, KY: 77, LA: 69,
    MA: 66, MS: 64, MT: 55, NE: 62, NH: 58, NJ: 80, OK: 73, RI: 61,
    SD: 54, WV: 52, WY: 50, OR: 65, WI: 67, MN: 70, AR: 63, ID: 56,
    UT: 68, VT: 53, VA: 78, ND: 51, HI: 48, AK: 45, NM: 62, ME: 57,
    KS: 66, DE: 64,
};

function getStateColor(isLien) {
    return isLien ? '#2563eb' : '#475569'; // blue-600 for Lien, slate-600 for Deed
}

function getStateColorLight(isLien) {
    return isLien ? '#3b82f6' : '#64748b'; // blue-500 for Lien hover, slate-500 for Deed hover
}

const getStars = (r) => '★'.repeat(r) + '☆'.repeat(5 - r);

function TooltipCard({ data, position }) {
    if (!data) return null;
    
    const abbr = STATE_ABBREV[data.name];
    const isLien = LIEN_STATES.has(data.name);
    const type = isLien ? 'Lien' : 'Deed';
    const score = STATE_SCORES[abbr] || 50;
    const info = STATE_AUCTION_INFO[abbr];

    const glowColor = isLien ? 'rgba(37,99,235,0.2)' : 'rgba(71,85,105,0.2)';

    return (
        <div
            className="fixed z-[99999] pointer-events-none transition-all duration-150 ease-out"
            style={{
                left: position.isRightHalf ? undefined : position.x + 16,
                right: position.isRightHalf ? (window.innerWidth - position.x + 16) : undefined,
                top: position.isBottomHalf ? undefined : position.y + 16,
                bottom: position.isBottomHalf ? (window.innerHeight - position.y + 16) : undefined,
                opacity: data ? 1 : 0,
                transform: `scale(${data ? 1 : 0.95})`,
            }}
        >
            <div className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-none rounded-sm px-4 py-2 whitespace-nowrap overflow-hidden">
                {/* Status Beacon */}
                <div className={`w-2 h-2 rounded-sm ${isLien ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-none' : 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.8)]'}`} />
                
                {/* State Name */}
                <span className="text-xs font-semibold text-white tracking-tight">{data.name}</span>
                
                {/* Minimal Data Strip */}
                {info ? (
                    <div className="flex items-center gap-3 ml-1">
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Yield</span>
                            <span className="text-[10px] font-semibold text-emerald-400 font-mono tracking-tighter">{info.interestRate}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Term</span>
                            <span className="text-[10px] font-bold text-white/90 font-mono tracking-tighter">{info.redemptionPeriod}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Bid Logic</span>
                            <span className="text-[9px] font-bold text-slate-300 truncate max-w-[80px] text-right">{info.biddingType || 'Varies'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 ml-1">
                        <div className="w-px h-3 bg-slate-700"></div>
                        <span className="text-[9px] text-amber-500/80 font-mono tracking-widest uppercase">No Intel</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function USChoropleth({ onStateClick, selectedState, height = '100%' }) {
    const [hoveredGeo, setHoveredGeo] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, isRightHalf: false, isBottomHalf: false });

    const handleMouseMove = useCallback((e) => {
        setTooltipPos({ 
            x: e.clientX, 
            y: e.clientY,
            isRightHalf: e.clientX > window.innerWidth / 2,
            isBottomHalf: e.clientY > window.innerHeight - 100
        });
    }, []);

    return (
        <div 
            style={{ 
                width: '100%', 
                height, 
                background: 'radial-gradient(ellipse at 50% 50%, #475569 0%, #1e293b 100%)', // brighter slate-600 to slate-800
                position: 'relative',
                borderRadius: '1rem',
                overflow: 'hidden'
            }}
            onMouseMove={handleMouseMove}
        >
            <ComposableMap
                projection="geoAlbersUsa"
                style={{ width: '100%', height: '100%' }}
                projectionConfig={{ scale: 1000 }}
            >
                <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const stateName = geo.properties.name;
                            const abbr = STATE_ABBREV[stateName];
                            const score = STATE_SCORES[abbr] || 50;
                            const isSelected = selectedState === abbr;
                            const isHovered = hoveredGeo?.properties?.name === stateName;
                            const centroid = geoCentroid(geo);

                            return (
                                <g key={geo.rsmKey}>
                                    <Geography
                                        geography={geo}
                                        onClick={() => onStateClick && onStateClick(abbr)}
                                        onMouseEnter={() => setHoveredGeo(geo)}
                                        onMouseLeave={() => setHoveredGeo(null)}
                                        style={{
                                            default: {
                                                fill: isSelected 
                                                    ? getStateColorLight(LIEN_STATES.has(stateName))
                                                    : getStateColor(LIEN_STATES.has(stateName)),
                                                stroke: '#1e293b',
                                                strokeWidth: isSelected ? 2 : 0.5,
                                                outline: 'none',
                                                opacity: isSelected ? 1 : 1,
                                                transition: 'all 150ms ease',
                                                cursor: 'pointer',
                                            },
                                            hover: {
                                                fill: getStateColorLight(LIEN_STATES.has(stateName)),
                                                stroke: '#ffffff',
                                                strokeWidth: 2,
                                                outline: 'none',
                                                opacity: 1,
                                                cursor: 'pointer',
                                            },
                                            pressed: {
                                                fill: getStateColorLight(LIEN_STATES.has(stateName)),
                                                stroke: '#ffffff',
                                                strokeWidth: 2,
                                                outline: 'none',
                                                opacity: 1,
                                            }
                                        }}
                                    />
                                    {/* State Label */}
                                    {abbr && (
                                        <Marker coordinates={centroid}>
                                            <text 
                                                y="3" 
                                                fontSize={10} 
                                                textAnchor="middle" 
                                                fill="#ffffff"
                                                fontWeight="900"
                                                stroke="rgba(15, 23, 42, 0.6)"
                                                strokeWidth={2.5}
                                                paintOrder="stroke filling"
                                                pointerEvents="none"
                                            >
                                                {abbr}
                                            </text>
                                        </Marker>
                                    )}
                                </g>
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>

            {/* Hover Tooltip */}
            <TooltipCard 
                data={hoveredGeo ? { name: hoveredGeo.properties.name } : null} 
                position={tooltipPos} 
            />



            {/* Header */}
            <div className="absolute top-6 left-6 pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-sm bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Interactive Analysis</span>
                </div>
                <h2 className="text-xl font-semibold text-white/90 tracking-tight">US Market Map</h2>
            </div>
        </div>
    );
}

export default memo(USChoropleth);
