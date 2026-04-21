import React, { useState, useEffect } from 'react';
import { Search, Trophy, TrendingUp, Target, Filter, ChevronRight, Zap } from 'lucide-react';
import SparklineChart from './charts/SparklineChart';

const DealFinder = ({ apiUrl = 'http://localhost:8080/api' }) => {
    const [deals, setDeals] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(null);

    useEffect(() => {
        fetchDeals();
    }, [apiUrl]);

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/deals/top?limit=12`);
            const data = await res.json();
            setDeals(data);
        } catch (err) {
            console.error('Fetch Deals Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setFilters(null);
            fetchDeals();
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/deals/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setFilters(data);
            // In a real implementation, we'd then fetch deals with these filters
        } catch (err) {
            console.error('Search Error:', err);
        }
    };

    const getGradeColor = (grade) => {
        if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-600 border-emerald-500/50';
        if (grade.startsWith('B')) return 'bg-indigo-500/20 text-indigo-500 border-indigo-300';
        if (grade.startsWith('C')) return 'bg-amber-100 text-amber-400 border-amber-500/50';
        return 'bg-slate-400/20 text-slate-600 border-slate-500/50';
    };

    return (
        <div className="flex-1 overflow-y-auto bg-surface p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-xl font-mono font-semibold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
                        <Trophy className="w-8 h-8 text-amber-500" />
                        AI DEAL FINDER
                    </h1>
                    <p className="text-slate-500 font-medium">Nationwide top-tier auction opportunities ranked by real-time intelligence.</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-12 transform hover:scale-[1.01] transition-all duration-300">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input
                            type="text"
                            placeholder="e.g. 'Lien states under 200k in Florida with high growth'..."
                            className="w-full h-16 bg-canvas border-2 border-slate-300 rounded-md pl-16 pr-6 text-lg font-semibold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none relative"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                        <button
                            type="submit"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-surface text-white px-6 py-2.5 rounded-sm font-bold hover:bg-black transition-colors"
                        >
                            Analyze
                        </button>
                    </form>

                    {filters && (
                        <div className="mt-4 flex gap-2 animate-in fade-in slide-in-">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 py-1">Active Filters:</span>
                            {filters.max_price && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-sm border border-indigo-200">Price: &lt;${filters.max_price / 1000}k</span>}
                            {filters.state && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-sm border border-emerald-200">State: {filters.state}</span>}
                            {filters.min_population && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2.5 py-1 rounded-sm border border-purple-200">Pop: 500k+</span>}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-canvas border border-slate-300 rounded-md h-64 animate-none" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deals.map((deal, i) => (
                            <div
                                key={i}
                                className="group relative bg-canvas border border-slate-300 p-6 rounded-md hover:border-indigo-500/50 hover:shadow-none hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
                            >
                                {/* Status Badge */}
                                <div className="absolute top-0 right-0 p-3">
                                    <div className={`px-3 py-1 rounded-sm border text-[10px] font-semibold tracking-tight ${getGradeColor(deal.grade)}`}>
                                        GRADE {deal.grade}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 truncate pr-20">{deal.county}</h3>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        <Target className="w-3 h-3" />
                                        {deal.state} • MARKET STRENGTH
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">Median Price</span>
                                        <span className="text-lg font-semibold text-slate-800">${(deal.zhvi / 1000).toFixed(0)}k</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">Growth Index</span>
                                        <div className="flex items-center gap-1 text-emerald-500 font-semibold">
                                            <TrendingUp className="w-4 h-4" />
                                            +4.2%
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                                    <div className="shrink-0">
                                        <SparklineChart fips={String(i + 12000)} height={32} width={80} color={deal.grade.startsWith('A') ? '#10b981' : '#3b82f6'} />
                                    </div>
                                    <div className="flex items-center gap-1 text-indigo-600 font-bold text-sm group-hover:gap-2 transition-all">
                                        View Details
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>

                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DealFinder;
