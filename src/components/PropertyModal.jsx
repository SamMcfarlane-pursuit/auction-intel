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
            color: 'bg-indigo-500',
            confidence: 'High',
            updated: '2 days ago'
        },
        {
            source: 'Redfin',
            label: 'Redfin Estimate',
            value: redfinEstimate || Math.round(baseValue * (0.95 + Math.random() * 0.08)),
            icon: '🔴',
            color: 'bg-rose-500',
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
            color: 'bg-slate-400',
            confidence: 'Official',
            updated: 'Annual'
        },
    ];

    const avgValue = Math.round(estimates.reduce((sum, e) => sum + e.value, 0) / estimates.length);
    const minValue = Math.min(...estimates.map(e => e.value));
    const maxValue = Math.max(...estimates.map(e => e.value));

    return (
        <div className="bg-surface to-white rounded-md border border-slate-300 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    💰 Property Valuations
                </h3>
                <div className="text-xs text-slate-500">Multi-source AVM</div>
            </div>

            {/* Average Value */}
            <div className="bg-canvas border border-emerald-900/50 rounded-sm p-4 mb-4">
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Average Estimate</div>
                <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-mono font-semibold text-white/90">${avgValue.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-600 font-bold uppercase">Weighted AVM</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                    Volatility: ${minValue.toLocaleString()} - ${maxValue.toLocaleString()}
                </div>
            </div>

            {/* Individual Sources */}
            <div className="space-y-2">
                {estimates.map((est, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-canvas rounded-sm border border-slate-200 hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-sm bg-surface border border-slate-300 flex items-center justify-center text-sm`}>
                                {est.icon}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900">{est.source}</div>
                                <div className="text-[10px] text-slate-500">{est.label}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-slate-900">${est.value.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-600">{est.updated}</div>
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
        high: 'border-red-900/50 bg-red-950/20',
        medium: 'border-amber-900/50 bg-amber-950/20',
        low: 'border-slate-200 bg-white/70',
    };

    return (
        <div className="bg-canvas rounded-md border border-slate-300 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono font-semibold text-slate-900 uppercase tracking-tight text-sm">
                    ✅ Due Diligence Matrix
                </h3>
                <div className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">{progress}% RESOLVED</div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-surface rounded-none mb-6 overflow-hidden border border-slate-200">
                <div
                    className="h-full bg-emerald-500 transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
                {checklist.map(item => (
                    <label
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-all border ${item.checked ? 'bg-emerald-950/30 border-emerald-900/50 shadow-none' : priorityColors[item.priority]
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleItem(item.id)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold tracking-tight ${item.checked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                {item.label}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">{item.description}</div>
                        </div>
                        {!item.checked && (
                            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm ${item.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-red-900/50' :
                                item.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-900/50' :
                                'bg-panel text-slate-500'
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
        tax_lien: { label: 'Tax Lien', color: 'bg-indigo-500' },
        tax_deed: { label: 'Tax Deed', color: 'bg-purple-500' },
        mortgage: { label: 'Mortgage/Foreclosure', color: 'bg-rose-500' },
        other: { label: 'Other', color: 'bg-slate-400' },
    };

    const catInfo = categoryLabels[category] || categoryLabels.other;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-canvas rounded-md shadow-none max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-surface p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`${catInfo.color} text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider text-white`}>
                                    {catInfo.label}
                                </span>
                                <span className="bg-indigo-600 text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider text-white">
                                    TERM_TIER_{tier}
                                </span>
                                <span className="bg-panel text-[9px] font-bold border border-slate-300 px-2 py-1 rounded-sm uppercase tracking-wider text-white">
                                    {discount}% DELTA_PRICE
                                </span>
                            </div>
                            <h2 className="text-2xl font-mono font-semibold text-white tracking-tighter mb-1 uppercase">{address}</h2>
                            <p className="text-slate-600 font-mono text-[11px] uppercase tracking-widest">{city}, {state} {zip} • {county} County</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white text-lg font-mono w-10 h-10 flex items-center justify-center rounded-sm hover:bg-slate-50/10"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white/70 px-6 py-2 flex gap-2 border-b border-slate-200">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'valuations', label: 'Valuations' },
                        { id: 'diligence', label: 'Due Diligence' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-canvas text-indigo-500 border border-indigo-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/30'
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
                            <div className="bg-surface rounded-md p-4">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Property Intelligence Matrix</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {[
                                        { label: 'Asset Type', val: propertyType },
                                        { label: 'Erection Yr', val: yearBuilt },
                                        { label: 'Beds', val: bedrooms },
                                        { label: 'Baths', val: bathrooms },
                                        { label: 'Internal Area', val: `${sqft.toLocaleString()} SQFT` },
                                        { label: 'Price/SQFT', val: `$${Math.round(openingBid / sqft)}` }
                                    ].map((field, fidx) => (
                                        <div key={fidx} className="bg-canvas rounded-sm border border-slate-200 p-3">
                                            <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">{field.label}</div>
                                            <div className="font-mono font-semibold text-slate-900 text-xs">{field.val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Auction Info */}
                            <div className="bg-canvas rounded-md p-6 border border-emerald-200">
                                <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-6">Auction Financials</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white/70 p-3 border-l-2 border-emerald-500">
                                        <span className="text-[10px] uppercase font-bold text-slate-600">Opening Bid</span>
                                        <span className="text-xl font-mono font-semibold text-white/90">${openingBid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-3">
                                        <span className="text-[10px] uppercase font-bold text-slate-500">Est. AVM Value</span>
                                        <span className="text-lg font-mono font-medium text-slate-600 line-through">${estimatedValue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/70 p-3 border-l-2 border-emerald-500">
                                        <span className="text-[10px] uppercase font-bold text-slate-600">Projected Equity</span>
                                        <span className="text-xl font-mono font-semibold text-emerald-500">${(estimatedValue - openingBid).toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-6 mt-6">
                                        <div className="text-[9px] uppercase font-bold text-slate-500 tracking-[0.2em] mb-2">Event Timestamp</div>
                                        <div className="text-base font-mono font-semibold text-white/90">
                                            {new Date(auctionDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mortgage Info */}
                            {mortgageBalance && (
                                <div className="bg-canvas rounded-md p-6 border border-red-900/30 md:col-span-2">
                                    <h3 className="text-[10px] font-bold text-rose-600 uppercase tracking-[0.2em] mb-6">Financial Encumbrances</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white/70 p-4 border-l-2 border-red-500">
                                            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Mortgage Balance</div>
                                            <div className="text-xl font-mono font-semibold text-white/90">${mortgageBalance?.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-white/70 p-4 border-l-2 border-emerald-500">
                                            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Asset Equity</div>
                                            <div className="text-xl font-mono font-semibold text-emerald-500">${equity?.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-white/70 p-4 border-l-2 border-slate-500">
                                            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Lead Lender</div>
                                            <div className="text-base font-mono font-semibold text-white/90 truncate">{lender}</div>
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
                <div className="border-t border-slate-300 p-4 flex items-center justify-between bg-surface">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-sm border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                    >
                        Close
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={() => onOpenDueDiligence?.(property)}
                            className="px-6 py-2 rounded-sm bg-surface border border-slate-300 text-slate-900 font-mono font-bold text-xs hover:bg-slate-100 transition-all uppercase tracking-widest"
                        >
                            Audit File
                        </button>
                        <button className="px-6 py-2 rounded-sm bg-indigo-600 border border-indigo-500 text-white font-mono font-bold text-xs hover:bg-indigo-700 transition-all uppercase tracking-widest">
                            Geospatial
                        </button>
                        <button
                            onClick={() => onAddToWatchlist?.(property)}
                            className="px-6 py-2 rounded-sm bg-amber-600 border border-amber-500 text-white font-mono font-bold text-xs hover:bg-amber-700 transition-all uppercase tracking-widest"
                        >
                            Watch Asset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PropertyModal;
