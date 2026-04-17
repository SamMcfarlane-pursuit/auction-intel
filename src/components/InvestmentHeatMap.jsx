import React, { useState, useMemo } from 'react';

// Investment scoring criteria
const SCORING_FACTORS = {
    interestRate: { weight: 0.35, label: 'Interest Rate', icon: '📈' },
    redemptionPeriod: { weight: 0.25, label: 'Redemption Period', icon: '⏱️' },
    saleType: { weight: 0.15, label: 'Sale Type', icon: '🏷️' },
    marketActivity: { weight: 0.15, label: 'Market Activity', icon: '🔥' },
    accessibility: { weight: 0.10, label: 'Accessibility', icon: '🌐' },
};

// State investment data with scores (0-100)
const STATE_INVESTMENT_SCORES = {
    // === TOP TIER (80-100) - Best Investment States ===
    'IA': { score: 98, interestRate: 24, redemption: '1yr 9mo', type: 'Lien', highlight: '🏆 HIGHEST RATE IN US' },
    'GA': { score: 92, interestRate: 20, redemption: '1 year', type: 'Lien', highlight: '40% at escalation' },
    'FL': { score: 88, interestRate: 18, redemption: '2 years', type: 'Lien', highlight: 'Online auctions' },
    'MD': { score: 87, interestRate: 22, redemption: '6 months', type: 'Lien', highlight: 'Short redemption' },
    'TX': { score: 85, interestRate: 25, redemption: '6mo-2yr', type: 'Deed', highlight: 'Monthly sales' },
    'IL': { score: 84, interestRate: 18, redemption: '2-3 years', type: 'Lien', highlight: 'Large inventory' },
    'NJ': { score: 83, interestRate: 18, redemption: '2 years', type: 'Lien', highlight: 'Bid down system' },

    // === HIGH TIER (60-79) ===
    'AZ': { score: 78, interestRate: 16, redemption: '3 years', type: 'Lien', highlight: 'Bid down from 16%' },
    'CO': { score: 76, interestRate: 14, redemption: '3 years', type: 'Lien', highlight: 'Fed rate + 9%' },
    'IN': { score: 75, interestRate: 15, redemption: '1 year', type: 'Lien', highlight: '10-15% graduated' },
    'MI': { score: 74, interestRate: 0, redemption: '0', type: 'Deed', highlight: 'Clean title deeds' },
    'MS': { score: 73, interestRate: 18, redemption: '2 years', type: 'Lien', highlight: 'Lower competition' },
    'SC': { score: 72, interestRate: 8, redemption: '1 year', type: 'Lien', highlight: 'Penalty system' },
    'NE': { score: 71, interestRate: 14, redemption: '3 years', type: 'Lien', highlight: 'Solid returns' },
    'AL': { score: 70, interestRate: 12, redemption: '3 years', type: 'Lien', highlight: 'Steady market' },
    'OH': { score: 69, interestRate: 0, redemption: '0', type: 'Deed', highlight: 'Year-round sales' },
    'PA': { score: 68, interestRate: 0, redemption: '0', type: 'Deed', highlight: 'Frequent sales' },
    'NC': { score: 67, interestRate: 0, redemption: '0', type: 'Deed', highlight: 'Upset bid process' },

    // === MEDIUM TIER (40-59) ===
    'MO': { score: 58, interestRate: 10, redemption: '2 years', type: 'Lien', highlight: '10% annual' },
    'KY': { score: 57, interestRate: 12, redemption: '1 year', type: 'Lien', highlight: 'Moderate returns' },
    'LA': { score: 56, interestRate: 12, redemption: '3 years', type: 'Lien', highlight: 'Reformed 2024' },
    'MT': { score: 55, interestRate: 10, redemption: '2-3 years', type: 'Lien', highlight: 'Rural focus' },
    'WV': { score: 54, interestRate: 12, redemption: '1 year', type: 'Lien', highlight: 'Low competition' },
    'WY': { score: 53, interestRate: 18, redemption: '4 years', type: 'Lien', highlight: 'Long redemption' },
    'SD': { score: 52, interestRate: 12, redemption: '3-4 years', type: 'Lien', highlight: 'Max 10% bid' },
    'OK': { score: 51, interestRate: 8, redemption: '2 years', type: 'Lien', highlight: 'Lower rate' },
    'RI': { score: 50, interestRate: 12, redemption: '1 year', type: 'Lien', highlight: '10% + 1%/mo' },
    'VT': { score: 49, interestRate: 12, redemption: '1 year', type: 'Lien', highlight: 'Town based' },
    'CT': { score: 48, interestRate: 18, redemption: '6 months', type: 'Lien', highlight: 'Short cycle' },
    'NH': { score: 47, interestRate: 18, redemption: '2 years', type: 'Lien', highlight: 'Town sales' },
    'MA': { score: 46, interestRate: 16, redemption: 'Varies', type: 'Lien', highlight: "Collector's deed" },
    'DC': { score: 45, interestRate: 18, redemption: '6 months', type: 'Lien', highlight: 'DC Government' },
    'NY': { score: 44, interestRate: 0, redemption: '2-4 years', type: 'Deed', highlight: 'High prices' },
    'CA': { score: 43, interestRate: 0, redemption: '5yr pre-sale', type: 'Deed', highlight: 'Long wait' },
    'VA': { score: 42, interestRate: 0, redemption: 'Varies', type: 'Deed', highlight: 'By locality' },
    'NV': { score: 41, interestRate: 0, redemption: '2yr before deed', type: 'Deed', highlight: 'Pre-deed process' },
    'TN': { score: 40, interestRate: 0, redemption: '1 year', type: 'Deed', highlight: 'Standard deed' },

    // === LOWER TIER (20-39) ===
    'WA': { score: 38, interestRate: 0, redemption: '0', type: 'Deed', highlight: 'No redemption' },
    'OR': { score: 37, interestRate: 0, redemption: '2yr before deed', type: 'Deed', highlight: 'Pre-deed wait' },
    'MN': { score: 36, interestRate: 0, redemption: '0', type: 'Deed', highlight: 'County forfeiture' },
    'WI': { score: 35, interestRate: 0, redemption: '2yr to county', type: 'Deed', highlight: 'County holds' },
    'ID': { score: 34, interestRate: 0, redemption: '3yr before deed', type: 'Deed', highlight: 'Long wait' },
    'UT': { score: 33, interestRate: 0, redemption: '4yr before deed', type: 'Deed', highlight: 'Very long wait' },
    'KS': { score: 32, interestRate: 0, redemption: 'Court', type: 'Deed', highlight: 'Court process' },
    'AR': { score: 31, interestRate: 0, redemption: '30 days', type: 'Deed', highlight: 'Quick deed' },
    'NM': { score: 30, interestRate: 0, redemption: '120 days IRS', type: 'Deed', highlight: 'IRS only' },
    'ME': { score: 29, interestRate: 0, redemption: '18 months', type: 'Deed', highlight: 'Town based' },
    'DE': { score: 28, interestRate: 15, redemption: '60 days', type: 'Deed', highlight: '15% penalty' },
    'HI': { score: 27, interestRate: 0, redemption: '1 year', type: 'Deed', highlight: 'High prices' },
    'AK': { score: 26, interestRate: 0, redemption: '1 year', type: 'Deed', highlight: 'Remote' },
    'ND': { score: 25, interestRate: 9, redemption: '4 years', type: 'Deed', highlight: 'Max 9% bid down' },
};

// Color gradient for heat map
const getHeatColor = (score) => {
    if (score >= 85) return { bg: '#22c55e', text: '#fff', label: 'Excellent' };
    if (score >= 70) return { bg: '#84cc16', text: '#fff', label: 'Very Good' };
    if (score >= 55) return { bg: '#eab308', text: '#000', label: 'Good' };
    if (score >= 40) return { bg: '#f97316', text: '#fff', label: 'Moderate' };
    if (score >= 25) return { bg: '#ef4444', text: '#fff', label: 'Low' };
    return { bg: '#94a3b8', text: '#fff', label: 'Very Low' };
};

export function InvestmentHeatMap({ onStateSelect, currentView = 'score' }) {
    const [heatView, setHeatView] = useState(currentView); // 'score', 'rate', 'type'
    const [hoveredState, setHoveredState] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'lien', 'deed'

    const filteredStates = useMemo(() => {
        return Object.entries(STATE_INVESTMENT_SCORES).filter(([abbr, data]) => {
            if (selectedFilter === 'all') return true;
            return selectedFilter === 'lien' ? data.type === 'Lien' : data.type === 'Deed';
        });
    }, [selectedFilter]);

    const topStates = useMemo(() => {
        return [...filteredStates].sort((a, b) => b[1].score - a[1].score).slice(0, 10);
    }, [filteredStates]);

    return (
        <div className="bg-slate-950 rounded-md shadow-none border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-mono md:text-xl font-semibold text-slate-100 tracking-tighter mb-1 uppercase">
                            Market Opportunity Heat Map
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Jurisdictions ranked by aggregate investment signal • HIGHER = ALPHA_TARGET
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'lien', 'deed'].map(f => (
                            <button key={f}
                                onClick={() => setSelectedFilter(f)}
                                className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${selectedFilter === f
                                    ? 'bg-blue-600 text-white shadow-none'
                                    : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                                    }`}>
                                {f === 'all' ? 'All_Feeds' : `${f}_Only`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    <span className="text-slate-400">SIGNAL_RTG</span>
                    {[
                        { min: 85, label: 'Excellent', color: '#22c55e' },
                        { min: 70, label: 'Strong', color: '#84cc16' },
                        { min: 55, label: 'Moderate', color: '#eab308' },
                        { min: 40, label: 'Low', color: '#f97316' },
                        { min: 25, label: 'Weak', color: '#ef4444' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }}></div>
                            <span className="text-slate-500">{item.min}+ {item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top 10 List */}
                    <div>
                        <h3 className="font-mono font-semibold text-lg text-slate-100 mb-4 flex items-center gap-2">
                            <span>🏆</span> Top 10 Investment States
                            <span className="text-xs font-normal text-slate-400">
                                ({selectedFilter === 'all' ? 'All' : selectedFilter === 'lien' ? 'Lien Only' : 'Deed Only'})
                            </span>
                        </h3>
                        <div className="space-y-2">
                            {topStates.map(([abbr, data], idx) => {
                                const color = getHeatColor(data.score);
                                return (
                                    <div key={abbr}
                                        onClick={() => onStateSelect?.(abbr)}
                                        onMouseEnter={() => setHoveredState(abbr)}
                                        onMouseLeave={() => setHoveredState(null)}
                                        className={`flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-all border-l-2 ${hoveredState === abbr ? 'bg-slate-900 border-blue-500 scale-[1.01]' : 'bg-slate-950 border-transparent hover:bg-slate-900'
                                            }`}>
                                        <div className="w-8 h-8 rounded-sm flex items-center justify-center font-mono font-bold text-sm bg-slate-900 border border-slate-800"
                                            style={{ color: color.bg }}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-slate-100 uppercase tracking-tighter">{abbr}</span>
                                                <span className={`px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${data.type === 'Lien' ? 'bg-blue-900/30 text-blue-400 border border-blue-900/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                                                    }`}>
                                                    {data.type}
                                                </span>
                                                {data.interestRate > 0 && (
                                                    <span className="text-[10px] font-bold text-emerald-500 font-mono">+{data.interestRate}%</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-widest">{data.highlight}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-semibold text-lg" style={{ color: color.bg }}>{data.score}</div>
                                            <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{color.label}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Full State Grid */}
                    <div>
                        <h3 className="font-mono font-semibold text-lg text-slate-100 mb-4">
                            📊 All States by Score
                        </h3>
                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {[...filteredStates]
                                .sort((a, b) => b[1].score - a[1].score)
                                .map(([abbr, data]) => {
                                    const color = getHeatColor(data.score);
                                    return (
                                        <div key={abbr}
                                            onClick={() => onStateSelect?.(abbr)}
                                            onMouseEnter={() => setHoveredState(abbr)}
                                            onMouseLeave={() => setHoveredState(null)}
                                            className={`aspect-square rounded-sm flex flex-col items-center justify-center cursor-pointer transition-all ${hoveredState === abbr ? 'scale-110 shadow-none z-10 brightness-110' : 'opacity-80 hover:opacity-100'
                                                }`}
                                            style={{ background: color.bg, color: color.text }}
                                            title={`${abbr}: ${data.score} - ${data.highlight}`}>
                                            <div className="font-mono font-bold text-xs">{abbr}</div>
                                            <div className="text-[9px] font-mono tracking-tighter">{data.score}</div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* Scoring Methodology */}
                <div className="mt-8 p-5 bg-slate-900 rounded-md border border-blue-100">
                    <h4 className="font-mono font-semibold text-slate-100 mb-3 flex items-center gap-2">
                        <span>📐</span> Score Methodology
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(SCORING_FACTORS).map(([key, factor]) => (
                            <div key={key} className="bg-slate-950/60 rounded-sm p-3 text-center">
                                <div className="text-xl mb-1">{factor.icon}</div>
                                <div className="text-xs font-bold text-slate-300">{factor.label}</div>
                                <div className="text-lg font-semibold text-blue-600">{(factor.weight * 100).toFixed(0)}%</div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                        💡 Higher interest rates, shorter redemption periods, and better accessibility increase the score.
                        Lien states generally score higher due to guaranteed returns.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default InvestmentHeatMap;
