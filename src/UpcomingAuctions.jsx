import React, { useState, useMemo } from 'react';
import { UPCOMING_AUCTIONS, STATE_NAMES, STATE_AUCTION_INFO } from './data';

// Calculate days until sale
const getDaysUntil = (dateStr) => {
    const saleDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((saleDate - today) / (1000 * 60 * 60 * 24));
};

// Format date nicely
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

// Get badge color based on sale type
const getSaleTypeColor = (type) => {
    switch (type) {
        case 'Tax Lien': return { bg: '#7c3aed', text: 'white' };
        case 'Tax Deed': return { bg: '#2563eb', text: 'white' };
        case 'Tax Sale': return { bg: '#059669', text: 'white' };
        case 'Tax Defaulted': return { bg: '#0891b2', text: 'white' };
        case 'Tax Foreclosure': return { bg: '#dc2626', text: 'white' };
        case 'Sheriff Sale': return { bg: '#ea580c', text: 'white' };
        default: return { bg: '#6b7280', text: 'white' };
    }
};

// Get urgency info
const getUrgencyInfo = (days) => {
    if (days < 0) return { label: 'PASSED', color: '#94a3b8', bg: 'bg-slate-100', pulse: false };
    if (days === 0) return { label: 'TODAY', color: '#dc2626', bg: 'bg-red-50', pulse: true };
    if (days <= 3) return { label: `${days}d LEFT`, color: '#dc2626', bg: 'bg-red-50', pulse: true };
    if (days <= 7) return { label: `${days} days`, color: '#ea580c', bg: 'bg-orange-50', pulse: false };
    if (days <= 14) return { label: `${days} days`, color: '#f59e0b', bg: 'bg-amber-50', pulse: false };
    if (days <= 30) return { label: `${days} days`, color: '#059669', bg: 'bg-emerald-50', pulse: false };
    return { label: `${days} days`, color: '#2563eb', bg: 'bg-blue-50', pulse: false };
};

export default function UpcomingAuctions({ auctions, onSelectCounty, onSelectState }) {
    const [stateFilter, setStateFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'cards'
    const [expandedStates, setExpandedStates] = useState({});

    // Map backend data to frontend format if provided
    const displayAuctions = useMemo(() => {
        if (!auctions || auctions.length === 0) return UPCOMING_AUCTIONS;

        return auctions.map(a => ({
            id: a.id,
            state: a.state,
            county: a.county,
            saleType: a.sale_type,
            saleDate: a.sale_date,
            propertyCount: a.property_count,
            deposit: a.deposit_required,
            registrationDeadline: a.registration_deadline,
            platform: a.platform,
            notes: a.notes,
            sourceUrl: a.platform_url
        }));
    }, [auctions]);

    // Available states and types for filters
    const states = useMemo(() =>
        [...new Set(displayAuctions.map(a => a.state))].sort(),
        [displayAuctions]
    );
    const saleTypes = useMemo(() =>
        [...new Set(displayAuctions.map(a => a.saleType))],
        [displayAuctions]
    );

    // Filter auctions (exclude past)
    const filteredAuctions = useMemo(() => {
        let result = [...displayAuctions].filter(a => getDaysUntil(a.saleDate) >= 0);

        if (stateFilter !== 'all') {
            result = result.filter(a => a.state === stateFilter);
        }
        if (typeFilter !== 'all') {
            result = result.filter(a => a.saleType === typeFilter);
        }

        result.sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));
        return result;
    }, [displayAuctions, stateFilter, typeFilter]);

    // Group by state
    const groupedByState = useMemo(() => {
        const groups = {};
        filteredAuctions.forEach(a => {
            if (!groups[a.state]) groups[a.state] = [];
            groups[a.state].push(a);
        });
        return Object.entries(groups).sort((a, b) => {
            const aNext = new Date(a[1][0].saleDate);
            const bNext = new Date(b[1][0].saleDate);
            return aNext - bNext;
        });
    }, [filteredAuctions]);

    // Summary stats
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const monthEnd = new Date(today);
        monthEnd.setDate(monthEnd.getDate() + 30);

        const thisWeek = filteredAuctions.filter(a => {
            const d = new Date(a.saleDate);
            return d >= today && d <= weekEnd;
        }).length;

        const thisMonth = filteredAuctions.filter(a => {
            const d = new Date(a.saleDate);
            return d >= today && d <= monthEnd;
        }).length;

        const totalProperties = filteredAuctions.reduce((sum, a) => sum + a.propertyCount, 0);

        return { thisWeek, thisMonth, total: filteredAuctions.length, totalProperties };
    }, [filteredAuctions]);

    const toggleState = (st) => {
        setExpandedStates(prev => ({ ...prev, [st]: !prev[st] }));
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-display font-black text-gray-900 tracking-tight">Upcoming Auctions</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Live auction sales across all states</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('grouped')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grouped' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            📋 By State
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'cards' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            🃏 Cards
                        </button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-black text-red-700">{stats.thisWeek} This Week</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                        <span className="text-xs font-black text-amber-700">{stats.thisMonth} This Month</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="text-xs font-black text-blue-700">{stats.total} Total</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-xs font-black text-emerald-700">{stats.totalProperties.toLocaleString()} Properties</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    <select
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                        <option value="all">All States ({states.length})</option>
                        {states.map(s => (
                            <option key={s} value={s}>{STATE_NAMES[s] || s}</option>
                        ))}
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                        <option value="all">All Types</option>
                        {saleTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Auction Content */}
            <div className="flex-1 overflow-auto pb-4">
                {viewMode === 'grouped' ? (
                    /* ═══ STATE-GROUPED VIEW ═══ */
                    <div className="space-y-3">
                        {groupedByState.map(([state, auctions]) => {
                            const stateInfo = STATE_AUCTION_INFO[state];
                            const isExpanded = expandedStates[state] !== false; // default expanded
                            const nextSale = auctions[0];
                            const nextDays = getDaysUntil(nextSale.saleDate);
                            const urgency = getUrgencyInfo(nextDays);
                            const totalProps = auctions.reduce((s, a) => s + a.propertyCount, 0);

                            return (
                                <div key={state} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    {/* State Header */}
                                    <div
                                        onClick={() => toggleState(state)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${urgency.bg}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-display font-black text-sm">
                                                    {state}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-display font-black text-slate-900">{STATE_NAMES[state]}</span>
                                                        {stateInfo && (
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white ${stateInfo.type === 'Lien' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                                                {stateInfo.type}
                                                            </span>
                                                        )}
                                                        {urgency.pulse && (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white rounded text-[9px] font-black">
                                                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                                                {urgency.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-xs text-slate-500">{auctions.length} {auctions.length === 1 ? 'sale' : 'sales'}</span>
                                                        <span className="text-xs text-slate-400">•</span>
                                                        <span className="text-xs text-slate-500">{totalProps.toLocaleString()} properties</span>
                                                        {stateInfo && stateInfo.interestRate !== 'N/A' && (
                                                            <>
                                                                <span className="text-xs text-slate-400">•</span>
                                                                <span className="text-xs font-bold text-emerald-600">{stateInfo.interestRate}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {!urgency.pulse && (
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: `${urgency.color}15`, color: urgency.color }}>
                                                        Next: {urgency.label}
                                                    </span>
                                                )}
                                                <span className={`text-slate-400 transition-transform text-lg ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auctions List */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-50">
                                            {auctions.map(auction => {
                                                const days = getDaysUntil(auction.saleDate);
                                                const typeColor = getSaleTypeColor(auction.saleType);
                                                const aUrgency = getUrgencyInfo(days);

                                                return (
                                                    <div
                                                        key={auction.id}
                                                        onClick={() => {
                                                            onSelectState?.(auction.state);
                                                            onSelectCounty?.(auction.county);
                                                        }}
                                                        className="p-4 border-b border-gray-50 last:border-0 hover:bg-blue-50/30 cursor-pointer transition-all flex items-center justify-between gap-4"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-slate-900">{auction.county} County</span>
                                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: typeColor.bg }}>
                                                                    {auction.saleType}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                                <span className="font-semibold text-blue-600">{formatDate(auction.saleDate)}</span>
                                                                <span>•</span>
                                                                <span>{auction.propertyCount}+ properties</span>
                                                                <span>•</span>
                                                                <span>Deposit: ${auction.deposit.toLocaleString()}</span>
                                                                <span>•</span>
                                                                <span>{auction.platform}</span>
                                                            </div>
                                                            {auction.notes && (
                                                                <p className="text-[11px] text-slate-400 mt-1 truncate">{auction.notes}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span
                                                                className={`px-2.5 py-1 rounded-lg text-xs font-black text-white ${aUrgency.pulse ? 'animate-pulse' : ''}`}
                                                                style={{ backgroundColor: aUrgency.color }}
                                                            >
                                                                {aUrgency.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ═══ CARD VIEW ═══ */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredAuctions.map(auction => {
                            const days = getDaysUntil(auction.saleDate);
                            const typeColor = getSaleTypeColor(auction.saleType);
                            const urgency = getUrgencyInfo(days);
                            const stateInfo = STATE_AUCTION_INFO[auction.state];

                            return (
                                <div
                                    key={auction.id}
                                    className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group ${urgency.pulse ? 'border-red-300' : 'border-gray-100 hover:border-blue-200'
                                        }`}
                                    onClick={() => {
                                        onSelectState?.(auction.state);
                                        onSelectCounty?.(auction.county);
                                    }}
                                >
                                    {/* Top Banner */}
                                    <div className="relative h-20 bg-gradient-to-br from-slate-800 to-slate-900 flex items-end justify-between p-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-display font-black text-white text-lg">{auction.state}</span>
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: typeColor.bg }}>
                                                {auction.saleType}
                                            </span>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded text-[9px] font-black text-white ${urgency.pulse ? 'animate-pulse' : ''}`}
                                            style={{ backgroundColor: urgency.color }}
                                        >
                                            {urgency.label}
                                        </span>
                                        {urgency.pulse && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                                <span className="text-[8px] font-black text-red-300 uppercase">Live Soon</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="text-base font-bold text-gray-900 mb-1">
                                            {auction.county} County
                                        </h3>
                                        <div className="text-blue-600 font-semibold text-sm mb-2">
                                            {formatDate(auction.saleDate)}
                                        </div>

                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold">
                                                {auction.propertyCount >= 1000
                                                    ? `${(auction.propertyCount / 1000).toFixed(1)}K+ Props`
                                                    : `${auction.propertyCount}+ Props`
                                                }
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                                ${auction.deposit.toLocaleString()} dep.
                                            </span>
                                        </div>

                                        {auction.notes && (
                                            <p className="text-xs text-gray-400 italic line-clamp-2">{auction.notes}</p>
                                        )}

                                        {stateInfo && stateInfo.interestRate !== 'N/A' && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
                                                <span className="text-gray-500">Interest Rate</span>
                                                <span className="font-bold text-emerald-600">{stateInfo.interestRate}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {filteredAuctions.length === 0 && (
                    <div className="flex-1 flex items-center justify-center py-16">
                        <div className="text-center text-gray-400">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-lg font-medium">No upcoming auctions match your filters</p>
                            <button
                                onClick={() => { setStateFilter('all'); setTypeFilter('all'); }}
                                className="mt-3 text-blue-600 hover:underline font-medium"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
