import React, { useState } from 'react';

/**
 * Property Categories for filtering
 */
export const PROPERTY_CATEGORIES = {
    TAX_LIEN: { id: 'tax_lien', label: 'Tax Lien', icon: '📋', color: 'bg-blue-500', description: 'Tax lien certificates' },
    TAX_DEED: { id: 'tax_deed', label: 'Tax Deed', icon: '📜', color: 'bg-purple-500', description: 'Tax deed sales' },
    MORTGAGE: { id: 'mortgage', label: 'Mortgage/Foreclosure', icon: '🏦', color: 'bg-red-500', description: 'Pre-foreclosure & REO' },
    OTHER: { id: 'other', label: 'Other', icon: '📦', color: 'bg-slate-500', description: 'Bank-owned, vacant, etc.' },
};

/**
 * PropertyCard - Individual property listing card with PropWire-style data
 */
export function PropertyCard({ property, onViewDetails, onAddToWatchlist }) {
    const [isHovered, setIsHovered] = useState(false);

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
        // PropWire-style mortgage data
        equity = null,
        mortgageBalance = null,
        lender = null,
        interestRate = null,
        foreclosureStage = null,
        ownerType = 'Owner Occupied',
    } = property;

    const discount = Math.round((1 - openingBid / estimatedValue) * 100);
    const daysUntil = Math.ceil((new Date(auctionDate) - new Date()) / (1000 * 60 * 60 * 24));

    // Get category info
    const categoryInfo = Object.values(PROPERTY_CATEGORIES).find(c => c.id === category) || PROPERTY_CATEGORIES.OTHER;

    const tierColors = {
        1: 'bg-emerald-500',
        2: 'bg-blue-500',
        3: 'bg-amber-500',
        4: 'bg-orange-500',
        5: 'bg-red-500',
    };

    return (
        <div
            className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Section */}
            <div className="relative h-44 bg-gradient-to-br from-slate-200 to-slate-300">
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <div className="text-4xl mb-1">🏠</div>
                        <div className="text-[10px]">{propertyType}</div>
                    </div>
                </div>

                {/* Tier Badge */}
                <div className={`absolute top-2 left-2 ${tierColors[tier]} text-white text-[10px] font-black px-2 py-0.5 rounded shadow`}>
                    T{tier}
                </div>

                {/* Category Badge */}
                <div className={`absolute top-2 right-2 ${categoryInfo.color} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1`}>
                    <span>{categoryInfo.icon}</span>
                    <span>{categoryInfo.label}</span>
                </div>

                {/* Discount Badge */}
                <div className="absolute bottom-2 left-2 bg-emerald-500 text-white font-black px-2 py-0.5 rounded shadow text-xs">
                    {discount}% Below Value
                </div>

                {/* Days Until */}
                <div className={`absolute bottom-2 right-2 ${daysUntil <= 7 ? 'bg-red-500' : 'bg-slate-900/80'} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>
                    {daysUntil > 0 ? `${daysUntil} days` : 'Today!'}
                </div>

                {/* Hover Actions */}
                {isHovered && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                        <button
                            onClick={() => onViewDetails?.(property)}
                            className="bg-white text-slate-900 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-slate-100 transition-all"
                        >
                            Details
                        </button>
                        <button
                            onClick={() => onAddToWatchlist?.(property)}
                            className="bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-amber-600 transition-all"
                        >
                            ⭐ Save
                        </button>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-3">
                {/* Address */}
                <div className="font-bold text-slate-900 text-sm mb-0.5 truncate">{address}</div>
                <div className="text-xs text-slate-500 mb-2">{city}, {state} {zip}</div>

                {/* Property Stats */}
                <div className="flex items-center gap-3 text-[10px] text-slate-600 mb-2">
                    <span>🛏️ {bedrooms} bd</span>
                    <span>🚿 {bathrooms} ba</span>
                    <span>📐 {sqft.toLocaleString()} sf</span>
                    <span>📅 {yearBuilt}</span>
                </div>

                {/* Mortgage/Equity Info (PropWire style) */}
                {(equity !== null || mortgageBalance !== null) && (
                    <div className="bg-slate-50 rounded-lg p-2 mb-2 text-[10px]">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-500">Equity</span>
                            <span className="font-bold text-emerald-600">${equity?.toLocaleString() || 'N/A'}</span>
                        </div>
                        {mortgageBalance && (
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-slate-500">Mortgage Bal</span>
                                <span className="font-bold text-slate-800">${mortgageBalance?.toLocaleString()}</span>
                            </div>
                        )}
                        {lender && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Lender</span>
                                <span className="font-bold text-slate-800 truncate max-w-[100px]">{lender}</span>
                            </div>
                        )}
                        {interestRate && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Rate</span>
                                <span className="font-bold text-slate-800">{interestRate}%</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Pricing */}
                <div className="flex items-end justify-between border-t border-slate-100 pt-2">
                    <div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Opening Bid</div>
                        <div className="text-lg font-black text-emerald-600">${openingBid.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Est. Value</div>
                        <div className="text-sm font-bold text-slate-400 line-through">${estimatedValue.toLocaleString()}</div>
                    </div>
                </div>

                {/* County & Date */}
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                    <span>📍 {county} County</span>
                    <span>📅 {new Date(auctionDate).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * PropertyFeed - Grid of property listings with 4 category tabs
 */
export function PropertyFeed({ properties = [], onViewDetails, onAddToWatchlist, loading = false }) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [filter, setFilter] = useState({
        minPrice: 0,
        maxPrice: 1000000,
        tier: 'all',
    });

    // Filter properties
    const filteredProperties = properties.filter(p => {
        if (activeCategory !== 'all' && p.category !== activeCategory) return false;
        if (filter.tier !== 'all' && p.tier !== parseInt(filter.tier)) return false;
        if (p.openingBid < filter.minPrice || p.openingBid > filter.maxPrice) return false;
        return true;
    });

    // Count by category
    const categoryCounts = {
        all: properties.length,
        tax_lien: properties.filter(p => p.category === 'tax_lien').length,
        tax_deed: properties.filter(p => p.category === 'tax_deed').length,
        mortgage: properties.filter(p => p.category === 'mortgage').length,
        other: properties.filter(p => p.category === 'other').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400 animate-pulse">Loading properties...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black mb-1">🏠 Live Property Feed</h1>
                        <p className="text-purple-100 text-sm">PropWire-powered tax sale and foreclosure listings</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black">{properties.length}</div>
                        <div className="text-xs text-purple-200">Total Properties</div>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-3">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeCategory === 'all'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        All ({categoryCounts.all})
                    </button>
                    {Object.values(PROPERTY_CATEGORIES).map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 ${activeCategory === cat.id
                                    ? `${cat.color} text-white`
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            <span className="opacity-70">({categoryCounts[cat.id]})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Tier:</span>
                    <select
                        value={filter.tier}
                        onChange={(e) => setFilter({ ...filter, tier: e.target.value })}
                        className="px-2 py-1 border border-slate-200 rounded text-xs"
                    >
                        <option value="all">All</option>
                        {[1, 2, 3, 4, 5].map(t => <option key={t} value={t}>T{t}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Max:</span>
                    <select
                        value={filter.maxPrice}
                        onChange={(e) => setFilter({ ...filter, maxPrice: parseInt(e.target.value) })}
                        className="px-2 py-1 border border-slate-200 rounded text-xs"
                    >
                        <option value={100000}>$100K</option>
                        <option value={250000}>$250K</option>
                        <option value={500000}>$500K</option>
                        <option value={1000000}>$1M+</option>
                    </select>
                </div>
                <div className="ml-auto text-xs text-slate-500">
                    Showing {filteredProperties.length} of {properties.length}
                </div>
            </div>

            {/* Property Grid */}
            {filteredProperties.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
                    <div className="text-4xl mb-3">🏠</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No Properties Found</h3>
                    <p className="text-sm text-slate-500">Try adjusting your filters or category</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProperties.map((property, idx) => (
                        <PropertyCard
                            key={property.id || idx}
                            property={property}
                            onViewDetails={onViewDetails}
                            onAddToWatchlist={onAddToWatchlist}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Sample properties with 4 categories and PropWire-style data
export const SAMPLE_PROPERTIES = [
    // TAX LIEN properties
    { id: 1, address: '567 Sunshine Blvd', city: 'Tampa', state: 'FL', zip: '33601', county: 'Hillsborough', propertyType: 'Single Family', bedrooms: 3, bathrooms: 2, sqft: 1800, yearBuilt: 1998, auctionDate: '2026-02-20', openingBid: 12500, estimatedValue: 320000, category: 'tax_lien', tier: 1, equity: 185000, interestRate: 18 },
    { id: 2, address: '456 Pine Creek Rd', city: 'Atlanta', state: 'GA', zip: '30301', county: 'Fulton', propertyType: 'Single Family', bedrooms: 4, bathrooms: 3, sqft: 2400, yearBuilt: 1995, auctionDate: '2026-03-05', openingBid: 8500, estimatedValue: 285000, category: 'tax_lien', tier: 1, equity: 142000, interestRate: 20 },
    { id: 3, address: '123 Maple Ave', city: 'Chicago', state: 'IL', zip: '60601', county: 'Cook', propertyType: 'Single Family', bedrooms: 3, bathrooms: 2, sqft: 1600, yearBuilt: 2001, auctionDate: '2026-02-28', openingBid: 15000, estimatedValue: 275000, category: 'tax_lien', tier: 2, equity: 98000, interestRate: 18 },

    // TAX DEED properties
    { id: 4, address: '1234 Desert Rose Ln', city: 'Phoenix', state: 'AZ', zip: '85001', county: 'Maricopa', propertyType: 'Single Family', bedrooms: 4, bathrooms: 2, sqft: 2100, yearBuilt: 2005, auctionDate: '2026-02-15', openingBid: 145000, estimatedValue: 385000, category: 'tax_deed', tier: 1, equity: 245000 },
    { id: 5, address: '890 Mountain View Dr', city: 'Denver', state: 'CO', zip: '80202', county: 'Denver', propertyType: 'Condo', bedrooms: 2, bathrooms: 1, sqft: 1200, yearBuilt: 2010, auctionDate: '2026-02-25', openingBid: 125000, estimatedValue: 380000, category: 'tax_deed', tier: 1, equity: 195000 },
    { id: 6, address: '321 Lakeside Way', city: 'Austin', state: 'TX', zip: '78701', county: 'Travis', propertyType: 'Single Family', bedrooms: 3, bathrooms: 2, sqft: 1650, yearBuilt: 2001, auctionDate: '2026-03-01', openingBid: 175000, estimatedValue: 520000, category: 'tax_deed', tier: 1, equity: 285000 },

    // MORTGAGE/FORECLOSURE properties
    { id: 7, address: '789 Ocean Ave', city: 'Miami', state: 'FL', zip: '33101', county: 'Miami-Dade', propertyType: 'Condo', bedrooms: 2, bathrooms: 2, sqft: 1100, yearBuilt: 2015, auctionDate: '2026-03-10', openingBid: 195000, estimatedValue: 450000, category: 'mortgage', tier: 1, equity: 125000, mortgageBalance: 325000, lender: 'Wells Fargo', interestRate: 6.5, foreclosureStage: 'Pre-Foreclosure' },
    { id: 8, address: '555 Harbor Dr', city: 'San Diego', state: 'CA', zip: '92101', county: 'San Diego', propertyType: 'Single Family', bedrooms: 4, bathrooms: 3, sqft: 2800, yearBuilt: 2008, auctionDate: '2026-03-15', openingBid: 485000, estimatedValue: 875000, category: 'mortgage', tier: 1, equity: 220000, mortgageBalance: 655000, lender: 'Bank of America', interestRate: 5.9, foreclosureStage: 'Notice of Default' },
    { id: 9, address: '222 Broadway St', city: 'Nashville', state: 'TN', zip: '37201', county: 'Davidson', propertyType: 'Single Family', bedrooms: 3, bathrooms: 2, sqft: 1850, yearBuilt: 2003, auctionDate: '2026-03-20', openingBid: 165000, estimatedValue: 385000, category: 'mortgage', tier: 1, equity: 95000, mortgageBalance: 290000, lender: 'Chase', interestRate: 6.2, foreclosureStage: 'REO' },

    // OTHER properties (Bank-owned, vacant, etc.)
    { id: 10, address: '999 Industrial Pkwy', city: 'Houston', state: 'TX', zip: '77001', county: 'Harris', propertyType: 'Vacant Land', bedrooms: 0, bathrooms: 0, sqft: 0, yearBuilt: 0, auctionDate: '2026-03-25', openingBid: 45000, estimatedValue: 125000, category: 'other', tier: 2, ownerType: 'Bank Owned' },
    { id: 11, address: '777 Warehouse Blvd', city: 'Las Vegas', state: 'NV', zip: '89101', county: 'Clark', propertyType: 'Commercial', bedrooms: 0, bathrooms: 2, sqft: 5000, yearBuilt: 1990, auctionDate: '2026-04-01', openingBid: 185000, estimatedValue: 420000, category: 'other', tier: 2, ownerType: 'Absentee Owner' },
    { id: 12, address: '333 Rural Route', city: 'Raleigh', state: 'NC', zip: '27601', county: 'Wake', propertyType: 'Vacant Land', bedrooms: 0, bathrooms: 0, sqft: 0, yearBuilt: 0, auctionDate: '2026-04-05', openingBid: 28000, estimatedValue: 85000, category: 'other', tier: 3, ownerType: 'Estate Sale' },
];

export default PropertyFeed;
