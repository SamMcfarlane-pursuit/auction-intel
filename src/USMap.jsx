import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STATE_AUCTION_INFO } from './data';

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

const getStars = (r) => '★'.repeat(r) + '☆'.repeat(5 - r);

function StateLabels({ geoData }) {
    const map = useMap();
    const labelsRef = useRef([]);

    useEffect(() => {
        labelsRef.current.forEach(m => map.removeLayer(m));
        labelsRef.current = [];
        if (!geoData) return;
        geoData.features.forEach(f => {
            const abbr = STATE_ABBREV[f.properties.name];
            if (!abbr) return;
            const center = L.geoJSON(f).getBounds().getCenter();
            const label = L.marker(center, {
                icon: L.divIcon({ 
                    className: 'state-label-premium', 
                    html: `<div class="flex flex-col items-center">
                            <span class="abbr">${abbr}</span>
                           </div>`, 
                    iconSize: [40, 20], 
                    iconAnchor: [20, 10] 
                }),
                interactive: false
            });
            label.addTo(map);
            labelsRef.current.push(label);
        });
        return () => labelsRef.current.forEach(m => map.removeLayer(m));
    }, [map, geoData]);
    return null;
}

function MapIntegrityHandler({ onHoverState }) {
    const map = useMap();
    useEffect(() => {
        // Fix Leaflet sizing artifacts (like the gray box issue)
        setTimeout(() => map.invalidateSize(), 200);
        
        const handleResize = () => map.invalidateSize();
        const container = map.getContainer();
        const handleMouseLeave = () => { if (onHoverState) onHoverState(null); };

        window.addEventListener('resize', handleResize);
        container.addEventListener('mouseleave', handleMouseLeave);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [map, onHoverState]);
    return null;
}

export default function USMap({ onStateClick, selectedState, hoveredState, onHoverState }) {
    const [geoData, setGeoData] = useState(null);
    const layersRef = useRef({});
    const activeTooltipRef = useRef(null);

    useEffect(() => {
        fetch('/us-states.json').then(r => r.json()).then(setGeoData).catch(console.error);
    }, []);

    useEffect(() => {
        Object.entries(layersRef.current).forEach(([abbr, layer]) => {
            const name = Object.keys(STATE_ABBREV).find(n => STATE_ABBREV[n] === abbr);
            if (!name) return;
            const isLien = LIEN_STATES.has(name);
            const isSelected = selectedState === abbr;
            const isHovered = hoveredState === abbr;

            layer.setStyle({
                fillColor: isLien ? '#8b5cf6' : '#3b82f6',
                weight: isSelected ? 3 : isHovered ? 2 : 0.8,
                color: isSelected ? '#ffffff' : isHovered ? '#60a5fa' : '#334155',
                fillOpacity: isSelected ? 0.85 : isHovered ? 0.7 : 0.35
            });

            if (isHovered) {
                if (activeTooltipRef.current && activeTooltipRef.current !== layer) {
                    activeTooltipRef.current.closeTooltip();
                }
                layer.openTooltip();
                activeTooltipRef.current = layer;
            } else if (activeTooltipRef.current === layer && !hoveredState) {
                layer.closeTooltip();
                activeTooltipRef.current = null;
            }
        });
    }, [selectedState, hoveredState]);

    const getStyle = useCallback((feature) => {
        const name = feature.properties.name;
        const isLien = LIEN_STATES.has(name);
        return {
            fillColor: isLien ? '#8b5cf6' : '#3b82f6',
            weight: 0.8,
            color: '#334155',
            fillOpacity: 0.35
        };
    }, []);

    const onEachState = useCallback((feature, layer) => {
        const name = feature.properties.name;
        const abbr = STATE_ABBREV[name];
        const isLien = LIEN_STATES.has(name);
        const type = isLien ? 'Lien State' : 'Deed State';
        const info = STATE_AUCTION_INFO[abbr];

        layersRef.current[abbr] = layer;

        let html;
        if (info) {
            const stars = getStars(info.investorRating || 3);
            html = `
                <div class="glass-tooltip">
                    <div class="header">
                        <span class="state-name">${name}</span>
                        <span class="badge ${isLien ? 'lien' : 'deed'}">${type}</span>
                    </div>
                    <div class="rating">${stars}</div>
                    <div class="grid">
                        <div class="stat-item"><span class="label">INT RATE</span><span class="val highlight">${info.interestRate}</span></div>
                        <div class="stat-item"><span class="label">REDEMPTION</span><span class="val uppercase">${info.redemptionPeriod}</span></div>
                        <div class="stat-item"><span class="label">AUCTION</span><span class="val">${info.biddingType || 'Varies'}</span></div>
                        <div class="stat-item"><span class="label">ONLINE</span><span class="val ${info.onlineAuctions ? 'text-emerald-400' : 'text-red-400'}">${info.onlineAuctions ? 'AVAILABLE' : 'OFFLINE'}</span></div>
                    </div>
                    <div class="footer-hint">Click state for detailed county analysis</div>
                </div>
            `;
        } else {
            html = `<div class="glass-tooltip-simple"><strong>${name}</strong><br/>${type}</div>`;
        }

        layer.bindTooltip(html, {
            direction: 'auto',
            className: 'premium-leaflet-tooltip',
            permanent: false,
            sticky: false,
            offset: [0, -10]
        });

        layer.on({
            click: () => onStateClick && onStateClick(abbr),
            mouseover: () => onHoverState && onHoverState(abbr),
            mouseout: () => onHoverState && onHoverState(null)
        });
    }, [onStateClick, onHoverState]);

    if (!geoData) return <div className="w-full h-full flex items-center justify-center bg-slate-950 rounded-md"><span className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest animate-none">Initializing Neural Map...</span></div>;

    return (
        <>
            <style>{`
                .premium-leaflet-tooltip {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    pointer-events: none !important;
                }
                
                .glass-tooltip {
                    background: rgba(15, 23, 42, 0.95) !important;
                    backdrop-filter: blur(16px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 20px !important;
                    padding: 18px !important;
                    min-width: 250px !important;
                    color: white !important;
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5) !important;
                    pointer-events: none !important;
                }
                
                .glass-tooltip .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
                .glass-tooltip .state-name { font-size: 16px; font-weight: 900; letter-spacing: -0.02em; }
                .glass-tooltip .badge { font-size: 8px; font-weight: 900; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.1em; }
                .glass-tooltip .badge.lien { background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.3); }
                .glass-tooltip .badge.deed { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
                .glass-tooltip .rating { color: #fbbf24; font-size: 14px; margin-bottom: 12px; letter-spacing: 2px; }
                
                .glass-tooltip .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
                .glass-tooltip .stat-item { display: flex; flex-direction: column; }
                .glass-tooltip .label { font-size: 7px; font-weight: 900; color: rgba(255, 255, 255, 0.4); letter-spacing: 0.1em; margin-bottom: 2px; }
                .glass-tooltip .val { font-size: 10px; font-weight: 700; color: f8fafc; }
                .glass-tooltip .val.highlight { color: #34d399; }
                
                .glass-tooltip .footer-hint { font-size: 8px; font-weight: 700; color: #64748b; margin-top: 14px; text-align: center; text-transform: uppercase; letter-spacing: 0.1em; }
                
                .state-label-premium {
                    pointer-events: none !important;
                }
                
                .state-label-premium .abbr { 
                    font-size: 10px; 
                    font-weight: 900; 
                    color: rgba(255, 255, 255, 0.4); 
                    text-transform: uppercase;
                    pointer-events: none;
                }
                
                .leaflet-container { background: #020617 !important; cursor: crosshair !important; border-radius: 24px !important; }
            `}</style>
            <MapContainer
                center={[39.5, -98.5]}
                zoom={4}
                minZoom={3}
                maxZoom={8}
                maxBounds={[[20, -130], [55, -60]]}
                maxBoundsViscosity={1.0}
                style={{ width: '100%', height: '100%', borderRadius: '24px', background: '#020617' }}
                scrollWheelZoom={true}
                zoomControl={false}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution="" />
                <GeoJSON data={geoData} style={getStyle} onEachFeature={onEachState} />
                <StateLabels geoData={geoData} />
                <MapIntegrityHandler onHoverState={onHoverState} />
            </MapContainer>
        </>
    );
}
