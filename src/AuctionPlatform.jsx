import React, { useState, useMemo, useEffect } from 'react';
import { TIERS, COUNTIES as STATIC_COUNTIES, STATE_NAMES, STATE_PATHS, STATE_LABEL_COORDS, TIER_CRITERIA, FREE_DATA_SOURCES, NY_COUNTY_DETAILS, PYTHON_QUICK_START, STATE_AUCTION_INFO as STATIC_STATE_AUCTION_INFO, getStateByZip } from './data';
import { exportToCSV, copyToClipboard, tableToText, printReport, generateCountyReportHTML, generateStateReportHTML } from './exportUtils';
import USMap from './USMap';
import UpcomingAuctions from './UpcomingAuctions';
import 'leaflet/dist/leaflet.css';

const API_BASE = 'http://localhost:8080/api';

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

export default function AuctionPlatform() {
    const [view, setView] = useState('map');
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCounty, setSelectedCounty] = useState(null);
    const [search, setSearch] = useState('');
    const [sortCol, setSortCol] = useState('tier');
    const [sortAsc, setSortAsc] = useState(true);
    const [filterTier, setFilterTier] = useState(5);
    const [hoveredState, setHoveredState] = useState(null);
    const [selectedStateInfo, setSelectedStateInfo] = useState(null); // For State Info verification modal
    const [stateInfoFilter, setStateInfoFilter] = useState('all'); // 'all', 'lien', 'deed'
    const [stateInfoSort, setStateInfoSort] = useState({ col: 'state', asc: true });
    const [stateRateFilter, setStateRateFilter] = useState('all'); // 'all', 'high', 'medium', 'low'
    const [stateRedemptionFilter, setStateRedemptionFilter] = useState('all'); // 'all', 'short', 'medium', 'long'
    const [mapZoom, setMapZoom] = useState(1); // Map zoom level (0.5 to 3)
    const [mapPan, setMapPan] = useState({ x: 0, y: 0 }); // Map pan offset
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isMapExpanded, setIsMapExpanded] = useState(false); // Map expansion state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

    // API-driven data with fallbacks to static data
    const [COUNTIES, setCOUNTIES] = useState(STATIC_COUNTIES);
    const [STATE_AUCTION_INFO, setSTATE_AUCTION_INFO] = useState(STATIC_STATE_AUCTION_INFO);
    const [apiStatus, setApiStatus] = useState('connecting'); // 'connecting', 'live', 'offline'

    // Fetch data from backend API on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch state auction info
                const stateRes = await fetch(`${API_BASE}/state-info`);
                if (stateRes.ok) {
                    const stateData = await stateRes.json();
                    // Transform array to object keyed by abbr
                    const stateMap = {};
                    stateData.forEach(s => {
                        stateMap[s.abbr] = {
                            type: s.type,
                            interestRate: s.interest_rate,
                            redemptionPeriod: s.redemption_period,
                            notes: s.notes
                        };
                    });
                    setSTATE_AUCTION_INFO(stateMap);
                }

                // Fetch all counties
                const countyRes = await fetch(`${API_BASE}/counties`);
                if (countyRes.ok) {
                    const countyData = await countyRes.json();
                    // Transform array to object keyed by state
                    const countyMap = {};
                    countyData.forEach(c => {
                        if (!countyMap[c.state]) countyMap[c.state] = [];
                        // Format: [name, pop, income, zhvi, growth, dom, tier, notes]
                        countyMap[c.state].push([
                            c.name, c.pop, c.income, c.zhvi, c.growth, c.dom, c.tier, c.notes
                        ]);
                    });
                    setCOUNTIES(countyMap);
                }

                setApiStatus('live');
            } catch (err) {
                console.warn('Backend API unavailable, using static data:', err.message);
                setApiStatus('offline');
            }
        };

        fetchData();
    }, []);

    const getStateSummary = (abbr) => {
        const counties = COUNTIES[abbr] || [];
        if (!counties.length) return { best: 5, count: 0, t123: 0 };
        const best = Math.min(...counties.map(c => c[6]));
        const t123 = counties.filter(c => c[6] <= 3).length;
        return { best, count: counties.length, t123 };
    };

    // Helper to parse interest rate string to number
    const parseRate = (rateStr) => {
        if (!rateStr) return 0;
        const match = rateStr.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

    // Helper to parse redemption period to months
    const parseRedemption = (redemptionStr) => {
        if (!redemptionStr) return 0;
        const str = redemptionStr.toLowerCase();
        const match = str.match(/(\d+)/);
        const num = match ? parseInt(match[1], 10) : 0;
        if (str.includes('year')) return num * 12;
        if (str.includes('month')) return num;
        if (str.includes('day')) return Math.ceil(num / 30);
        return num;
    };

    // Filter functions for rate and redemption
    const matchesRateFilter = (info) => {
        if (stateRateFilter === 'all') return true;
        const rate = parseRate(info.interestRate);
        if (stateRateFilter === 'high') return rate >= 16;
        if (stateRateFilter === 'medium') return rate >= 8 && rate < 16;
        if (stateRateFilter === 'low') return rate < 8 && rate > 0;
        return true;
    };

    const matchesRedemptionFilter = (info) => {
        if (stateRedemptionFilter === 'all') return true;
        const months = parseRedemption(info.redemptionPeriod);
        if (stateRedemptionFilter === 'short') return months <= 6;
        if (stateRedemptionFilter === 'medium') return months > 6 && months <= 24;
        if (stateRedemptionFilter === 'long') return months > 24;
        return true;
    };

    const searchResults = useMemo(() => {
        if (!search || search.length < 2) return [];
        const term = search.toLowerCase().trim();
        const results = [];
        // Check if search term is a ZIP code (3-5 digits)
        if (/^\d{3,5}$/.test(term)) {
            const stateAbbr = getStateByZip(term);
            if (stateAbbr) {
                const stateName = STATE_NAMES[stateAbbr];
                results.push({ abbr: stateAbbr, state: stateName, county: null, matchType: 'zip', zipCode: term });
                (COUNTIES[stateAbbr] || []).forEach(c => results.push({ abbr: stateAbbr, state: stateName, county: c, matchType: 'zip-county' }));
                return results.slice(0, 15);
            }
        }
        // Check for exact state abbreviation match
        const upperTerm = term.toUpperCase();
        if (STATE_NAMES[upperTerm]) {
            const stateName = STATE_NAMES[upperTerm];
            results.push({ abbr: upperTerm, state: stateName, county: null, matchType: 'abbreviation' });
            (COUNTIES[upperTerm] || []).forEach(c => results.push({ abbr: upperTerm, state: stateName, county: c }));
            return results.slice(0, 15);
        }
        // Search by state name and counties
        Object.entries(COUNTIES).forEach(([abbr, counties]) => {
            const stateName = STATE_NAMES[abbr] || abbr;
            const stateMatch = stateName.toLowerCase().includes(term) || abbr.toLowerCase() === term;
            if (stateMatch && !results.find(r => r.abbr === abbr && !r.county)) {
                results.push({ abbr, state: stateName, county: null, matchType: 'state' });
            }
            counties.forEach(c => {
                if (c[0].toLowerCase().includes(term) || stateMatch) {
                    results.push({ abbr, state: stateName, county: c });
                }
            });
        });
        return results.slice(0, 15);
    }, [search, COUNTIES]);

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

    // Export handlers
    const handleExportCountyCSV = () => {
        if (!selectedCounty) return;
        const [name, pop, income, zhvi, growth, dom, tier, notes] = selectedCounty;
        const data = [{
            county: name,
            tier: `T${tier}`,
            population: pop,
            median_income: income,
            zhvi: zhvi,
            growth_pct: growth,
            days_on_market: dom,
            notes: notes || ''
        }];
        const columns = [
            { key: 'county', label: 'County' },
            { key: 'tier', label: 'Tier' },
            { key: 'population', label: 'Population' },
            { key: 'median_income', label: 'Median Income' },
            { key: 'zhvi', label: 'ZHVI' },
            { key: 'growth_pct', label: 'Growth %' },
            { key: 'days_on_market', label: 'DOM' },
            { key: 'notes', label: 'Notes' }
        ];
        exportToCSV(data, columns, `${name}_county_data`);
    };

    const handleExportParcelsCSV = () => {
        if (!selectedCounty || !parcels.length) return;
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'parcelId', label: 'Parcel ID' },
            { key: 'owner', label: 'Owner' },
            { key: 'type', label: 'Type' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' }
        ];
        exportToCSV(parcels, columns, `${selectedCounty[0]}_parcels`);
    };

    const handleExportStateCSV = () => {
        if (!selectedState || !displayCounties.length) return;
        const data = displayCounties.map(c => ({
            county: c[0],
            tier: `T${c[6]}`,
            population: c[1],
            median_income: c[2],
            zhvi: c[3],
            growth_pct: c[4],
            days_on_market: c[5],
            notes: c[7] || ''
        }));
        const columns = [
            { key: 'county', label: 'County' },
            { key: 'tier', label: 'Tier' },
            { key: 'population', label: 'Population' },
            { key: 'median_income', label: 'Median Income' },
            { key: 'zhvi', label: 'ZHVI' },
            { key: 'growth_pct', label: 'Growth %' },
            { key: 'days_on_market', label: 'DOM' },
            { key: 'notes', label: 'Notes' }
        ];
        exportToCSV(data, columns, `${STATE_NAMES[selectedState]}_counties`);
    };

    const handleCopyStateData = async () => {
        if (!displayCounties.length) return;
        const data = displayCounties.map(c => ({
            county: c[0],
            tier: `T${c[6]}`,
            population: c[1],
            income: `$${c[2]}`,
            zhvi: `$${c[3]}`,
            growth: `${c[4]}%`,
            dom: c[5]
        }));
        const columns = [
            { key: 'county', label: 'County' },
            { key: 'tier', label: 'Tier' },
            { key: 'population', label: 'Population' },
            { key: 'income', label: 'Income' },
            { key: 'zhvi', label: 'ZHVI' },
            { key: 'growth', label: 'Growth' },
            { key: 'dom', label: 'DOM' }
        ];
        const text = tableToText(data, columns);
        const success = await copyToClipboard(text);
        if (success) {
            alert('Copied to clipboard!');
        }
    };

    const handlePrintCountyReport = () => {
        if (!selectedCounty) return;
        const html = generateCountyReportHTML(
            selectedCounty,
            parcels,
            STATE_NAMES[selectedState],
            TIERS[selectedCounty[6]]
        );
        printReport(`${selectedCounty[0]} County Report`, html);
    };

    const handlePrintStateReport = () => {
        if (!displayCounties.length) return;
        const html = generateStateReportHTML(
            displayCounties,
            STATE_NAMES[selectedState],
            TIERS
        );
        printReport(`${STATE_NAMES[selectedState]} County Analysis`, html);
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden text-sm font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            {/* Sidebar - Premium Dark Theme with Mobile Responsiveness */}
            <aside className={`fixed md:relative w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
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
                                { id: 'auctions', label: 'Upcoming Sales', icon: '🔔' },
                                { id: 'list', label: 'State Database', icon: '📊' },
                                { id: 'stateinfo', label: 'State Info', icon: '🏛️' },
                                { id: 'detection', label: 'Tier Detection', icon: '🎯' },
                                { id: 'sources', label: 'Data Sources', icon: '📡' },
                                { id: 'guide', label: 'User Guide', icon: '📚' },
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
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Backend Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold tracking-tighter uppercase ${apiStatus === 'live' ? 'text-green-500' : apiStatus === 'connecting' ? 'text-yellow-500' : 'text-slate-500'}`}>
                                {apiStatus === 'live' ? 'LIVE' : apiStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${apiStatus === 'live' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse' : apiStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-500'}`}></span>
                        </div>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[9px] font-bold text-slate-400 tracking-tight">
                        {apiStatus === 'live' ? 'BACKEND API: localhost:8080' : apiStatus === 'connecting' ? 'CONNECTING TO BACKEND...' : 'USING STATIC DATA (BACKEND OFFLINE)'}
                    </div>
                    {apiStatus === 'live' && (
                        <div className="mt-2 p-2.5 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base">🏠</span>
                                    <span className="text-[9px] font-bold text-blue-300">Zillow ZHVI</span>
                                </div>
                                <span className="text-[8px] font-bold text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded">3,073 Counties</span>
                            </div>
                        </div>
                    )}
                    {apiStatus === 'live' && (
                        <div className="mt-2 p-2.5 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg border border-red-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base">📈</span>
                                    <span className="text-[9px] font-bold text-red-300">Redfin Market</span>
                                </div>
                                <span className="text-[8px] font-bold text-red-400 bg-red-900/50 px-1.5 py-0.5 rounded">DOM • S/L</span>
                            </div>
                        </div>
                    )}
                    {apiStatus === 'live' && (
                        <div className="mt-2 p-2.5 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base">💰</span>
                                    <span className="text-[9px] font-bold text-green-300">Mortgage Rates</span>
                                </div>
                                <span className="text-[8px] font-bold text-green-400 bg-green-900/50 px-1.5 py-0.5 rounded">6.72% 30yr</span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-100 w-full">
                {/* Top Navigation Bar - All elements visible on all devices */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shrink-0 z-40 relative">
                    {/* Main header row */}
                    <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
                        {/* Left: Hamburger + Title */}
                        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                            {/* Mobile Hamburger Menu */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
                            >
                                <span className="text-lg">{isSidebarOpen ? '✕' : '☰'}</span>
                            </button>

                            <div className="min-w-0">
                                <div className="hidden md:flex items-center gap-2 mb-0.5">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">Global Statistics</span>
                                </div>
                                <div className="font-display font-black text-sm md:text-xl text-slate-900 tracking-tighter truncate">
                                    {selectedCounty ? `${selectedCounty[0]} Region` : selectedState ? STATE_NAMES[selectedState] : 'Auction Intel'}
                                </div>
                            </div>
                        </div>

                        {/* Right: Profile Avatar (always visible) */}
                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <div className="hidden sm:flex flex-col text-right">
                                <div className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-tight">Sam McFarlane</div>
                                <div className="hidden md:flex gap-1 justify-end items-center">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                    <div className="text-[8px] text-blue-600 font-bold uppercase">Premium</div>
                                </div>
                            </div>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white font-display font-black text-xs md:text-sm shadow-lg">SM</div>
                        </div>
                    </div>

                    {/* Search bar row - always visible */}
                    <div className="px-3 md:px-6 pb-2 md:pb-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search ZIP, state, or county..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-100/70 border-slate-200 border rounded-lg md:rounded-xl px-4 py-2 md:py-2.5 pl-9 md:pl-10 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:bg-white focus:outline-none transition-all"
                            />
                            <span className="absolute left-3 top-2 md:top-2.5 text-slate-400">🔍</span>
                            {searchResults.length > 0 && (
                                <div className="absolute top-[calc(100%+4px)] left-0 right-0 md:right-auto md:w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] overflow-hidden py-2 max-h-72 overflow-y-auto">
                                    <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Search Results</div>
                                    {searchResults.map((r, i) => {
                                        if (!r.county) {
                                            const auctionInfo = STATE_AUCTION_INFO[r.abbr];
                                            return (
                                                <div key={i} onClick={() => { setSelectedState(r.abbr); setSelectedCounty(null); setSearch(''); setView('list'); setIsSidebarOpen(false); }}
                                                    className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white text-xs font-black">{r.abbr}</div>
                                                        <div className="font-bold text-slate-900 text-sm">{r.state}</div>
                                                    </div>
                                                    {auctionInfo && <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white ${auctionInfo.type === 'Lien' ? 'bg-purple-600' : 'bg-blue-600'}`}>{auctionInfo.type}</span>}
                                                </div>
                                            );
                                        }
                                        const [name, , , , , , tier] = r.county;
                                        const t = TIERS[tier];
                                        return (
                                            <div key={i} onClick={() => { setSelectedState(r.abbr); setSelectedCounty(r.county); setSearch(''); setView('list'); setIsSidebarOpen(false); }}
                                                className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer">
                                                <div className="font-bold text-slate-800 text-sm">{name}, {r.abbr}</div>
                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: t.color }}>{t.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8 relative">
                    <div className="max-w-[1600px] mx-auto h-full">
                        {selectedCounty ? (
                            /* County Detail View */
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <button onClick={() => setSelectedCounty(null)} className="group text-slate-400 font-bold hover:text-blue-600 flex items-center gap-2 mb-3 transition-colors">
                                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                                            <span className="uppercase tracking-[0.15em] text-[9px] font-black">Return to {STATE_NAMES[selectedState]}</span>
                                        </button>
                                        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                                            <h1 className="text-2xl md:text-5xl font-display font-black text-slate-900 tracking-tighter">{selectedCounty[0]}</h1>
                                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: TIERS[selectedCounty[6]].color }}></span>
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{TIERS[selectedCounty[6]].name}</span>
                                                <span className="text-xs font-bold text-slate-400">/ Tier {selectedCounty[6]}</span>
                                            </div>
                                            {/* Auction Type Badge */}
                                            {STATE_AUCTION_INFO[selectedState] && (
                                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'bg-purple-50 border-purple-200' : 'bg-indigo-50 border-indigo-200'}`}>
                                                    <span className={`w-2.5 h-2.5 rounded-full ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'bg-purple-600' : 'bg-indigo-600'}`}></span>
                                                    <span className={`text-sm font-black uppercase tracking-tight ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'text-purple-900' : 'text-indigo-900'}`}>
                                                        {STATE_AUCTION_INFO[selectedState].type}
                                                    </span>
                                                    <span className={`text-xs font-bold ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'text-purple-500' : 'text-indigo-500'}`}>
                                                        {STATE_AUCTION_INFO[selectedState].interestRate !== 'N/A' ? STATE_AUCTION_INFO[selectedState].interestRate : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 md:gap-3 flex-wrap mt-3 md:mt-0">
                                        <button onClick={handleExportParcelsCSV} className="bg-slate-900 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-display font-black text-xs md:text-sm shadow-xl hover:bg-black transition-all flex items-center gap-1 md:gap-2">
                                            <span>📥</span> <span className="hidden sm:inline">DOWNLOAD</span> CSV
                                        </button>
                                        <button onClick={handlePrintCountyReport} className="bg-white text-slate-900 border-2 border-slate-200 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-display font-black text-xs md:text-sm hover:bg-slate-50 transition-all flex items-center gap-1 md:gap-2">
                                            <span>📄</span> REPORT
                                        </button>
                                    </div>
                                </div>

                                {/* County Details from NY_COUNTY_DETAILS */}
                                {getCountyDetails(selectedCounty[0]) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                                    {[
                                        { label: "Housing Value (ZHVI)", value: `$${(selectedCounty[3] / 1000).toFixed(0)}K`, sub: `${selectedCounty[4]}% YoY`, icon: "📈", color: "text-blue-600" },
                                        { label: "Population", value: `${(selectedCounty[1] / 1000).toFixed(0)}K`, sub: "Residents", icon: "👥", color: "text-indigo-600" },
                                        { label: "Median Income", value: `$${(selectedCounty[2] / 1000).toFixed(0)}K`, sub: "Household", icon: "💰", color: "text-slate-900" },
                                        { label: "Days on Market", value: `${selectedCounty[5]}`, sub: "Average", icon: "⏱️", color: "text-amber-600" }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                                <span className="text-slate-400 text-[8px] md:text-[9px] font-black tracking-widest uppercase">{stat.label}</span>
                                                <span className="text-lg md:text-xl">{stat.icon}</span>
                                            </div>
                                            <div className={`text-xl md:text-3xl font-display font-black tracking-tighter ${stat.color}`}>{stat.value}</div>
                                            <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-1">{stat.sub}</div>
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
                            /* Map View - Clean Minimal Design */
                            <>
                                {/* Expanded Map Overlay - Premium Design */}
                                {isMapExpanded && (
                                    <div
                                        className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
                                        onClick={() => setIsMapExpanded(false)}
                                    >
                                        <div
                                            className="w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {/* Premium Header */}
                                            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                                                        🗺️
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900">US Market Map</h2>
                                                        <p className="text-sm text-gray-500">Click any state to explore county data</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {/* Hovered State Info */}
                                                    {hoveredState && (
                                                        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-lg">
                                                            <span className="font-bold text-lg">{STATE_NAMES[hoveredState]}</span>
                                                            {STATE_AUCTION_INFO[hoveredState] && (
                                                                <>
                                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATE_AUCTION_INFO[hoveredState].type === 'Lien' ? 'bg-violet-500' : 'bg-blue-500'}`}>
                                                                        {STATE_AUCTION_INFO[hoveredState].type}
                                                                    </span>
                                                                    <span className="text-gray-300">{STATE_AUCTION_INFO[hoveredState].interestRate}</span>
                                                                </>
                                                            )}
                                                            <span className="text-gray-400 text-sm">{getStateSummary(hoveredState).count} counties</span>
                                                        </div>
                                                    )}

                                                    {/* Close Button */}
                                                    <button
                                                        onClick={() => setIsMapExpanded(false)}
                                                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-all text-gray-500 text-lg font-bold"
                                                        title="Close (Esc)"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Main Content - Map + Stats */}
                                            <div className="flex-1 flex min-h-0">
                                                {/* Map Area */}
                                                <div className="flex-1 min-h-0 relative">
                                                    <USMap
                                                        onStateClick={(abbr) => { setSelectedState(abbr); setView('list'); setIsMapExpanded(false); }}
                                                        selectedState={selectedState}
                                                        hoveredState={hoveredState}
                                                        onHoverState={setHoveredState}
                                                    />
                                                </div>

                                                {/* Stats Sidebar */}
                                                <div className="w-64 bg-slate-50 border-l border-gray-100 p-4 flex flex-col gap-4 overflow-auto">
                                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Stats</div>

                                                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                                        <div className="text-3xl font-black text-gray-900">{allStates.length}</div>
                                                        <div className="text-xs text-gray-500 font-medium">States Covered</div>
                                                    </div>

                                                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                                        <div className="text-3xl font-black text-gray-900">{totalCounties.toLocaleString()}</div>
                                                        <div className="text-xs text-gray-500 font-medium">Total Counties</div>
                                                    </div>

                                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                                                        <div className="text-3xl font-black">{totalT123}</div>
                                                        <div className="text-xs text-blue-100 font-medium">Prime Tier (T1-T3)</div>
                                                    </div>

                                                    <div className="mt-auto">
                                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Legend</div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                                                <div className="w-4 h-4 rounded bg-violet-500 shadow-sm"></div>
                                                                <span className="text-sm text-gray-700 font-medium">Lien States</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                                                <div className="w-4 h-4 rounded bg-blue-500 shadow-sm"></div>
                                                                <span className="text-sm text-gray-700 font-medium">Deed States</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Bar */}
                                            <div className="px-6 py-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-sm">
                                                <span className="text-gray-400">Press <kbd className="px-2 py-0.5 bg-gray-200 rounded text-xs font-mono">Esc</kbd> or click outside to close</span>
                                                <span className="text-gray-500 font-medium">Hover over states to see auction details</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="h-full flex flex-col gap-4">
                                    {/* Map Container - lower z-index to not overlap header elements */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-1 flex flex-col min-h-0 relative overflow-hidden z-10">
                                        {/* Simple Header - Clickable to Expand */}
                                        <div
                                            className="flex items-center justify-between mb-3 cursor-pointer group"
                                            onClick={() => setIsMapExpanded(true)}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-xl font-semibold text-gray-900">US Market Map</h2>
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">⤢ Click to expand</span>
                                                </div>
                                                <p className="text-xs text-gray-400">Click a state to view counties</p>
                                            </div>
                                            {/* Hover Info */}
                                            {hoveredState && (
                                                <div className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-3">
                                                    <span className="font-semibold">{STATE_NAMES[hoveredState]}</span>
                                                    {STATE_AUCTION_INFO[hoveredState] && (
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATE_AUCTION_INFO[hoveredState].type === 'Lien' ? 'bg-violet-500' : 'bg-blue-500'}`}>
                                                            {STATE_AUCTION_INFO[hoveredState].type}
                                                        </span>
                                                    )}
                                                    <span className="text-gray-300 text-sm">{getStateSummary(hoveredState).count} counties</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Map */}
                                        <div className="flex-1 min-h-0 rounded-xl overflow-hidden relative" style={{ minHeight: '350px' }}>
                                            <USMap
                                                onStateClick={(abbr) => { setSelectedState(abbr); setView('list'); }}
                                                selectedState={selectedState}
                                                hoveredState={hoveredState}
                                                onHoverState={setHoveredState}
                                            />
                                        </div>

                                        {/* Simple Legend */}
                                        <div className="flex justify-center gap-6 mt-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-violet-500"></div>
                                                <span className="text-xs text-gray-500">Lien States</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-blue-500"></div>
                                                <span className="text-xs text-gray-500">Deed States</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Simple Stats Row */}
                                    <div className="grid grid-cols-3 gap-2 md:gap-3 shrink-0">
                                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                                            <div className="text-2xl font-bold text-gray-900">{allStates.length}</div>
                                            <div className="text-xs text-gray-400">States</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                                            <div className="text-2xl font-bold text-gray-900">{totalCounties}</div>
                                            <div className="text-xs text-gray-400">Counties</div>
                                        </div>
                                        <div className="bg-blue-500 rounded-xl p-4 text-white">
                                            <div className="text-2xl font-bold">{totalT123}</div>
                                            <div className="text-xs text-blue-100">Prime (T1-T3)</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : view === 'auctions' ? (
                            /* Auctions View - Upcoming Sales */
                            <UpcomingAuctions
                                onSelectState={(abbr) => { setSelectedState(abbr); setView('list'); }}
                                onSelectCounty={(name) => {
                                    if (selectedState) {
                                        const county = (COUNTIES[selectedState] || []).find(c => c[0] === name);
                                        if (county) setSelectedCounty(county);
                                    }
                                }}
                            />
                        ) : view === 'list' ? (
                            /* List View - State Database */
                            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 flex flex-col h-full">
                                <div className="p-8 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 mb-1">
                                            <h2 className="text-4xl font-display font-black text-slate-900 tracking-tighter">State Database</h2>
                                            {selectedState && STATE_AUCTION_INFO[selectedState] && (
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'bg-purple-100 border border-purple-200' : 'bg-indigo-100 border border-indigo-200'}`}>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                                        {STATE_AUCTION_INFO[selectedState].type}
                                                    </span>
                                                    <span className={`text-xs font-bold ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'text-purple-700' : 'text-indigo-700'}`}>
                                                        {STATE_AUCTION_INFO[selectedState].interestRate !== 'N/A' ? STATE_AUCTION_INFO[selectedState].interestRate : STATE_AUCTION_INFO[selectedState].redemptionPeriod}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select a territory to view county data</p>
                                    </div>
                                    {selectedState && displayCounties.length > 0 && (
                                        <div className="flex gap-2">
                                            <button onClick={handleExportStateCSV} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-display font-black text-xs shadow-lg hover:bg-black transition-all flex items-center gap-2">
                                                <span>📥</span> Export CSV
                                            </button>
                                            <button onClick={handleCopyStateData} className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-display font-black text-xs hover:bg-slate-50 transition-all flex items-center gap-2">
                                                <span>📋</span> Copy
                                            </button>
                                            <button onClick={handlePrintStateReport} className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-display font-black text-xs hover:bg-slate-50 transition-all flex items-center gap-2">
                                                <span>🖨️</span> Print
                                            </button>
                                        </div>
                                    )}
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
                        ) : view === 'stateinfo' ? (
                            /* State Info View - Lien vs Deed Types */
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-2xl font-display font-black text-slate-900 mb-1">🏛️ State Tax Sale Information</h2>
                                            <p className="text-slate-500">Comprehensive guide to lien vs deed sales, interest rates, and redemption periods</p>
                                        </div>
                                        {/* Filter Toggle Buttons */}
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <button
                                                onClick={() => setStateInfoFilter('all')}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${stateInfoFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                                            >All ({Object.keys(STATE_AUCTION_INFO).length})</button>
                                            <button
                                                onClick={() => setStateInfoFilter('lien')}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${stateInfoFilter === 'lien' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-200'}`}
                                            >Lien ({Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Lien').length})</button>
                                            <button
                                                onClick={() => setStateInfoFilter('deed')}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${stateInfoFilter === 'deed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'}`}
                                            >Deed ({Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Deed').length})</button>

                                            <div className="h-6 w-px bg-slate-300 mx-1"></div>

                                            {/* Interest Rate Filter */}
                                            <select
                                                value={stateRateFilter}
                                                onChange={(e) => setStateRateFilter(e.target.value)}
                                                className="px-3 py-2 rounded-xl text-xs font-bold border border-green-200 bg-white text-green-700 hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:outline-none cursor-pointer transition-all"
                                            >
                                                <option value="all">💰 All Rates</option>
                                                <option value="high">🔥 High (16%+)</option>
                                                <option value="medium">📈 Medium (8-15%)</option>
                                                <option value="low">📉 Low (&lt;8%)</option>
                                            </select>

                                            {/* Redemption Period Filter */}
                                            <select
                                                value={stateRedemptionFilter}
                                                onChange={(e) => setStateRedemptionFilter(e.target.value)}
                                                className="px-3 py-2 rounded-xl text-xs font-bold border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer transition-all"
                                            >
                                                <option value="all">⏱️ All Redemption</option>
                                                <option value="short">⚡ Short (≤6 mo)</option>
                                                <option value="medium">📅 Medium (6-24 mo)</option>
                                                <option value="long">🗓️ Long (2+ yr)</option>
                                            </select>

                                            {/* Clear Filters */}
                                            {(stateRateFilter !== 'all' || stateRedemptionFilter !== 'all') && (
                                                <button
                                                    onClick={() => { setStateRateFilter('all'); setStateRedemptionFilter('all'); }}
                                                    className="px-3 py-2 rounded-xl text-xs font-bold border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-all"
                                                >✕ Clear</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-8">
                                        <div className="text-center">
                                            <div className="text-3xl font-display font-black text-purple-600">
                                                {Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Lien').length}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Lien States</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-display font-black text-indigo-600">
                                                {Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Deed').length}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Deed States</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-display font-black text-green-600">24%</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Highest Rate (IA)</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-display font-black text-amber-600">4 yr</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Longest Redemption</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Lien vs Deed Explanation */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-purple-100 rounded-2xl p-5 border border-purple-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black">L</div>
                                            <h3 className="font-display font-black text-purple-900">Tax Lien States</h3>
                                        </div>
                                        <p className="text-sm text-purple-800">In lien states, you purchase a <strong>lien certificate</strong> on the property. The owner has a redemption period to pay back the lien plus interest. If they don't redeem, you can foreclose.</p>
                                        <div className="mt-3 text-xs font-bold text-purple-600">✓ Earn interest on investment • ✓ Lower risk • ✓ Passive income potential</div>
                                    </div>
                                    <div className="bg-indigo-100 rounded-2xl p-5 border border-indigo-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">D</div>
                                            <h3 className="font-display font-black text-indigo-900">Tax Deed States</h3>
                                        </div>
                                        <p className="text-sm text-indigo-800">In deed states, you bid on the <strong>property itself</strong> at auction. Winning bidder receives title to the property (subject to redemption period in some states).</p>
                                        <div className="mt-3 text-xs font-bold text-indigo-600">✓ Direct property ownership • ✓ Faster acquisition • ✓ Property value upside</div>
                                    </div>
                                </div>

                                {/* Full State Table */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-display font-black text-lg text-slate-900">
                                                {stateInfoFilter === 'all' ? 'All 50 States + DC' : stateInfoFilter === 'lien' ? 'Tax Lien States' : 'Tax Deed States'}
                                            </h3>
                                            <p className="text-xs text-slate-400">Click column headers to sort • Click row to view details</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    const filteredEntries = Object.entries(STATE_AUCTION_INFO)
                                                        .filter(([, info]) => (stateInfoFilter === 'all' || info.type.toLowerCase() === stateInfoFilter) && matchesRateFilter(info) && matchesRedemptionFilter(info));
                                                    const text = filteredEntries.map(([abbr, info]) =>
                                                        `${STATE_NAMES[abbr] || abbr}\t${info.type}\t${info.interestRate}\t${info.redemptionPeriod}\t${info.notes}`
                                                    ).join('\n');
                                                    await copyToClipboard(`State\tType\tInterest Rate\tRedemption\tNotes\n${text}`);
                                                    alert('Copied to clipboard!');
                                                }}
                                                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-display font-black text-xs hover:bg-slate-50 transition-all flex items-center gap-2"
                                            >
                                                <span>📋</span> Copy
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const data = Object.entries(STATE_AUCTION_INFO)
                                                        .filter(([, info]) => (stateInfoFilter === 'all' || info.type.toLowerCase() === stateInfoFilter) && matchesRateFilter(info) && matchesRedemptionFilter(info))
                                                        .map(([abbr, info]) => ({
                                                            state: STATE_NAMES[abbr] || abbr,
                                                            abbr,
                                                            type: info.type,
                                                            interestRate: info.interestRate,
                                                            redemptionPeriod: info.redemptionPeriod,
                                                            notes: info.notes
                                                        }));
                                                    const columns = [
                                                        { key: 'state', label: 'State' },
                                                        { key: 'type', label: 'Type' },
                                                        { key: 'interestRate', label: 'Interest Rate' },
                                                        { key: 'redemptionPeriod', label: 'Redemption Period' },
                                                        { key: 'notes', label: 'Notes' }
                                                    ];
                                                    const filename = stateInfoFilter === 'all' ? 'state_auction_info' : `${stateInfoFilter}_states_info`;
                                                    exportToCSV(data, columns, filename);
                                                }}
                                                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-display font-black text-xs shadow-lg hover:bg-black transition-all flex items-center gap-2"
                                            >
                                                <span>📥</span> Export CSV
                                            </button>
                                        </div>
                                    </div>
                                    <div className="overflow-auto max-h-[500px]">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 sticky top-0 z-10">
                                                <tr className="text-slate-400 text-[9px] font-black tracking-widest uppercase">
                                                    <th
                                                        className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                                                        onClick={() => setStateInfoSort(prev => ({ col: 'state', asc: prev.col === 'state' ? !prev.asc : true }))}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            State {stateInfoSort.col === 'state' && <span className="text-blue-600">{stateInfoSort.asc ? '↑' : '↓'}</span>}
                                                        </div>
                                                    </th>
                                                    <th
                                                        className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                                                        onClick={() => setStateInfoSort(prev => ({ col: 'type', asc: prev.col === 'type' ? !prev.asc : true }))}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Type {stateInfoSort.col === 'type' && <span className="text-blue-600">{stateInfoSort.asc ? '↑' : '↓'}</span>}
                                                        </div>
                                                    </th>
                                                    <th
                                                        className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                                                        onClick={() => setStateInfoSort(prev => ({ col: 'rate', asc: prev.col === 'rate' ? !prev.asc : false }))}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Interest Rate {stateInfoSort.col === 'rate' && <span className="text-blue-600">{stateInfoSort.asc ? '↑' : '↓'}</span>}
                                                        </div>
                                                    </th>
                                                    <th
                                                        className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                                                        onClick={() => setStateInfoSort(prev => ({ col: 'redemption', asc: prev.col === 'redemption' ? !prev.asc : true }))}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Redemption {stateInfoSort.col === 'redemption' && <span className="text-blue-600">{stateInfoSort.asc ? '↑' : '↓'}</span>}
                                                        </div>
                                                    </th>
                                                    <th className="px-5 py-4 text-left">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {Object.entries(STATE_AUCTION_INFO)
                                                    .filter(([, info]) => (stateInfoFilter === 'all' || info.type.toLowerCase() === stateInfoFilter) && matchesRateFilter(info) && matchesRedemptionFilter(info))
                                                    .sort((a, b) => {
                                                        const [abbrA, infoA] = a;
                                                        const [abbrB, infoB] = b;
                                                        let cmp = 0;
                                                        if (stateInfoSort.col === 'state') {
                                                            cmp = (STATE_NAMES[abbrA] || abbrA).localeCompare(STATE_NAMES[abbrB] || abbrB);
                                                        } else if (stateInfoSort.col === 'type') {
                                                            cmp = infoA.type.localeCompare(infoB.type);
                                                        } else if (stateInfoSort.col === 'rate') {
                                                            // Extract numeric rate for comparison
                                                            const getRateNum = (r) => {
                                                                const match = r.match(/(\d+)/);
                                                                return match ? parseInt(match[1]) : 0;
                                                            };
                                                            cmp = getRateNum(infoA.interestRate) - getRateNum(infoB.interestRate);
                                                        } else if (stateInfoSort.col === 'redemption') {
                                                            cmp = infoA.redemptionPeriod.localeCompare(infoB.redemptionPeriod);
                                                        }
                                                        return stateInfoSort.asc ? cmp : -cmp;
                                                    })
                                                    .map(([abbr, info]) => (
                                                        <tr
                                                            key={abbr}
                                                            className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${info.type === 'Lien' ? 'hover:bg-purple-50/50' : 'hover:bg-indigo-50/50'}`}
                                                            onClick={() => setSelectedStateInfo({ abbr, ...info })}
                                                        >
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-display font-black text-slate-900">{STATE_NAMES[abbr] || abbr}</span>
                                                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{abbr}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black text-white ${info.type === 'Lien' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                                                    {info.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`font-mono text-xs font-bold ${info.interestRate !== 'N/A' ? 'text-green-700 bg-green-50 px-2 py-1 rounded' : 'text-slate-400'}`}>
                                                                    {info.interestRate}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 font-medium text-slate-600">{info.redemptionPeriod}</td>
                                                            <td className="px-5 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={info.notes}>{info.notes || '—'}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* State Verification Modal */}
                                {selectedStateInfo && (
                                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedStateInfo(null)}>
                                        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                            {/* Header with state name and type */}
                                            <div className={`p-6 ${selectedStateInfo.type === 'Lien' ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700' : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                                            <span className="text-4xl font-display font-black text-white">{selectedStateInfo.abbr}</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
                                                                {selectedStateInfo.type === 'Lien' ? '🔒 Tax Lien State' : '📜 Tax Deed State'}
                                                            </div>
                                                            <h2 className="text-4xl font-display font-black text-white tracking-tight">
                                                                {STATE_NAMES[selectedStateInfo.abbr] || selectedStateInfo.abbr}
                                                            </h2>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedStateInfo(null)}
                                                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Main content area */}
                                            <div className="flex-1 overflow-auto p-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                                    {/* Left side - State info cards */}
                                                    <div className="space-y-4">
                                                        {/* Key metrics */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                                                                <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">💰 Interest Rate</div>
                                                                <div className="text-2xl font-display font-black text-green-900">{selectedStateInfo.interestRate}</div>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
                                                                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">⏱️ Redemption</div>
                                                                <div className="text-2xl font-display font-black text-blue-900">{selectedStateInfo.redemptionPeriod}</div>
                                                            </div>
                                                        </div>

                                                        {/* Notes */}
                                                        {selectedStateInfo.notes && (
                                                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                                                                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">📋 Key Information</div>
                                                                <div className="text-sm font-medium text-amber-900">{selectedStateInfo.notes}</div>
                                                            </div>
                                                        )}

                                                        {/* Process explanation */}
                                                        <div className={`rounded-2xl p-4 ${selectedStateInfo.type === 'Lien' ? 'bg-purple-50 border border-purple-200' : 'bg-indigo-50 border border-indigo-200'}`}>
                                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${selectedStateInfo.type === 'Lien' ? 'text-purple-600' : 'text-indigo-600'}`}>
                                                                {selectedStateInfo.type === 'Lien' ? '🔒 Tax Lien Process' : '📜 Tax Deed Process'}
                                                            </div>
                                                            <div className={`text-sm ${selectedStateInfo.type === 'Lien' ? 'text-purple-900' : 'text-indigo-900'}`}>
                                                                {selectedStateInfo.type === 'Lien'
                                                                    ? 'Investors purchase lien certificates at auction. Property owners can redeem by paying delinquent taxes plus accrued interest. If property remains unredeemed after the redemption period, the investor may initiate foreclosure proceedings to obtain the property.'
                                                                    : 'The government forecloses on properties with delinquent taxes and auctions them directly to investors. Winning bidders receive a deed to the property. Some states allow a brief redemption period before the sale is finalized.'}
                                                            </div>
                                                        </div>

                                                        {/* State map placeholder with SVG */}
                                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                                                            <div className="relative">
                                                                {STATE_PATHS[selectedStateInfo.abbr] ? (
                                                                    <svg viewBox="0 0 960 600" className="w-full h-40 mx-auto">
                                                                        <path
                                                                            d={STATE_PATHS[selectedStateInfo.abbr]}
                                                                            className={`${selectedStateInfo.type === 'Lien' ? 'fill-purple-400' : 'fill-indigo-400'} stroke-white stroke-2`}
                                                                            style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}
                                                                        />
                                                                    </svg>
                                                                ) : (
                                                                    <div className="w-full h-40 flex items-center justify-center">
                                                                        <span className="text-7xl font-display font-black text-slate-200">{selectedStateInfo.abbr}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                                                {STATE_NAMES[selectedStateInfo.abbr]} Territory
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right side - County list */}
                                                    <div className="space-y-4">
                                                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                                                <div>
                                                                    <h3 className="font-display font-black text-slate-900">📍 Counties</h3>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                                        {(COUNTIES[selectedStateInfo.abbr] || []).length} counties available
                                                                    </p>
                                                                </div>
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white ${selectedStateInfo.type === 'Lien' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                                                    {selectedStateInfo.type}
                                                                </span>
                                                            </div>
                                                            <div className="max-h-[300px] overflow-auto">
                                                                {(COUNTIES[selectedStateInfo.abbr] || []).length > 0 ? (
                                                                    <div className="divide-y divide-slate-50">
                                                                        {COUNTIES[selectedStateInfo.abbr].slice(0, 15).map((county, idx) => (
                                                                            <div key={idx} className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div
                                                                                        className="w-2 h-8 rounded-full"
                                                                                        style={{ backgroundColor: TIERS[county[6]]?.color || '#94a3b8' }}
                                                                                    ></div>
                                                                                    <div>
                                                                                        <div className="font-bold text-slate-900 text-sm">{county[0]}</div>
                                                                                        <div className="text-[10px] text-slate-400">
                                                                                            Pop: {(county[1] || 0).toLocaleString()} • Income: ${(county[2] || 0).toLocaleString()}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span
                                                                                        className="px-2 py-1 rounded-lg text-[9px] font-black text-white"
                                                                                        style={{ backgroundColor: TIERS[county[6]]?.color || '#94a3b8' }}
                                                                                    >
                                                                                        T{county[6]}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {(COUNTIES[selectedStateInfo.abbr] || []).length > 15 && (
                                                                            <div className="px-4 py-3 text-center text-xs text-slate-400 font-bold">
                                                                                + {(COUNTIES[selectedStateInfo.abbr] || []).length - 15} more counties
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-8 text-center">
                                                                        <div className="text-4xl mb-2">🗺️</div>
                                                                        <div className="text-sm font-bold text-slate-400">County data not yet available</div>
                                                                        <div className="text-xs text-slate-300">Data coming soon</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Quick stats */}
                                                        {(COUNTIES[selectedStateInfo.abbr] || []).length > 0 && (
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                                                                    <div className="text-lg font-display font-black text-emerald-700">
                                                                        {COUNTIES[selectedStateInfo.abbr].filter(c => c[6] === 1).length}
                                                                    </div>
                                                                    <div className="text-[8px] font-bold text-emerald-500 uppercase">Tier 1</div>
                                                                </div>
                                                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                                                                    <div className="text-lg font-display font-black text-blue-700">
                                                                        {COUNTIES[selectedStateInfo.abbr].filter(c => c[6] === 2).length}
                                                                    </div>
                                                                    <div className="text-[8px] font-bold text-blue-500 uppercase">Tier 2</div>
                                                                </div>
                                                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                                                                    <div className="text-lg font-display font-black text-amber-700">
                                                                        {COUNTIES[selectedStateInfo.abbr].filter(c => c[6] >= 3).length}
                                                                    </div>
                                                                    <div className="text-[8px] font-bold text-amber-500 uppercase">Tier 3+</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer with actions */}
                                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                                                <div className="text-[10px] text-slate-400 font-medium">
                                                    Source: THE GUIDE TO FINANCIAL INDEPENDENCE - Tax Reference
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setSelectedStateInfo(null)}
                                                        className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-display font-black text-sm hover:bg-slate-50 transition-colors"
                                                    >
                                                        Close
                                                    </button>
                                                    {(COUNTIES[selectedStateInfo.abbr] || []).length > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedState(selectedStateInfo.abbr);
                                                                setSelectedStateInfo(null);
                                                                setView('list');
                                                            }}
                                                            className={`px-6 py-3 rounded-xl font-display font-black text-sm text-white shadow-lg transition-all hover:scale-105 ${selectedStateInfo.type === 'Lien' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                                        >
                                                            🔍 Explore {COUNTIES[selectedStateInfo.abbr].length} Counties
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : view === 'guide' ? (
                            /* User Guide View */
                            <div className="space-y-6 overflow-auto max-h-[calc(100vh-180px)]">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50">
                                    <h2 className="text-3xl font-display font-black text-slate-900 mb-2">📚 User Guide</h2>
                                    <p className="text-slate-500">Master the platform for optimal tax lien/deed investment research</p>
                                </div>

                                {/* Quick Start */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="bg-blue-50 px-5 py-4 border-b border-blue-100">
                                        <h3 className="font-display font-black text-lg text-blue-900">🚀 Quick Start</h3>
                                    </div>
                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                <div className="text-2xl mb-2">📍</div>
                                                <div className="font-bold text-slate-900 mb-1">Map Explorer</div>
                                                <div className="text-xs text-slate-500">Visual overview - click any state to see counties</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                <div className="text-2xl mb-2">📊</div>
                                                <div className="font-bold text-slate-900 mb-1">State Database</div>
                                                <div className="text-xs text-slate-500">Analyze counties by tier, export CSV data</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                <div className="text-2xl mb-2">🏛️</div>
                                                <div className="font-bold text-slate-900 mb-1">State Info</div>
                                                <div className="text-xs text-slate-500">Lien vs Deed reference, interest rates</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tier System */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="bg-amber-50 px-5 py-4 border-b border-amber-100">
                                        <h3 className="font-display font-black text-lg text-amber-900">🎯 Understanding Tiers</h3>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-3">
                                            {[
                                                { tier: 1, name: 'Prime Investor', action: '✅ PURSUE', color: 'bg-emerald-500', desc: 'Population 500k+, high income, strong growth' },
                                                { tier: 2, name: 'Strong/Selective', action: '✅ PURSUE', color: 'bg-blue-500', desc: 'Pop 200k-500k, solid fundamentals' },
                                                { tier: 3, name: 'Opportunistic', action: '✅ CAUTIOUS', color: 'bg-amber-500', desc: 'Pop 100k-200k, stable regional markets' },
                                                { tier: 4, name: 'Speculative', action: '⚠️ CAUTION', color: 'bg-orange-500', desc: 'Limited liquidity, higher exit risk' },
                                                { tier: 5, name: 'Capital Trap', action: '❌ AVOID', color: 'bg-red-500', desc: 'Population decline, weak fundamentals' },
                                            ].map(t => (
                                                <div key={t.tier} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div className={`w-10 h-10 ${t.color} rounded-xl flex items-center justify-center text-white font-black`}>T{t.tier}</div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-slate-900">{t.name}</div>
                                                        <div className="text-xs text-slate-500">{t.desc}</div>
                                                    </div>
                                                    <div className="text-sm font-bold">{t.action}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Data Gathering Workflow */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="bg-purple-50 px-5 py-4 border-b border-purple-100">
                                        <h3 className="font-display font-black text-lg text-purple-900">📥 Optimal Data Gathering</h3>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-black shrink-0">1</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Go to State Info → Filter by "Lien"</div>
                                                    <div className="text-xs text-slate-500">Focus on states with interest-bearing investments</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-black shrink-0">2</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Sort by Interest Rate (descending)</div>
                                                    <div className="text-xs text-slate-500">Find highest return states (Iowa: 24%, Georgia: 20%)</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-black shrink-0">3</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Click state → View county preview</div>
                                                    <div className="text-xs text-slate-500">See tier breakdown and top counties instantly</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-black shrink-0">4</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Click "Explore Counties" → Filter Tier 1-2</div>
                                                    <div className="text-xs text-slate-500">Focus on prime opportunities with best liquidity</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-black shrink-0">5</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Export to CSV for offline analysis</div>
                                                    <div className="text-xs text-slate-500">Download data for due diligence and tracking</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pro Tips */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="bg-green-50 px-5 py-4 border-b border-green-100">
                                        <h3 className="font-display font-black text-lg text-green-900">💡 Pro Tips</h3>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { tip: 'Tier 1-2 counties have population > 100k', icon: '👥' },
                                            { tip: '26 Lien states offer 8-24% interest rates', icon: '💰' },
                                            { tip: '25 Deed states offer direct property acquisition', icon: '🏠' },
                                            { tip: 'Iowa has highest rate at 24%', icon: '🏆' },
                                            { tip: 'Wyoming has longest redemption (4 years)', icon: '⏰' },
                                            { tip: 'Click column headers to sort data', icon: '📊' },
                                        ].map((p, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-green-50/50 border border-green-100">
                                                <span className="text-xl">{p.icon}</span>
                                                <span className="text-sm font-medium text-green-900">{p.tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Key Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white">
                                        <div className="text-3xl font-display font-black">26</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Lien States</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-5 text-white">
                                        <div className="text-3xl font-display font-black">25</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Deed States</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white">
                                        <div className="text-3xl font-display font-black">{totalCounties}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Total Counties</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                                        <div className="text-3xl font-display font-black">{totalT123}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Prime Counties</div>
                                    </div>
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
                </div >

                {/* Footer */}
                < footer className="h-9 bg-white/50 backdrop-blur-sm border-t border-slate-200/40 flex items-center justify-between px-8 shrink-0" >
                    <div className="text-[8px] font-black text-slate-400 tracking-widest uppercase">System Core v4.2.19</div>
                    <div className="flex gap-4 items-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Data: Census • Zillow • Regrid</span>
                        <div className="h-3 w-px bg-slate-200"></div>
                        <span className="text-[8px] font-black text-blue-600 uppercase animate-pulse">Encrypted</span>
                    </div>
                </footer >
            </main >
        </div >
    );
}
