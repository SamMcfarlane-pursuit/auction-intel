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
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900 tracking-tighter mb-1">
                            🗺️ Investment Heat Map
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500">
                            States ranked by investment opportunity score • Higher = Better returns
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'lien', 'deed'].map(f => (
                            <button key={f}
                                onClick={() => setSelectedFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${selectedFilter === f
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}>
                                {f === 'all' ? 'All States' : `${f} States`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-bold text-slate-500">Score Legend:</span>
                    {[
                        { min: 85, label: 'Excellent', color: '#22c55e' },
                        { min: 70, label: 'Very Good', color: '#84cc16' },
                        { min: 55, label: 'Good', color: '#eab308' },
                        { min: 40, label: 'Moderate', color: '#f97316' },
                        { min: 25, label: 'Low', color: '#ef4444' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded" style={{ background: item.color }}></div>
                            <span className="text-slate-600">{item.min}+ {item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top 10 List */}
                    <div>
                        <h3 className="font-display font-black text-lg text-slate-900 mb-4 flex items-center gap-2">
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
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${hoveredState === abbr ? 'bg-blue-50 scale-[1.02]' : 'bg-slate-50 hover:bg-slate-100'
                                            }`}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                                            style={{ background: color.bg, color: color.text }}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{abbr}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${data.type === 'Lien' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {data.type}
                                                </span>
                                                {data.interestRate > 0 && (
                                                    <span className="text-xs font-bold text-emerald-600">{data.interestRate}%</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate">{data.highlight}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-lg" style={{ color: color.bg }}>{data.score}</div>
                                            <div className="text-[9px] text-slate-400 uppercase">{color.label}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Full State Grid */}
                    <div>
                        <h3 className="font-display font-black text-lg text-slate-900 mb-4">
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
                                            className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${hoveredState === abbr ? 'scale-110 shadow-lg z-10' : 'hover:scale-105'
                                                }`}
                                            style={{ background: color.bg, color: color.text }}
                                            title={`${abbr}: ${data.score} - ${data.highlight}`}>
                                            <div className="font-black text-sm">{abbr}</div>
                                            <div className="text-[10px] opacity-80">{data.score}</div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* Scoring Methodology */}
                <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <h4 className="font-display font-black text-slate-900 mb-3 flex items-center gap-2">
                        <span>📐</span> Score Methodology
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(SCORING_FACTORS).map(([key, factor]) => (
                            <div key={key} className="bg-white/60 rounded-xl p-3 text-center">
                                <div className="text-xl mb-1">{factor.icon}</div>
                                <div className="text-xs font-bold text-slate-700">{factor.label}</div>
                                <div className="text-lg font-black text-blue-600">{(factor.weight * 100).toFixed(0)}%</div>
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
