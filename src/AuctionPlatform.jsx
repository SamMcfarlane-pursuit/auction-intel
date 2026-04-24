import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './AuthContext';
import { useWatchlist } from './WatchlistContext';
import { useToast } from './ToastContext';
import { TIERS, COUNTIES as STATIC_COUNTIES, STATE_NAMES, STATE_PATHS, STATE_LABEL_COORDS, TIER_CRITERIA, FREE_DATA_SOURCES, NY_COUNTY_DETAILS, PYTHON_QUICK_START, STATE_AUCTION_INFO as STATIC_STATE_AUCTION_INFO, getStateByZip, UPCOMING_AUCTIONS } from './data';
import { exportToCSV, copyToClipboard, tableToText, printReport, generateCountyReportHTML, generateStateReportHTML } from './exportUtils';
import USChoropleth from './components/USChoropleth';
// USMap (MapLibre GL + Supercluster, ~1.2 MB) is lazy-loaded: fetched only when user opens the Map view.
const USMap = lazy(() => import('./USMap'));
// Hover/focus prefetch — warms the map-engine chunk cache before the user actually clicks.
// Idempotent: repeat calls are free because the browser caches the module resolution.
const prefetchMap = () => { import('./USMap'); };
import UpcomingAuctions from './UpcomingAuctions';
import ROICalculator from './components/ROICalculator';
import AuctionCalendar from './components/AuctionCalendar';
import { StateCountdown } from './components/CountdownTimer';
import InvestmentHeatMap from './components/InvestmentHeatMap';
import MarketDataDashboard from './components/MarketDataDashboard';
import { AlertSettings, NotificationBell } from './components/AlertSettings';
import { PropertyFeed, SAMPLE_PROPERTIES } from './components/PropertyFeed';
import { PropertyModal } from './components/PropertyModal';
import PropertyDueDiligence from './components/PropertyDueDiligence';
import MobileNav from './components/MobileNav';
import WelcomeScreen from './components/WelcomeScreen';
import UserSettings from './components/UserSettings';
import MarketForecaster from './components/MarketForecaster';
import PortfolioManager from './components/PortfolioManager';
import 'leaflet/dist/leaflet.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api';

// Watchlist View Component
function WatchlistView({ onSelectState, onSelectCounty, TIERS }) {
    const { watchlist, removeFromWatchlist, clearWatchlist, updateWatchlistItem, getWatchlistStats, togglePredictiveAlert } = useWatchlist();
    const [sortBy, setSortBy] = useState('addedAt');
    const [sortAsc, setSortAsc] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const sortedWatchlist = useMemo(() => {
        return [...watchlist].sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'tier': aVal = a.tier; bVal = b.tier; break;
                case 'county': aVal = a.county; bVal = b.county; break;
                case 'state': aVal = a.stateAbbr; bVal = b.stateAbbr; break;
                case 'population': aVal = a.population; bVal = b.population; break;
                case 'priority':
                    const po = { high: 1, medium: 2, low: 3 };
                    aVal = po[a.priority] || 2; bVal = po[b.priority] || 2; break;
                default: aVal = new Date(a.addedAt); bVal = new Date(b.addedAt);
            }
            if (typeof aVal === 'string') return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            return sortAsc ? aVal - bVal : bVal - aVal;
        });
    }, [watchlist, sortBy, sortAsc]);

    const stats = getWatchlistStats ? getWatchlistStats() : { total: watchlist.length, completed: 0, highPriority: 0 };

    const ddLabels = {
        titleSearch: '🔍 Title Search', propertyInspection: '🏠 Property Inspection',
        taxStatusVerified: '📋 Tax Status Verified', neighborhoodResearch: '🏘️ Neighborhood Research',
        auctionRegistered: '✅ Auction Registered', fundsSecured: '💰 Funds Secured'
    };

    const getProgress = (item) => {
        if (!item.dueDiligence) return 0;
        const done = Object.values(item.dueDiligence).filter(v => v).length;
        return Math.round((done / 6) * 100);
    };

    const handleExportWatchlist = () => {
        const csv = ['County,State,Tier,Population,Income,ZHVI,Growth,DOM,Priority,Notes,Added'];
        sortedWatchlist.forEach(item => {
            csv.push(`"${item.county}","${item.stateAbbr}",T${item.tier},${item.population},${item.income},${item.zhvi},${item.growth}%,${item.dom},"${item.priority || 'medium'}","${(item.userNotes || '').replace(/"/g, '""')}","${new Date(item.addedAt).toLocaleDateString()}"`);
        });
        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'watchlist_export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    if (watchlist.length === 0) {
        return (
            <div className="bg-canvas rounded-md shadow-none border border-slate-200 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-surface rounded-md flex items-center justify-center text-2xl font-mono">⭐</div>
                <h2 className="text-xl font-mono font-semibold text-slate-900 tracking-tighter mb-3">Your Watchlist is Empty</h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">Start building your investment portfolio by adding counties from the State Database.</p>
                <button onClick={() => onSelectState(null)} className="bg-indigo-600 text-white px-6 py-3 rounded-sm font-mono font-bold hover:bg-indigo-700 transition-all shadow-none shadow-indigo-600/20">📊 Browse State Database</button>
            </div>
        );
    }

    return (
        <div className="bg-canvas rounded-md shadow-none border border-slate-200 flex flex-col h-full">
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 className="text-xl font-mono md:text-2xl font-mono font-semibold text-slate-900 tracking-tighter">My Watchlist</h2>
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-sm text-sm font-bold">{stats.total} saved</span>
                        {stats.highPriority > 0 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-sm text-xs font-bold">🔥 {stats.highPriority} high priority</span>}
                    </div>
                    <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">Your tracked opportunities • {stats.completed} fully researched</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={handleExportWatchlist} className="bg-surface text-white px-4 py-2 rounded-lg font-mono font-semibold text-xs shadow-none hover:bg-black transition-all flex items-center gap-2"><span>📥</span> Export CSV</button>
                    <button onClick={() => {
                        const url = window.prompt("Enter your CRM/Sheets Webhook URL (Zapier, Make.com):", localStorage.getItem('auction_portfolio_webhook') || "");
                        if (url !== null) {
                            localStorage.setItem('auction_portfolio_webhook', url);
                            alert(url ? "Webhook Sync Enabled! Your portfolio will auto-sync on changes." : "Webhook Sync Disabled.");
                        }
                    }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-mono font-semibold text-xs shadow-none hover:bg-emerald-700 transition-all flex items-center gap-2"><span>🔄</span> Auto-Sync CRM</button>
                    <button onClick={clearWatchlist} className="bg-canvas text-rose-600 border border-red-200 px-4 py-2 rounded-lg font-mono font-semibold text-xs hover:bg-red-50 transition-all flex items-center gap-2"><span>🗑️</span> Clear All</button>
                </div>
            </div>

            <div className="p-4 md:p-6 border-b border-slate-200 flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
                {[{ id: 'addedAt', label: 'Recent' }, { id: 'priority', label: 'Priority' }, { id: 'tier', label: 'Tier' }, { id: 'state', label: 'State' }, { id: 'population', label: 'Population' }].map(opt => (
                    <button key={opt.id} onClick={() => { setSortBy(opt.id); setSortAsc(!sortAsc); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${sortBy === opt.id ? 'bg-surface text-white shadow-none' : 'bg-surface text-slate-600 hover:bg-slate-200'}`}>
                        {opt.label} {sortBy === opt.id && (sortAsc ? '↑' : '↓')}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {sortedWatchlist.map(item => {
                        const tier = TIERS[item.tier] || TIERS[5];
                        const isExpanded = expandedId === item.id;
                        const progress = getProgress(item);
                        return (
                            <div key={item.id} className={`bg-surface from-white rounded-md border-2 ${item.priority === 'high' ? 'border-red-200' : 'border-slate-200'} p-5 hover:shadow-none transition-all group`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="font-mono font-semibold text-lg text-slate-900 truncate">{item.county}</div>
                                            {item.priority === 'high' && <span className="text-rose-600">🔥</span>}
                                        </div>
                                        <div className="text-xs font-bold text-slate-600">{item.stateName} ({item.stateAbbr})</div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white" style={{ background: tier.color }}>{tier.label}</span>
                                        <button onClick={() => removeFromWatchlist(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-red-100 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">×</button>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 mb-1"><span>Due Diligence</span><span>{progress}%</span></div>
                                    <div className="h-1.5 bg-surface rounded-sm overflow-hidden"><div className={`h-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div></div>
                                </div>
                                {/* Priority Buttons */}
                                <div className="flex gap-1 mb-3">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button key={p} onClick={() => updateWatchlistItem && updateWatchlistItem(item.id, { priority: p })}
                                            className={`flex-1 py-1 rounded text-[10px] font-bold capitalize transition-all ${item.priority === p ? (p === 'high' ? 'bg-rose-500 text-white' : p === 'low' ? 'bg-slate-300 text-slate-700' : 'bg-amber-500 text-white') : 'bg-surface text-slate-500 hover:bg-slate-200'}`}>{p}</button>
                                    ))}
                                </div>
                                {/* Predictive Alert Toggle */}
                                <div className="mb-3 flex items-center justify-between bg-surface p-2.5 rounded-sm border border-slate-200">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-800">Predictive Bidding Alerts</span>
                                        <span className="text-[9px] text-slate-500 mt-0.5">MAB Threshold: <span className="font-semibold text-amber-600">${item.mabThreshold ? parseInt(item.mabThreshold).toLocaleString() : (item.targetPrice || (item.zhvi * 0.7).toFixed(0)).toLocaleString()}</span></span>
                                    </div>
                                    <button 
                                        onClick={() => togglePredictiveAlert(item.id, item.mabThreshold || item.targetPrice || (item.zhvi * 0.7))}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all ${item.alertEnabled ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 shadow-inner' : 'bg-canvas text-slate-500 border border-slate-300 hover:border-slate-500 hover:text-slate-700 shadow-none'}`}>
                                        {item.alertEnabled ? '🔔 ACTIVE' : '🔕 OFF'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div><div className="text-[9px] font-bold text-slate-600 uppercase">Pop</div><div className="font-bold text-slate-900">{(item.population / 1000).toFixed(0)}K</div></div>
                                    <div><div className="text-[9px] font-bold text-slate-600 uppercase">Income</div><div className="font-bold text-slate-900">${(item.income / 1000).toFixed(0)}K</div></div>
                                    <div><div className="text-[9px] font-bold text-slate-600 uppercase">ZHVI</div><div className="font-bold text-slate-900">${(item.zhvi / 1000).toFixed(0)}K</div></div>
                                </div>
                                {/* Expand Toggle */}
                                <button onClick={() => setExpandedId(isExpanded ? null : item.id)} className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 py-2 border-t border-slate-200">
                                    {isExpanded ? '▲ Close Details' : '▼ Notes & Checklist'}
                                </button>
                                {isExpanded && (
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-600 uppercase mb-1 block">📝 Research Notes</label>
                                            <textarea value={item.userNotes || ''} onChange={(e) => updateWatchlistItem && updateWatchlistItem(item.id, { userNotes: e.target.value })} placeholder="Add your research notes..." className="w-full p-2 text-xs border border-slate-300 rounded-lg resize-none h-20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-600 uppercase mb-2 block">✓ Due Diligence Checklist</label>
                                            <div className="space-y-1">
                                                {Object.entries(ddLabels).map(([key, label]) => (
                                                    <label key={key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                                                        <input type="checkbox" checked={item.dueDiligence?.[key] || false}
                                                            onChange={(e) => updateWatchlistItem && updateWatchlistItem(item.id, { dueDiligence: { ...item.dueDiligence, [key]: e.target.checked } })}
                                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                        <span className={`text-xs ${item.dueDiligence?.[key] ? 'text-emerald-600 font-bold line-through' : 'text-slate-600'}`}>{label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => onSelectCounty(item)} className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all">View Details</button>
                                    <button onClick={() => onSelectState(item.stateAbbr)} className="px-3 py-2 bg-surface text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">State →</button>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200 text-[9px] text-slate-600">Added {new Date(item.addedAt).toLocaleDateString()}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// AUCTION PLATFORM LINKS - Direct links to real auction sites
// ============================================================================
const AUCTION_PLATFORMS = {
    'Bid4Assets': { url: 'https://www.bid4assets.com', logo: '🏷️' },
    'RealAuction': { url: 'https://www.realauction.com', logo: '🔨' },
    'GovEase': { url: 'https://www.govease.com', logo: '🏛️' },
    'Zeusauction': { url: 'https://www.zeusauction.com', logo: '⚡' },
    'CivicSource': { url: 'https://www.civicsource.com', logo: '📋' },
    'SRI': { url: 'https://www.tax-sale.info', logo: '📊' },
};

// County to Platform Mapping - 200+ Major Counties
const COUNTY_PLATFORMS = {
    // TEXAS (254 counties - top 20)
    'Harris': { state: 'TX', platform: 'RealAuction', url: 'https://www.realauction.com/harris-county-tx', taxCollector: 'https://www.hctax.net' },
    'Dallas': { state: 'TX', platform: 'RealAuction', url: 'https://www.realauction.com/dallas-county-tx', taxCollector: 'https://www.dallascounty.org/departments/tax' },
    'Tarrant': { state: 'TX', platform: 'SRI', url: 'https://www.tax-sale.info/tarrant-county', taxCollector: 'https://www.tarrantcounty.com/taxoffice' },
    'Bexar': { state: 'TX', platform: 'County', url: 'https://www.bexar.org/taxsale', taxCollector: 'https://www.bexar.org/tax' },
    'Travis': { state: 'TX', platform: 'County', url: 'https://tax-office.traviscountytx.gov', taxCollector: 'https://tax-office.traviscountytx.gov' },
    'Collin': { state: 'TX', platform: 'RealAuction', url: 'https://www.realauction.com/collin-tx', taxCollector: 'https://www.collincountytx.gov/tax' },
    'Denton': { state: 'TX', platform: 'RealAuction', url: 'https://www.realauction.com/denton-tx', taxCollector: 'https://dentoncounty.gov/tax' },
    'Fort Bend': { state: 'TX', platform: 'RealAuction', url: 'https://www.realauction.com/fortbend-tx', taxCollector: 'https://www.fortbendcountytx.gov/tax' },
    'Hidalgo': { state: 'TX', platform: 'County', url: 'https://www.co.hidalgo.tx.us/tax', taxCollector: 'https://www.co.hidalgo.tx.us/tax' },
    'El Paso': { state: 'TX', platform: 'County', url: 'https://www.epcounty.com/tax', taxCollector: 'https://www.epcounty.com/tax' },
    'Williamson': { state: 'TX', platform: 'County', url: 'https://www.wilco.org/tax', taxCollector: 'https://www.wilco.org/tax' },
    'Montgomery': { state: 'TX', platform: 'RealAuction', url: 'https://www.realauction.com/montgomery-tx', taxCollector: 'https://www.mctx.org/tax' },

    // FLORIDA (67 counties - top 15)
    'Miami-Dade': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/miami-dade-fl', taxCollector: 'https://www.miamidade.gov/tax' },
    'Broward': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/broward-fl', taxCollector: 'https://www.broward.org/RecordsTaxesTreasury' },
    'Palm Beach': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/palm-beach-fl', taxCollector: 'https://www.pbctax.com' },
    'Hillsborough': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/hillsborough-fl', taxCollector: 'https://www.hillstax.org' },
    'Orange': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/orange-fl', taxCollector: 'https://www.octaxcol.com' },
    'Pinellas': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/pinellas-fl', taxCollector: 'https://www.pinellascounty.org/taxcoll' },
    'Duval': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/duval-fl', taxCollector: 'https://www.coj.net/tax' },
    'Lee': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/lee-fl', taxCollector: 'https://www.leetc.com' },
    'Polk': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/polk-fl', taxCollector: 'https://www.polktaxes.com' },
    'Brevard': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/brevard-fl', taxCollector: 'https://brevardtc.com' },
    'Volusia': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/volusia-fl', taxCollector: 'https://vcso.us/tax' },
    'Pasco': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/pasco-fl', taxCollector: 'https://www.pascotaxes.com' },
    'Seminole': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/seminole-fl', taxCollector: 'https://www.seminoletax.org' },
    'Sarasota': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/sarasota-fl', taxCollector: 'https://www.sarasotataxcollector.com' },
    'Manatee': { state: 'FL', platform: 'RealAuction', url: 'https://www.realauction.com/manatee-fl', taxCollector: 'https://www.taxcollector.com' },

    // ARIZONA (15 counties - all)
    'AZ-Maricopa': { state: 'AZ', platform: 'RealAuction', url: 'https://www.realauction.com/maricopa-az', taxCollector: 'https://treasurer.maricopa.gov' },
    'AZ-Pima': { state: 'AZ', platform: 'County', url: 'https://www.pima.gov/tax-lien-sale', taxCollector: 'https://www.pima.gov/treasurer' },
    'AZ-Pinal': { state: 'AZ', platform: 'County', url: 'https://www.pinalcountyaz.gov/treasurer', taxCollector: 'https://www.pinalcountyaz.gov/treasurer' },
    'AZ-Yavapai': { state: 'AZ', platform: 'County', url: 'https://www.yavapai.us/treasurer', taxCollector: 'https://www.yavapai.us/treasurer' },
    'AZ-Mohave': { state: 'AZ', platform: 'County', url: 'https://www.mohavecounty.us/treasurer', taxCollector: 'https://www.mohavecounty.us/treasurer' },
    'AZ-Yuma': { state: 'AZ', platform: 'County', url: 'https://www.yumacountyaz.gov/treasurer', taxCollector: 'https://www.yumacountyaz.gov/treasurer' },
    'AZ-Cochise': { state: 'AZ', platform: 'County', url: 'https://www.cochise.az.gov/treasurer', taxCollector: 'https://www.cochise.az.gov/treasurer' },
    'AZ-Coconino': { state: 'AZ', platform: 'County', url: 'https://www.coconino.az.gov/treasurer', taxCollector: 'https://www.coconino.az.gov/treasurer' },

    // GEORGIA (159 counties - top 15)
    'GA-Fulton': { state: 'GA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/fulton-ga', taxCollector: 'https://www.fultoncountytaxes.org' },
    'GA-DeKalb': { state: 'GA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/dekalb-ga', taxCollector: 'https://www.dekalbcountyga.gov/tax' },
    'GA-Gwinnett': { state: 'GA', platform: 'County', url: 'https://www.gwinnettcounty.com/taxsale', taxCollector: 'https://www.gwinnettcounty.com/tax' },
    'GA-Cobb': { state: 'GA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/cobb-ga', taxCollector: 'https://www.cobbcounty.org/tax' },
    'GA-Clayton': { state: 'GA', platform: 'County', url: 'https://www.claytoncountyga.gov/tax', taxCollector: 'https://www.claytoncountyga.gov/tax' },
    'GA-Cherokee': { state: 'GA', platform: 'County', url: 'https://www.cherokeega.com/tax', taxCollector: 'https://www.cherokeega.com/tax' },
    'GA-Forsyth': { state: 'GA', platform: 'County', url: 'https://www.forsythco.com/tax', taxCollector: 'https://www.forsythco.com/tax' },
    'GA-Henry': { state: 'GA', platform: 'County', url: 'https://www.co.henry.ga.us/tax', taxCollector: 'https://www.co.henry.ga.us/tax' },
    'GA-Augusta': { state: 'GA', platform: 'County', url: 'https://www.augustaga.gov/tax', taxCollector: 'https://www.augustaga.gov/tax' },
    'GA-Chatham': { state: 'GA', platform: 'County', url: 'https://www.chathamcounty.org/tax', taxCollector: 'https://www.chathamcounty.org/tax' },

    // CALIFORNIA (58 counties - top 15)
    'CA-Los Angeles': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/la-county', taxCollector: 'https://ttc.lacounty.gov' },
    'CA-San Diego': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/san-diego', taxCollector: 'https://www.sdttc.com' },
    'CA-Riverside': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/riverside-ca', taxCollector: 'https://www.countytreasurer.org' },
    'CA-San Bernardino': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/sanbernardino', taxCollector: 'https://www.sbcounty.gov/atc' },
    'CA-Santa Clara': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/santaclara', taxCollector: 'https://www.sccgov.org/tax' },
    'CA-Alameda': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/alameda-ca', taxCollector: 'https://www.acgov.org/treasurer' },
    'CA-Sacramento': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/sacramento', taxCollector: 'https://www.finance.saccounty.net' },
    'CA-Contra Costa': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/contracosta', taxCollector: 'https://www.cctax.us' },
    'CA-Fresno': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/fresno', taxCollector: 'https://www.co.fresno.ca.us/ttc' },
    'CA-Kern': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/kern', taxCollector: 'https://www.kcttc.co.kern.ca.us' },
    'CA-Ventura': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/ventura', taxCollector: 'https://www.ventura.org/ttc' },
    'CA-San Mateo': { state: 'CA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/sanmateo', taxCollector: 'https://www.smcacre.org' },

    // PENNSYLVANIA (67 counties - top 10)
    'PA-Philadelphia': { state: 'PA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/philadelphia', taxCollector: 'https://www.phila.gov/revenue' },
    'PA-Allegheny': { state: 'PA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/allegheny', taxCollector: 'https://www.alleghenycounty.us/real-estate' },
    'PA-Montgomery': { state: 'PA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/montgomery-pa', taxCollector: 'https://www.montcopa.org/tax' },
    'PA-Bucks': { state: 'PA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/bucks-pa', taxCollector: 'https://www.buckscounty.gov/tax' },
    'PA-Delaware': { state: 'PA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/delaware-pa', taxCollector: 'https://www.delcopa.gov/tax' },
    'PA-Chester': { state: 'PA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/chester-pa', taxCollector: 'https://www.chesco.org/tax' },
    'PA-Lancaster': { state: 'PA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/lancaster-pa', taxCollector: 'https://www.co.lancaster.pa.us/tax' },
    'PA-York': { state: 'PA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/york-pa', taxCollector: 'https://www.yorkcountypa.gov/tax' },

    // NEW JERSEY (21 counties - all major)
    'NJ-Essex': { state: 'NJ', platform: 'Zeusauction', url: 'https://www.zeusauction.com/essex-nj', taxCollector: 'https://www.essexcountynj.org' },
    'NJ-Hudson': { state: 'NJ', platform: 'Zeusauction', url: 'https://www.zeusauction.com/hudson-nj', taxCollector: 'https://www.hudsoncountynj.org' },
    'NJ-Bergen': { state: 'NJ', platform: 'Zeusauction', url: 'https://www.zeusauction.com/bergen-nj', taxCollector: 'https://www.bergencountynj.gov' },
    'NJ-Middlesex': { state: 'NJ', platform: 'Zeusauction', url: 'https://www.middlesexcountynj.gov', taxCollector: 'https://www.middlesexcountynj.gov' },
    'NJ-Union': { state: 'NJ', platform: 'Zeusauction', url: 'https://ucnj.org', taxCollector: 'https://ucnj.org' },
    'NJ-Passaic': { state: 'NJ', platform: 'Zeusauction', url: 'https://www.passaiccountynj.org', taxCollector: 'https://www.passaiccountynj.org' },
    'NJ-Monmouth': { state: 'NJ', platform: 'Zeusauction', url: 'https://www.visitmonmouth.com', taxCollector: 'https://www.visitmonmouth.com' },
    'NJ-Ocean': { state: 'NJ', platform: 'Zeusauction', url: 'https://www.co.ocean.nj.us', taxCollector: 'https://www.co.ocean.nj.us' },
    'NJ-Camden': { state: 'NJ', platform: 'Zeusauction', url: 'https://www.camdencounty.com', taxCollector: 'https://www.camdencounty.com' },
    'NJ-Morris': { state: 'NJ', platform: 'Zeusauction', url: 'https://www.morriscountynj.gov', taxCollector: 'https://www.morriscountynj.gov' },

    // ILLINOIS (102 counties - top 10)
    'IL-Cook': { state: 'IL', platform: 'GovEase', url: 'https://www.govease.com/cook-il', taxCollector: 'https://www.cookcountytreasurer.com' },
    'IL-DuPage': { state: 'IL', platform: 'GovEase', url: 'https://www.govease.com/dupage-il', taxCollector: 'https://www.dupageco.org/tax' },
    'IL-Lake': { state: 'IL', platform: 'GovEase', url: 'https://www.govease.com/lake-il', taxCollector: 'https://www.lakecountyil.gov/tax' },
    'IL-Will': { state: 'IL', platform: 'GovEase', url: 'https://www.govease.com/will-il', taxCollector: 'https://www.willcountyillinois.com/tax' },
    'IL-Kane': { state: 'IL', platform: 'GovEase', url: 'https://www.govease.com/kane-il', taxCollector: 'https://www.countyofkane.org/tax' },
    'IL-McHenry': { state: 'IL', platform: 'GovEase', url: 'https://www.govease.com/mchenry-il', taxCollector: 'https://www.mchenrycountyil.gov' },
    'IL-Winnebago': { state: 'IL', platform: 'GovEase', url: 'https://www.govease.com/winnebago-il', taxCollector: 'https://www.wincoil.us' },
    'IL-Madison': { state: 'IL', platform: 'GovEase', url: 'https://www.govease.com/madison-il', taxCollector: 'https://www.co.madison.il.us' },

    // OHIO (88 counties - top 10)
    'OH-Cuyahoga': { state: 'OH', platform: 'GovEase', url: 'https://www.govease.com/cuyahoga', taxCollector: 'https://fiscalofficer.cuyahogacounty.us' },
    'OH-Franklin': { state: 'OH', platform: 'GovEase', url: 'https://www.govease.com/franklin-oh', taxCollector: 'https://treasurer.franklincountyohio.gov' },
    'OH-Hamilton': { state: 'OH', platform: 'GovEase', url: 'https://www.govease.com/hamilton-oh', taxCollector: 'https://www.hamiltoncountytreasurer.org' },
    'OH-Summit': { state: 'OH', platform: 'GovEase', url: 'https://www.govease.com/summit-oh', taxCollector: 'https://fiscaloffice.summitoh.net' },
    'OH-Montgomery': { state: 'OH', platform: 'GovEase', url: 'https://www.govease.com/montgomery-oh', taxCollector: 'https://www.mctreasurer.org' },
    'OH-Lucas': { state: 'OH', platform: 'GovEase', url: 'https://www.govease.com/lucas-oh', taxCollector: 'https://www.co.lucas.oh.us/treasurer' },
    'OH-Stark': { state: 'OH', platform: 'GovEase', url: 'https://www.govease.com/stark-oh', taxCollector: 'https://starkcountyohio.gov/treasurer' },
    'OH-Butler': { state: 'OH', platform: 'GovEase', url: 'https://www.govease.com/butler-oh', taxCollector: 'https://www.butlercountyohio.org/treasurer' },

    // MICHIGAN (83 counties - top 10)
    'MI-Wayne': { state: 'MI', platform: 'GovEase', url: 'https://www.govease.com/wayne-mi', taxCollector: 'https://www.waynecounty.com/treasurer' },
    'MI-Oakland': { state: 'MI', platform: 'GovEase', url: 'https://www.govease.com/oakland-mi', taxCollector: 'https://www.oakgov.com/treasurer' },
    'MI-Macomb': { state: 'MI', platform: 'GovEase', url: 'https://www.govease.com/macomb-mi', taxCollector: 'https://treasurer.macombgov.org' },
    'MI-Kent': { state: 'MI', platform: 'GovEase', url: 'https://www.govease.com/kent-mi', taxCollector: 'https://www.accesskent.com/Treasurer' },
    'MI-Genesee': { state: 'MI', platform: 'GovEase', url: 'https://www.govease.com/genesee-mi', taxCollector: 'https://www.gc4me.com/treasurer' },
    'MI-Washtenaw': { state: 'MI', platform: 'GovEase', url: 'https://www.govease.com/washtenaw-mi', taxCollector: 'https://www.washtenaw.org/treasurer' },
    'MI-Ingham': { state: 'MI', platform: 'GovEase', url: 'https://www.govease.com/ingham-mi', taxCollector: 'https://tr.ingham.org' },
    'MI-Kalamazoo': { state: 'MI', platform: 'GovEase', url: 'https://www.govease.com/kalamazoo-mi', taxCollector: 'https://www.kalcounty.com/treasurer' },

    // INDIANA (92 counties - top 8)
    'IN-Marion': { state: 'IN', platform: 'GovEase', url: 'https://www.govease.com/marion-in', taxCollector: 'https://www.indy.gov/treasurer' },
    'IN-Lake': { state: 'IN', platform: 'GovEase', url: 'https://www.govease.com/lake-in', taxCollector: 'https://www.lakecountyin.org/treasurer' },
    'IN-Allen': { state: 'IN', platform: 'GovEase', url: 'https://www.govease.com/allen-in', taxCollector: 'https://www.allencounty.us/treasurer' },
    'IN-Hamilton': { state: 'IN', platform: 'GovEase', url: 'https://www.govease.com/hamilton-in', taxCollector: 'https://www.hamiltoncounty.in.gov/treasurer' },
    'IN-St. Joseph': { state: 'IN', platform: 'GovEase', url: 'https://www.govease.com/stjoseph-in', taxCollector: 'https://www.sjcindiana.com/treasurer' },
    'IN-Elkhart': { state: 'IN', platform: 'GovEase', url: 'https://www.govease.com/elkhart-in', taxCollector: 'https://www.elkhartcounty.com/treasurer' },

    // NEW YORK (62 counties - top 10)
    'NY-Kings': { state: 'NY', platform: 'Zeusauction', url: 'https://www.zeusauction.com/kings-ny', taxCollector: 'https://www.nyc.gov/finance' },
    'NY-Queens': { state: 'NY', platform: 'Zeusauction', url: 'https://www.zeusauction.com/queens-ny', taxCollector: 'https://www.nyc.gov/finance' },
    'NY-Manhattan': { state: 'NY', platform: 'Zeusauction', url: 'https://www.zeusauction.com/manhattan-ny', taxCollector: 'https://www.nyc.gov/finance' },
    'NY-Suffolk': { state: 'NY', platform: 'Zeusauction', url: 'https://www.zeusauction.com/suffolk-ny', taxCollector: 'https://www.suffolkcountyny.gov/tax' },
    'NY-Nassau': { state: 'NY', platform: 'Zeusauction', url: 'https://www.zeusauction.com/nassau-ny', taxCollector: 'https://www.nassaucountyny.gov/treasurer' },
    'NY-Bronx': { state: 'NY', platform: 'Zeusauction', url: 'https://www.zeusauction.com/bronx-ny', taxCollector: 'https://www.nyc.gov/finance' },
    'NY-Erie': { state: 'NY', platform: 'Zeusauction', url: 'https://www.zeusauction.com/erie-ny', taxCollector: 'https://www2.erie.gov/comptroller' },
    'NY-Westchester': { state: 'NY', platform: 'Zeusauction', url: 'https://www.zeusauction.com/westchester-ny', taxCollector: 'https://www.westchestergov.com/finance' },

    // NORTH CAROLINA (100 counties - top 10)
    'NC-Mecklenburg': { state: 'NC', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/mecklenburg-nc', taxCollector: 'https://www.mecknc.gov/tax' },
    'NC-Wake': { state: 'NC', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/wake-nc', taxCollector: 'https://www.wakegov.com/tax' },
    'NC-Guilford': { state: 'NC', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/guilford-nc', taxCollector: 'https://www.guilfordcountync.gov/tax' },
    'NC-Forsyth': { state: 'NC', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/forsyth-nc', taxCollector: 'https://www.forsyth.cc/tax' },
    'NC-Cumberland': { state: 'NC', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/cumberland-nc', taxCollector: 'https://www.cumberlandcountync.gov/tax' },
    'NC-Durham': { state: 'NC', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/durham-nc', taxCollector: 'https://www.dconc.gov/tax' },

    // VIRGINIA (133 counties - top 8)
    'VA-Fairfax': { state: 'VA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/fairfax-va', taxCollector: 'https://www.fairfaxcounty.gov/taxes' },
    'VA-Prince William': { state: 'VA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/princewilliam-va', taxCollector: 'https://www.pwcgov.org/tax' },
    'VA-Loudoun': { state: 'VA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/loudoun-va', taxCollector: 'https://www.loudoun.gov/tax' },
    'VA-Chesterfield': { state: 'VA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/chesterfield-va', taxCollector: 'https://www.chesterfield.gov/tax' },
    'VA-Henrico': { state: 'VA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/henrico-va', taxCollector: 'https://henrico.us/finance' },
    'VA-Virginia Beach': { state: 'VA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/virginiabeach', taxCollector: 'https://www.vbgov.com/finance' },

    // MARYLAND (24 counties - top 8)
    'MD-Montgomery': { state: 'MD', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/montgomery-md', taxCollector: 'https://www.montgomerycountymd.gov/finance' },
    'MD-Prince George\'s': { state: 'MD', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/princegeorges-md', taxCollector: 'https://www.princegeorgescountymd.gov/tax' },
    'MD-Baltimore County': { state: 'MD', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/baltimore-county', taxCollector: 'https://www.baltimorecountymd.gov/finance' },
    'MD-Baltimore City': { state: 'MD', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/baltimore-city', taxCollector: 'https://finance.baltimorecity.gov' },
    'MD-Anne Arundel': { state: 'MD', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/annearundel-md', taxCollector: 'https://www.aacounty.org/finance' },
    'MD-Howard': { state: 'MD', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/howard-md', taxCollector: 'https://www.howardcountymd.gov/finance' },

    // COLORADO (64 counties - top 8)
    'CO-Denver': { state: 'CO', platform: 'RealAuction', url: 'https://www.realauction.com/denver-co', taxCollector: 'https://www.denvergov.org/treasury' },
    'CO-El Paso': { state: 'CO', platform: 'RealAuction', url: 'https://www.realauction.com/elpaso-co', taxCollector: 'https://treasurer.elpasoco.com' },
    'CO-Arapahoe': { state: 'CO', platform: 'RealAuction', url: 'https://www.realauction.com/arapahoe-co', taxCollector: 'https://www.arapahoegov.com/treasurer' },
    'CO-Jefferson': { state: 'CO', platform: 'RealAuction', url: 'https://www.realauction.com/jefferson-co', taxCollector: 'https://www.jeffco.us/treasurer' },
    'CO-Adams': { state: 'CO', platform: 'RealAuction', url: 'https://www.realauction.com/adams-co', taxCollector: 'https://www.adcogov.org/treasurer' },
    'CO-Douglas': { state: 'CO', platform: 'RealAuction', url: 'https://www.realauction.com/douglas-co', taxCollector: 'https://www.douglas.co.us/treasurer' },
    'CO-Larimer': { state: 'CO', platform: 'RealAuction', url: 'https://www.realauction.com/larimer-co', taxCollector: 'https://www.larimer.org/treasurer' },
    'CO-Boulder': { state: 'CO', platform: 'RealAuction', url: 'https://www.realauction.com/boulder-co', taxCollector: 'https://www.bouldercounty.org/treasurer' },

    // IOWA (99 counties - top 6)
    'IA-Polk': { state: 'IA', platform: 'County', url: 'https://www.polkcountyiowa.gov/treasurer', taxCollector: 'https://www.polkcountyiowa.gov/treasurer' },
    'IA-Linn': { state: 'IA', platform: 'County', url: 'https://www.linncounty.org/treasurer', taxCollector: 'https://www.linncounty.org/treasurer' },
    'IA-Scott': { state: 'IA', platform: 'County', url: 'https://www.scottcountyiowa.gov/treasurer', taxCollector: 'https://www.scottcountyiowa.gov/treasurer' },
    'IA-Johnson': { state: 'IA', platform: 'County', url: 'https://www.johnson-county.com/treasurer', taxCollector: 'https://www.johnson-county.com/treasurer' },
    'IA-Black Hawk': { state: 'IA', platform: 'County', url: 'https://www.blackhawkcounty.iowa.gov/treasurer', taxCollector: 'https://www.blackhawkcounty.iowa.gov/treasurer' },
    'IA-Woodbury': { state: 'IA', platform: 'County', url: 'https://www.woodburycountyiowa.gov/treasurer', taxCollector: 'https://www.woodburycountyiowa.gov/treasurer' },

    // WASHINGTON (39 counties - top 6)
    'WA-King': { state: 'WA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/king-wa', taxCollector: 'https://kingcounty.gov/depts/finance' },
    'WA-Pierce': { state: 'WA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/pierce-wa', taxCollector: 'https://www.piercecountywa.gov/tax' },
    'WA-Snohomish': { state: 'WA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/snohomish-wa', taxCollector: 'https://www.snohomishcountywa.gov/treasurer' },
    'WA-Spokane': { state: 'WA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/spokane-wa', taxCollector: 'https://www.spokanecounty.org/treasurer' },
    'WA-Clark': { state: 'WA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/clark-wa', taxCollector: 'https://www.clark.wa.gov/treasurer' },
    'WA-Thurston': { state: 'WA', platform: 'Bid4Assets', url: 'https://www.bid4assets.com/thurston-wa', taxCollector: 'https://www.thurstoncountywa.gov/treasurer' },

    // MINNESOTA (87 counties - top 6)
    'MN-Hennepin': { state: 'MN', platform: 'County', url: 'https://www.hennepin.us/residents/property/tax-forfeited-land', taxCollector: 'https://www.hennepin.us/property-taxes' },
    'MN-Ramsey': { state: 'MN', platform: 'County', url: 'https://www.ramseycounty.us/residents/property/tax-forfeited-land', taxCollector: 'https://www.ramseycounty.us/property-taxes' },
    'MN-Dakota': { state: 'MN', platform: 'County', url: 'https://www.co.dakota.mn.us/Government/PropertyTaxes', taxCollector: 'https://www.co.dakota.mn.us/Government/PropertyTaxes' },
    'MN-Anoka': { state: 'MN', platform: 'County', url: 'https://www.anokacounty.us/tax', taxCollector: 'https://www.anokacounty.us/tax' },
    'MN-Washington': { state: 'MN', platform: 'County', url: 'https://www.co.washington.mn.us/property-taxes', taxCollector: 'https://www.co.washington.mn.us/property-taxes' },
    'MN-Scott': { state: 'MN', platform: 'County', url: 'https://www.scottcountymn.gov/tax', taxCollector: 'https://www.scottcountymn.gov/tax' },

    // NEVADA (17 counties - top 4)
    'NV-Clark': { state: 'NV', platform: 'County', url: 'https://www.clarkcountynv.gov/tax-sale', taxCollector: 'https://www.clarkcountynv.gov/treasurer' },
    'NV-Washoe': { state: 'NV', platform: 'County', url: 'https://www.washoecounty.us/treasurer', taxCollector: 'https://www.washoecounty.us/treasurer' },
    'NV-Nye': { state: 'NV', platform: 'County', url: 'https://www.nyecounty.net/treasurer', taxCollector: 'https://www.nyecounty.net/treasurer' },
    'NV-Elko': { state: 'NV', platform: 'County', url: 'https://www.elkocountynv.net/treasurer', taxCollector: 'https://www.elkocountynv.net/treasurer' },
};

// State-level auction info - ALL 51 JURISDICTIONS
const STATE_AUCTION_DETAILS = {
    // === LIEN STATES (26) ===
    'AL': { type: 'Lien', rate: '12%', redemption: '3 years', frequency: 'May-June', platform: 'County' },
    'AZ': { type: 'Lien', rate: '16% max (bid down)', redemption: '3 years', frequency: 'February', platform: 'RealAuction' },
    'CO': { type: 'Lien', rate: 'Fed+9%', redemption: '3 years', frequency: 'November', platform: 'RealAuction' },
    'FL': { type: 'Lien', rate: '18% max (bid down)', redemption: '2 years', frequency: 'May-June', platform: 'RealAuction' },
    'GA': { type: 'Lien', rate: '20% (escalates to 40%)', redemption: '1 year', frequency: '1st Tuesday monthly', platform: 'Bid4Assets' },
    'IL': { type: 'Lien', rate: '18% (bid down)', redemption: '2-3 years', frequency: 'Oct-Nov', platform: 'GovEase' },
    'IN': { type: 'Lien', rate: '10-15% graduated', redemption: '1 year', frequency: 'Sept-Oct', platform: 'GovEase' },
    'IA': { type: 'Lien', rate: '24% (HIGHEST IN US)', redemption: '1yr 9mo', frequency: 'June 3rd Monday', platform: 'County (in-person)' },
    'KY': { type: 'Lien', rate: '12%', redemption: '1 year', frequency: 'July-Aug', platform: 'County' },
    'LA': { type: 'Lien', rate: 'Bid-down (reformed 2024)', redemption: '3 years', frequency: 'June-July', platform: 'CivicSource' },
    'MD': { type: 'Lien', rate: '18-24%', redemption: '6 months', frequency: 'May-June', platform: 'Bid4Assets' },
    'MS': { type: 'Lien', rate: '18%', redemption: '2 years', frequency: 'August', platform: 'County' },
    'MO': { type: 'Lien', rate: '10%', redemption: '2 years', frequency: 'August 4th Monday', platform: 'County' },
    'MT': { type: 'Lien', rate: '10%', redemption: '2-3 years', frequency: 'July', platform: 'County' },
    'NE': { type: 'Lien', rate: '14%', redemption: '3 years', frequency: 'March 1st Monday', platform: 'GovEase' },
    'NH': { type: 'Lien', rate: '18%', redemption: '2 years', frequency: 'May-June', platform: 'Town' },
    'NJ': { type: 'Lien', rate: '18% (bid down)', redemption: '2 years', frequency: 'Oct-Dec', platform: 'Zeusauction' },
    'OK': { type: 'Lien', rate: '8%', redemption: '2 years', frequency: 'June 2nd Monday', platform: 'County' },
    'RI': { type: 'Lien', rate: '10% + 1%/mo', redemption: '1 year', frequency: 'December', platform: 'City/Town' },
    'SC': { type: 'Lien', rate: '8% penalty', redemption: '1 year', frequency: 'Oct-Nov', platform: 'County' },
    'SD': { type: 'Lien', rate: '12% (max 10% bid)', redemption: '3-4 years', frequency: 'Dec 3rd Tuesday', platform: 'County' },
    'VT': { type: 'Lien', rate: '12%', redemption: '1 year', frequency: 'April-July', platform: 'Town' },
    'WV': { type: 'Lien', rate: '12%', redemption: '1 year', frequency: 'Oct-Nov', platform: 'County' },
    'WY': { type: 'Lien', rate: '15% + 3% penalty', redemption: '4 years', frequency: 'September', platform: 'County' },
    'CT': { type: 'Lien', rate: '18%', redemption: '6 months', frequency: 'June-July', platform: 'County' },
    'DC': { type: 'Lien', rate: '18%', redemption: '6 months', frequency: 'July', platform: 'DC Government' },
    'MA': { type: 'Lien', rate: '16%', redemption: "Collector's deed", frequency: 'Varies', platform: 'Town Collector' },

    // === DEED STATES (25) ===
    'TX': { type: 'Deed', rate: '25% penalty', redemption: '6mo-2yr', frequency: '1st Tuesday monthly', platform: 'RealAuction' },
    'CA': { type: 'Deed', rate: 'N/A', redemption: '5yr pre-sale', frequency: 'Varies', platform: 'Bid4Assets' },
    'MI': { type: 'Deed', rate: 'N/A', redemption: 'None after sale', frequency: 'July 3rd Tuesday', platform: 'GovEase' },
    'OH': { type: 'Deed', rate: 'N/A', redemption: 'None after sale', frequency: 'Year-round', platform: 'GovEase' },
    'PA': { type: 'Deed', rate: 'N/A', redemption: 'None after upset', frequency: 'Monthly/Quarterly', platform: 'Bid4Assets' },
    'NY': { type: 'Deed', rate: 'N/A', redemption: '2-4 years', frequency: 'Spring/Fall', platform: 'Zeusauction' },
    'AK': { type: 'Deed', rate: 'N/A', redemption: '1 year', frequency: 'Varies', platform: 'Borough/City' },
    'AR': { type: 'Deed', rate: 'N/A', redemption: '30 days', frequency: 'Varies', platform: 'County' },
    'DE': { type: 'Deed', rate: '15% penalty', redemption: '60 days', frequency: 'Annual', platform: 'Bid4Assets' },
    'HI': { type: 'Deed', rate: 'N/A', redemption: '1 year', frequency: 'Varies', platform: 'County' },
    'ID': { type: 'Deed', rate: 'N/A', redemption: '3yr before deed', frequency: 'January', platform: 'County' },
    'KS': { type: 'Deed', rate: 'N/A', redemption: 'Court judgment', frequency: 'September', platform: 'County' },
    'ME': { type: 'Deed', rate: 'N/A', redemption: '18 months', frequency: 'Varies', platform: 'Town' },
    'MN': { type: 'Deed', rate: 'N/A', redemption: 'None after sale', frequency: 'May', platform: 'County' },
    'NC': { type: 'Deed', rate: 'N/A', redemption: 'Upset bid period', frequency: 'Varies', platform: 'Bid4Assets' },
    'ND': { type: 'Deed', rate: 'Max 9% (bid down)', redemption: '4 years', frequency: 'October', platform: 'County' },
    'NM': { type: 'Deed', rate: 'N/A', redemption: '120 days IRS only', frequency: 'Varies', platform: 'County' },
    'NV': { type: 'Deed', rate: 'N/A', redemption: '2yr before deed', frequency: 'June', platform: 'County' },
    'OR': { type: 'Deed', rate: 'N/A', redemption: '2yr before deed', frequency: 'Varies', platform: 'County' },
    'TN': { type: 'Deed', rate: 'N/A', redemption: '1 year', frequency: 'Varies', platform: 'County' },
    'UT': { type: 'Deed', rate: 'N/A', redemption: '4yr before deed', frequency: 'May', platform: 'County' },
    'VA': { type: 'Deed', rate: 'N/A', redemption: 'Varies by locality', frequency: 'Varies', platform: 'Bid4Assets' },
    'WA': { type: 'Deed', rate: 'N/A', redemption: 'None', frequency: 'Varies', platform: 'Bid4Assets' },
    'WI': { type: 'Deed', rate: 'N/A', redemption: '2yr to county', frequency: 'Varies', platform: 'County' },
};

// Get county auction info with platform links (listings now fetched from API)
const getCountyAuctionInfo = (countyName, stateAbbr) => {
    const countyInfo = COUNTY_PLATFORMS[countyName];
    const stateInfo = STATE_AUCTION_DETAILS[stateAbbr] || { type: 'Deed', rate: 'Varies', platform: 'County' };

    return {
        platform: countyInfo?.platform || stateInfo.platform || 'County',
        platformUrl: countyInfo?.url || AUCTION_PLATFORMS[stateInfo.platform]?.url || null,
        taxCollectorUrl: countyInfo?.taxCollector || null,
        saleType: stateInfo.type,
        interestRate: stateInfo.rate,
        redemption: stateInfo.redemption,
        frequency: stateInfo.frequency,
    };
};

export default function AuctionPlatform() {
    const { user, signOut } = useAuth();
    const { addToWatchlist, isInWatchlist } = useWatchlist();
    const toast = useToast();
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
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // User dropdown menu state
    const [proMode, setProMode] = useState(false); // Toggle for advanced visuals

    // API-driven data with fallbacks to static data
    const [COUNTIES, setCOUNTIES] = useState(STATIC_COUNTIES);
    const [STATE_AUCTION_INFO, setSTATE_AUCTION_INFO] = useState(STATIC_STATE_AUCTION_INFO);
    const [apiStatus, setApiStatus] = useState('connecting'); // 'connecting', 'live', 'offline'
    const [realListings, setRealListings] = useState([]); // Real HUD/REO listings from API
    const [listingsLoading, setListingsLoading] = useState(false);
    const [selectedPropertyForModal, setSelectedPropertyForModal] = useState(null); // Property detail modal
    const [mapFocus, setMapFocus] = useState(null); // { lat, lng } to focus map
    const [dueDiligenceProperty, setDueDiligenceProperty] = useState(null); // Full Due Diligence view
    const [showWelcome, setShowWelcome] = useState(true);
    const [realAuctions, setRealAuctions] = useState([]);

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

                // Try to fetch Census API data (all 3,143 counties)
                const censusRes = await fetch(`${API_BASE}/census/counties`);
                if (censusRes.ok) {
                    const censusData = await censusRes.json();
                    if (censusData.data && censusData.data.length > 0) {
                        // Transform Census data to expected format, grouped by state
                        const countyMap = {};
                        censusData.data.forEach(c => {
                            if (!countyMap[c.state]) countyMap[c.state] = [];
                            // Format: [name, pop, income, zhvi, growth, dom, tier, notes]
                            // Census provides: name, population, median_income, median_home_value, tier
                            countyMap[c.state].push([
                                c.name,
                                c.population,
                                c.median_income,
                                c.median_home_value,
                                0, // growth (not in Census data)
                                45, // days on market (default)
                                c.tier,
                                `FIPS: ${c.fips}`
                            ]);
                        });
                        setCOUNTIES(countyMap);
                        console.log(`Loaded ${censusData.total_counties} counties from Census API`);
                    }
                } else {
                    // Fallback to legacy counties endpoint
                    const countyRes = await fetch(`${API_BASE}/counties`);
                    if (countyRes.ok) {
                        const countyData = await countyRes.json();
                        const countyMap = {};
                        countyData.forEach(c => {
                            if (!countyMap[c.state]) countyMap[c.state] = [];
                            countyMap[c.state].push([
                                c.name, c.pop, c.income, c.zhvi, c.growth, c.dom, c.tier, c.notes
                            ]);
                        });
                        setCOUNTIES(countyMap);
                    }
                }

                setApiStatus('live');

                // Fetch live auctions
                const auctionRes = await fetch(`${API_BASE}/auctions`);
                if (auctionRes.ok) {
                    const auctionData = await auctionRes.json();
                    if (auctionData.auctions) {
                        setRealAuctions(auctionData.auctions);

                        // Generate alerts from real auctions (clear and concise)
                        const newAlerts = auctionData.auctions
                            .filter(a => {
                                const saleDate = new Date(a.sale_date);
                                const today = new Date();
                                const diffDays = Math.ceil((saleDate - today) / (1000 * 60 * 60 * 24));
                                return diffDays > 0 && diffDays <= 7; // Sales in next 7 days
                            })
                            .map(a => {
                                const isHighGrade = ['TX', 'FL', 'GA', 'AZ', 'IA', 'CO'].includes(a.state);
                                return {
                                    id: `auction-${a.id}`,
                                    type: isHighGrade ? 'high-priority' : 'auction',
                                    message: `${isHighGrade ? '🔥 [HIGH GRADE] ' : ''}${a.county}, ${a.state} sale in ${Math.ceil((new Date(a.sale_date) - new Date()) / (1000 * 60 * 60 * 24))} days`,
                                    time: 'Just now',
                                    read: false
                                };
                            });

                        if (newAlerts.length > 0) {
                            const existing = JSON.parse(localStorage.getItem('auction_alerts') || '[]');
                            const merged = [...newAlerts, ...existing.filter(e => !newAlerts.some(n => n.id === e.id))].slice(0, 20);
                            localStorage.setItem('auction_alerts', JSON.stringify(merged));
                        }
                    }
                }
            } catch (err) {
                console.warn('Backend API unavailable, using static data:', err.message);
                setApiStatus('offline');
            }
        };

        fetchData();
    }, []);

    // Listen for geospatial requests from PropertyModal (also fires custom event)
    useEffect(() => {
        const handler = (e) => {
            const p = e?.detail || null;
            if (!p) return;
            const lat = p?.lat || p?.latitude || (p?.location && p.location.lat) || (p?.coords && p.coords[0]) || null;
            const lng = p?.lng || p?.longitude || (p?.location && p.location.lng) || (p?.coords && p.coords[1]) || null;
            if (lat && lng) setMapFocus({ lat: Number(lat), lng: Number(lng) });
            setView('map');
        };
        window.addEventListener('aim:geospatial', handler);
        return () => window.removeEventListener('aim:geospatial', handler);
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

    const auctionInfo = useMemo(() => {
        return selectedCounty && selectedState ? getCountyAuctionInfo(selectedCounty[0], selectedState) : null;
    }, [selectedCounty, selectedState]);

    // Fetch real HUD/REO listings from backend API when state changes
    useEffect(() => {
        if (!selectedState) {
            setRealListings([]);
            return;
        }

        const fetchListings = async () => {
            setListingsLoading(true);
            try {
                const res = await fetch(`${API_BASE}/foreclosures/${selectedState}`);
                if (res.ok) {
                    const data = await res.json();
                    setRealListings(data.properties || []);
                } else {
                    setRealListings([]);
                }
            } catch (err) {
                console.warn('Failed to fetch foreclosure listings:', err.message);
                setRealListings([]);
            } finally {
                setListingsLoading(false);
            }
        };

        fetchListings();
    }, [selectedState]);

    const parcels = realListings; // Now using real API data

    // Normalize a backend ForeclosureProperty (HUD/Fannie/Freddie) into the shape USMap expects.
    // Key behavior: preserves backend-supplied lat/lng so markers land on exact city centroids;
    // falls back to resolvePropertyCoords' deterministic jitter when either is missing.
    const foreclosureToProperty = (p, idx) => {
        const categoryBySource = { HUD: 'mortgage', 'Fannie Mae': 'mortgage', 'Freddie Mac': 'mortgage' };
        return {
            id: `${p.state}-${p.city}-${p.address}-${idx}`.replace(/\s+/g, '-'),
            address: p.address,
            city: p.city,
            state: p.state,
            zip: p.zip,
            county: '',
            propertyType: p.property_type || 'Single Family',
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            sqft: p.sqft,
            yearBuilt: 0,
            auctionDate: p.listing_date,
            openingBid: p.price,
            estimatedValue: Math.round((p.price || 0) * 1.35),
            category: categoryBySource[p.source] || 'other',
            tier: 2,
            source: p.source,
            lat: p.lat ?? null,
            lng: p.lng ?? null,
        };
    };

    // Source of truth for the Map view: prefer live backend listings for the selected state,
    // otherwise fall back to the in-repo SAMPLE_PROPERTIES so the map is never empty.
    const mapProperties = useMemo(() => {
        if (Array.isArray(realListings) && realListings.length > 0) {
            return realListings.map(foreclosureToProperty);
        }
        return SAMPLE_PROPERTIES;
    }, [realListings]);

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
            toast.success('Copied to clipboard!');
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
        <div className="flex h-screen bg-surface overflow-hidden text-sm font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            {/* Sidebar - Premium Dark Theme with Mobile Responsiveness */}
            <aside className={`fixed md:relative w-64 bg-surface text-slate-700 flex flex-col shadow-none z-50 h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 border-b border-slate-200/50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface rounded-sm flex items-center justify-center text-white font-mono font-semibold text-xl shadow-none shadow-indigo-500/15">A</div>
                    <div>
                        <div className="font-mono font-semibold text-white tracking-tight text-base">AUCTION INTEL</div>
                        <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">System Control v4.0</div>
                    </div>
                </div>

                <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide px-3">
                    {/* 1 DISCOVER */}
                    <div className="mb-5">
                        <div className="text-[9px] font-semibold text-indigo-500 uppercase tracking-[0.2em] mb-2 px-2 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center text-[8px]">1</span>
                            <span>Explore</span>
                        </div>
                        <div className="space-y-0.5">
                            {[
                                { id: 'map', label: 'Market Map', icon: '🗺️' },
                                { id: 'auctions', label: 'Live Auctions', icon: '🔨' },
                                { id: 'properties', label: 'Properties', icon: '🏠' },
                            ].map(item => (
                                <button key={item.id}
                                    onClick={() => { setView(item.id); setSelectedCounty(null); }}
                                    onMouseEnter={item.id === 'map' ? prefetchMap : undefined}
                                    onFocus={item.id === 'map' ? prefetchMap : undefined}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${view === item.id ? 'bg-indigo-600 text-white font-bold shadow-none' : 'hover:bg-slate-100 text-slate-600 hover:text-white'}`}>
                                    <span className="text-sm">{item.icon}</span>
                                    <span className="text-xs font-semibold">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2 RESEARCH */}
                    <div className="mb-5">
                        <div className="text-[9px] font-semibold text-emerald-600 uppercase tracking-[0.2em] mb-2 px-2 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center text-[8px]">2</span>
                            <span>Research</span>
                        </div>
                        <div className="space-y-0.5">
                            {[
                                { id: 'stateinfo', label: 'State Database', icon: '⚖️' },
                                { id: 'calendar', label: 'Auction Calendar', icon: '📅' },
                                { id: 'roi', label: 'ROI Calculator', icon: '💰' },
                                { id: 'forecaster', label: 'AI Forecaster', icon: '🔮' },
                            ].map(item => (
                                <button key={item.id} onClick={() => { setView(item.id); setSelectedCounty(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${view === item.id ? 'bg-emerald-600 text-white font-bold shadow-none' : 'hover:bg-slate-100 text-slate-600 hover:text-white'}`}>
                                    <span className="text-sm">{item.icon}</span>
                                    <span className="text-xs font-semibold">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3 MY PORTFOLIO */}
                    <div className="mb-5">
                        <div className="text-[9px] font-semibold text-amber-400 uppercase tracking-[0.2em] mb-2 px-2 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-amber-100 flex items-center justify-center text-[8px]">3</span>
                            <span>Portfolio</span>
                        </div>
                        <div className="space-y-0.5">
                            {[
                                { id: 'watchlist', label: 'Watchlist', icon: '⭐' },
                                { id: 'alerts', label: 'Alerts', icon: '🔔' },
                            ].map(item => (
                                <button key={item.id} onClick={() => { setView(item.id); setSelectedCounty(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${view === item.id ? 'bg-amber-600 text-white font-bold shadow-none' : 'hover:bg-slate-100 text-slate-600 hover:text-white'}`}>
                                    <span className="text-sm">{item.icon}</span>
                                    <span className="text-xs font-semibold">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mb-4 pt-3 border-t border-slate-200">
                        <div className="space-y-0.5">
                            {[
                                { id: 'guide', label: 'Quick Start', icon: '📖' },
                                { id: 'settings', label: 'Settings', icon: '⚙️' },
                            ].map(item => (
                                <button key={item.id} onClick={() => { setView(item.id); setSelectedCounty(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${view === item.id ? 'bg-panel-2 text-white font-bold' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
                                    <span className="text-sm">{item.icon}</span>
                                    <span className="text-xs">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tier Filter */}
                    <div className="pt-3 border-t border-slate-200">
                        <div className="text-[8px] font-bold text-slate-600 uppercase tracking-wider mb-2 px-2">Filter by Tier</div>
                        <div className="px-2">
                            <div className="grid grid-cols-5 gap-1">
                                {[1, 2, 3, 4, 5].map(t => (
                                    <button key={t} onClick={() => setFilterTier(t)}
                                        className={`h-6 rounded text-[9px] font-bold transition-all ${filterTier >= t ? 'text-white' : 'bg-panel text-slate-600 hover:bg-slate-200'}`}
                                        style={filterTier >= t ? { backgroundColor: TIERS[t].color } : {}}>
                                        T{t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="p-4 bg-panel/20 border-t border-slate-200/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Backend Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold tracking-tighter uppercase ${apiStatus === 'live' ? 'text-green-500' : apiStatus === 'connecting' ? 'text-yellow-500' : 'text-slate-500'}`}>
                                {apiStatus === 'live' ? 'LIVE' : apiStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
                            </span>
                            <span className={`w-2 h-2 rounded-sm ${apiStatus === 'live' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-none' : apiStatus === 'connecting' ? 'bg-yellow-500 animate-none' : 'bg-slate-400'}`}></span>
                        </div>
                    </div>
                    <div className="p-2.5 bg-surface rounded-lg border border-slate-200 text-[9px] font-bold text-slate-600 tracking-tight">
                        {apiStatus === 'live' ? 'BACKEND API: localhost:8080' : apiStatus === 'connecting' ? 'CONNECTING TO BACKEND...' : 'USING STATIC DATA (BACKEND OFFLINE)'}
                    </div>
                    {apiStatus === 'live' && (
                        <div className="mt-2 p-2.5 bg-white/50 rounded-lg border border-blue-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base">🏠</span>
                                    <span className="text-[9px] font-bold text-indigo-400">Zillow ZHVI</span>
                                </div>
                                <span className="text-[8px] font-bold text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded">3,073 Counties</span>
                            </div>
                        </div>
                    )}
                    {apiStatus === 'live' && (
                        <div className="mt-2 p-2.5 bg-white/50 rounded-lg border border-red-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base">📈</span>
                                    <span className="text-[9px] font-bold text-rose-500">Redfin Market</span>
                                </div>
                                <span className="text-[8px] font-bold text-rose-600 bg-red-900/50 px-1.5 py-0.5 rounded">DOM • S/L</span>
                            </div>
                        </div>
                    )}
                    {apiStatus === 'live' && (
                        <div className="mt-2 p-2.5 bg-white/50 rounded-lg border border-green-800/50">
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
            <main className="flex-1 flex flex-col relative overflow-hidden bg-surface w-full">
                {/* Top Navigation Bar - All elements visible on all devices */}
                <header className="bg-white/85 backdrop-blur-xl border-b border-slate-300/60 shadow-none shrink-0 z-40 relative">
                    {/* Main header row */}
                    <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
                        {/* Left: Hamburger + Title */}
                        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                            {/* Mobile Hamburger Menu */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-surface hover:bg-slate-200 transition-colors shrink-0"
                            >
                                <span className="text-lg">{isSidebarOpen ? '✕' : '☰'}</span>
                            </button>

                            <div className="min-w-0">
                                <div className="hidden md:flex items-center gap-2 mb-0.5">
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-sm"></span>
                                    <span className="text-[9px] text-slate-600 uppercase font-semibold tracking-[0.2em]">
                                        {view === 'properties' ? 'Property Intelligence' :
                                            view === 'alerts' ? 'Alert Management' :
                                                view === 'watchlist' ? 'My Watchlist' :
                                                    view === 'portfolio' ? 'Fund Manager' :
                                                    view === 'market' ? 'Market Analytics' :
                                                        view === 'roi' ? 'ROI Calculator' :
                                                            view === 'stateinfo' ? 'State Database' :
                                                                view === 'detection' ? 'County Analysis' :
                                                                    view === 'heatmap' ? 'Opportunity Heatmap' :
                                                                        view === 'auctions' ? 'Auction Calendar' :
                                                                            view === 'calendar' ? 'Auction Schedule' :
                                                                                'Global Statistics'}
                                    </span>
                                </div>
                                <div className="font-mono font-semibold text-sm md:text-xl text-slate-900 tracking-tighter truncate">
                                    {view === 'properties' ? 'Live Property Feed' :
                                        view === 'alerts' ? 'Alert Settings' :
                                            view === 'watchlist' ? 'Saved Counties' :
                                                view === 'portfolio' ? 'Portfolio Fund Manager' :
                                                    view === 'market' ? 'Market Data Dashboard' :
                                                    view === 'roi' ? 'Investment Calculator' :
                                                        view === 'stateinfo' ? 'State Rules & Info' :
                                                            view === 'detection' ? 'County Tier Detection' :
                                                                view === 'heatmap' ? 'Best Opportunities' :
                                                                    view === 'auctions' ? 'Upcoming Auctions' :
                                                                        view === 'calendar' ? '2026 Auction Calendar' :
                                                                            view === 'forecaster' ? 'AI Market Forecaster' :
                                                                                selectedCounty ? `${selectedCounty[0]} Region` :
                                                                                    selectedState ? STATE_NAMES[selectedState] :
                                                                                        'Auction Intel'}
                                </div>
                            </div>
                        </div>

                        {/* Right: User Profile Dropdown */}
                        <div className="relative flex items-center gap-2 md:gap-3 shrink-0">
                            <div className="hidden sm:flex flex-col text-right">
                                <div className="text-[9px] md:text-[10px] font-semibold text-slate-900 uppercase tracking-tight">{user?.name || 'User'}</div>
                                <div className="hidden md:flex gap-1 justify-end items-center">
                                    <span className="w-1 h-1 bg-indigo-500 rounded-sm"></span>
                                    <div className="text-[8px] text-indigo-600 font-bold uppercase">Premium</div>
                                </div>
                            </div>
                            {/* Notification Bell */}
                            <NotificationBell onClick={() => setView('alerts')} />
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-sm bg-surface flex items-center justify-center text-white font-mono font-semibold text-xs md:text-sm shadow-none hover:scale-105 transition-transform"
                            >
                                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                            </button>

                            {/* User Dropdown Menu */}
                            {isUserMenuOpen && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    />
                                    {/* Dropdown */}
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-canvas rounded-md shadow-none border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in- duration-200">
                                        {/* User Info */}
                                        <div className="p-4 bg-surface to-white border-b border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-sm bg-surface flex items-center justify-center text-white font-mono font-semibold text-lg shadow-none">
                                                    {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-mono font-bold text-slate-900 truncate">{user?.name || 'User'}</div>
                                                    <div className="text-xs text-slate-500 truncate">{user?.email || ''}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="p-2">
                                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left text-slate-700 hover:bg-slate-100 transition-colors">
                                                <span>👤</span>
                                                <span className="text-sm font-medium">Profile Settings</span>
                                            </button>
                                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left text-slate-700 hover:bg-slate-100 transition-colors">
                                                <span>⚙️</span>
                                                <span className="text-sm font-medium">Preferences</span>
                                            </button>
                                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left text-slate-700 hover:bg-slate-100 transition-colors">
                                                <span>💎</span>
                                                <span className="text-sm font-medium">Upgrade Plan</span>
                                            </button>
                                        </div>

                                        {/* Sign Out */}
                                        <div className="p-2 border-t border-slate-200">
                                            <button
                                                onClick={() => { setIsUserMenuOpen(false); signOut(); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left text-rose-600 hover:bg-red-50 transition-colors"
                                            >
                                                <span>🚪</span>
                                                <span className="text-sm font-medium">Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
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
                                className="w-full bg-white/80 border-slate-300 border rounded-lg md:rounded-sm px-4 py-2 md:py-2.5 pl-9 md:pl-10 text-sm font-medium focus:ring-2 focus:ring-indigo-200 focus:bg-canvas focus:outline-none transition-all"
                            />
                            <span className="absolute left-3 top-2 md:top-2.5 text-slate-600">🔍</span>
                            {searchResults.length > 0 && (
                                <div className="absolute top-[calc(100%+4px)] left-0 right-0 md:right-auto md:w-80 bg-canvas rounded-sm shadow-none border border-slate-200 z-[100] overflow-hidden py-2 max-h-72 overflow-y-auto">
                                    <div className="px-3 py-1.5 text-[9px] font-semibold text-slate-600 uppercase tracking-widest border-b border-slate-200">Search Results</div>
                                    {searchResults.map((r, i) => {
                                        if (!r.county) {
                                            const auctionInfo = STATE_AUCTION_INFO[r.abbr];
                                            return (
                                                <div key={i} onClick={() => { setSelectedState(r.abbr); setSelectedCounty(null); setSearch(''); setView('list'); setIsSidebarOpen(false); }}
                                                    className="flex items-center justify-between px-3 py-2 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-md bg-surface flex items-center justify-center text-white text-xs font-semibold">{r.abbr}</div>
                                                        <div className="font-bold text-slate-900 text-sm">{r.state}</div>
                                                    </div>
                                                    {auctionInfo && <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white ${auctionInfo.type === 'Lien' ? 'bg-indigo-600' : 'bg-slate-300'}`}>{auctionInfo.type}</span>}
                                                </div>
                                            );
                                        }
                                        const [name, , , , growth, , tier] = r.county;
                                        const t = TIERS[tier];
                                        const isAlpha = tier <= 2 && growth > 5;
                                        return (
                                            <div key={i} onClick={() => { setSelectedState(r.abbr); setSelectedCounty(r.county); setSearch(''); setView('list'); setIsSidebarOpen(false); }}
                                                className="flex items-center justify-between px-3 py-2 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200 last:border-0 group">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-sm truncate">{name}, {r.abbr}</span>
                                                        {isAlpha && <span className="text-[7px] font-semibold bg-indigo-600 text-white px-1.2 py-0.5 rounded-sm animate-none tracking-tighter">AI ALPHA</span>}
                                                    </div>
                                                    <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">Tier {tier} Opportunity</div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded text-[9px] font-semibold text-white" style={{ background: t.color }}>{t.label}</span>
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
                            <div className="space-y-8 animate-in fade-in slide-in- duration-500">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <button onClick={() => setSelectedCounty(null)} className="group text-slate-600 font-bold hover:text-indigo-600 flex items-center gap-2 mb-3 transition-colors">
                                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                                            <span className="uppercase tracking-[0.15em] text-[9px] font-semibold">Return to {STATE_NAMES[selectedState]}</span>
                                        </button>
                                        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                                            <h1 className="text-lg font-mono md:text-3xl font-mono font-semibold text-slate-900 tracking-tighter">{selectedCounty[0]}</h1>
                                            <div className="flex items-center gap-2 bg-canvas px-4 py-2 rounded-sm shadow-none border border-slate-200">
                                                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: TIERS[selectedCounty[6]].color }}></span>
                                                <span className="text-sm font-semibold text-slate-900 uppercase tracking-tight">{TIERS[selectedCounty[6]].name}</span>
                                                <span className="text-xs font-bold text-slate-600">/ Tier {selectedCounty[6]}</span>
                                            </div>
                                            {/* Auction Type Badge */}
                                            {STATE_AUCTION_INFO[selectedState] && (
                                                <div className={`flex items-center gap-2 px-4 py-2 rounded-sm shadow-none border ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'bg-blue-950/40 border-indigo-200' : 'bg-surface border-slate-300'}`}>
                                                    <span className={`w-2.5 h-2.5 rounded-sm ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
                                                    <span className={`text-sm font-semibold uppercase tracking-tight ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'text-indigo-500' : 'text-slate-900'}`}>
                                                        {STATE_AUCTION_INFO[selectedState].type}
                                                    </span>
                                                    <span className={`text-xs font-bold ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                        {STATE_AUCTION_INFO[selectedState].interestRate !== 'N/A' ? STATE_AUCTION_INFO[selectedState].interestRate : ''}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Auction Countdown Timer */}
                                            <StateCountdown stateAbbr={selectedState} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 md:gap-3 flex-wrap mt-3 md:mt-0">
                                        {selectedCounty && selectedState && (
                                            <button
                                                onClick={() => {
                                                    const added = addToWatchlist(selectedCounty, selectedState, STATE_NAMES[selectedState]);
                                                    if (added) {
                                                        toast.success(`${selectedCounty[0]} added to watchlist!`);
                                                    } else {
                                                        toast.info(`${selectedCounty[0]} is already in your watchlist.`);
                                                    }
                                                }}
                                                disabled={isInWatchlist(selectedState, selectedCounty[0])}
                                                className={`px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-sm font-mono font-semibold text-xs md:text-sm transition-all flex items-center gap-1 md:gap-2 ${isInWatchlist(selectedState, selectedCounty[0]) ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' : 'bg-surface text-white shadow-none hover: hover:'}`}
                                            >
                                                <span>{isInWatchlist(selectedState, selectedCounty[0]) ? '⭐' : '☆'}</span> {isInWatchlist(selectedState, selectedCounty[0]) ? 'In Watchlist' : 'Add to Watchlist'}
                                            </button>
                                        )}
                                        <button onClick={handleExportParcelsCSV} className="bg-surface text-white px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-sm font-mono font-semibold text-xs md:text-sm shadow-none hover:bg-black transition-all flex items-center gap-1 md:gap-2">
                                            <span>📥</span> <span className="hidden sm:inline">DOWNLOAD</span> CSV
                                        </button>
                                        <button onClick={handlePrintCountyReport} className="bg-canvas text-slate-900 border-2 border-slate-300 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-sm font-mono font-semibold text-xs md:text-sm hover:bg-slate-100 transition-all flex items-center gap-1 md:gap-2">
                                            <span>📄</span> REPORT
                                        </button>
                                    </div>
                                </div>

                                {/* County Details from NY_COUNTY_DETAILS */}
                                {getCountyDetails(selectedCounty[0]) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <div className="bg-canvas p-6 rounded-md shadow-none border border-slate-200">
                                            <h4 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Investor Focus</h4>
                                            <p className="text-slate-800 font-medium">{getCountyDetails(selectedCounty[0]).investorFocus}</p>
                                        </div>
                                        <div className="bg-canvas p-6 rounded-md shadow-none border border-slate-200">
                                            <h4 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Lifestyle Score</h4>
                                            <p className="text-slate-800 font-medium">{getCountyDetails(selectedCounty[0]).lifestyle}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Metric Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                                    {[
                                        { label: "Housing Value (ZHVI)", value: `$${(selectedCounty[3] / 1000).toFixed(0)}K`, sub: `${selectedCounty[4]}% YoY`, icon: "📈", color: "text-indigo-600" },
                                        { label: "Population", value: `${(selectedCounty[1] / 1000).toFixed(0)}K`, sub: "Residents", icon: "👥", color: "text-indigo-600" },
                                        { label: "Median Income", value: `$${(selectedCounty[2] / 1000).toFixed(0)}K`, sub: "Household", icon: "💰", color: "text-slate-900" },
                                        { label: "Days on Market", value: `${selectedCounty[5]}`, sub: "Average", icon: "⏱️", color: "text-amber-600" }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-canvas p-4 md:p-6 rounded-md shadow-none border border-slate-200 hover:shadow-none transition-all">
                                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                                <span className="text-slate-600 text-[8px] md:text-[9px] font-semibold tracking-widest uppercase">{stat.label}</span>
                                                <span className="text-lg md:text-xl">{stat.icon}</span>
                                            </div>
                                            <div className={`text-xl md:text-xl font-mono font-semibold tracking-tighter ${stat.color}`}>{stat.value}</div>
                                            <div className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase mt-1">{stat.sub}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* ═══ Live Auctions for this State/County ═══ */}
                                {(() => {
                                    const stateAuctions = UPCOMING_AUCTIONS
                                        .filter(a => {
                                            const matchState = a.state === selectedState;
                                            const matchCounty = selectedCounty ? a.county === selectedCounty[0] : true;
                                            const daysUntil = Math.ceil((new Date(a.saleDate) - new Date()) / (1000 * 60 * 60 * 24));
                                            return matchState && daysUntil >= 0;
                                        })
                                        .sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate))
                                        .slice(0, 5);

                                    if (stateAuctions.length === 0) return null;

                                    return (
                                        <div className="bg-surface rounded-md border border-slate-200 overflow-hidden">
                                            <div className="p-5 border-b border-slate-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-rose-500 rounded-sm animate-none"></span>
                                                        <h3 className="font-mono font-semibold text-slate-900">Upcoming Auctions</h3>
                                                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-semibold">{stateAuctions.length}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setView('auctions')}
                                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                                                    >
                                                        View All →
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="divide-y divide-slate-200">
                                                {stateAuctions.map(a => {
                                                    const days = Math.ceil((new Date(a.saleDate) - new Date()) / (1000 * 60 * 60 * 24));
                                                    const isUrgent = days <= 7;
                                                    return (
                                                        <div key={a.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-all">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="font-bold text-slate-900 text-sm">{a.county} County</span>
                                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold text-white ${a.saleType.includes('Lien') ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                                        {a.saleType}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {new Date(a.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {a.propertyCount}+ props • {a.platform}
                                                                </div>
                                                            </div>
                                                            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white shrink-0 ${isUrgent ? 'bg-rose-500 animate-none' : days <= 30 ? 'bg-amber-500' : 'bg-indigo-500'
 }`}>
                                                                {days === 0 ? 'TODAY' : days <= 3 ? `${days}d LEFT` : `${days} days`}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Tax Sale Inventory with Platform Links */}
                                <div className="bg-canvas rounded-md shadow-none overflow-hidden border border-slate-200">
                                    <div className="p-6 border-b border-slate-200">
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                            <div className="flex items-baseline gap-3">
                                                <h3 className="font-mono font-semibold text-lg text-slate-900">Tax Sale Inventory</h3>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white ${auctionInfo?.saleType === 'Lien' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                    {auctionInfo?.saleType || 'Deed'} State
                                                </span>
                                                <span className="text-xs font-bold text-emerald-600">{parcels.length} HUD/REO Listings</span>
                                            </div>
                                            {auctionInfo?.platformUrl && (
                                                <a
                                                    href={auctionInfo.platformUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-surface text-white rounded-lg font-bold text-xs hover:bg-slate-100 transition-all shadow-md"
                                                >
                                                    🔗 View Live Auctions on {auctionInfo.platform}
                                                </a>
                                            )}
                                        </div>

                                        {/* Auction Info Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="bg-surface rounded-sm p-3">
                                                <div className="text-[9px] font-semibold text-slate-600 uppercase mb-1">Interest/Penalty</div>
                                                <div className="font-mono font-semibold text-slate-900">{auctionInfo?.interestRate || 'Varies'}</div>
                                            </div>
                                            <div className="bg-surface rounded-sm p-3">
                                                <div className="text-[9px] font-semibold text-slate-600 uppercase mb-1">Redemption</div>
                                                <div className="font-mono font-semibold text-slate-900">{auctionInfo?.redemption || 'Varies'}</div>
                                            </div>
                                            <div className="bg-surface rounded-sm p-3">
                                                <div className="text-[9px] font-semibold text-slate-600 uppercase mb-1">Sale Frequency</div>
                                                <div className="font-mono font-semibold text-slate-900">{auctionInfo?.frequency || 'Varies'}</div>
                                            </div>
                                            <div className="bg-surface rounded-sm p-3">
                                                <div className="text-[9px] font-semibold text-slate-600 uppercase mb-1">Platform</div>
                                                <div className="font-mono font-semibold text-slate-900">{auctionInfo?.platform || 'County'}</div>
                                            </div>
                                        </div>

                                        {/* Tax Collector Link */}
                                        {auctionInfo?.taxCollectorUrl && (
                                            <div className="mt-4 pt-4 border-t border-slate-200">
                                                <a
                                                    href={auctionInfo.taxCollectorUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    🏛️ Official Tax Collector Website →
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 bg-canvas border-b border-slate-200">
                                        <p className="text-xs text-emerald-500/80 font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-sm animate-none"></span>
                                            <strong className="text-emerald-600">Live Data:</strong> Real-time HUD, Fannie Mae, and Freddie Mac foreclosure listings from official sources.
                                            {listingsLoading && <span className="text-slate-500 ml-2">(Loading...)</span>}
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-surface">
                                                <tr className="text-slate-600 text-[9px] font-semibold tracking-widest uppercase">
                                                    <th className="px-6 py-4">Address</th>
                                                    <th className="px-6 py-4">City</th>
                                                    <th className="px-6 py-4 text-right">Price</th>
                                                    <th className="px-6 py-4 text-center">Beds/Baths</th>
                                                    <th className="px-6 py-4 text-right">Sqft</th>
                                                    <th className="px-6 py-4">Type</th>
                                                    <th className="px-6 py-4">Source</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {parcels.length === 0 && !listingsLoading && (
                                                    <tr>
                                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-600">
                                                            No listings available for this state. Select a state to view HUD/REO properties.
                                                        </td>
                                                    </tr>
                                                )}
                                                {listingsLoading && (
                                                    <tr>
                                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-600">
                                                            <div className="animate-none">Loading real foreclosure listings...</div>
                                                        </td>
                                                    </tr>
                                                )}
                                                {parcels.map((p, i) => (
                                                    <tr key={i} className="hover:bg-slate-100/80 transition-all">
                                                        <td className="px-6 py-4 font-bold text-slate-900">{p.address}</td>
                                                        <td className="px-6 py-4 text-slate-600">{p.city}, {p.state} {p.zip}</td>
                                                        <td className="px-6 py-4 text-right font-mono font-semibold text-emerald-600">${p.price?.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{p.bedrooms}bd / {p.bathrooms}ba</td>
                                                        <td className="px-6 py-4 text-right text-slate-600">{p.sqft?.toLocaleString()} sqft</td>
                                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-surface rounded text-[9px] font-semibold text-slate-500 uppercase">{p.property_type}</span></td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-sm text-[9px] font-semibold uppercase ${p.source === 'HUD' ? 'bg-indigo-100 text-indigo-500 border border-blue-800' :
                                                                p.source === 'Fannie Mae' ? 'bg-panel text-slate-700 border border-slate-300' :
                                                                'bg-surface text-slate-600'
                                                                }`}>{p.source}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-sm text-[8px] font-semibold uppercase ${p.status === 'Available' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
 }`}>{p.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : view === 'map' ? (
                            /* Map View - Command Center Transformation */
                            <>
                                {/* 4K Cinematic Edge-to-Edge Container */}
                                <div className={isMapExpanded ? "fixed inset-0 z-50 bg-canvas animate-in fade-in duration-300" : "flex-1 w-full h-full min-h-[60vh] md:min-h-[700px] relative rounded-md overflow-hidden bg-canvas border border-slate-200 shadow-none transition-all duration-300"}>
                                    {/* Base UI layer (MapLibre GL — vector tiles, satellite toggle, property markers) */}
                                    <div className="absolute inset-0" style={{ zIndex: 1 }}>
                                        <Suspense fallback={
                                            <div className="w-full h-full flex items-center justify-center bg-canvas">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
                                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Loading map engine…</div>
                                                </div>
                                            </div>
                                        }>
                                            <USMap
                                                onStateClick={(abbr) => setSelectedState(abbr)}
                                                selectedState={selectedState}
                                                properties={mapProperties}
                                                focusProperty={mapFocus}
                                                onPropertyClick={(p) => setSelectedPropertyForModal(p)}
                                            />
                                        </Suspense>
                                    </div>
                                    
                                    {/* Glass Overlay Layer: Top HUD */}
                                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none" style={{ zIndex: 10 }}>
                                        {/* Top Left Title Glass */}
                                        <div className="bg-white backdrop-blur-2xl border border-white/20 rounded-sm p-5 shadow-none">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-1.5 h-1.5 rounded-sm bg-emerald-400 animate-none shadow-[0_0_8px_#34d399]" />
                                                <h2 className="text-[9px] font-semibold text-slate-600 uppercase tracking-[0.3em]">State Liquidity :: Neural Projection</h2>
                                            </div>
                                            <h1 className="text-lg font-mono font-semibold text-white/90 tracking-tighter">Market Intelligence Hub</h1>
                                        </div>

                                        {/* Top Right Fullscreen Toggle */}
                                        <div className="flex items-center gap-3 pointer-events-auto">
                                            <button
                                                onClick={() => setIsMapExpanded(!isMapExpanded)}
                                                className="w-12 h-12 flex items-center justify-center rounded-sm bg-white backdrop-blur-2xl border border-white/20 text-ink hover:text-ink hover:bg-slate-50 transition-all shadow-none"
                                                title={isMapExpanded ? "Exit Fullscreen" : "Fullscreen Mode"}
                                            >
                                                <span className="text-xl leading-none">{isMapExpanded ? '×' : '⤢'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Glass Overlay Layer: Bottom Status HUD */}
                                    <div className="absolute bottom-6 left-6 right-6 flex flex-col-reverse md:flex-row items-center md:items-end justify-between pointer-events-none gap-4" style={{ zIndex: 10 }}>
                                        {/* Left Spacer (Desktop Only) */}
                                        <div className="hidden md:block w-[140px] invisible"></div>

                                        {/* Bottom Center Intelligence Bar */}
                                        <div className="bg-white backdrop-blur-2xl border border-white/20 rounded-sm px-6 py-3 flex items-center justify-center flex-wrap md:flex-nowrap gap-6 md:gap-12 shadow-none pointer-events-auto filter drop-shadow-none max-w-full">
                                            <div>
                                                <div className="text-[8px] text-slate-600 font-semibold uppercase tracking-[0.2em] mb-1">Global Coverage</div>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-xl md:text-lg font-mono font-semibold text-white/90">50</span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">States</span>
                                                </div>
                                            </div>
                                            <div className="w-px h-6 bg-slate-100/60 hidden md:block" />
                                            <div>
                                                <div className="text-[8px] text-slate-600 font-semibold uppercase tracking-[0.2em] mb-1">Active Pipeline</div>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-xl md:text-lg font-mono font-semibold text-white/90">14.2K</span>
                                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Deals</span>
                                                </div>
                                            </div>
                                            <div className="w-px h-6 bg-slate-100/60 hidden md:block" />
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-[8px] text-slate-600 font-semibold uppercase tracking-[0.2em] mb-0.5">Network Status</div>
                                                    <div className="text-[9px] font-mono text-emerald-600 font-bold">TERMINUS_SYNC_OK</div>
                                                </div>
                                                <div className="w-6 h-6 md:w-8 md:h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-sm animate-none shadow-[0_0_8px_#34d399]" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Right Legend */}
                                        <div className="bg-surface/90 backdrop-blur-md shadow-none border border-slate-300/60 rounded-sm p-3 flex flex-row items-center gap-4 min-w-[140px] pointer-events-auto md:w-[140px] md:flex-col md:items-start md:gap-3 justify-center md:justify-self-end text-left w-auto z-50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded border border-indigo-500 bg-indigo-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                                                <span className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">Lien States</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded border border-slate-500 bg-slate-300 shadow-[0_0_8px_rgba(71,85,105,0.4)]" />
                                                <span className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">Deed States</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {selectedPropertyForModal && (
                                    <PropertyModal
                                        property={selectedPropertyForModal}
                                        onClose={() => setSelectedPropertyForModal(null)}
                                        onAddToWatchlist={(p) => {
                                            toast.success(`${p.address} added to watchlist!`);
                                            setSelectedPropertyForModal(null);
                                        }}
                                        onOpenDueDiligence={(p) => {
                                            setSelectedPropertyForModal(null);
                                            setDueDiligenceProperty(p);
                                        }}
                                    />
                                )}
                            </>
                        ) : view === 'auctions' ? (
                            /* Auctions View - Upcoming Sales */
                            <UpcomingAuctions
                                auctions={realAuctions.length > 0 ? realAuctions : null}
                                onSelectState={(abbr) => { setSelectedState(abbr); setView('list'); }}
                                onSelectCounty={(c) => {
                                    const found = (COUNTIES[selectedState] || []).find(co => co[0] === c);
                                    if (found) setSelectedCounty(found);
                                    setView('list');
                                }}
                            />
                        ) : view === 'calendar' ? (
                            /* 2026 Auction Calendar View */
                            <AuctionCalendar
                                auctions={realAuctions.length > 0 ? realAuctions : []}
                                onSelectState={(abbr) => {
                                    setSelectedState(abbr);
                                    setView('list');
                                }}
                            />
                        ) : view === 'roi' ? (
                            /* ROI Calculator View */
                            <div className="p-6">
                                <ROICalculator />
                            </div>
                        ) : view === 'heatmap' ? (
                            /* Investment Heat Map View */
                            <div className="h-full overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-canvas">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-sm bg-surface flex items-center justify-center text-indigo-500 border border-slate-200">📊</div>
                                        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">National Market Intelligence</h2>
                                    </div>
                                    <div className="flex bg-surface p-1 rounded-sm">
                                        <button 
                                            onClick={() => setProMode(false)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!proMode ? 'bg-canvas shadow-none text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            2D Heatmap
                                        </button>
                                        <button 
                                            onClick={() => setProMode(true)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${proMode ? 'bg-canvas shadow-none text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Pro 3D Map
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0 bg-surface">
                                    {proMode ? (
                                        <MarketGlobe height="100%" />
                                    ) : (
                                        <InvestmentHeatMap
                                            onStateSelect={(abbr) => {
                                                setSelectedState(abbr);
                                                setView('list');
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : view === 'market' ? (
                            /* Market Intelligence Dashboard View */
                            <div className="h-full overflow-auto">
                                <MarketDataDashboard />
                            </div>
                        ) : view === 'forecaster' ? (
                            /* AI Market Forecaster View */
                            <div className="p-4 md:p-8 overflow-auto h-full">
                                <MarketForecaster 
                                    county={selectedCounty ? { name: selectedCounty[0], zhvi: selectedCounty[3], fips: selectedCounty[7]?.split(' ')[1] } : null} 
                                    onBack={() => setView('map')}
                                />
                            </div>
                        ) : view === 'alerts' ? (
                            /* Alert Settings View */
                            <div className="h-full overflow-auto p-6">
                                <AlertSettings onClose={() => setView('map')} />
                            </div>
                        ) : view === 'properties' ? (
                            /* Live Property Feed View with Due Diligence Modal */
                            <div className="h-full overflow-auto p-6">
                                <PropertyFeed
                                    properties={SAMPLE_PROPERTIES}
                                    onViewDetails={(p) => setSelectedPropertyForModal(p)}
                                    onAddToWatchlist={(p) => toast.success(`${p.address} added to watchlist!`)}
                                />
                                {selectedPropertyForModal && (
                                    <PropertyModal
                                        property={selectedPropertyForModal}
                                        onClose={() => setSelectedPropertyForModal(null)}
                                        onAddToWatchlist={(p) => {
                                            toast.success(`${p.address} added to watchlist!`);
                                            setSelectedPropertyForModal(null);
                                        }}
                                        onOpenDueDiligence={(p) => {
                                            setSelectedPropertyForModal(null);
                                            setDueDiligenceProperty(p);
                                        }}
                                    />
                                )}
                                {dueDiligenceProperty && (
                                    <PropertyDueDiligence
                                        property={dueDiligenceProperty}
                                        onClose={() => setDueDiligenceProperty(null)}
                                        onAddToWatchlist={(p) => {
                                            toast.success(`${p.address} added to watchlist!`);
                                        }}
                                    />
                                )}
                            </div>
                        ) : view === 'watchlist' ? (
                            /* Watchlist View - Saved Counties */
                            <WatchlistView
                                onSelectState={(abbr) => {
                                    if (!abbr) setView('stateinfo');
                                    else { setSelectedState(abbr); setView('list'); }
                                }}
                                onSelectCounty={(item) => {
                                    setSelectedState(item.stateAbbr);
                                    const county = (COUNTIES[item.stateAbbr] || []).find(c => c[0] === item.county);
                                    if (county) {
                                        setSelectedCounty(county);
                                        setView('list');
                                    }
                                }}
                                TIERS={TIERS}
                            />
                        ) : view === 'portfolio' ? (
                            /* Portfolio "Fund Manager" Engine */
                            <PortfolioManager onBack={() => setView('watchlist')} />
                        ) : view === 'alerts' ? (
                            /* Alerts View - Notifications Center */
                            <div className="bg-canvas rounded-md shadow-none border border-slate-200 p-8 h-full overflow-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-mono font-semibold text-slate-900 tracking-tighter">My Alerts</h2>
                                        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mt-1">Stay updated on your investments</p>
                                    </div>
                                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-sm font-mono font-bold text-sm shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2">
                                        <span>🔔</span> Create Alert
                                    </button>
                                </div>

                                {/* Alert Categories */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-surface rounded-md p-5 border border-green-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-green-500 rounded-sm flex items-center justify-center text-white text-lg">💰</div>
                                            <div>
                                                <div className="text-lg font-mono font-semibold text-green-700">0</div>
                                                <div className="text-[9px] font-bold text-green-600 uppercase tracking-wider">Price Drops</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-surface rounded-md p-5 border border-amber-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-amber-500 rounded-sm flex items-center justify-center text-white text-lg">📅</div>
                                            <div>
                                                <div className="text-lg font-mono font-semibold text-amber-700">0</div>
                                                <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Auction Reminders</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-surface rounded-md p-5 border border-indigo-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-indigo-500 rounded-sm flex items-center justify-center text-white text-lg">⭐</div>
                                            <div>
                                                <div className="text-lg font-mono font-semibold text-indigo-700">0</div>
                                                <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Watchlist Updates</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Empty State */}
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-surface rounded-md flex items-center justify-center text-2xl font-mono mb-6">🔕</div>
                                    <h3 className="text-xl font-mono font-semibold text-slate-700 mb-2">No Active Alerts</h3>
                                    <p className="text-slate-600 text-sm max-w-md mb-6">Set up alerts to get notified about price changes, upcoming auctions, and updates to your watchlist properties.</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setView('properties')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-sm font-mono font-bold text-sm shadow-none hover:bg-indigo-700 transition-all">
                                            Browse Properties
                                        </button>
                                        <button onClick={() => setView('watchlist')} className="bg-canvas text-slate-700 border border-slate-300 px-5 py-2.5 rounded-sm font-mono font-bold text-sm hover:bg-slate-100 transition-all">
                                            View Watchlist
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : view === 'list' ? (
                            /* List View - State Database */
                            <div className="bg-canvas rounded-md shadow-none border border-slate-200 flex flex-col h-full">
                                <div className="p-8 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 mb-1">
                                            <h2 className="text-2xl font-mono font-semibold text-slate-900 tracking-tighter">State Database</h2>
                                            {selectedState && STATE_AUCTION_INFO[selectedState] && (
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'bg-indigo-100 border border-indigo-200' : 'bg-surface border border-slate-300'}`}>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold text-white ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                        {STATE_AUCTION_INFO[selectedState].type}
                                                    </span>
                                                    <span className={`text-xs font-bold ${STATE_AUCTION_INFO[selectedState].type === 'Lien' ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                        {STATE_AUCTION_INFO[selectedState].interestRate !== 'N/A' ? STATE_AUCTION_INFO[selectedState].interestRate : STATE_AUCTION_INFO[selectedState].redemptionPeriod}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">Select a territory to view county data</p>
                                    </div>
                                    {selectedState && displayCounties.length > 0 && (
                                        <div className="flex gap-2">
                                            <button onClick={handleExportStateCSV} className="bg-surface text-white px-4 py-2 rounded-lg font-mono font-semibold text-xs shadow-none hover:bg-black transition-all flex items-center gap-2">
                                                <span>📥</span> Export CSV
                                            </button>
                                            <button onClick={handleCopyStateData} className="bg-canvas text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-mono font-semibold text-xs hover:bg-slate-100 transition-all flex items-center gap-2">
                                                <span>📋</span> Copy
                                            </button>
                                            <button onClick={handlePrintStateReport} className="bg-canvas text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-mono font-semibold text-xs hover:bg-slate-100 transition-all flex items-center gap-2">
                                                <span>🖨️</span> Print
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="px-8 pb-6 border-b border-slate-200 overflow-x-auto scrollbar-hide shrink-0">
                                    <div className="flex gap-3 min-w-max pb-2">
                                        {allStates.map(abbr => {
                                            const { best } = getStateSummary(abbr);
                                            const isSelected = selectedState === abbr;
                                            return (
                                                <button
                                                    key={abbr}
                                                    onClick={() => { setSelectedState(abbr); setSelectedCounty(null); }}
                                                    className={`px-4 py-3 rounded-sm font-mono font-semibold transition-all duration-300 ${isSelected ? 'shadow-none ring-2 ring-indigo-500 scale-105' : 'hover:shadow-md brightness-75 hover:brightness-90'}`}
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
                                            <thead className="bg-canvas/95 backdrop-blur-sm sticky top-0 z-20">
                                                <tr className="text-slate-600 text-[9px] font-semibold tracking-widest uppercase border-b border-slate-200">
                                                    {[['name', 'County'], ['tier', 'Grade'], ['pop', 'Population'], ['income', 'Income'], ['zhvi', 'ZHVI'], ['growth', '% Change'], ['dom', 'DOM']].map(([col, label]) => (
                                                        <th key={col} onClick={() => handleSort(col)} className="px-6 py-5 text-left cursor-pointer hover:bg-slate-100 transition-colors">
                                                            <div className="flex items-center gap-1">
                                                                <span>{label}</span>
                                                                {sortCol === col && <span className="text-indigo-600">{sortAsc ? '↑' : '↓'}</span>}
                                                            </div>
                                                        </th>
                                                    ))}
                                                    <th className="px-6 py-5 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {displayCounties.map((c, i) => {
                                                    const [name, pop, income, zhvi, growth, dom, tier] = c;
                                                    const t = TIERS[tier];
                                                    return (
                                                        <tr key={i} onClick={() => setSelectedCounty(c)} className="group hover:bg-indigo-50/50 cursor-pointer transition-all">
                                                            <td className="px-6 py-5 font-mono font-semibold text-slate-800">{name}</td>
                                                            <td className="px-6 py-5">
                                                                <span className="px-2 py-1 rounded-lg text-[9px] font-semibold text-white" style={{ background: t.color }}>{t.label}</span>
                                                            </td>
                                                            <td className="px-6 py-5 font-bold text-slate-500 tabular-nums">{(pop / 1000).toFixed(0)}K</td>
                                                            <td className="px-6 py-5 font-bold text-slate-500 tabular-nums">${(income / 1000).toFixed(0)}K</td>
                                                            <td className="px-6 py-5 font-bold text-slate-500 tabular-nums">${(zhvi / 1000).toFixed(0)}K</td>
                                                            <td className="px-6 py-5">
                                                                <span className={`font-bold ${growth >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                                                    {growth > 0 ? '▴' : '▾'} {Math.abs(growth)}%
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="px-2 py-1 bg-surface rounded text-[10px] font-semibold text-slate-500">{dom}d</span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <button className="bg-surface text-white px-4 py-2 rounded-lg text-[9px] font-semibold uppercase opacity-0 group-hover:opacity-100 transition-all">Analyze</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                                        <div className="w-24 h-24 bg-surface rounded-md flex items-center justify-center text-2xl font-mono mb-6 opacity-60">🌐</div>
                                        <h3 className="text-lg font-mono font-semibold text-slate-800 uppercase">Select a State</h3>
                                        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-2">Choose from the state buttons above</p>
                                    </div>
                                )}
                            </div>
                        ) : view === 'detection' ? (
                            /* Tier Detection Algorithm View */
                            <div className="space-y-6">
                                <div className="bg-canvas rounded-md p-6 shadow-none border border-slate-200">
                                    <h2 className="text-lg font-mono font-semibold text-slate-900 mb-2">🎯 Tier Detection Algorithm</h2>
                                    <p className="text-slate-500">Automatically classify any US county into investment tiers using quantitative metrics.</p>
                                </div>

                                <div className="grid gap-4">
                                    {Object.entries(TIER_CRITERIA).map(([tier, info]) => {
                                        const tierData = TIERS[tier];
                                        return (
                                            <div key={tier} className="rounded-md p-5 border-l-4" style={{ backgroundColor: `${tierData.color}10`, borderLeftColor: tierData.color }}>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-sm flex items-center justify-center text-white font-mono font-semibold text-lg" style={{ backgroundColor: tierData.color }}>
                                                        {tier}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-mono font-semibold text-slate-900">{info.name}</h3>
                                                        <p className="text-sm text-slate-500">{info.description}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {Object.entries(info.criteria).map(([metric, value]) => (
                                                        <div key={metric} className="bg-white/85 rounded-lg p-3 border border-slate-200">
                                                            <div className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest mb-1">
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
                                <div className="bg-surface rounded-md p-6 text-white">
                                    <h3 className="font-mono font-semibold text-lg mb-4">📐 Scoring Formula</h3>
                                    <div className="bg-panel rounded-sm p-4 font-mono text-sm overflow-x-auto">
                                        <div className="text-green-400 mb-2">// Tier Score Calculation (0-100)</div>
                                        <div className="text-indigo-400">tier_score = (</div>
                                        <div className="pl-4 text-slate-700">
                                            population_score × 0.15 +<br />
                                            income_score × 0.15 +<br />
                                            home_value_growth × 0.20 +<br />
                                            days_on_market_inv × 0.20 +<br />
                                            transaction_volume × 0.15 +<br />
                                            employment_rate × 0.15
                                        </div>
                                        <div className="text-indigo-400">)</div>
                                        <div className="mt-4 text-yellow-400">// Tier Assignment</div>
                                        <div className="text-slate-700">
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
                                <div className="bg-surface rounded-md p-6 border border-green-200/50">
                                    <h2 className="text-lg font-mono font-semibold text-slate-900 mb-1">100% Free Data Sources</h2>
                                    <p className="text-slate-500">All tier detection uses publicly available, free data APIs</p>
                                    <div className="mt-4 flex gap-6">
                                        <div className="text-center">
                                            <div className="text-xl font-mono font-semibold text-indigo-600">{FREE_DATA_SOURCES.length}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Data Sources</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {FREE_DATA_SOURCES.map(source => (
                                        <div key={source.name} className="bg-canvas rounded-md p-5 shadow-none border border-slate-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-mono">{source.icon}</span>
                                                    <h3 className="font-mono font-semibold text-slate-900">{source.name}</h3>
                                                </div>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] font-semibold uppercase">Free</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {source.metrics.map(m => (
                                                    <span key={m} className="px-2 py-1 bg-surface rounded text-[10px] font-bold text-slate-600">{m}</span>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600 text-xs font-bold">Weight: {(source.weight * 100).toFixed(0)}%</span>
                                                <a href={`https://${source.url}`} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline text-xs font-medium">
                                                    {source.url}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Python Quick Start */}
                                <div className="bg-surface rounded-md p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-lg font-mono">🐍</span>
                                        <h3 className="font-mono font-semibold text-white text-lg">Quick Start: Fetch Tier Data</h3>
                                    </div>
                                    <pre className="bg-panel p-4 rounded-sm text-sm overflow-x-auto">
                                        <code className="text-green-400">{PYTHON_QUICK_START}</code>
                                    </pre>
                                </div>
                            </div>
                        ) : view === 'stateinfo' ? (
                            /* State Info View - Lien vs Deed Types */
                            <div className="space-y-6">
                                <div className="bg-surface rounded-md p-6 border border-indigo-200/50">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-lg font-mono font-semibold text-slate-900 mb-1">🏛️ State Tax Sale Information</h2>
                                            <p className="text-slate-500">Comprehensive guide to lien vs deed sales, interest rates, and redemption periods</p>
                                        </div>
                                        {/* Filter Toggle Buttons */}
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <button
                                                onClick={() => setStateInfoFilter('all')}
                                                className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase transition-all ${stateInfoFilter === 'all' ? 'bg-surface text-white shadow-none' : 'bg-canvas text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
                                            >All ({Object.keys(STATE_AUCTION_INFO).length})</button>
                                            <button
                                                onClick={() => setStateInfoFilter('lien')}
                                                className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase transition-all ${stateInfoFilter === 'lien' ? 'bg-indigo-600 text-white shadow-none shadow-indigo-200' : 'bg-canvas text-indigo-600 hover:bg-indigo-50 border border-indigo-200'}`}
                                            >Lien ({Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Lien').length})</button>
                                            <button
                                                onClick={() => setStateInfoFilter('deed')}
                                                className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase transition-all ${stateInfoFilter === 'deed' ? 'bg-slate-300 text-white shadow-none shadow-slate-200' : 'bg-canvas text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
                                            >Deed ({Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Deed').length})</button>

                                            <div className="h-6 w-px bg-slate-300 mx-1"></div>

                                            {/* Interest Rate Filter */}
                                            <select
                                                value={stateRateFilter}
                                                onChange={(e) => setStateRateFilter(e.target.value)}
                                                className="px-3 py-2 rounded-sm text-xs font-bold border border-green-200 bg-canvas text-green-700 hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:outline-none cursor-pointer transition-all"
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
                                                className="px-3 py-2 rounded-sm text-xs font-bold border border-amber-200 bg-canvas text-amber-700 hover:bg-amber-50 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer transition-all"
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
                                                    className="px-3 py-2 rounded-sm text-xs font-bold border border-red-200 bg-canvas text-rose-600 hover:bg-red-50 transition-all"
                                                >✕ Clear</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-8">
                                        <div className="text-center">
                                            <div className="text-xl font-mono font-semibold text-indigo-600">
                                                {Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Lien').length}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Lien States</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-mono font-semibold text-slate-600">
                                                {Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Deed').length}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Deed States</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-mono font-semibold text-green-600">24%</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Highest Rate (IA)</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-mono font-semibold text-amber-600">4 yr</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Longest Redemption</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Lien vs Deed Explanation */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-indigo-100 rounded-md p-5 border border-indigo-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-indigo-600 rounded-sm flex items-center justify-center text-white font-semibold">L</div>
                                            <h3 className="font-mono font-semibold text-indigo-900">Tax Lien States</h3>
                                        </div>
                                        <p className="text-sm text-blue-800">In lien states, you purchase a <strong>lien certificate</strong> on the property. The owner has a redemption period to pay back the lien plus interest. If they don't redeem, you can foreclose.</p>
                                        <div className="mt-3 text-xs font-bold text-indigo-600">✓ Earn interest on investment • ✓ Lower risk • ✓ Passive income potential</div>
                                    </div>
                                    <div className="bg-surface rounded-md p-5 border border-slate-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-slate-300 rounded-sm flex items-center justify-center text-white font-semibold">D</div>
                                            <h3 className="font-mono font-semibold text-slate-900">Tax Deed States</h3>
                                        </div>
                                        <p className="text-sm text-slate-800">In deed states, you bid on the <strong>property itself</strong> at auction. Winning bidder receives title to the property (subject to redemption period in some states).</p>
                                        <div className="mt-3 text-xs font-bold text-slate-600">✓ Direct property ownership • ✓ Faster acquisition • ✓ Property value upside</div>
                                    </div>
                                </div>

                                {/* Full State Table */}
                                <div className="bg-canvas rounded-md shadow-none border border-slate-200 overflow-hidden">
                                    <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-mono font-semibold text-lg text-slate-900">
                                                {stateInfoFilter === 'all' ? 'All 50 States + DC' : stateInfoFilter === 'lien' ? 'Tax Lien States' : 'Tax Deed States'}
                                            </h3>
                                            <p className="text-xs text-slate-600">Click column headers to sort • Click row to view details</p>
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
                                                    toast.success('Copied to clipboard!');
                                                }}
                                                className="bg-canvas text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-mono font-semibold text-xs hover:bg-slate-100 transition-all flex items-center gap-2"
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
                                                className="bg-surface text-white px-4 py-2 rounded-lg font-mono font-semibold text-xs shadow-none hover:bg-black transition-all flex items-center gap-2"
                                            >
                                                <span>📥</span> Export CSV
                                            </button>
                                        </div>
                                    </div>
                                    <div className="overflow-auto max-h-[500px]">
                                        <table className="w-full text-sm">
                                            <thead className="bg-surface sticky top-0 z-10">
                                                <tr className="text-slate-600 text-[9px] font-semibold tracking-widest uppercase">
                                                    <th
                                                        className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                                                        onClick={() => setStateInfoSort(prev => ({ col: 'state', asc: prev.col === 'state' ? !prev.asc : true }))}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            State {stateInfoSort.col === 'state' && <span className="text-indigo-600">{stateInfoSort.asc ? '↑' : '↓'}</span>}
                                                        </div>
                                                    </th>
                                                    <th
                                                        className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                                                        onClick={() => setStateInfoSort(prev => ({ col: 'type', asc: prev.col === 'type' ? !prev.asc : true }))}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Type {stateInfoSort.col === 'type' && <span className="text-indigo-600">{stateInfoSort.asc ? '↑' : '↓'}</span>}
                                                        </div>
                                                    </th>
                                                    <th
                                                        className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                                                        onClick={() => setStateInfoSort(prev => ({ col: 'rate', asc: prev.col === 'rate' ? !prev.asc : false }))}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Interest Rate {stateInfoSort.col === 'rate' && <span className="text-indigo-600">{stateInfoSort.asc ? '↑' : '↓'}</span>}
                                                        </div>
                                                    </th>
                                                    <th
                                                        className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                                                        onClick={() => setStateInfoSort(prev => ({ col: 'redemption', asc: prev.col === 'redemption' ? !prev.asc : true }))}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Redemption {stateInfoSort.col === 'redemption' && <span className="text-indigo-600">{stateInfoSort.asc ? '↑' : '↓'}</span>}
                                                        </div>
                                                    </th>
                                                    <th className="px-5 py-4 text-left">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
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
                                                            className={`hover:bg-indigo-50/50 transition-colors cursor-pointer ${info.type === 'Lien' ? 'hover:bg-purple-50/50' : 'hover:bg-indigo-50/50'}`}
                                                            onClick={() => setSelectedStateInfo({ abbr, ...info })}
                                                        >
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-semibold text-slate-900">{STATE_NAMES[abbr] || abbr}</span>
                                                                    <span className="text-[9px] font-bold text-slate-600 bg-surface px-1.5 py-0.5 rounded">{abbr}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white ${info.type === 'Lien' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                                                    {info.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`font-mono text-xs font-bold ${info.interestRate !== 'N/A' ? 'text-green-700 bg-green-50 px-2 py-1 rounded' : 'text-slate-600'}`}>
                                                                    {info.interestRate}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 font-medium text-slate-600">{info.redemptionPeriod}</td>
                                                            <td className="px-5 py-4 text-xs text-slate-600 max-w-[200px] truncate" title={info.notes}>{info.notes || '—'}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* State Verification Modal */}
                                {selectedStateInfo && (
                                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedStateInfo(null)}>
                                        <div className="bg-canvas rounded-md shadow-none max-w-5xl w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                            {/* Header with state name and type */}
                                            <div className={`p-6 ${selectedStateInfo.type === 'Lien' ? 'bg-surface ' : 'bg-surface '}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-20 h-20 bg-slate-100/60 rounded-md flex items-center justify-center backdrop-blur-sm border border-white/20">
                                                            <span className="text-2xl font-mono font-semibold text-white">{selectedStateInfo.abbr}</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-white text-xs font-bold uppercase tracking-widest mb-1">
                                                                {selectedStateInfo.type === 'Lien' ? '🔒 Tax Lien State' : '📜 Tax Deed State'}
                                                            </div>
                                                            <h2 className="text-2xl font-mono font-semibold text-white tracking-tight">
                                                                {STATE_NAMES[selectedStateInfo.abbr] || selectedStateInfo.abbr}
                                                            </h2>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedStateInfo(null)}
                                                        className="w-10 h-10 bg-slate-100/60 hover:bg-slate-50/20 rounded-sm flex items-center justify-center text-white transition-colors"
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
                                                            <div className="bg-surface border border-green-200 rounded-md p-4">
                                                                <div className="text-[10px] font-semibold text-green-600 uppercase tracking-widest mb-1">💰 Interest Rate</div>
                                                                <div className="text-lg font-mono font-semibold text-green-900">{selectedStateInfo.interestRate}</div>
                                                            </div>
                                                            <div className="bg-surface border border-indigo-200 rounded-md p-4">
                                                                <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest mb-1">⏱️ Redemption</div>
                                                                <div className="text-lg font-mono font-semibold text-indigo-900">{selectedStateInfo.redemptionPeriod}</div>
                                                            </div>
                                                        </div>

                                                        {/* Notes */}
                                                        {selectedStateInfo.notes && (
                                                            <div className="bg-surface border border-amber-200 rounded-md p-4">
                                                                <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-2">📋 Key Information</div>
                                                                <div className="text-sm font-medium text-amber-900">{selectedStateInfo.notes}</div>
                                                            </div>
                                                        )}

                                                        {/* Process explanation */}
                                                        <div className={`rounded-md p-4 ${selectedStateInfo.type === 'Lien' ? 'bg-purple-50 border border-purple-200' : 'bg-indigo-50 border border-indigo-200'}`}>
                                                            <div className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${selectedStateInfo.type === 'Lien' ? 'text-purple-600' : 'text-indigo-600'}`}>
                                                                {selectedStateInfo.type === 'Lien' ? '🔒 Tax Lien Process' : '📜 Tax Deed Process'}
                                                            </div>
                                                            <div className={`text-sm ${selectedStateInfo.type === 'Lien' ? 'text-purple-900' : 'text-indigo-900'}`}>
                                                                {selectedStateInfo.type === 'Lien'
                                                                    ? 'Investors purchase lien certificates at auction. Property owners can redeem by paying delinquent taxes plus accrued interest. If property remains unredeemed after the redemption period, the investor may initiate foreclosure proceedings to obtain the property.'
                                                                    : 'The government forecloses on properties with delinquent taxes and auctions them directly to investors. Winning bidders receive a deed to the property. Some states allow a brief redemption period before the sale is finalized.'}
                                                            </div>
                                                        </div>

                                                        {/* State map placeholder with SVG */}
                                                        <div className="bg-surface border border-slate-300 rounded-md p-6 text-center">
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
                                                                        <span className="text-7xl font-mono font-semibold text-slate-800">{selectedStateInfo.abbr}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-2">
                                                                {STATE_NAMES[selectedStateInfo.abbr]} Territory
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right side - County list */}
                                                    <div className="space-y-4">
                                                        <div className="bg-canvas border border-slate-300 rounded-md overflow-hidden shadow-none">
                                                            <div className="bg-surface px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                                                <div>
                                                                    <h3 className="font-mono font-semibold text-slate-900">📍 Counties</h3>
                                                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">
                                                                        {(COUNTIES[selectedStateInfo.abbr] || []).length} counties available
                                                                    </p>
                                                                </div>
                                                                <span className={`px-3 py-1 rounded-sm text-[10px] font-semibold text-white ${selectedStateInfo.type === 'Lien' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                                                    {selectedStateInfo.type}
                                                                </span>
                                                            </div>
                                                            <div className="max-h-[300px] overflow-auto">
                                                                {(COUNTIES[selectedStateInfo.abbr] || []).length > 0 ? (
                                                                    <div className="divide-y divide-slate-200">
                                                                        {COUNTIES[selectedStateInfo.abbr].slice(0, 15).map((county, idx) => {
                                                                            const tier = TIERS[county[6]] || TIERS[5];
                                                                            const isAlpha = county[6] <= 2 && (county[4] > 5 || county[3] > 400000); // AI Alpha logic
                                                                            return (
                                                                                <button
                                                                                    key={idx}
                                                                                    onClick={async () => {
                                                                                        setSelectedState(selectedStateInfo.abbr);
                                                                                        setSelectedCounty(county);
                                                                                        setView('detection');
                                                                                        setSelectedStateInfo(null);
                                                                                    }}
                                                                                    className="w-full flex items-center justify-between p-3 hover:bg-slate-100 border-b border-slate-200 last:border-0 transition-all text-left group"
                                                                                >
                                                                                    <div className="min-w-0">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="font-bold text-slate-900 truncate">{county[0]}</span>
                                                                                            {isAlpha && <span className="text-[8px] font-semibold bg-indigo-600 text-white px-1.5 py-0.5 rounded-sm animate-none">AI ALPHA</span>}
                                                                                        </div>
                                                                                        <div className="text-[10px] text-slate-600 font-bold">{selectedStateInfo.abbr} • Tier {county[6]}</div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span
                                                                                            className="px-2 py-1 rounded-lg text-[9px] font-semibold text-white"
                                                                                            style={{ backgroundColor: tier.color }}
                                                                                        >
                                                                                            T{county[6]}
                                                                                        </span>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                        {(COUNTIES[selectedStateInfo.abbr] || []).length > 15 && (
                                                                            <div className="px-4 py-3 text-center text-xs text-slate-600 font-bold">
                                                                                + {(COUNTIES[selectedStateInfo.abbr] || []).length - 15} more counties
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-8 text-center">
                                                                        <div className="text-2xl font-mono mb-2">🗺️</div>
                                                                        <div className="text-sm font-bold text-slate-600">County data not yet available</div>
                                                                        <div className="text-xs text-slate-700">Data coming soon</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Quick stats */}
                                                        {(COUNTIES[selectedStateInfo.abbr] || []).length > 0 && (
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-3 text-center">
                                                                    <div className="text-lg font-mono font-semibold text-emerald-700">
                                                                        {COUNTIES[selectedStateInfo.abbr].filter(c => c[6] === 1).length}
                                                                    </div>
                                                                    <div className="text-[8px] font-bold text-emerald-500 uppercase">Tier 1</div>
                                                                </div>
                                                                <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-3 text-center">
                                                                    <div className="text-lg font-mono font-semibold text-indigo-700">
                                                                        {COUNTIES[selectedStateInfo.abbr].filter(c => c[6] === 2).length}
                                                                    </div>
                                                                    <div className="text-[8px] font-bold text-indigo-500 uppercase">Tier 2</div>
                                                                </div>
                                                                <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 text-center">
                                                                    <div className="text-lg font-mono font-semibold text-amber-700">
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
                                            <div className="p-6 bg-surface border-t border-slate-200 flex items-center justify-between gap-4">
                                                <div className="text-[10px] text-slate-600 font-medium">
                                                    Source: THE GUIDE TO FINANCIAL INDEPENDENCE - Tax Reference
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setSelectedStateInfo(null)}
                                                        className="px-6 py-3 bg-canvas border border-slate-300 text-slate-700 rounded-sm font-mono font-semibold text-sm hover:bg-slate-100 transition-colors"
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
                                                            className={`px-6 py-3 rounded-sm font-mono font-semibold text-sm text-white shadow-none transition-all hover:scale-105 ${selectedStateInfo.type === 'Lien' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
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
                                <div className="bg-surface rounded-md p-6 border border-emerald-200/50">
                                    <h2 className="text-xl font-mono font-semibold text-slate-900 mb-2">📚 User Guide</h2>
                                    <p className="text-slate-500">Master the platform for optimal tax lien/deed investment research</p>
                                </div>

                                {/* Quick Start */}
                                <div className="bg-canvas rounded-md shadow-none border border-slate-200 overflow-hidden">
                                    <div className="bg-indigo-50 px-5 py-4 border-b border-indigo-100">
                                        <h3 className="font-mono font-semibold text-lg text-indigo-900">🚀 Quick Start</h3>
                                    </div>
                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-surface rounded-sm p-4 border border-slate-200">
                                                <div className="text-lg font-mono mb-2">📍</div>
                                                <div className="font-bold text-slate-900 mb-1">Map Explorer</div>
                                                <div className="text-xs text-slate-500">Visual overview - click any state to see counties</div>
                                            </div>
                                            <div className="bg-surface rounded-sm p-4 border border-slate-200">
                                                <div className="text-lg font-mono mb-2">📊</div>
                                                <div className="font-bold text-slate-900 mb-1">State Database</div>
                                                <div className="text-xs text-slate-500">Analyze counties by tier, export CSV data</div>
                                            </div>
                                            <div className="bg-surface rounded-sm p-4 border border-slate-200">
                                                <div className="text-lg font-mono mb-2">🏛️</div>
                                                <div className="font-bold text-slate-900 mb-1">State Info</div>
                                                <div className="text-xs text-slate-500">Lien vs Deed reference, interest rates</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tier System */}
                                <div className="bg-canvas rounded-md shadow-none border border-slate-200 overflow-hidden">
                                    <div className="bg-amber-50 px-5 py-4 border-b border-amber-100">
                                        <h3 className="font-mono font-semibold text-lg text-amber-900">🎯 Understanding Tiers</h3>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-3">
                                            {[
                                                { tier: 1, name: 'Prime Investor', action: '✅ PURSUE', color: 'bg-emerald-500', desc: 'Population 500k+, high income, strong growth' },
                                                { tier: 2, name: 'Strong/Selective', action: '✅ PURSUE', color: 'bg-indigo-500', desc: 'Pop 200k-500k, solid fundamentals' },
                                                { tier: 3, name: 'Opportunistic', action: '✅ CAUTIOUS', color: 'bg-amber-500', desc: 'Pop 100k-200k, stable regional markets' },
                                                { tier: 4, name: 'Speculative', action: '⚠️ CAUTION', color: 'bg-orange-500', desc: 'Limited liquidity, higher exit risk' },
                                                { tier: 5, name: 'Capital Trap', action: '❌ AVOID', color: 'bg-rose-500', desc: 'Population decline, weak fundamentals' },
                                            ].map(t => (
                                                <div key={t.tier} className="flex items-center gap-4 p-3 rounded-sm bg-surface border border-slate-200">
                                                    <div className={`w-10 h-10 ${t.color} rounded-sm flex items-center justify-center text-white font-semibold`}>T{t.tier}</div>
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
                                <div className="bg-canvas rounded-md shadow-none border border-slate-200 overflow-hidden">
                                    <div className="bg-purple-50 px-5 py-4 border-b border-purple-100">
                                        <h3 className="font-mono font-semibold text-lg text-purple-900">📥 Optimal Data Gathering</h3>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-semibold shrink-0">1</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Go to State Info → Filter by "Lien"</div>
                                                    <div className="text-xs text-slate-500">Focus on states with interest-bearing investments</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-semibold shrink-0">2</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Sort by Interest Rate (descending)</div>
                                                    <div className="text-xs text-slate-500">Find highest return states (Iowa: 24%, Georgia: 20%)</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-semibold shrink-0">3</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Click state → View county preview</div>
                                                    <div className="text-xs text-slate-500">See tier breakdown and top counties instantly</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-semibold shrink-0">4</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Click "Explore Counties" → Filter Tier 1-2</div>
                                                    <div className="text-xs text-slate-500">Focus on prime opportunities with best liquidity</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-semibold shrink-0">5</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Export to CSV for offline analysis</div>
                                                    <div className="text-xs text-slate-500">Download data for due diligence and tracking</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pro Tips */}
                                <div className="bg-canvas rounded-md shadow-none border border-slate-200 overflow-hidden">
                                    <div className="bg-green-50 px-5 py-4 border-b border-green-100">
                                        <h3 className="font-mono font-semibold text-lg text-green-900">💡 Pro Tips</h3>
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
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-sm bg-green-50/50 border border-green-100">
                                                <span className="text-xl">{p.icon}</span>
                                                <span className="text-sm font-medium text-green-900">{p.tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Key Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-surface rounded-md p-5 text-white">
                                        <div className="text-xl font-mono font-semibold">{Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Lien').length}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white">Lien States</div>
                                    </div>
                                    <div className="bg-surface rounded-md p-5 text-white">
                                        <div className="text-xl font-mono font-semibold">{Object.values(STATE_AUCTION_INFO).filter(s => s.type === 'Deed').length}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white">Deed States</div>
                                    </div>
                                    <div className="bg-surface rounded-md p-5 text-white">
                                        <div className="text-xl font-mono font-semibold">{totalCounties}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white">Total Counties</div>
                                    </div>
                                    <div className="bg-surface rounded-md p-5 text-white">
                                        <div className="text-xl font-mono font-semibold">{totalT123}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white">Prime Counties</div>
                                    </div>
                                </div>
                            </div>
                        ) : view === 'settings' ? (
                            /* User Settings View */
                            <div className="h-full overflow-auto p-6">
                                <UserSettings onClose={() => setView('map')} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
                                <div className="text-6xl">⚡</div>
                                <div className="font-mono font-semibold text-xl font-mono uppercase text-slate-900">Coming Soon</div>
                                <div className="text-xs font-bold tracking-widest uppercase text-slate-500">Feature in development</div>
                            </div>
                        )}
                    </div>
                </div >

                {/* Footer */}
                <footer className="h-9 bg-canvas/50 backdrop-blur-sm border-t border-slate-300/40 flex items-center justify-between px-8 shrink-0" >
                    <div className="text-[8px] font-semibold text-slate-600 tracking-widest uppercase">System Core v4.2.19</div>
                    <div className="flex gap-4 items-center">
                        <span className="text-[8px] font-bold text-slate-600 uppercase">Data: Census • Zillow • Regrid</span>
                        <div className="h-3 w-px bg-slate-200"></div>
                        <span className="text-[8px] font-semibold text-indigo-600 uppercase animate-none">Encrypted</span>
                    </div>
                </footer >
            </main >

            {/* Welcome Screen for first-time users */}
            {showWelcome && <WelcomeScreen user={user} onDismiss={() => setShowWelcome(false)} />}

            {/* Mobile Bottom Navigation */}
            <MobileNav
                activeView={view}
                onNavigate={(newView) => {
                    setView(newView);
                    setSelectedCounty(null);
                    setIsSidebarOpen(false);
                }}
            />
        </div >
    );
}
