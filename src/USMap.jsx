import { useEffect, useState, useRef } from 'react';
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
                icon: L.divIcon({ className: 'state-label', html: '<span>' + abbr + '</span>', iconSize: [30, 16], iconAnchor: [15, 8] }),
                interactive: false
            });
            label.addTo(map);
            labelsRef.current.push(label);
        });
        return () => labelsRef.current.forEach(m => map.removeLayer(m));
    }, [map, geoData]);
    return null;
}

export default function USMap({ onStateClick, selectedState, hoveredState, onHoverState }) {
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        fetch('/us-states.json').then(r => r.json()).then(setGeoData).catch(console.error);
    }, []);

    const getStyle = (feature) => {
        const name = feature.properties.name;
        const abbr = STATE_ABBREV[name];
        const isLien = LIEN_STATES.has(name);
        const isSelected = selectedState === abbr;
        const isHovered = hoveredState === abbr;
        return {
            fillColor: isLien ? '#7c3aed' : '#2563eb',
            weight: isSelected ? 2.5 : isHovered ? 2 : 0.5,
            color: isSelected ? '#1e293b' : isHovered ? '#374151' : '#94a3b8',
            fillOpacity: isSelected ? 0.75 : isHovered ? 0.65 : 0.45
        };
    };

    const onEachState = (feature, layer) => {
        const name = feature.properties.name;
        const abbr = STATE_ABBREV[name];
        const isLien = LIEN_STATES.has(name);
        const type = isLien ? 'Lien' : 'Deed';
        const info = STATE_AUCTION_INFO[abbr];

        let html;
        if (info) {
            const stars = getStars(info.investorRating || 3);
            const pros = info.pros ? info.pros.join(' • ') : '';
            const cons = info.cons ? info.cons.join(' • ') : '';
            html = '<div style="font-family:system-ui;padding:4px 0;min-width:220px">' +
                '<div style="font-weight:700;font-size:14px;margin-bottom:6px">' + name + '</div>' +
                '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">' +
                '<span style="background:' + (isLien ? '#7c3aed' : '#2563eb') + ';color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">' + type + '</span>' +
                '<span style="color:#f59e0b;font-size:12px;letter-spacing:1px">' + stars + '</span>' +
                '</div>' +
                '<div style="border-top:1px solid #e5e7eb;padding-top:8px;font-size:11px">' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#6b7280">Interest Rate:</span><span style="font-weight:600;color:#059669">' + info.interestRate + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#6b7280">Redemption:</span><span style="font-weight:600;color:#1e293b">' + info.redemptionPeriod + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#6b7280">Bidding:</span><span style="font-weight:600;color:#1e293b">' + (info.biddingType || 'N/A') + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#6b7280">Online:</span><span style="font-weight:600;color:' + (info.onlineAuctions ? '#059669' : '#dc2626') + '">' + (info.onlineAuctions ? '✓ Yes' : '✗ No') + '</span></div>' +
                '<div style="display:flex;justify-content:space-between"><span style="color:#6b7280">Frequency:</span><span style="font-weight:600;color:#1e293b">' + (info.auctionFrequency || 'Varies') + '</span></div>' +
                '</div>' +
                (pros ? '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb"><div style="font-size:10px;color:#059669;font-weight:600;margin-bottom:3px">✓ PROS</div><div style="font-size:10px;color:#374151">' + pros + '</div></div>' : '') +
                (cons ? '<div style="margin-top:6px"><div style="font-size:10px;color:#dc2626;font-weight:600;margin-bottom:3px">✗ CONS</div><div style="font-size:10px;color:#374151">' + cons + '</div></div>' : '') +
                '</div>';
        } else {
            html = '<div style="font-family:system-ui;padding:4px 0"><div style="font-weight:700;font-size:14px">' + name + '</div><span style="background:' + (isLien ? '#7c3aed' : '#2563eb') + ';color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">' + type + '</span></div>';
        }

        layer.bindTooltip(html, { direction: 'top', className: 'custom-tooltip', permanent: false, sticky: true });
        layer.on({
            click: () => onStateClick && onStateClick(abbr),
            mouseover: () => onHoverState && onHoverState(abbr),
            mouseout: () => onHoverState && onHoverState(null)
        });
    };

    if (!geoData) return <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl"><span className="text-gray-400 text-sm">Loading...</span></div>;

    return (
        <>
            <style>{`
        .state-label { background: transparent; border: none; }
        .state-label span { font-size: 10px; font-weight: 700; color: #1e293b; text-shadow: 1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white; pointer-events: none; }
        .custom-tooltip { background: white !important; border: 1px solid #e5e7eb !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; padding: 10px 14px !important; max-width: 300px !important; }
        .custom-tooltip::before { border-top-color: white !important; }
      `}</style>
            <MapContainer center={[39.5, -98.5]} zoom={4} minZoom={3} maxZoom={8} maxBounds={[[20, -130], [55, -60]]} maxBoundsViscosity={1.0} style={{ width: '100%', height: '100%', borderRadius: '16px', background: '#f8fafc' }} scrollWheelZoom={true} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" attribution="" />
                <GeoJSON data={geoData} style={getStyle} onEachFeature={onEachState} />
                <StateLabels geoData={geoData} />
            </MapContainer>
        </>
    );
}
