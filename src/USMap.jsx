import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Supercluster from 'supercluster';
import { resolvePropertyCoords } from './mapData';
import { getStyleConfig } from './mapStyles';
import MapStyleSwitcher from './map/MapStyleSwitcher';
import MapSearchBar from './map/MapSearchBar';
import StreetViewModal from './map/StreetViewModal';
import './map/USMap.css';

const INITIAL_VIEW = { center: [-98.5, 39.5], zoom: 3.6, pitch: 0, bearing: 0 };
const MAX_BOUNDS = [[-170, 15], [-50, 72]];
const US_STATES_URL = '/us-states.json';
const LIEN_COLOR = '#4F46E5';
const DEED_COLOR = '#0D9488';
const SELECTED_COLOR = '#F59E0B';
const HOVER_COLOR = '#8B5CF6';
const STATE_SOURCE = 'us-states';

function featureColorExpr(selectedAbbr, hoveredAbbr) {
    return [
        'case',
        ['==', ['get', 'abbr'], selectedAbbr || ''], SELECTED_COLOR,
        ['==', ['get', 'abbr'], hoveredAbbr || ''], HOVER_COLOR,
        ['==', ['get', 'type'], 'Lien'], LIEN_COLOR,
        DEED_COLOR
    ];
}

function clusterRadius(points) {
    if (points >= 200) return 38;
    if (points >= 50) return 32;
    if (points >= 10) return 26;
    return 22;
}

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

export default function USMap({
    onStateClick,
    selectedState,
    hoveredState,
    onHoverState,
    properties = [],
    onPropertyClick,
    focusProperty
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const geoDataRef = useRef(null);
    const propertyMarkersRef = useRef([]);
    const clusterIndexRef = useRef(null);
    const [styleId, setStyleId] = useState(() => localStorage.getItem('aim.mapStyle') || 'streets');
    const [ready, setReady] = useState(false);
    const [view, setView] = useState({ zoom: INITIAL_VIEW.zoom, lng: INITIAL_VIEW.center[0], lat: INITIAL_VIEW.center[1] });
    const [cursor, setCursor] = useState(null);
    const [streetView, setStreetView] = useState(null);
    const [showHint, setShowHint] = useState(() => !localStorage.getItem('aim.mapHintSeen'));
    const [showMobileHint, setShowMobileHint] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !localStorage.getItem('aim.mapMobileHintSeen') && window.innerWidth <= 720;
    });

    const styleDark = getStyleConfig(styleId).dark;

    useEffect(() => {
        if (!containerRef.current) return;
        const cfg = getStyleConfig(styleId);
        const map = new maplibregl.Map({
            container: containerRef.current,
            style: cfg.url || cfg.style,
            center: INITIAL_VIEW.center,
            zoom: INITIAL_VIEW.zoom,
            pitch: INITIAL_VIEW.pitch,
            bearing: INITIAL_VIEW.bearing,
            maxBounds: MAX_BOUNDS,
            minZoom: 2.5,
            maxZoom: 19,
            attributionControl: { compact: true },
            dragRotate: true,
            pitchWithRotate: true,
            touchPitch: true
        });
        mapRef.current = map;

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }), 'bottom-right');
        map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'imperial' }), 'bottom-left');
        map.addControl(new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false,
            showUserLocation: true,
            fitBoundsOptions: { maxZoom: 14 }
        }), 'top-right');

        const onMove = () => {
            const c = map.getCenter();
            setView({ zoom: map.getZoom(), lng: c.lng, lat: c.lat });
        };
        const onMouseMove = (e) => setCursor({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        const onMouseOut = () => setCursor(null);
        map.on('move', onMove);
        map.on('mousemove', onMouseMove);
        map.on('mouseout', onMouseOut);
        map.on('load', () => setReady(true));
        map.on('style.load', () => { setReady(true); addDataLayers(map); });
        map.on('contextmenu', (e) => {
            setStreetView({ lat: e.lngLat.lat, lng: e.lngLat.lng, label: null });
        });

        const onKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'r' || e.key === 'R') map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
            if (e.key === 'h' || e.key === 'H') map.flyTo({ ...INITIAL_VIEW, duration: 900, essential: true });
        };
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetch(US_STATES_URL).then(r => r.json()).then(data => {
            if (cancelled) return;
            data.features = data.features.map(f => {
                const abbr = STATE_ABBREV[f.properties.name] || '';
                const type = LIEN_STATES.has(f.properties.name) ? 'Lien' : 'Deed';
                return { ...f, properties: { ...f.properties, abbr, type } };
            });
            geoDataRef.current = data;
            if (mapRef.current && mapRef.current.isStyleLoaded()) addDataLayers(mapRef.current);
        }).catch(console.error);
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addDataLayers = useCallback((map) => {
        if (!geoDataRef.current) return;
        const src = map.getSource(STATE_SOURCE);
        if (!src) {
            map.addSource(STATE_SOURCE, { type: 'geojson', data: geoDataRef.current });
        } else {
            src.setData(geoDataRef.current);
        }
        const darkBg = getStyleConfig(styleId).dark;
        const fillOpacity = [
            'interpolate', ['linear'], ['zoom'],
            3, 0.42, 5, 0.36, 7, 0.24, 9, 0.14, 11, 0.06, 13, 0.02
        ];
        if (!map.getLayer('state-fill')) {
            map.addLayer({
                id: 'state-fill', type: 'fill', source: STATE_SOURCE,
                paint: {
                    'fill-color': featureColorExpr(selectedState, hoveredState),
                    'fill-opacity': fillOpacity
                }
            });
            map.addLayer({
                id: 'state-outline', type: 'line', source: STATE_SOURCE,
                paint: {
                    'line-color': darkBg ? '#E2E8F0' : '#334155',
                    'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 7, 1.1, 11, 1.4],
                    'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 9, 0.32, 13, 0.1]
                }
            });
            map.on('mousemove', 'state-fill', (e) => {
                map.getCanvas().style.cursor = 'pointer';
                const abbr = e.features?.[0]?.properties?.abbr;
                if (abbr && onHoverState) onHoverState(abbr);
            });
            map.on('mouseleave', 'state-fill', () => {
                map.getCanvas().style.cursor = '';
                if (onHoverState) onHoverState(null);
            });
            map.on('click', 'state-fill', (e) => {
                const feature = e.features?.[0];
                if (!feature) return;
                const abbr = feature.properties.abbr;
                if (onStateClick) onStateClick(abbr);
                const [lng, lat] = e.lngLat.toArray();
                map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 5.5), duration: 800, essential: true });
            });
        } else {
            map.setPaintProperty('state-outline', 'line-color', darkBg ? '#E2E8F0' : '#334155');
        }
    }, [styleId, selectedState, hoveredState, onStateClick, onHoverState]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getLayer('state-fill')) return;
        map.setPaintProperty('state-fill', 'fill-color', featureColorExpr(selectedState, hoveredState));
    }, [selectedState, hoveredState]);

    useEffect(() => {
        if (!focusProperty || !mapRef.current) return;
        const { lat, lng } = focusProperty;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        try {
            mapRef.current.flyTo({ center: [lng, lat], zoom: 14, duration: 700, essential: true });
        } catch (err) {
            console.warn('Map flyTo failed', err);
        }
    }, [focusProperty]);

    const geoProperties = useMemo(() => {
        if (!Array.isArray(properties) || properties.length === 0) return [];
        const out = [];
        for (const p of properties) {
            const coord = resolvePropertyCoords(p);
            if (!coord) continue;
            out.push({
                type: 'Feature',
                properties: { ...p },
                geometry: { type: 'Point', coordinates: [coord[1], coord[0]] }
            });
        }
        return out;
    }, [properties]);

    useEffect(() => {
        const index = new Supercluster({ radius: 56, maxZoom: 16, minPoints: 2 });
        index.load(geoProperties);
        clusterIndexRef.current = index;
        if (mapRef.current && mapRef.current.isStyleLoaded()) refreshPropertyLayer(mapRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geoProperties]);

    const refreshPropertyLayer = useCallback((map) => {
        if (!map) map = mapRef.current;
        if (!map || !clusterIndexRef.current) return;
        propertyMarkersRef.current.forEach(m => m.remove());
        propertyMarkersRef.current = [];
        const b = map.getBounds();
        const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
        const zoom = Math.floor(map.getZoom());
        const clusters = clusterIndexRef.current.getClusters(bbox, zoom);
        clusters.forEach(c => {
            const [lng, lat] = c.geometry.coordinates;
            const el = document.createElement('div');
            if (c.properties.cluster) {
                const count = c.properties.point_count;
                const r = clusterRadius(count);
                el.className = 'aim-cluster';
                el.style.width = `${r}px`; el.style.height = `${r}px`;
                el.innerHTML = `<span>${c.properties.point_count_abbreviated}</span>`;
                el.addEventListener('click', () => {
                    const expZoom = clusterIndexRef.current.getClusterExpansionZoom(c.properties.cluster_id);
                    map.flyTo({ center: [lng, lat], zoom: expZoom + 0.4, duration: 700, essential: true });
                });
            } else {
                const p = c.properties;
                const tier = p.tier || 2;
                const cat = p.category || 'other';
                el.className = `aim-marker tier-${tier} cat-${cat}`;
                el.innerHTML = `<span class="aim-marker-dot"></span><span class="aim-marker-label">$${Math.round((p.openingBid || 0) / 1000)}k</span>`;
                el.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (onPropertyClick) onPropertyClick(p);
                });
                el.addEventListener('contextmenu', (ev) => {
                    ev.preventDefault();
                    setStreetView({ lat, lng, label: `${p.address || ''}, ${p.city || ''}`.replace(/^,\s*/, '') });
                });
            }
            const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map);
            propertyMarkersRef.current.push(marker);
        });
    }, [onPropertyClick]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const handler = () => refreshPropertyLayer(map);
        map.on('moveend', handler);
        map.on('zoomend', handler);
        if (ready) handler();
        return () => { map.off('moveend', handler); map.off('zoomend', handler); };
    }, [refreshPropertyLayer, ready]);

    const changeStyle = useCallback((id) => {
        const map = mapRef.current;
        if (!map) return;
        const cfg = getStyleConfig(id);
        setStyleId(id);
        localStorage.setItem('aim.mapStyle', id);
        map.setStyle(cfg.url || cfg.style);
    }, []);

    const handleSearchSelect = useCallback(({ lat, lng, bbox }) => {
        const map = mapRef.current;
        if (!map) return;
        if (bbox && bbox.length === 4) {
            const [s, n, w, e] = bbox.map(parseFloat);
            map.fitBounds([[w, s], [e, n]], { padding: 80, duration: 900, maxZoom: 15, essential: true });
        } else {
            map.flyTo({ center: [lng, lat], zoom: 14, duration: 900, essential: true });
        }
    }, []);

    const dismissHint = () => { setShowHint(false); localStorage.setItem('aim.mapHintSeen', '1'); };
    const dismissMobileHint = () => { setShowMobileHint(false); localStorage.setItem('aim.mapMobileHintSeen', '1'); };

    const handleZoomIn = () => {
        const map = mapRef.current;
        if (map) map.zoomIn({ duration: 300 });
    };

    const handleZoomOut = () => {
        const map = mapRef.current;
        if (map) map.zoomOut({ duration: 300 });
    };

    const handleResetView = () => {
        const map = mapRef.current;
        if (map) map.flyTo({ ...INITIAL_VIEW, duration: 600, essential: true });
    };

    return (
        <div className={`usmap-root ${styleDark ? 'is-dark' : 'is-light'}`}>
            <div ref={containerRef} className="usmap-canvas" />

            <div className="usmap-overlay top-left">
                <MapSearchBar onSelect={handleSearchSelect} />
            </div>

            <div className="usmap-overlay top-right">
                <MapStyleSwitcher value={styleId} onChange={changeStyle} />
            </div>

            <div className="usmap-hud">
                <span className="hud-dot" />
                <span>Z{view.zoom.toFixed(1)}</span>
                <span className="hud-sep">·</span>
                <span>
                    {cursor
                        ? `${cursor.lat.toFixed(4)}°, ${cursor.lng.toFixed(4)}°`
                        : `${view.lat.toFixed(3)}°, ${view.lng.toFixed(3)}°`}
                </span>
                <span className="hud-sep">·</span>
                <span className="hud-hint">Right-click for Street View</span>
            </div>

            {showHint && (
                <div className="usmap-kbd-hint">
                    <div className="kbd-title">Map Navigation</div>
                    <ul>
                        <li><kbd>Scroll</kbd> zoom</li>
                        <li><kbd>Drag</kbd> pan · <kbd>Right-drag</kbd> tilt / rotate</li>
                        <li><kbd>R</kbd> reset pitch · <kbd>H</kbd> home view</li>
                        <li><kbd>Right-click</kbd> open Street View</li>
                    </ul>
                    <button type="button" onClick={dismissHint}>Got it</button>
                </div>
            )}

            {showMobileHint && (
                <div className="usmap-mobile-hint">
                    <div className="hint-title">Map Tips</div>
                    <div className="hint-text">
                        Drag to pan, pinch to zoom, or use the buttons below for navigation.
                    </div>
                    <div className="hint-actions">
                        <button className="hint-secondary" onClick={dismissMobileHint}>
                            Later
                        </button>
                        <button className="hint-primary" onClick={dismissMobileHint}>
                            Got it
                        </button>
                    </div>
                </div>
            )}

            <div className="usmap-mobile-nav">
                <button
                    title="Zoom in"
                    onClick={handleZoomIn}
                    aria-label="Zoom in"
                >
                    +
                </button>
                <button
                    title="Zoom out"
                    onClick={handleZoomOut}
                    aria-label="Zoom out"
                >
                    −
                </button>
                <button
                    title="Reset view"
                    onClick={handleResetView}
                    aria-label="Reset to home view"
                >
                    ⌂
                </button>
            </div>

            {streetView && (
                <StreetViewModal
                    lat={streetView.lat}
                    lng={streetView.lng}
                    label={streetView.label}
                    onClose={() => setStreetView(null)}
                />
            )}
        </div>
    );
}

