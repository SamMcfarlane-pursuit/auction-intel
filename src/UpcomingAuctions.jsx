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
        case 'Foreclosure': return { bg: '#dc2626', text: 'white' };
        default: return { bg: '#6b7280', text: 'white' };
    }
};

// Get urgency color based on days until sale
const getUrgencyColor = (days) => {
    if (days < 0) return '#6b7280';
    if (days <= 7) return '#dc2626';
    if (days <= 30) return '#f59e0b';
    if (days <= 60) return '#059669';
    return '#2563eb';
};

export default function UpcomingAuctions({ onSelectCounty, onSelectState }) {
    const [stateFilter, setStateFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    // Available states and types for filters
    const states = useMemo(() =>
        [...new Set(UPCOMING_AUCTIONS.map(a => a.state))].sort(),
        []
    );
    const saleTypes = useMemo(() =>
        [...new Set(UPCOMING_AUCTIONS.map(a => a.saleType))],
        []
    );

    // Filter and sort auctions
    const filteredAuctions = useMemo(() => {
        let result = [...UPCOMING_AUCTIONS];

        if (stateFilter !== 'all') {
            result = result.filter(a => a.state === stateFilter);
        }
        if (typeFilter !== 'all') {
            result = result.filter(a => a.saleType === typeFilter);
        }

        // Sort
        switch (sortBy) {
            case 'date':
                result.sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));
                break;
            case 'properties':
                result.sort((a, b) => b.propertyCount - a.propertyCount);
                break;
            case 'deposit':
                result.sort((a, b) => a.deposit - b.deposit);
                break;
            default:
                break;
        }

        return result;
    }, [stateFilter, typeFilter, sortBy]);

    // Stats
    const totalProperties = useMemo(() =>
        filteredAuctions.reduce((sum, a) => sum + a.propertyCount, 0),
        [filteredAuctions]
    );

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Upcoming Auction Sales</h2>
                        <p className="text-sm text-gray-500">
                            {filteredAuctions.length} sales • {totalProperties.toLocaleString()} properties
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={stateFilter}
                            onChange={(e) => setStateFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="all">All States</option>
                            {states.map(s => (
                                <option key={s} value={s}>{STATE_NAMES[s] || s}</option>
                            ))}
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="all">All Types</option>
                            {saleTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="properties">Sort by Properties</option>
                            <option value="deposit">Sort by Deposit</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Auction Cards Grid */}
            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-4">
                    {filteredAuctions.map(auction => {
                        const days = getDaysUntil(auction.saleDate);
                        const typeColor = getSaleTypeColor(auction.saleType);
                        const urgencyColor = getUrgencyColor(days);
                        const stateInfo = STATE_AUCTION_INFO[auction.state];

                        return (
                            <div
                                key={auction.id}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                                onClick={() => {
                                    onSelectState?.(auction.state);
                                    onSelectCounty?.(auction.county);
                                }}
                            >
                                {/* Property Count Banner */}
                                <div className="relative h-24 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                    <span
                                        className="absolute top-3 left-3 px-3 py-1 rounded-lg text-sm font-semibold text-white"
                                        style={{ backgroundColor: '#f97316' }}
                                    >
                                        {auction.propertyCount >= 1000
                                            ? `Over ${Math.floor(auction.propertyCount / 1000)},000 Properties`
                                            : `${auction.propertyCount}+ Properties`
                                        }
                                    </span>
                                    <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-white/70 text-xs">
                                        <span>{auction.platform}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        {auction.county} County, {auction.state}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-3">{auction.saleType}</p>

                                    {/* Sale Date */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-blue-600 font-semibold">
                                            Sale Date: {formatDate(auction.saleDate)}
                                        </span>
                                    </div>

                                    {/* Countdown */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span
                                            className="px-2 py-0.5 rounded text-xs font-bold text-white"
                                            style={{ backgroundColor: urgencyColor }}
                                        >
                                            {days < 0 ? 'PASSED' : days === 0 ? 'TODAY' : `${days} days`}
                                        </span>
                                        {stateInfo && (
                                            <span
                                                className="px-2 py-0.5 rounded text-xs font-semibold"
                                                style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                                            >
                                                {stateInfo.type}
                                            </span>
                                        )}
                                    </div>

                                    {/* Deposit & Registration */}
                                    <div className="text-sm text-gray-500 space-y-1">
                                        <div>
                                            <span className="font-medium">Deposit:</span>{' '}
                                            <span className="text-gray-900">${auction.deposit.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Register by:</span>{' '}
                                            <span className="text-gray-900">{formatDate(auction.registrationDeadline)}</span>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {auction.notes && (
                                        <p className="mt-2 text-xs text-gray-400 italic">{auction.notes}</p>
                                    )}

                                    {/* State Interest Rate */}
                                    {stateInfo && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
                                            <span className="text-gray-500">Interest Rate</span>
                                            <span className="font-semibold text-green-600">{stateInfo.interestRate}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Empty State */}
            {filteredAuctions.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <p className="text-lg">No auctions match your filters</p>
                        <button
                            onClick={() => { setStateFilter('all'); setTypeFilter('all'); }}
                            className="mt-2 text-violet-600 hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
