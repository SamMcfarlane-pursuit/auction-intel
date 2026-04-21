import React, { useEffect, useRef, useState } from 'react';

// Nominatim (OpenStreetMap) geocoder — free, no API key, rate-limited to 1 req/sec.
// Results restricted to US to keep the search focused.
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

export default function MapSearchBar({ onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query || query.trim().length < 3) {
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
                const url = `${NOMINATIM}?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=6&addressdetails=1`;
                const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } });
                const data = await res.json();
                setResults(Array.isArray(data) ? data : []);
            } catch (e) {
                if (e.name !== 'AbortError') setResults([]);
            } finally {
                setLoading(false);
            }
        }, 380);
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    const handleSelect = (r) => {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        setQuery(r.display_name.split(',').slice(0, 2).join(', '));
        setOpen(false);
        onSelect({ lat, lng, name: r.display_name, bbox: r.boundingbox });
    };

    return (
        <div className="map-search-wrap">
            <div className="map-search-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                    type="text"
                    placeholder="Search address, city, ZIP..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 180)}
                    aria-label="Search map"
                />
                {loading && <span className="map-search-spinner" aria-hidden="true" />}
                {query && !loading && (
                    <button type="button" className="map-search-clear" onClick={() => { setQuery(''); setResults([]); }} aria-label="Clear">×</button>
                )}
            </div>
            {open && results.length > 0 && (
                <ul className="map-search-results" role="listbox">
                    {results.map((r) => (
                        <li key={r.place_id}>
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelect(r)}>
                                <span className="mss-primary">{r.display_name.split(',').slice(0, 2).join(', ')}</span>
                                <span className="mss-secondary">{r.display_name.split(',').slice(2).join(',').trim()}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
