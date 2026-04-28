import React, { useEffect, useRef, useState } from 'react';

// Nominatim (OpenStreetMap) geocoder — free, no API key, rate-limited to 1 req/sec.
// Results restricted to US to keep the search focused.
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

export default function MapSearchBar({ onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query || query.trim().length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            if (abortRef.current) abortRef.current.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;
            setLoading(true);
            try {
                const url = `${NOMINATIM}?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=8&addressdetails=1`;
                const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } });
                const data = await res.json();
                setResults(Array.isArray(data) ? data.slice(0, 8) : []);
            } catch (e) {
                if (e.name !== 'AbortError') setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    const handleSelect = (r) => {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        setQuery(r.display_name.split(',').slice(0, 2).join(', '));
        setOpen(false);
        setResults([]);
        onSelect({ lat, lng, name: r.display_name, bbox: r.boundingbox });
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div className="map-search-wrap">
            <div className="map-search-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search address, city, ZIP..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
                    onFocus={() => query.length > 0 && setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    aria-label="Search map locations"
                    aria-expanded={open && results.length > 0}
                    aria-controls="map-search-results"
                />
                {loading && <span className="map-search-spinner" aria-label="Loading..." />}
                {query && !loading && (
                    <button 
                        type="button" 
                        className="map-search-clear" 
                        onClick={handleClear}
                        title="Clear search"
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>
            {open && results.length > 0 && (
                <ul 
                    id="map-search-results"
                    className="map-search-results" 
                    role="listbox"
                    aria-label="Search results"
                >
                    {results.map((r, idx) => {
                        const displayName = r.display_name.split(',').slice(0, 2).join(', ');
                        const secondary = r.display_name.split(',').slice(2).join(',').trim();
                        return (
                            <li key={`${r.place_id}-${idx}`} role="option">
                                <button 
                                    type="button" 
                                    onMouseDown={(e) => e.preventDefault()} 
                                    onClick={() => handleSelect(r)}
                                    className="map-search-result-item"
                                >
                                    <span className="mss-primary">{displayName}</span>
                                    {secondary && <span className="mss-secondary">{secondary}</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
