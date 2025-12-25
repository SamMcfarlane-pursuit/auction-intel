import React, { useState, useMemo } from 'react';
import { TIERS, COUNTIES, STATE_NAMES, STATE_PATHS, STATE_LABEL_COORDS, TIER_CRITERIA, FREE_DATA_SOURCES, NY_COUNTY_DETAILS, PYTHON_QUICK_START } from './data';

// Mock parcel data generator
const generateParcels = (countyName) => {
    const owners = ["BLULIGHT CRE LLC", "CROSSCOUNTRY MORTGAGE", "LEE KRISTEN D", "VANDEGRIFT JACQUELINE", "JENKINS SHAQUANNA", "JOHNSON BOBBY", "WISTERIA INVEST LLC"];
    const types = ["Vacant Land", "Single Family", "Commercial", "Industrial", "Multi-Family"];
    return Array.from({ length: 12 }, (_, i) => ({
        id: `2025-${1000 + i}`,
        parcelId: `${12 + i}-${30 + (i * 2)}`,
        owner: owners[i % owners.length],
        type: types[i % types.length],
        amount: (Math.random() * 5000 + 50).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        status: Math.random() > 0.2 ? "Active" : "Sold"
    }));
};

const getStateSummary = (abbr) => {
    const counties = COUNTIES[abbr] || [];
    if (!counties.length) return { best: 5, count: 0, t123: 0 };
    const best = Math.min(...counties.map(c => c[6]));
    const t123 = counties.filter(c => c[6] <= 3).length;
    return { best, count: counties.length, t123 };
};

export default function AuctionPlatform() {
    const [view, setView] = useState('map');
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCounty, setSelectedCounty] = useState(null);
    const [search, setSearch] = useState('');
    const [sortCol, setSortCol] = useState('tier');
    const [sortAsc, setSortAsc] = useState(true);
    const [filterTier, setFilterTier] = useState(5);
    const [hoveredState, setHoveredState] = useState(null);

    const searchResults = useMemo(() => {
        if (!search || search.length < 2) return [];
        const term = search.toLowerCase();
        const results = [];
        Object.entries(COUNTIES).forEach(([abbr, counties]) => {
            counties.forEach(c => {
                const stateName = STATE_NAMES[abbr] || abbr;
                if (c[0].toLowerCase().includes(term) || stateName.toLowerCase().includes(term)) {
                    results.push({ abbr, state: stateName, county: c });
                }
            });
        });
        return results.slice(0, 12);
    }, [search]);

    const displayCounties = useMemo(() => {
        if (!selectedState) return [];
        let counties = (COUNTIES[selectedState] || []).filter(c => c[6] <= filterTier);
        const sortIndex = { name: 0, pop: 1, income: 2, zhvi: 3, growth: 4, dom: 5, tier: 6 }[sortCol] || 6;
        counties = [...counties].sort((a, b) => {
            const aVal = a[sortIndex], bVal = b[sortIndex];
            if (typeof aVal === 'string') return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            return sortAsc ? aVal - bVal : bVal - aVal;
        });
        return counties;
    }, [selectedState, sortCol, sortAsc, filterTier]);

    const handleSort = (col) => {
        if (sortCol === col) setSortAsc(!sortAsc);
        else { setSortCol(col); setSortAsc(true); }
    };

    const allStates = Object.keys(COUNTIES).sort();
    const totalCounties = Object.values(COUNTIES).reduce((s, c) => s + c.length, 0);
    const totalT123 = Object.values(COUNTIES).reduce((s, c) => s + c.filter(x => x[6] <= 3).length, 0);

    const parcels = useMemo(() => {
        return selectedCounty ? generateParcels(selectedCounty[0]) : [];
    }, [selectedCounty]);

    // Get county details if available (for NY)
    const getCountyDetails = (countyName) => {
        return NY_COUNTY_DETAILS[countyName] || null;
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden text-sm font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Sidebar - Premium Dark Theme */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50">
                <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-display font-black text-xl shadow-lg shadow-blue-500/20">A</div>
                    <div>
                        <div className="font-display font-black text-white tracking-tight text-base">AUCTION INTEL</div>
                        <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">System Control v4.0</div>
                    </div>
                </div>

                <nav className="flex-1 py-6 overflow-y-auto scrollbar-hide px-4">
                    <div className="mb-8">
                        <div className="space-y-1">
                            {[
                                { id: 'map', label: 'Map Explorer', icon: '📍' },
                                { id: 'list', label: 'State Database', icon: '📊' },
                                { id: 'detection', label: 'Tier Detection', icon: '🎯' },
                                { id: 'sources', label: 'Data Sources', icon: '📡' },
                                { id: 'favorites', label: 'Watchlist', icon: '⭐' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setView(item.id); setSelectedCounty(null); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${view === item.id ? 'bg-blue-600 text-white font-bold shadow-xl shadow-blue-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                                >
                                    <span className="text-base leading-none">{item.icon}</span>
                                    <span className="text-sm tracking-tight">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-3 pl-2">Dynamic Filtering</div>
                        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                            <div className="text-[9px] font-black text-slate-400 mb-3 uppercase tracking-widest">Minimum Tiers</div>
                            <div className="grid grid-cols-5 gap-1">
                                {[1, 2, 3, 4, 5].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setFilterTier(t)}
                                        className={`h-9 rounded-lg flex items-center justify-center text-xs font-black transition-all transform active:scale-95 ${filterTier >= t ? 'text-white shadow-lg' : 'bg-slate-700 text-slate-500 hover:bg-slate-600'}`}
                                        style={filterTier >= t ? { backgroundColor: TIERS[t].color } : {}}
                                    >
                                        T{t}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-700/50">
                                <div className="text-[8px] font-bold text-slate-500 uppercase">Current Filter:</div>
                                <div className="text-xs font-bold text-slate-300 mt-0.5">T1 through T{filterTier}</div>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="p-4 bg-slate-800/20 border-t border-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Real-Time Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-green-500 tracking-tighter uppercase">LIVE</span>
                            <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></span>
                        </div>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[9px] font-bold text-slate-400 tracking-tight">
                        REGRID DATA FEED BROADCASTING VIA WS_8081
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-100">
                {/* Top Navigation Bar */}
                <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-8 shadow-sm shrink-0 z-40">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">Global Statistics</span>
                        </div>
                        <div className="font-display font-black text-xl text-slate-900 tracking-tighter">
                            {selectedCounty ? `${selectedCounty[0]} Region` : selectedState ? STATE_NAMES[selectedState] : 'United States Nexus'}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Lookup by FIPS, Parcel ID, or County..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-80 bg-slate-100/50 border-slate-200 border rounded-xl px-5 py-2.5 pl-10 text-sm font-medium focus:ring-4 focus:ring-blue-100 focus:bg-white focus:outline-none transition-all duration-300"
                            />
                            <span className="absolute left-4 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
                            {searchResults.length > 0 && (
                                <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden py-2">
                                    <div className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Search Results</div>
                                    {searchResults.map((r, i) => {
                                        const [name, , , , , , tier] = r.county;
                                        const t = TIERS[tier];
                                        return (
                                            <div key={i} onClick={() => { setSelectedState(r.abbr); setSelectedCounty(r.county); setSearch(''); setView('list'); }}
                                                className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                                                <div>
                                                    <div className="font-display font-black text-slate-800 text-sm">{name}, {r.abbr}</div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black text-white" style={{ background: t.color }}>{t.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex flex-col text-right">
                                <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Sam McFarlane</div>
                                <div className="flex gap-1.5 justify-end items-center">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                    <div className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">Premium Entity</div>
                                </div>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white font-display font-black text-sm border-3 border-white shadow-lg hover:scale-105 transition-transform cursor-pointer">SM</div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <div className="flex-1 overflow-auto p-8 relative">
                    <div className="max-w-[1600px] mx-auto h-full">
                        {selectedCounty ? (
                            /* County Detail View */
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <button onClick={() => setSelectedCounty(null)} className="group text-slate-400 font-bold hover:text-blue-600 flex items-center gap-2 mb-3 transition-colors">
                                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                                            <span className="uppercase tracking-[0.15em] text-[9px] font-black">Return to {STATE_NAMES[selectedState]}</span>
                                        </button>
                                        <div className="flex items-center gap-4">
                                            <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter">{selectedCounty[0]}</h1>
                                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: TIERS[selectedCounty[6]].color }}></span>
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{TIERS[selectedCounty[6]].name}</span>
                                                <span className="text-xs font-bold text-slate-400">/ Tier {selectedCounty[6]}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-display font-black text-sm shadow-xl hover:bg-black transition-all">DOWNLOAD</button>
                                        <button className="bg-white text-slate-900 border-2 border-slate-200 px-6 py-3 rounded-xl font-display font-black text-sm hover:bg-slate-50 transition-all">REPORT</button>
                                    </div>
                                </div>

                                {/* County Details from NY_COUNTY_DETAILS */}
                                {getCountyDetails(selectedCounty[0]) && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Investor Focus</h4>
                                            <p className="text-slate-800 font-medium">{getCountyDetails(selectedCounty[0]).investorFocus}</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lifestyle Score</h4>
                                            <p className="text-slate-800 font-medium">{getCountyDetails(selectedCounty[0]).lifestyle}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Metric Cards */}
                                <div className="grid grid-cols-4 gap-6">
                                    {[
                                        { label: "Housing Value (ZHVI)", value: `$${(selectedCounty[3] / 1000).toFixed(0)}K`, sub: `${selectedCounty[4]}% YoY`, icon: "📈", color: "text-blue-600" },
                                        { label: "Population", value: `${(selectedCounty[1] / 1000).toFixed(0)}K`, sub: "Residents", icon: "👥", color: "text-indigo-600" },
                                        { label: "Median Income", value: `$${(selectedCounty[2] / 1000).toFixed(0)}K`, sub: "Household", icon: "💰", color: "text-slate-900" },
                                        { label: "Days on Market", value: `${selectedCounty[5]}`, sub: "Average", icon: "⏱️", color: "text-amber-600" }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-slate-400 text-[9px] font-black tracking-widest uppercase">{stat.label}</span>
                                                <span className="text-xl">{stat.icon}</span>
                                            </div>
                                            <div className={`text-3xl font-display font-black tracking-tighter ${stat.color}`}>{stat.value}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{stat.sub}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Parcels Table */}
                                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                                    <div className="p-6 flex items-center justify-between border-b border-slate-50">
                                        <div className="flex items-baseline gap-3">
                                            <h3 className="font-display font-black text-lg text-slate-900">Tax Sale Inventory</h3>
                                            <span className="text-xs font-bold text-slate-400">{parcels.length} Listings</span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50">
                                                <tr className="text-slate-400 text-[9px] font-black tracking-widest uppercase">
                                                    <th className="px-6 py-4">ID</th>
                                                    <th className="px-6 py-4">Parcel</th>
                                                    <th className="px-6 py-4">Owner</th>
                                                    <th className="px-6 py-4">Type</th>
                                                    <th className="px-6 py-4 text-right">Amount</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {parcels.map((p, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/80 transition-all">
                                                        <td className="px-6 py-4 font-display font-black text-blue-600">{p.id}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-900">{p.parcelId}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">{p.owner}</td>
                                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase">{p.type}</span></td>
                                                        <td className="px-6 py-4 text-right font-display font-black text-slate-900">{p.amount}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${p.status === 'Active' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{p.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : view === 'map' ? (
                            /* Map View */
                            <div className="h-full flex flex-col gap-8">
                                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 flex-1 relative overflow-hidden">
                                    {/* Background Grid */}
                                    <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

                                    <div className="w-full flex items-start justify-between mb-6 z-10 relative">
                                        <div>
                                            <h2 className="text-4xl font-display font-black text-slate-900 tracking-tighter mb-1">Market Intelligence</h2>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                                <span className="w-6 h-[2px] bg-blue-500 rounded-full"></span>
                                                North America Coverage
                                            </p>
                                        </div>
                                        {hoveredState ? (
                                            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl min-w-[260px]">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[9px] font-black tracking-widest text-blue-400/60 uppercase">FIPS Data</span>
                                                    <span className="text-[9px] font-black text-green-500 uppercase">Active</span>
                                                </div>
                                                <div className="text-3xl font-display font-black tracking-tighter mb-2">{STATE_NAMES[hoveredState]}</div>
                                                <div className="h-[2px] w-full bg-slate-800 rounded-full mb-3 overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${(getStateSummary(hoveredState).t123 / Math.max(getStateSummary(hoveredState).count, 1)) * 100}%` }}></div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-400">Prime Counties</span>
                                                    <span className="font-black text-blue-400">{getStateSummary(hoveredState).t123} / {getStateSummary(hoveredState).count}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 rounded-2xl p-6 min-w-[260px] border border-slate-100 flex flex-col items-center gap-2">
                                                <span className="text-2xl opacity-30">🛰️</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Hover over a state</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative z-10 w-full flex justify-center py-6 state-intake">
                                        <svg viewBox="0 0 800 580" className="h-[480px] w-auto filter drop-shadow-lg overflow-visible">
                                            <defs>
                                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur stdDeviation="6" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                            </defs>
                                            {Object.entries(STATE_PATHS).map(([abbr, path]) => {
                                                const { best } = getStateSummary(abbr);
                                                const tier = TIERS[best];
                                                const isHovered = hoveredState === abbr;
                                                return (
                                                    <path
                                                        key={abbr}
                                                        d={path}
                                                        fill={tier.color}
                                                        fillOpacity={isHovered ? 0.85 : 0.15}
                                                        stroke={isHovered ? '#fff' : tier.color}
                                                        strokeOpacity={isHovered ? 1 : 0.4}
                                                        strokeWidth={isHovered ? "2" : "1"}
                                                        filter={isHovered ? "url(#glow)" : "none"}
                                                        className="transition-all duration-300 ease-out cursor-pointer"
                                                        onMouseEnter={() => setHoveredState(abbr)}
                                                        onMouseLeave={() => setHoveredState(null)}
                                                        onClick={() => { setSelectedState(abbr); setView('list'); }}
                                                    />
                                                );
                                            })}
                                            {Object.entries(STATE_LABEL_COORDS).map(([abbr, [x, y]]) => (
                                                <text
                                                    key={`label-${abbr}`}
                                                    x={x}
                                                    y={y}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className={`pointer-events-none fill-slate-800 font-display font-black text-[11px] transition-all duration-300 uppercase tracking-wider ${hoveredState === abbr ? 'opacity-100' : 'opacity-40'}`}
                                                >
                                                    {abbr}
                                                </text>
                                            ))}
                                        </svg>
                                    </div>

                                    <div className="flex justify-center gap-10 mt-6 z-10 relative">
                                        {Object.entries(TIERS).map(([t, info]) => (
                                            <div key={t} className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: info.color }}></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">{info.name}</span>
                                                    <span className="text-[10px] font-black text-slate-700">Tier {t}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bottom Stats */}
                                <div className="grid grid-cols-3 gap-6 shrink-0">
                                    {[
                                        { label: "Network Capacity", value: `${allStates.length}`, unit: "Jurisdictions", sub: "Full State Coverage Active", icon: "💎" },
                                        { label: "Asset Index", value: `${totalCounties}`, unit: "Regions", sub: "Real-time County Feeds", icon: "📊" },
                                        { label: "Premium Opportunity", value: `${totalT123}`, unit: "Targets", sub: "Tier 1-3 Recommendations", icon: "🚀", highlight: true }
                                    ].map((s, i) => (
                                        <div key={i} className={`p-6 rounded-2xl border transition-all ${s.highlight ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-400/30 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${s.highlight ? 'text-white/60' : 'text-slate-400'}`}>{s.label}</span>
                                                <span className="text-xl">{s.icon}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-display font-black tracking-tighter">{s.value}</span>
                                                <span className={`text-sm font-bold uppercase ${s.highlight ? 'text-white/80' : 'text-slate-400'}`}>{s.unit}</span>
                                            </div>
                                            <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${s.highlight ? 'text-white/70' : 'text-slate-400'}`}>{s.sub}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : view === 'list' ? (
                            /* List View - State Database */
                            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 flex flex-col h-full">
                                <div className="p-8 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-slate-900 tracking-tighter mb-1">State Database</h2>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select a territory to view county data</p>
                                    </div>
                                </div>

                                <div className="px-8 pb-6 border-b border-slate-50 overflow-x-auto scrollbar-hide shrink-0">
                                    <div className="flex gap-3 min-w-max pb-2">
                                        {allStates.map(abbr => {
                                            const { best } = getStateSummary(abbr);
                                            const isSelected = selectedState === abbr;
                                            return (
                                                <button
                                                    key={abbr}
                                                    onClick={() => { setSelectedState(abbr); setSelectedCounty(null); }}
                                                    className={`px-4 py-3 rounded-xl font-display font-black transition-all duration-300 ${isSelected ? 'shadow-lg ring-2 ring-blue-500 scale-105' : 'opacity-50 hover:opacity-100 hover:shadow-md'}`}
                                                    style={{ background: TIERS[best].bg, color: TIERS[best].color }}
                                                >
                                                    <div className="text-lg tracking-tighter">{abbr}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {selectedState ? (
                                    <div className="flex-1 overflow-auto px-4 pb-4">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/95 backdrop-blur-sm sticky top-0 z-20">
                                                <tr className="text-slate-400 text-[9px] font-black tracking-widest uppercase border-b border-slate-100">
                                                    {[['name', 'County'], ['tier', 'Grade'], ['pop', 'Population'], ['income', 'Income'], ['zhvi', 'ZHVI'], ['growth', '% Change'], ['dom', 'DOM']].map(([col, label]) => (
                                                        <th key={col} onClick={() => handleSort(col)} className="px-6 py-5 text-left cursor-pointer hover:bg-slate-50 transition-colors">
                                                            <div className="flex items-center gap-1">
                                                                <span>{label}</span>
                                                                {sortCol === col && <span className="text-blue-600">{sortAsc ? '↑' : '↓'}</span>}
                                                            </div>
                                                        </th>
                                                    ))}
                                                    <th className="px-6 py-5 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {displayCounties.map((c, i) => {
                                                    const [name, pop, income, zhvi, growth, dom, tier] = c;
                                                    const t = TIERS[tier];
                                                    return (
                                                        <tr key={i} onClick={() => setSelectedCounty(c)} className="group hover:bg-blue-50/50 cursor-pointer transition-all">
                                                            <td className="px-6 py-5 font-display font-black text-slate-800">{name}</td>
                                                            <td className="px-6 py-5">
                                                                <span className="px-2 py-1 rounded-lg text-[9px] font-black text-white" style={{ background: t.color }}>{t.label}</span>
                                                            </td>
                                                            <td className="px-6 py-5 font-bold text-slate-500 tabular-nums">{(pop / 1000).toFixed(0)}K</td>
                                                            <td className="px-6 py-5 font-bold text-slate-500 tabular-nums">${(income / 1000).toFixed(0)}K</td>
                                                            <td className="px-6 py-5 font-bold text-slate-500 tabular-nums">${(zhvi / 1000).toFixed(0)}K</td>
                                                            <td className="px-6 py-5">
                                                                <span className={`font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                                    {growth > 0 ? '▴' : '▾'} {Math.abs(growth)}%
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500">{dom}d</span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-all">Analyze</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                                        <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mb-6 opacity-30">🌐</div>
                                        <h3 className="text-2xl font-display font-black text-slate-200 uppercase">Select a State</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Choose from the state buttons above</p>
                                    </div>
                                )}
                            </div>
                        ) : view === 'detection' ? (
                            /* Tier Detection Algorithm View */
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                    <h2 className="text-2xl font-display font-black text-slate-900 mb-2">🎯 Tier Detection Algorithm</h2>
                                    <p className="text-slate-500">Automatically classify any US county into investment tiers using quantitative metrics.</p>
                                </div>

                                <div className="grid gap-4">
                                    {Object.entries(TIER_CRITERIA).map(([tier, info]) => {
                                        const tierData = TIERS[tier];
                                        return (
                                            <div key={tier} className="rounded-2xl p-5 border-l-4" style={{ backgroundColor: `${tierData.color}10`, borderLeftColor: tierData.color }}>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-black text-lg" style={{ backgroundColor: tierData.color }}>
                                                        {tier}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-display font-black text-slate-900">{info.name}</h3>
                                                        <p className="text-sm text-slate-500">{info.description}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {Object.entries(info.criteria).map(([metric, value]) => (
                                                        <div key={metric} className="bg-white/80 rounded-lg p-3 border border-slate-100">
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                                {metric.replace(/([A-Z])/g, ' $1').trim()}
                                                            </div>
                                                            <div className="font-mono text-sm font-bold text-slate-800">{value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Scoring Formula */}
                                <div className="bg-slate-900 rounded-2xl p-6 text-white">
                                    <h3 className="font-display font-black text-lg mb-4">📐 Scoring Formula</h3>
                                    <div className="bg-slate-800 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                                        <div className="text-green-400 mb-2">// Tier Score Calculation (0-100)</div>
                                        <div className="text-blue-300">tier_score = (</div>
                                        <div className="pl-4 text-gray-300">
                                            population_score × 0.15 +<br />
                                            income_score × 0.15 +<br />
                                            home_value_growth × 0.20 +<br />
                                            days_on_market_inv × 0.20 +<br />
                                            transaction_volume × 0.15 +<br />
                                            employment_rate × 0.15
                                        </div>
                                        <div className="text-blue-300">)</div>
                                        <div className="mt-4 text-yellow-400">// Tier Assignment</div>
                                        <div className="text-gray-300">
                                            if (tier_score &gt;= 80) → Tier 1<br />
                                            if (tier_score &gt;= 60) → Tier 2<br />
                                            if (tier_score &gt;= 40) → Tier 3<br />
                                            if (tier_score &gt;= 20) → Tier 4<br />
                                            else → Tier 5
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : view === 'sources' ? (
                            /* Data Sources View */
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200/50">
                                    <h2 className="text-2xl font-display font-black text-slate-900 mb-1">100% Free Data Sources</h2>
                                    <p className="text-slate-500">All tier detection uses publicly available, free data APIs</p>
                                    <div className="mt-4 flex gap-6">
                                        <div className="text-center">
                                            <div className="text-3xl font-display font-black text-green-600">$0</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Monthly Cost</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-display font-black text-blue-600">{FREE_DATA_SOURCES.length}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Data Sources</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {FREE_DATA_SOURCES.map(source => (
                                        <div key={source.name} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{source.icon}</span>
                                                    <h3 className="font-display font-black text-slate-900">{source.name}</h3>
                                                </div>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] font-black uppercase">Free</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {source.metrics.map(m => (
                                                    <span key={m} className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{m}</span>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400 text-xs font-bold">Weight: {(source.weight * 100).toFixed(0)}%</span>
                                                <a href={`https://${source.url}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs font-medium">
                                                    {source.url}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Python Quick Start */}
                                <div className="bg-slate-900 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">🐍</span>
                                        <h3 className="font-display font-black text-white text-lg">Quick Start: Fetch Tier Data</h3>
                                    </div>
                                    <pre className="bg-slate-800 p-4 rounded-xl text-sm overflow-x-auto">
                                        <code className="text-green-400">{PYTHON_QUICK_START}</code>
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                                <div className="text-6xl">⚡</div>
                                <div className="font-display font-black text-3xl uppercase text-slate-900">Coming Soon</div>
                                <div className="text-xs font-bold tracking-widest uppercase text-slate-500">Feature in development</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="h-9 bg-white/50 backdrop-blur-sm border-t border-slate-200/40 flex items-center justify-between px-8 shrink-0">
                    <div className="text-[8px] font-black text-slate-400 tracking-widest uppercase">System Core v4.2.19</div>
                    <div className="flex gap-4 items-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Data: Census • Zillow • Regrid</span>
                        <div className="h-3 w-px bg-slate-200"></div>
                        <span className="text-[8px] font-black text-blue-600 uppercase animate-pulse">Encrypted</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
