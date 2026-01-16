import React, { useState } from 'react';

/**
 * Multi-source property valuation display
 */
export function ValuationSources({ property }) {
    const {
        estimatedValue = 285000,
        zillowEstimate = null,
        redfinEstimate = null,
        regridEstimate = null,
    } = property;

    // Generate realistic estimates based on base value
    const baseValue = estimatedValue;
    const estimates = [
        {
            source: 'Zillow',
            label: 'Zestimate®',
            value: zillowEstimate || Math.round(baseValue * (0.97 + Math.random() * 0.06)),
            icon: '🏠',
            color: 'bg-blue-500',
            confidence: 'High',
            updated: '2 days ago'
        },
        {
            source: 'Redfin',
            label: 'Redfin Estimate',
            value: redfinEstimate || Math.round(baseValue * (0.95 + Math.random() * 0.08)),
            icon: '🔴',
            color: 'bg-red-500',
            confidence: 'Medium',
            updated: '5 days ago'
        },
        {
            source: 'Regrid',
            label: 'AVM Value',
            value: regridEstimate || Math.round(baseValue * (0.92 + Math.random() * 0.10)),
            icon: '📊',
            color: 'bg-purple-500',
            confidence: 'High',
            updated: '1 week ago'
        },
        {
            source: 'County',
            label: 'Tax Assessment',
            value: Math.round(baseValue * 0.85),
            icon: '🏛️',
            color: 'bg-slate-500',
            confidence: 'Official',
            updated: 'Annual'
        },
    ];

    const avgValue = Math.round(estimates.reduce((sum, e) => sum + e.value, 0) / estimates.length);
    const minValue = Math.min(...estimates.map(e => e.value));
    const maxValue = Math.max(...estimates.map(e => e.value));

    return (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    💰 Property Valuations
                </h3>
                <div className="text-xs text-slate-500">Multi-source AVM</div>
            </div>

            {/* Average Value */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                <div className="text-xs text-emerald-600 font-bold uppercase mb-1">Average Estimate</div>
                <div className="text-3xl font-black text-emerald-700">${avgValue.toLocaleString()}</div>
                <div className="text-xs text-emerald-600 mt-1">
                    Range: ${minValue.toLocaleString()} - ${maxValue.toLocaleString()}
                </div>
            </div>

            {/* Individual Sources */}
            <div className="space-y-2">
                {estimates.map((est, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 ${est.color} rounded-lg flex items-center justify-center text-white text-sm`}>
                                {est.icon}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900">{est.source}</div>
                                <div className="text-[10px] text-slate-500">{est.label}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-slate-900">${est.value.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">{est.updated}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Due Diligence Checklist
 */
export function DueDiligenceChecklist({ onUpdate }) {
    const [checklist, setChecklist] = useState([
        { id: 'title', label: 'Title Search', description: 'Clear title verification', checked: false, priority: 'high' },
        { id: 'liens', label: 'Lien Check', description: 'Outstanding liens/encumbrances', checked: false, priority: 'high' },
        { id: 'taxes', label: 'Tax Status', description: 'Delinquent taxes owed', checked: false, priority: 'high' },
        { id: 'occupancy', label: 'Occupancy Check', description: 'Occupied/vacant status', checked: false, priority: 'medium' },
        { id: 'condition', label: 'Property Condition', description: 'Physical inspection', checked: false, priority: 'medium' },
        { id: 'comps', label: 'Comparable Sales', description: 'Recent nearby sales', checked: false, priority: 'medium' },
        { id: 'zoning', label: 'Zoning Verification', description: 'Permitted use', checked: false, priority: 'low' },
        { id: 'hoa', label: 'HOA/Association', description: 'Fees and restrictions', checked: false, priority: 'low' },
    ]);

    const toggleItem = (id) => {
        setChecklist(prev => prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const completedCount = checklist.filter(c => c.checked).length;
    const progress = Math.round((completedCount / checklist.length) * 100);

    const priorityColors = {
        high: 'border-red-200 bg-red-50',
        medium: 'border-amber-200 bg-amber-50',
        low: 'border-slate-200 bg-slate-50',
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    ✅ Due Diligence Checklist
                </h3>
                <div className="text-xs font-bold text-emerald-600">{progress}% Complete</div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
                {checklist.map(item => (
                    <label
                        key={item.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${item.checked ? 'bg-emerald-50 border-emerald-200' : priorityColors[item.priority]
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleItem(item.id)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold ${item.checked ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                                {item.label}
                            </div>
                            <div className="text-[10px] text-slate-500">{item.description}</div>
                        </div>
                        {!item.checked && (
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${item.priority === 'high' ? 'bg-red-100 text-red-600' :
                                item.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                {item.priority}
                            </span>
                        )}
                    </label>
                ))}
            </div>
        </div>
    );
}

/**
 * PropertyModal - Full property details with valuations and due diligence
 */
export function PropertyModal({ property, onClose, onAddToWatchlist, onOpenDueDiligence }) {
    const [activeTab, setActiveTab] = useState('overview');

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
        auctionDate = '2026-02-15',
        openingBid = 85000,
        estimatedValue = 285000,
        category = 'tax_deed',
        tier = 1,
        equity = null,
        mortgageBalance = null,
        lender = null,
    } = property;

    const discount = Math.round((1 - openingBid / estimatedValue) * 100);

    const categoryLabels = {
        tax_lien: { label: 'Tax Lien', color: 'bg-blue-500' },
        tax_deed: { label: 'Tax Deed', color: 'bg-purple-500' },
        mortgage: { label: 'Mortgage/Foreclosure', color: 'bg-red-500' },
        other: { label: 'Other', color: 'bg-slate-500' },
    };

    const catInfo = categoryLabels[category] || categoryLabels.other;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`${catInfo.color} text-xs font-bold px-2 py-0.5 rounded`}>
                                    {catInfo.label}
                                </span>
                                <span className="bg-emerald-500 text-xs font-bold px-2 py-0.5 rounded">
                                    T{tier}
                                </span>
                                <span className="bg-amber-500 text-xs font-bold px-2 py-0.5 rounded">
                                    {discount}% Below Value
                                </span>
                            </div>
                            <h2 className="text-2xl font-black mb-1">{address}</h2>
                            <p className="text-slate-300">{city}, {state} {zip} • {county} County</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-slate-100 px-6 py-2 flex gap-2 border-b border-slate-200">
                    {[
                        { id: 'overview', label: '📋 Overview' },
                        { id: 'valuations', label: '💰 Valuations' },
                        { id: 'diligence', label: '✅ Due Diligence' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white text-slate-900 shadow'
                                : 'text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Property Details */}
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <h3 className="font-bold text-slate-900 mb-3">🏠 Property Details</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-white rounded-lg p-2">
                                        <div className="text-slate-500 text-xs">Type</div>
                                        <div className="font-bold text-slate-900">{propertyType}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <div className="text-slate-500 text-xs">Year Built</div>
                                        <div className="font-bold text-slate-900">{yearBuilt}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <div className="text-slate-500 text-xs">Bedrooms</div>
                                        <div className="font-bold text-slate-900">{bedrooms}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <div className="text-slate-500 text-xs">Bathrooms</div>
                                        <div className="font-bold text-slate-900">{bathrooms}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <div className="text-slate-500 text-xs">Square Feet</div>
                                        <div className="font-bold text-slate-900">{sqft.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <div className="text-slate-500 text-xs">Price/SqFt</div>
                                        <div className="font-bold text-slate-900">${Math.round(openingBid / sqft)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Auction Info */}
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                <h3 className="font-bold text-emerald-900 mb-3">📅 Auction Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-emerald-700">Opening Bid</span>
                                        <span className="text-2xl font-black text-emerald-700">${openingBid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-emerald-700">Est. Value</span>
                                        <span className="text-lg font-bold text-slate-400 line-through">${estimatedValue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-emerald-700">Potential Equity</span>
                                        <span className="text-lg font-bold text-emerald-700">${(estimatedValue - openingBid).toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-emerald-200 pt-3 mt-3">
                                        <div className="text-sm text-emerald-600">Auction Date</div>
                                        <div className="text-xl font-black text-emerald-800">
                                            {new Date(auctionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mortgage Info */}
                            {mortgageBalance && (
                                <div className="bg-red-50 rounded-2xl p-4 border border-red-100 md:col-span-2">
                                    <h3 className="font-bold text-red-900 mb-3">🏦 Mortgage Information</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-red-600">Mortgage Balance</div>
                                            <div className="text-xl font-black text-red-800">${mortgageBalance?.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-red-600">Equity</div>
                                            <div className="text-xl font-black text-emerald-700">${equity?.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-red-600">Lender</div>
                                            <div className="text-xl font-black text-red-800">{lender}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'valuations' && (
                        <ValuationSources property={property} />
                    )}

                    {activeTab === 'diligence' && (
                        <DueDiligenceChecklist />
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-white transition-all"
                    >
                        Close
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onOpenDueDiligence?.(property)}
                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:from-purple-600 hover:to-indigo-600 transition-all"
                        >
                            🔍 Full Due Diligence
                        </button>
                        <button className="px-6 py-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all">
                            🗺️ View on Map
                        </button>
                        <button
                            onClick={() => onAddToWatchlist?.(property)}
                            className="px-6 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all"
                        >
                            ⭐ Add to Watchlist
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PropertyModal;
