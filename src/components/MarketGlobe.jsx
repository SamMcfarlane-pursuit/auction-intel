import React, { useState, useCallback, useMemo, useRef, useEffect, Component } from 'react';

/**
 * MarketGlobe — Premium interactive globe powered by react-globe.gl.
 * Lazy-loaded to avoid SSR issues and reduce initial bundle.
 */

// State data for globe visualization
const STATE_POINTS = [
    { name: 'Florida', abbr: 'FL', lat: 27.6, lng: -81.5, score: 95, type: 'lien', deals: 742, capRate: '6.3%', grade: 'A+' },
    { name: 'Texas', abbr: 'TX', lat: 31.0, lng: -100.0, score: 92, type: 'deed', deals: 890, capRate: '6.5%', grade: 'A' },
    { name: 'Georgia', abbr: 'GA', lat: 32.2, lng: -83.4, score: 89, type: 'lien', deals: 312, capRate: '6.0%', grade: 'A' },
    { name: 'Arizona', abbr: 'AZ', lat: 34.0, lng: -111.1, score: 85, type: 'lien', deals: 189, capRate: '6.2%', grade: 'A-' },
    { name: 'North Carolina', abbr: 'NC', lat: 35.7, lng: -79.0, score: 87, type: 'deed', deals: 215, capRate: '5.9%', grade: 'A-' },
    { name: 'Illinois', abbr: 'IL', lat: 40.6, lng: -89.0, score: 78, type: 'lien', deals: 284, capRate: '6.8%', grade: 'B+' },
    { name: 'California', abbr: 'CA', lat: 36.8, lng: -119.4, score: 72, type: 'deed', deals: 452, capRate: '4.9%', grade: 'B' },
    { name: 'New York', abbr: 'NY', lat: 42.2, lng: -74.9, score: 81, type: 'lien', deals: 521, capRate: '4.8%', grade: 'B+' },
    { name: 'Ohio', abbr: 'OH', lat: 40.4, lng: -82.7, score: 72, type: 'lien', deals: 198, capRate: '7.2%', grade: 'B' },
    { name: 'Michigan', abbr: 'MI', lat: 44.3, lng: -85.6, score: 68, type: 'deed', deals: 145, capRate: '7.4%', grade: 'B-' },
    { name: 'Tennessee', abbr: 'TN', lat: 35.5, lng: -86.6, score: 83, type: 'deed', deals: 167, capRate: '6.1%', grade: 'A-' },
    { name: 'Colorado', abbr: 'CO', lat: 39.0, lng: -105.5, score: 84, type: 'lien', deals: 156, capRate: '5.5%', grade: 'A-' },
    { name: 'Indiana', abbr: 'IN', lat: 40.3, lng: -86.1, score: 76, type: 'lien', deals: 134, capRate: '7.0%', grade: 'B+' },
    { name: 'Nevada', abbr: 'NV', lat: 38.8, lng: -116.4, score: 82, type: 'deed', deals: 115, capRate: '6.1%', grade: 'B+' },
    { name: 'Washington', abbr: 'WA', lat: 47.7, lng: -120.7, score: 88, type: 'deed', deals: 124, capRate: '5.2%', grade: 'A-' },
    { name: 'South Carolina', abbr: 'SC', lat: 33.8, lng: -81.2, score: 86, type: 'lien', deals: 178, capRate: '6.5%', grade: 'A-' },
    { name: 'Maryland', abbr: 'MD', lat: 39.0, lng: -76.6, score: 79, type: 'lien', deals: 165, capRate: '5.8%', grade: 'B+' },
    { name: 'Alabama', abbr: 'AL', lat: 32.3, lng: -86.9, score: 74, type: 'lien', deals: 98, capRate: '7.1%', grade: 'B' },
    { name: 'Pennsylvania', abbr: 'PA', lat: 41.2, lng: -77.2, score: 71, type: 'deed', deals: 187, capRate: '6.9%', grade: 'B' },
    { name: 'Missouri', abbr: 'MO', lat: 38.5, lng: -92.3, score: 70, type: 'lien', deals: 112, capRate: '7.3%', grade: 'B' },
];

// Arcs connecting high-activity state pairs
const ARC_DATA = [
    { startLat: 27.6, startLng: -81.5, endLat: 31.0, endLng: -100.0, color: ['rgba(16,185,129,0.6)', 'rgba(59,130,246,0.6)'] },
    { startLat: 32.2, startLng: -83.4, endLat: 35.7, endLng: -79.0, color: ['rgba(16,185,129,0.4)', 'rgba(139,92,246,0.4)'] },
    { startLat: 42.2, startLng: -74.9, endLat: 40.6, endLng: -89.0, color: ['rgba(59,130,246,0.4)', 'rgba(16,185,129,0.4)'] },
    { startLat: 36.8, startLng: -119.4, endLat: 47.7, endLng: -120.7, color: ['rgba(139,92,246,0.3)', 'rgba(59,130,246,0.3)'] },
    { startLat: 27.6, startLng: -81.5, endLat: 32.2, endLng: -83.4, color: ['rgba(16,185,129,0.5)', 'rgba(16,185,129,0.3)'] },
    { startLat: 34.0, startLng: -111.1, endLat: 38.8, endLng: -116.4, color: ['rgba(59,130,246,0.3)', 'rgba(139,92,246,0.3)'] },
];

function getPointColor(score) {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#8b5cf6';
    return '#64748b';
}

function getPointSize(score) {
    if (score >= 90) return 0.35;
    if (score >= 80) return 0.28;
    return 0.2;
}

// Error boundary for WebGL fallback
class GlobeErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error) { console.warn('[MarketGlobe] WebGL Error:', error.message); }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    width: '100%', height: this.props.height || '100%',
                    background: '#F1EEE8', borderRadius: '1rem',
                    border: '1px solid #E5E1D8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px'
                }}>
                    <div style={{ fontSize: '3rem' }}>🌐</div>
                    <div style={{ color: '#0F172A', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        Globe Unavailable
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.75rem', maxWidth: '280px', textAlign: 'center' }}>
                        WebGL is not supported in this environment.
                        Switch to Map mode for full functionality.
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function MarketGlobeInner({ height = '100%', onStateClick }) {
    const globeRef = useRef();
    const [GlobeModule, setGlobeModule] = useState(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const containerRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Dynamically import react-globe.gl (it uses window/document)
    useEffect(() => {
        import('react-globe.gl').then(mod => {
            setGlobeModule(() => mod.default);
        }).catch(err => {
            console.error('[MarketGlobe] Failed to load globe:', err);
        });
    }, []);

    // Track container dimensions
    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver(entries => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    // Auto-rotate
    useEffect(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            if (controls) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.4;
                controls.enableZoom = true;
                controls.minDistance = 180;
                controls.maxDistance = 450;
            }
            // Point camera at US
            globeRef.current.pointOfView({ lat: 35, lng: -95, altitude: 2.2 }, 1500);
        }
    }, [GlobeModule, dimensions]);

    const Globe = GlobeModule;

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: height,
                background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 70%)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '1rem'
            }}
        >
            {Globe && dimensions.width > 0 && (
                <Globe
                    ref={globeRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    backgroundColor="rgba(0,0,0,0)"
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                    atmosphereColor="#6366f1"
                    atmosphereAltitude={0.18}
                    // Data points
                    pointsData={STATE_POINTS}
                    pointLat="lat"
                    pointLng="lng"
                    pointAltitude={d => getPointSize(d.score) * 0.15}
                    pointRadius={d => getPointSize(d.score)}
                    pointColor={d => getPointColor(d.score)}
                    pointsMerge={false}
                    onPointHover={setHoveredPoint}
                    onPointClick={d => {
                        if (d && onStateClick) onStateClick(d.abbr);
                    }}
                    // Arcs
                    arcsData={ARC_DATA}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={0.2}
                    arcDashAnimateTime={2000}
                    arcStroke={0.5}
                    // Labels
                    labelsData={STATE_POINTS.filter(s => s.score >= 80)}
                    labelLat="lat"
                    labelLng="lng"
                    labelText="abbr"
                    labelSize={0.6}
                    labelDotRadius={0.15}
                    labelColor={() => 'rgba(255,255,255,0.6)'}
                    labelAltitude={0.01}
                    labelResolution={2}
                />
            )}

            {/* Loading state */}
            {(!Globe || dimensions.width === 0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-sm animate-spin" />
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-[0.3em]">Loading Globe</span>
                    </div>
                </div>
            )}

            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500 animate-none shadow-[0_0_8px_#10b981]" />
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em]">Live Intelligence</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white/90 tracking-tight">Global Command</h2>
                </div>

                <div className="flex justify-between items-end">
                    <div className="flex gap-8">
                        <div>
                            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-widest mb-0.5">States Tracked</div>
                            <div className="text-base font-semibold text-white/80">50</div>
                        </div>
                        <div>
                            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-widest mb-0.5">Active Pipeline</div>
                            <div className="text-base font-semibold text-indigo-400">14.2K</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredPoint && (
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
                >
                    <div className="bg-canvas/90 backdrop-blur-2xl border border-white/10 rounded-md p-5 shadow-none min-w-[220px]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold text-white">{hoveredPoint.name}</div>
                            <div className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-sm border ${
 hoveredPoint.type === 'lien' 
 ? 'text-violet-300 bg-violet-500/10 border-violet-500/20' 
 : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
 }`}>
                                {hoveredPoint.type}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Grade</div>
                                <div className="text-sm font-semibold" style={{ color: getPointColor(hoveredPoint.score) }}>{hoveredPoint.grade}</div>
                            </div>
                            <div>
                                <div className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Deals</div>
                                <div className="text-sm font-semibold text-white">{hoveredPoint.deals}</div>
                            </div>
                            <div>
                                <div className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Cap Rate</div>
                                <div className="text-sm font-semibold text-emerald-600">{hoveredPoint.capRate}</div>
                            </div>
                            <div>
                                <div className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Score</div>
                                <div className="text-sm font-semibold text-white">{hoveredPoint.score}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MarketGlobe(props) {
    return (
        <GlobeErrorBoundary height={props.height}>
            <MarketGlobeInner {...props} />
        </GlobeErrorBoundary>
    );
}
