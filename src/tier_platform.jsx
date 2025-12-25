import React, { useState, useMemo } from 'react';

// NY County Data from the uploaded document
const nyCountyData = [
  { rank: 1, county: "New York (Manhattan)", tier: 1, investorFocus: "Unmatched liquidity with constant buyer depth", lifestyle: "Global employment center with premier urban lifestyle", fips: "36061" },
  { rank: 2, county: "Kings (Brooklyn)", tier: 1, investorFocus: "Extremely high transaction volume and fast exits", lifestyle: "Dense population and cultural amenities drive demand", fips: "36047" },
  { rank: 3, county: "Queens", tier: 1, investorFocus: "Strong liquidity with diverse housing stock", lifestyle: "Transit access and employment hubs support livability", fips: "36081" },
  { rank: 4, county: "Nassau", tier: 1, investorFocus: "Affluent suburban market with reliable resale", lifestyle: "Top schools and commuter access boost demand", fips: "36059" },
  { rank: 5, county: "Westchester", tier: 1, investorFocus: "Consistent high-value exits near NYC", lifestyle: "Affluent communities and quality of life sustain demand", fips: "36119" },
  { rank: 6, county: "Bronx", tier: 2, investorFocus: "High volume requires neighborhood selectivity", lifestyle: "Urban density supports employment access", fips: "36005" },
  { rank: 7, county: "Richmond (Staten Island)", tier: 2, investorFocus: "Moderate liquidity with suburban profile", lifestyle: "Family-oriented lifestyle with NYC access", fips: "36085" },
  { rank: 8, county: "Suffolk", tier: 2, investorFocus: "Large market with selective exits", lifestyle: "Suburban and coastal lifestyle appeal", fips: "36103" },
  { rank: 9, county: "Rockland", tier: 2, investorFocus: "Commuter-driven demand supports resale", lifestyle: "High incomes and metro access enhance livability", fips: "36087" },
  { rank: 10, county: "Erie", tier: 3, investorFocus: "Regional hub liquidity centered on Buffalo", lifestyle: "Healthcare and education employment anchor demand", fips: "36029" },
  { rank: 11, county: "Monroe", tier: 3, investorFocus: "University and healthcare employment stabilize exits", lifestyle: "Rochester anchors livability", fips: "36055" },
  { rank: 12, county: "Onondaga", tier: 3, investorFocus: "Government and education support baseline liquidity", lifestyle: "Syracuse anchors regional lifestyle", fips: "36067" },
  { rank: 13, county: "Albany", tier: 3, investorFocus: "State government employment stabilizes housing", lifestyle: "Capital-region amenities support livability", fips: "36001" },
  { rank: 14, county: "Dutchess", tier: 4, investorFocus: "Selective exits tied to commuter demand", lifestyle: "Rural-suburban mix limits volume", fips: "36027" },
  { rank: 15, county: "Ulster", tier: 4, investorFocus: "Thin liquidity outside select towns", lifestyle: "Lifestyle appeal balanced by slower growth", fips: "36111" },
  { rank: 16, county: "Jefferson", tier: 4, investorFocus: "Military presence offers narrow liquidity", lifestyle: "Limited civilian demand", fips: "36045" },
  { rank: 17, county: "Chautauqua", tier: 5, investorFocus: "Very weak resale fundamentals", lifestyle: "Population decline and limited employment", fips: "36013" },
  { rank: 18, county: "St. Lawrence", tier: 5, investorFocus: "Extremely thin market", lifestyle: "Remote geography limits demand", fips: "36089" },
  { rank: 19, county: "Allegany", tier: 5, investorFocus: "Minimal buyer activity", lifestyle: "Rural isolation", fips: "36003" },
  { rank: 20, county: "Hamilton", tier: 5, investorFocus: "Near-zero liquidity", lifestyle: "Smallest population base", fips: "36041" }
];

// US States with basic data
const usStates = [
  { abbr: "AL", name: "Alabama", region: "South" },
  { abbr: "AK", name: "Alaska", region: "West" },
  { abbr: "AZ", name: "Arizona", region: "West" },
  { abbr: "AR", name: "Arkansas", region: "South" },
  { abbr: "CA", name: "California", region: "West" },
  { abbr: "CO", name: "Colorado", region: "West" },
  { abbr: "CT", name: "Connecticut", region: "Northeast" },
  { abbr: "DE", name: "Delaware", region: "South" },
  { abbr: "FL", name: "Florida", region: "South" },
  { abbr: "GA", name: "Georgia", region: "South" },
  { abbr: "HI", name: "Hawaii", region: "West" },
  { abbr: "ID", name: "Idaho", region: "West" },
  { abbr: "IL", name: "Illinois", region: "Midwest" },
  { abbr: "IN", name: "Indiana", region: "Midwest" },
  { abbr: "IA", name: "Iowa", region: "Midwest" },
  { abbr: "KS", name: "Kansas", region: "Midwest" },
  { abbr: "KY", name: "Kentucky", region: "South" },
  { abbr: "LA", name: "Louisiana", region: "South" },
  { abbr: "ME", name: "Maine", region: "Northeast" },
  { abbr: "MD", name: "Maryland", region: "South" },
  { abbr: "MA", name: "Massachusetts", region: "Northeast" },
  { abbr: "MI", name: "Michigan", region: "Midwest" },
  { abbr: "MN", name: "Minnesota", region: "Midwest" },
  { abbr: "MS", name: "Mississippi", region: "South" },
  { abbr: "MO", name: "Missouri", region: "Midwest" },
  { abbr: "MT", name: "Montana", region: "West" },
  { abbr: "NE", name: "Nebraska", region: "Midwest" },
  { abbr: "NV", name: "Nevada", region: "West" },
  { abbr: "NH", name: "New Hampshire", region: "Northeast" },
  { abbr: "NJ", name: "New Jersey", region: "Northeast" },
  { abbr: "NM", name: "New Mexico", region: "West" },
  { abbr: "NY", name: "New York", region: "Northeast", hasData: true },
  { abbr: "NC", name: "North Carolina", region: "South" },
  { abbr: "ND", name: "North Dakota", region: "Midwest" },
  { abbr: "OH", name: "Ohio", region: "Midwest" },
  { abbr: "OK", name: "Oklahoma", region: "South" },
  { abbr: "OR", name: "Oregon", region: "West" },
  { abbr: "PA", name: "Pennsylvania", region: "Northeast" },
  { abbr: "RI", name: "Rhode Island", region: "Northeast" },
  { abbr: "SC", name: "South Carolina", region: "South" },
  { abbr: "SD", name: "South Dakota", region: "Midwest" },
  { abbr: "TN", name: "Tennessee", region: "South" },
  { abbr: "TX", name: "Texas", region: "South" },
  { abbr: "UT", name: "Utah", region: "West" },
  { abbr: "VT", name: "Vermont", region: "Northeast" },
  { abbr: "VA", name: "Virginia", region: "South" },
  { abbr: "WA", name: "Washington", region: "West" },
  { abbr: "WV", name: "West Virginia", region: "South" },
  { abbr: "WI", name: "Wisconsin", region: "Midwest" },
  { abbr: "WY", name: "Wyoming", region: "West" },
  { abbr: "DC", name: "District of Columbia", region: "South" }
];

// Tier Detection Algorithm based on free data sources
const tierCriteria = {
  tier1: {
    name: "Prime Investor",
    color: "#10B981",
    bgColor: "bg-emerald-900/30",
    borderColor: "border-emerald-500",
    criteria: {
      population: "> 500,000",
      medianIncome: "> $80,000",
      homeValueGrowth: "> 5% YoY",
      daysOnMarket: "< 30 days",
      transactionVolume: "> 10,000/year",
      employmentRate: "> 96%"
    },
    description: "Unmatched liquidity, constant buyer depth, fast exits"
  },
  tier2: {
    name: "Strong / Selective",
    color: "#3B82F6",
    bgColor: "bg-blue-900/30",
    borderColor: "border-blue-500",
    criteria: {
      population: "200,000 - 500,000",
      medianIncome: "$60,000 - $80,000",
      homeValueGrowth: "3-5% YoY",
      daysOnMarket: "30-45 days",
      transactionVolume: "5,000-10,000/year",
      employmentRate: "94-96%"
    },
    description: "Moderate liquidity, requires neighborhood selectivity"
  },
  tier3: {
    name: "Opportunistic",
    color: "#F59E0B",
    bgColor: "bg-amber-900/30",
    borderColor: "border-amber-500",
    criteria: {
      population: "100,000 - 200,000",
      medianIncome: "$50,000 - $60,000",
      homeValueGrowth: "1-3% YoY",
      daysOnMarket: "45-60 days",
      transactionVolume: "2,000-5,000/year",
      employmentRate: "92-94%"
    },
    description: "Regional hub liquidity, anchor employer stability"
  },
  tier4: {
    name: "Speculative",
    color: "#F97316",
    bgColor: "bg-orange-900/30",
    borderColor: "border-orange-500",
    criteria: {
      population: "50,000 - 100,000",
      medianIncome: "$40,000 - $50,000",
      homeValueGrowth: "0-1% YoY",
      daysOnMarket: "60-90 days",
      transactionVolume: "500-2,000/year",
      employmentRate: "90-92%"
    },
    description: "Thin liquidity, selective exits tied to specific demand"
  },
  tier5: {
    name: "Capital Trap Risk",
    color: "#EF4444",
    bgColor: "bg-red-900/30",
    borderColor: "border-red-500",
    criteria: {
      population: "< 50,000",
      medianIncome: "< $40,000",
      homeValueGrowth: "< 0% YoY",
      daysOnMarket: "> 90 days",
      transactionVolume: "< 500/year",
      employmentRate: "< 90%"
    },
    description: "Weak resale fundamentals, minimal buyer activity"
  }
};

// Free Data Sources for Tier Detection
const freeDataSources = [
  { 
    name: "Census ACS API", 
    metrics: ["Population", "Median Income", "Housing Units", "Vacancy Rate"],
    url: "api.census.gov/data/2023/acs/acs5",
    weight: 0.25
  },
  { 
    name: "Zillow Research", 
    metrics: ["ZHVI", "Rent Index", "Price Forecast", "Inventory"],
    url: "zillow.com/research/data",
    weight: 0.25
  },
  { 
    name: "Redfin Data Center", 
    metrics: ["Days on Market", "Sale-to-List", "Price Drops", "Homes Sold"],
    url: "redfin.com/news/data-center",
    weight: 0.25
  },
  { 
    name: "FRED Economic", 
    metrics: ["Unemployment", "GDP", "Mortgage Rates"],
    url: "fred.stlouisfed.org",
    weight: 0.15
  },
  { 
    name: "HUD Datasets", 
    metrics: ["Fair Market Rent", "Foreclosure Risk", "Income Limits"],
    url: "huduser.gov/portal/pdrdatas_landing.html",
    weight: 0.10
  }
];

const TierDetectionPlatform = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedState, setSelectedState] = useState('NY');
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [tierFilter, setTierFilter] = useState(null);

  // State positions for the map (simplified grid layout)
  const statePositions = {
    AK: { row: 0, col: 0 }, HI: { row: 0, col: 1 },
    WA: { row: 1, col: 1 }, OR: { row: 2, col: 1 }, CA: { row: 3, col: 1 }, NV: { row: 3, col: 2 },
    ID: { row: 1, col: 2 }, MT: { row: 1, col: 3 }, WY: { row: 2, col: 3 }, UT: { row: 3, col: 3 }, AZ: { row: 4, col: 2 }, NM: { row: 4, col: 3 },
    CO: { row: 3, col: 4 }, ND: { row: 1, col: 4 }, SD: { row: 2, col: 4 }, NE: { row: 2, col: 5 }, KS: { row: 3, col: 5 }, OK: { row: 4, col: 5 }, TX: { row: 5, col: 4 },
    MN: { row: 1, col: 5 }, IA: { row: 2, col: 6 }, MO: { row: 3, col: 6 }, AR: { row: 4, col: 6 }, LA: { row: 5, col: 6 },
    WI: { row: 1, col: 6 }, IL: { row: 2, col: 7 }, IN: { row: 2, col: 8 }, OH: { row: 2, col: 9 }, MI: { row: 1, col: 8 },
    KY: { row: 3, col: 8 }, TN: { row: 4, col: 7 }, MS: { row: 5, col: 7 }, AL: { row: 5, col: 8 },
    WV: { row: 3, col: 9 }, VA: { row: 4, col: 9 }, NC: { row: 4, col: 10 }, SC: { row: 5, col: 10 }, GA: { row: 5, col: 9 }, FL: { row: 6, col: 10 },
    PA: { row: 2, col: 10 }, NY: { row: 1, col: 10 }, VT: { row: 0, col: 10 }, NH: { row: 0, col: 11 }, ME: { row: 0, col: 12 },
    MA: { row: 1, col: 11 }, RI: { row: 2, col: 11 }, CT: { row: 2, col: 12 }, NJ: { row: 3, col: 11 }, DE: { row: 3, col: 10 }, MD: { row: 4, col: 10 }, DC: { row: 4, col: 11 }
  };

  const getTierColor = (tier) => {
    const colors = {
      1: '#10B981',
      2: '#3B82F6', 
      3: '#F59E0B',
      4: '#F97316',
      5: '#EF4444'
    };
    return colors[tier] || '#6B7280';
  };

  const filteredCounties = tierFilter 
    ? nyCountyData.filter(c => c.tier === tierFilter)
    : nyCountyData;

  const tierStats = useMemo(() => {
    const stats = {};
    for (let i = 1; i <= 5; i++) {
      stats[i] = nyCountyData.filter(c => c.tier === i).length;
    }
    return stats;
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              🗺️ Property Tax Auction Intelligence Platform
            </h1>
            <p className="text-gray-400 text-sm">Free Data • Tier Detection • All 50 States</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500">Data Cost</div>
              <div className="text-lg font-bold text-green-400">$0/month</div>
            </div>
            <div className="h-8 w-px bg-gray-700"></div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Counties Analyzed</div>
              <div className="text-lg font-bold text-blue-400">{nyCountyData.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          {['map', 'counties', 'detection', 'sources'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab === 'map' && '🗺️ '}
              {tab === 'counties' && '📊 '}
              {tab === 'detection' && '🎯 '}
              {tab === 'sources' && '📡 '}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* US State Map */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🇺🇸</span> United States - Select a State
              </h2>
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                {Object.entries(statePositions).map(([abbr, pos]) => {
                  const state = usStates.find(s => s.abbr === abbr);
                  const isSelected = selectedState === abbr;
                  const hasData = abbr === 'NY';
                  return (
                    <div
                      key={abbr}
                      onClick={() => setSelectedState(abbr)}
                      style={{ gridRow: pos.row + 1, gridColumn: pos.col + 1 }}
                      className={`
                        w-12 h-10 rounded flex items-center justify-center text-xs font-bold cursor-pointer transition-all
                        ${isSelected ? 'bg-gradient-to-r from-green-500 to-blue-500 scale-110 z-10' : ''}
                        ${hasData && !isSelected ? 'bg-green-700 hover:bg-green-600' : ''}
                        ${!hasData && !isSelected ? 'bg-gray-700 hover:bg-gray-600' : ''}
                      `}
                      title={state?.name}
                    >
                      {abbr}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-700"></div>
                  <span className="text-gray-400">Data Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-700"></div>
                  <span className="text-gray-400">Coming Soon</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-blue-500"></div>
                  <span className="text-gray-400">Selected</span>
                </div>
              </div>
            </div>

            {/* State Detail */}
            {selectedState && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">
                  {usStates.find(s => s.abbr === selectedState)?.name}
                  {selectedState === 'NY' && <span className="ml-2 text-green-400 text-sm">✓ Data Available</span>}
                </h2>
                
                {selectedState === 'NY' ? (
                  <div className="space-y-4">
                    {/* Tier Distribution */}
                    <div className="grid grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map(tier => (
                        <button
                          key={tier}
                          onClick={() => setTierFilter(tierFilter === tier ? null : tier)}
                          className={`p-3 rounded-lg text-center transition-all ${
                            tierFilter === tier ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ 
                            backgroundColor: `${getTierColor(tier)}20`,
                            borderLeft: `4px solid ${getTierColor(tier)}`
                          }}
                        >
                          <div className="text-2xl font-bold" style={{ color: getTierColor(tier) }}>
                            {tierStats[tier]}
                          </div>
                          <div className="text-xs text-gray-400">Tier {tier}</div>
                        </button>
                      ))}
                    </div>

                    {/* County Grid */}
                    <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
                      {filteredCounties.map(county => (
                        <div
                          key={county.rank}
                          onClick={() => setSelectedCounty(county)}
                          className="bg-gray-700/50 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-all"
                          style={{ borderLeft: `4px solid ${getTierColor(county.tier)}` }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">{county.county}</span>
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: `${getTierColor(county.tier)}30`,
                                color: getTierColor(county.tier)
                              }}
                            >
                              T{county.tier}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">Rank #{county.rank}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🚧</div>
                    <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                    <p className="text-gray-400 mb-4">
                      County tier rankings for {usStates.find(s => s.abbr === selectedState)?.name} are in development.
                    </p>
                    <p className="text-sm text-gray-500">
                      Use the Tier Detection algorithm to analyze any county with free data sources.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Selected County Detail */}
            {selectedCounty && (
              <div 
                className="bg-gray-800 rounded-xl p-6 border-l-4"
                style={{ borderLeftColor: getTierColor(selectedCounty.tier) }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedCounty.county}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{ 
                          backgroundColor: `${getTierColor(selectedCounty.tier)}30`,
                          color: getTierColor(selectedCounty.tier)
                        }}
                      >
                        Tier {selectedCounty.tier} - {tierCriteria[`tier${selectedCounty.tier}`].name}
                      </span>
                      <span className="text-gray-400">Rank #{selectedCounty.rank}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCounty(null)}
                    className="text-gray-500 hover:text-white"
                  >✕</button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm text-gray-500 uppercase mb-2">Investor Focus</h4>
                    <p className="text-white">{selectedCounty.investorFocus}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-500 uppercase mb-2">Lifestyle Score</h4>
                    <p className="text-white">{selectedCounty.lifestyle}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Counties Tab */}
        {activeTab === 'counties' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">New York County Rankings</h2>
              <p className="text-gray-400 text-sm">Hybrid Investor & Lifestyle Model</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">Rank</th>
                    <th className="px-4 py-3 text-left text-sm">County</th>
                    <th className="px-4 py-3 text-left text-sm">Tier</th>
                    <th className="px-4 py-3 text-left text-sm">Investor Focus</th>
                    <th className="px-4 py-3 text-left text-sm">Lifestyle</th>
                  </tr>
                </thead>
                <tbody>
                  {nyCountyData.map(county => (
                    <tr 
                      key={county.rank}
                      className="border-t border-gray-700/50 hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setSelectedCounty(county)}
                    >
                      <td className="px-4 py-3 font-bold">{county.rank}</td>
                      <td className="px-4 py-3 font-medium">{county.county}</td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ 
                            backgroundColor: `${getTierColor(county.tier)}30`,
                            color: getTierColor(county.tier)
                          }}
                        >
                          Tier {county.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{county.investorFocus}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{county.lifestyle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detection Tab */}
        {activeTab === 'detection' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">🎯 Tier Detection Algorithm</h2>
              <p className="text-gray-400 mb-6">
                Automatically classify any US county into investment tiers using free data sources.
              </p>
              
              <div className="grid gap-4">
                {Object.entries(tierCriteria).map(([key, tier]) => (
                  <div 
                    key={key}
                    className={`rounded-xl p-4 border ${tier.borderColor} ${tier.bgColor}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
                        style={{ backgroundColor: tier.color }}
                      >
                        {key.replace('tier', '')}
                      </div>
                      <div>
                        <h3 className="font-bold" style={{ color: tier.color }}>{tier.name}</h3>
                        <p className="text-sm text-gray-400">{tier.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {Object.entries(tier.criteria).map(([metric, value]) => (
                        <div key={metric} className="bg-gray-900/50 rounded-lg p-2">
                          <div className="text-gray-500 text-xs capitalize">
                            {metric.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="font-mono text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detection Formula */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">📐 Scoring Formula</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400 mb-2">// Tier Score Calculation (0-100)</div>
                <div className="text-blue-300">
                  tier_score = (
                </div>
                <div className="pl-4 text-gray-300">
                  population_score × 0.15 +<br/>
                  income_score × 0.15 +<br/>
                  home_value_growth × 0.20 +<br/>
                  days_on_market_inv × 0.20 +<br/>
                  transaction_volume × 0.15 +<br/>
                  employment_rate × 0.15
                </div>
                <div className="text-blue-300">)</div>
                <div className="mt-4 text-yellow-400">// Tier Assignment</div>
                <div className="text-gray-300">
                  if (tier_score &gt;= 80) → Tier 1<br/>
                  if (tier_score &gt;= 60) → Tier 2<br/>
                  if (tier_score &gt;= 40) → Tier 3<br/>
                  if (tier_score &gt;= 20) → Tier 4<br/>
                  else → Tier 5
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-500/30">
              <h2 className="text-xl font-bold mb-2">100% Free Data Sources</h2>
              <p className="text-gray-400">All tier detection uses publicly available, free data</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {freeDataSources.map(source => (
                <div key={source.name} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">{source.name}</h3>
                    <span className="text-green-400 text-sm font-bold">FREE</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {source.metrics.map(m => (
                      <span key={m} className="px-2 py-0.5 bg-gray-700 rounded text-xs">{m}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Weight: {(source.weight * 100).toFixed(0)}%</span>
                    <a 
                      href={`https://${source.url}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {source.url}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Python Example */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">🐍 Quick Start: Fetch Tier Data</h3>
              <pre className="bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
                <code className="text-green-400">{`import requests
import pandas as pd

# 1. Census API - Get population & income
CENSUS_KEY = "YOUR_FREE_KEY"  # Get at api.census.gov
state_fips = "36"  # New York

census_url = f"""https://api.census.gov/data/2023/acs/acs5?
  get=B01003_001E,B19013_001E,B25077_001E&
  for=county:*&in=state:{state_fips}&key={CENSUS_KEY}"""

census_data = requests.get(census_url).json()
df = pd.DataFrame(census_data[1:], columns=census_data[0])
df.columns = ['population', 'median_income', 'median_home_value', 'state', 'county']

# 2. Zillow Research - Get home value trends
zhvi = pd.read_csv("https://files.zillowstatic.com/research/public_csvs/zhvi/County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv")
ny_zhvi = zhvi[zhvi['StateCodeFIPS'] == 36]

# 3. Calculate tier score
def calculate_tier(pop, income, growth):
    score = 0
    score += min(pop / 500000, 1) * 25  # Population
    score += min(income / 80000, 1) * 25  # Income
    score += min(growth / 0.05, 1) * 50  # Growth
    if score >= 80: return 1
    if score >= 60: return 2
    if score >= 40: return 3
    if score >= 20: return 4
    return 5

print("County tiers calculated!")`}
              </code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TierDetectionPlatform;
