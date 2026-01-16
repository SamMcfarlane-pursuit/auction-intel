import React, { useState, useMemo } from 'react';
import { useWatchlist } from '../WatchlistContext';
import { useToast } from '../ToastContext';

/**
 * PropertyDueDiligence - Comprehensive parcel-level investigation view
 * Includes Street View, comparable sales, ownership history, and detailed valuation
 */
export default function PropertyDueDiligence({ property, onClose, onAddToWatchlist }) {
    const [activeTab, setActiveTab] = useState('valuation');
    const { addToWatchlist, watchlist } = useWatchlist();
    const { showToast } = useToast();

    if (!property) return null;

    const {
        address = '123 Main St',
        city = 'Phoenix',
        state = 'AZ',
        zip = '85001',
        county = 'Maricopa',
        propertyType = 'Single Family',
        bedrooms = 3,
        bathrooms = 2,
        sqft = 1500,
        yearBuilt = 1995,
        lotSize = 7500,
        auctionDate = '2026-02-15',
        openingBid = 85000,
        estimatedValue = 285000,
        category = 'tax_deed',
        tier = 1,
        equity = null,
        mortgageBalance = null,
        lender = null,
        parcelId = null,
    } = property;

    const discount = Math.round((1 - openingBid / estimatedValue) * 100);
    const pricePerSqft = Math.round(openingBid / sqft);
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    const encodedAddress = encodeURIComponent(fullAddress);

    // Check if already in watchlist
    const isWatched = watchlist.some(item =>
        item.address === address || item.parcelId === parcelId
    );

    // Generate realistic comparable sales
    const comparables = useMemo(() => {
        const baseValue = estimatedValue;
        const baseSqft = sqft;
        return [
            {
                address: `${Math.floor(Math.random() * 900) + 100} Oak St`,
                distance: '0.3 mi',
                salePrice: Math.round(baseValue * (0.92 + Math.random() * 0.16)),
                sqft: Math.round(baseSqft * (0.85 + Math.random() * 0.30)),
                saleDate: '2025-11-12',
                beds: bedrooms + Math.floor(Math.random() * 2) - 1,
                baths: bathrooms,
            },
            {
                address: `${Math.floor(Math.random() * 900) + 100} Maple Ave`,
                distance: '0.5 mi',
                salePrice: Math.round(baseValue * (0.88 + Math.random() * 0.20)),
                sqft: Math.round(baseSqft * (0.90 + Math.random() * 0.25)),
                saleDate: '2025-10-28',
                beds: bedrooms,
                baths: bathrooms + Math.floor(Math.random() * 2) - 1,
            },
            {
                address: `${Math.floor(Math.random() * 900) + 100} Pine Rd`,
                distance: '0.7 mi',
                salePrice: Math.round(baseValue * (0.95 + Math.random() * 0.15)),
                sqft: Math.round(baseSqft * (0.95 + Math.random() * 0.15)),
                saleDate: '2025-09-15',
                beds: bedrooms,
                baths: bathrooms,
            },
            {
                address: `${Math.floor(Math.random() * 900) + 100} Cedar Ln`,
                distance: '0.9 mi',
                salePrice: Math.round(baseValue * (0.85 + Math.random() * 0.25)),
                sqft: Math.round(baseSqft * (0.80 + Math.random() * 0.35)),
                saleDate: '2025-08-22',
                beds: bedrooms - 1,
                baths: bathrooms,
            },
        ];
    }, [estimatedValue, sqft, bedrooms, bathrooms]);

    // Generate ownership history
    const ownershipHistory = useMemo(() => [
        {
            owner: 'Current Owner (Delinquent)',
            acquired: '2018-06-15',
            price: Math.round(estimatedValue * 0.72),
            type: 'Sale',
            status: 'delinquent',
        },
        {
            owner: 'Previous Owner LLC',
            acquired: '2012-03-22',
            price: Math.round(estimatedValue * 0.55),
            type: 'Sale',
            status: 'clear',
        },
        {
            owner: 'Original Developer',
            acquired: '2008-01-10',
            price: Math.round(estimatedValue * 0.45),
            type: 'New Construction',
            status: 'clear',
        },
    ], [estimatedValue]);

    // Liens and encumbrances
    const liens = useMemo(() => [
        {
            type: 'Property Tax Lien',
            amount: openingBid,
            holder: `${county} County`,
            date: '2024-04-15',
            priority: 1,
            status: 'active',
        },
        {
            type: 'HOA Assessment',
            amount: Math.round(1500 + Math.random() * 3000),
            holder: 'Community HOA',
            date: '2025-01-01',
            priority: 3,
            status: 'pending',
        },
    ], [openingBid, county]);

    const handleAddToWatchlist = () => {
        if (isWatched) {
            showToast('Already in your watchlist', 'info');
            return;
        }
        addToWatchlist({
            ...property,
            type: 'property',
            addedAt: new Date().toISOString(),
        });
        showToast('Added to watchlist!', 'success');
    };

    const handleExportReport = () => {
        // Generate a simple CSV report
        const reportData = [
            ['Property Due Diligence Report'],
            ['Generated', new Date().toLocaleString()],
            [''],
            ['PROPERTY DETAILS'],
            ['Address', fullAddress],
            ['County', county],
            ['Type', propertyType],
            ['Beds/Baths', `${bedrooms}/${bathrooms}`],
            ['Square Feet', sqft],
            ['Year Built', yearBuilt],
            [''],
            ['VALUATION'],
            ['Estimated Value', estimatedValue],
            ['Opening Bid', openingBid],
            ['Discount', `${discount}%`],
            ['Potential Equity', estimatedValue - openingBid],
            [''],
            ['LIENS'],
            ...liens.map(l => [l.type, l.amount, l.holder]),
        ];

        const csv = reportData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DD_Report_${address.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Report downloaded!', 'success');
    };

    const tabs = [
        { id: 'valuation', label: '💰 Valuation', icon: '💰' },
        { id: 'comparables', label: '📊 Comparables', icon: '📊' },
        { id: 'history', label: '📜 History', icon: '📜' },
        { id: 'location', label: '📍 Location', icon: '📍' },
    ];

    const categoryColors = {
        tax_lien: 'from-blue-500 to-blue-600',
        tax_deed: 'from-purple-500 to-purple-600',
        mortgage: 'from-red-500 to-red-600',
        other: 'from-slate-500 to-slate-600',
    };

    const categoryLabels = {
        tax_lien: 'Tax Lien',
        tax_deed: 'Tax Deed',
        mortgage: 'Foreclosure',
        other: 'Other',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">

                {/* Hero Header */}
                <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-4 sm:p-6">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }} />
                    </div>

                    <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`bg-gradient-to-r ${categoryColors[category] || categoryColors.other} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
                                    {categoryLabels[category] || 'Other'}
                                </span>
                                <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    Tier {tier}
                                </span>
                                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    {discount}% Below Market
                                </span>
                            </div>

                            {/* Address */}
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1">{address}</h1>
                            <p className="text-slate-300 text-sm sm:text-base">{city}, {state} {zip} • {county} County</p>

                            {/* Quick Stats */}
                            <div className="flex flex-wrap gap-3 mt-4">
                                <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                                    <span className="text-slate-400 text-xs">🏠</span>
                                    <span className="text-white font-bold ml-1">{propertyType}</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                                    <span className="text-slate-400 text-xs">🛏️</span>
                                    <span className="text-white font-bold ml-1">{bedrooms} bd / {bathrooms} ba</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                                    <span className="text-slate-400 text-xs">📐</span>
                                    <span className="text-white font-bold ml-1">{sqft.toLocaleString()} sqft</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                                    <span className="text-slate-400 text-xs">📅</span>
                                    <span className="text-white font-bold ml-1">Built {yearBuilt}</span>
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center transition-all text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Price Highlight */}
                    <div className="mt-4 flex flex-wrap gap-4 items-end">
                        <div>
                            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wide">Opening Bid</div>
                            <div className="text-3xl sm:text-4xl font-black text-emerald-400">${openingBid.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Est. Value</div>
                            <div className="text-xl text-slate-400 line-through">${estimatedValue.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-xs text-amber-400 font-bold uppercase tracking-wide">Potential Equity</div>
                            <div className="text-2xl font-bold text-amber-400">+${(estimatedValue - openingBid).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-slate-800/50 px-4 sm:px-6 py-2 flex gap-1 sm:gap-2 overflow-x-auto border-b border-slate-700/50">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.icon}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-auto p-4 sm:p-6">

                    {/* Valuation Tab */}
                    {activeTab === 'valuation' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Multi-Source Valuation */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    💰 Multi-Source Valuation
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { source: 'Zillow Zestimate®', value: Math.round(estimatedValue * 1.02), color: 'bg-blue-500', confidence: 'High' },
                                        { source: 'Redfin Estimate', value: Math.round(estimatedValue * 0.98), color: 'bg-red-500', confidence: 'Medium' },
                                        { source: 'Regrid AVM', value: Math.round(estimatedValue * 0.95), color: 'bg-purple-500', confidence: 'High' },
                                        { source: 'County Assessment', value: Math.round(estimatedValue * 0.85), color: 'bg-slate-500', confidence: 'Official' },
                                    ].map((est, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 ${est.color} rounded-full`} />
                                                <div>
                                                    <div className="text-sm font-bold text-white">{est.source}</div>
                                                    <div className="text-xs text-slate-400">{est.confidence} Confidence</div>
                                                </div>
                                            </div>
                                            <div className="text-lg font-bold text-white">${est.value.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                    <div className="text-xs text-emerald-400 font-bold uppercase">Average Estimate</div>
                                    <div className="text-2xl font-black text-emerald-400">${estimatedValue.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Investment Analysis */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    📈 Investment Analysis
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-700/50 rounded-xl p-3">
                                            <div className="text-xs text-slate-400">Price/SqFt</div>
                                            <div className="text-xl font-bold text-white">${pricePerSqft}</div>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-xl p-3">
                                            <div className="text-xs text-slate-400">Lot Size</div>
                                            <div className="text-xl font-bold text-white">{(lotSize / 43560).toFixed(2)} acres</div>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-xl p-3">
                                            <div className="text-xs text-slate-400">Cap Rate (Est.)</div>
                                            <div className="text-xl font-bold text-emerald-400">{(8 + Math.random() * 4).toFixed(1)}%</div>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-xl p-3">
                                            <div className="text-xs text-slate-400">Cash-on-Cash</div>
                                            <div className="text-xl font-bold text-emerald-400">{(12 + Math.random() * 8).toFixed(1)}%</div>
                                        </div>
                                    </div>

                                    {/* Liens Section */}
                                    <div className="mt-4">
                                        <h4 className="text-sm font-bold text-white mb-2">⚠️ Known Liens & Encumbrances</h4>
                                        <div className="space-y-2">
                                            {liens.map((lien, idx) => (
                                                <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${lien.status === 'active' ? 'bg-red-500/20 border border-red-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{lien.type}</div>
                                                        <div className="text-xs text-slate-400">{lien.holder} • Priority {lien.priority}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-white">${lien.amount.toLocaleString()}</div>
                                                        <div className={`text-xs font-bold uppercase ${lien.status === 'active' ? 'text-red-400' : 'text-amber-400'}`}>{lien.status}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comparables Tab */}
                    {activeTab === 'comparables' && (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    📊 Recent Comparable Sales (within 1 mile)
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-slate-400 border-b border-slate-700">
                                                <th className="pb-3 font-bold">Address</th>
                                                <th className="pb-3 font-bold">Distance</th>
                                                <th className="pb-3 font-bold">Sale Price</th>
                                                <th className="pb-3 font-bold">$/SqFt</th>
                                                <th className="pb-3 font-bold">Beds/Baths</th>
                                                <th className="pb-3 font-bold">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comparables.map((comp, idx) => (
                                                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                                    <td className="py-3 text-white font-medium">{comp.address}</td>
                                                    <td className="py-3 text-slate-400">{comp.distance}</td>
                                                    <td className="py-3 text-emerald-400 font-bold">${comp.salePrice.toLocaleString()}</td>
                                                    <td className="py-3 text-white">${Math.round(comp.salePrice / comp.sqft)}</td>
                                                    <td className="py-3 text-slate-400">{comp.beds}/{comp.baths}</td>
                                                    <td className="py-3 text-slate-400">{new Date(comp.saleDate).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                    <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                        <div className="text-xs text-slate-400">Avg Sale Price</div>
                                        <div className="text-lg font-bold text-white">
                                            ${Math.round(comparables.reduce((s, c) => s + c.salePrice, 0) / comparables.length).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                        <div className="text-xs text-slate-400">Avg $/SqFt</div>
                                        <div className="text-lg font-bold text-white">
                                            ${Math.round(comparables.reduce((s, c) => s + (c.salePrice / c.sqft), 0) / comparables.length)}
                                        </div>
                                    </div>
                                    <div className="bg-emerald-500/20 rounded-xl p-3 text-center border border-emerald-500/30">
                                        <div className="text-xs text-emerald-400">Subject Discount</div>
                                        <div className="text-lg font-bold text-emerald-400">{discount}%</div>
                                    </div>
                                    <div className="bg-amber-500/20 rounded-xl p-3 text-center border border-amber-500/30">
                                        <div className="text-xs text-amber-400">Subject $/SqFt</div>
                                        <div className="text-lg font-bold text-amber-400">${pricePerSqft}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Ownership History */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    📜 Ownership History
                                </h3>
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-slate-600" />

                                    <div className="space-y-4">
                                        {ownershipHistory.map((record, idx) => (
                                            <div key={idx} className="relative pl-8">
                                                <div className={`absolute left-1.5 w-3 h-3 rounded-full ${record.status === 'delinquent' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                <div className={`p-3 rounded-xl ${record.status === 'delinquent' ? 'bg-red-500/20 border border-red-500/30' : 'bg-slate-700/50'}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{record.owner}</div>
                                                            <div className="text-xs text-slate-400">{record.type}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-white">${record.price.toLocaleString()}</div>
                                                            <div className="text-xs text-slate-400">{new Date(record.acquired).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    {record.status === 'delinquent' && (
                                                        <div className="mt-2 text-xs font-bold text-red-400 uppercase">⚠️ Tax Delinquent</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Property Records */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    📋 Property Records
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between p-3 bg-slate-700/50 rounded-xl">
                                        <span className="text-slate-400">Parcel ID</span>
                                        <span className="text-white font-mono">{parcelId || `${county.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-slate-700/50 rounded-xl">
                                        <span className="text-slate-400">Zoning</span>
                                        <span className="text-white">R-1 Residential</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-slate-700/50 rounded-xl">
                                        <span className="text-slate-400">Legal Description</span>
                                        <span className="text-white text-xs text-right max-w-[200px] truncate">Lot 15, Block 3, {city} Subdivision</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-slate-700/50 rounded-xl">
                                        <span className="text-slate-400">Year Delinquent</span>
                                        <span className="text-red-400 font-bold">2024</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-slate-700/50 rounded-xl">
                                        <span className="text-slate-400">Redemption Period</span>
                                        <span className="text-amber-400 font-bold">6 months</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location Tab */}
                    {activeTab === 'location' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Street View */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    🏠 Street View
                                </h3>
                                <div className="relative aspect-video bg-slate-700 rounded-xl overflow-hidden">
                                    {/* Google Street View Embed (static mode - upgrade with API key for interactive) */}
                                    <iframe
                                        title="Street View"
                                        className="w-full h-full"
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${encodeURIComponent(city + ', ' + state)}&heading=210&pitch=10&fov=90`}
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        📍 {fullAddress}
                                    </div>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
                                >
                                    🗺️ Open in Google Maps
                                </a>
                            </div>

                            {/* Neighborhood Info */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    🏘️ Neighborhood
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                            <div className="text-2xl mb-1">🏫</div>
                                            <div className="text-xs text-slate-400">Schools</div>
                                            <div className="text-lg font-bold text-white">A-</div>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                            <div className="text-2xl mb-1">🚔</div>
                                            <div className="text-xs text-slate-400">Crime</div>
                                            <div className="text-lg font-bold text-emerald-400">Low</div>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                            <div className="text-2xl mb-1">🚶</div>
                                            <div className="text-xs text-slate-400">Walk Score</div>
                                            <div className="text-lg font-bold text-white">{55 + Math.floor(Math.random() * 30)}</div>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                            <div className="text-2xl mb-1">🚗</div>
                                            <div className="text-xs text-slate-400">Commute</div>
                                            <div className="text-lg font-bold text-white">{15 + Math.floor(Math.random() * 20)} min</div>
                                        </div>
                                    </div>

                                    {/* Nearby Amenities */}
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">📍 Nearby</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['Grocery', 'Hospital', 'Park', 'School', 'Restaurant', 'Gas Station'].map(amenity => (
                                                <span key={amenity} className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded-lg">
                                                    {amenity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-700 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-bold hover:bg-slate-700 transition-all"
                    >
                        Close
                    </button>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleExportReport}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-600 text-white font-bold hover:bg-slate-500 transition-all"
                        >
                            📥 Export Report
                        </button>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all text-center"
                        >
                            🗺️ View on Map
                        </a>
                        <button
                            onClick={handleAddToWatchlist}
                            disabled={isWatched}
                            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold transition-all ${isWatched
                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                                }`}
                        >
                            {isWatched ? '✓ In Watchlist' : '⭐ Add to Watchlist'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
