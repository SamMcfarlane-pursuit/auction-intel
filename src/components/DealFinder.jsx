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
        if (grade.startsWith('A')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
        if (grade.startsWith('B')) return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
        if (grade.startsWith('C')) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-2">
                        <Trophy className="w-8 h-8 text-amber-500" />
                        AI DEAL FINDER
                    </h1>
                    <p className="text-slate-500 font-medium">Nationwide top-tier auction opportunities ranked by real-time intelligence.</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-12 transform hover:scale-[1.01] transition-all duration-300">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input
                            type="text"
                            placeholder="e.g. 'Lien states under 200k in Florida with high growth'..."
                            className="w-full h-16 bg-white border-2 border-slate-200 rounded-2xl pl-16 pr-6 text-lg font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none relative"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <button
                            type="submit"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition-colors"
                        >
                            Analyze
                        </button>
                    </form>

                    {filters && (
                        <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">Active Filters:</span>
                            {filters.max_price && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full border border-blue-200">Price: &lt;${filters.max_price / 1000}k</span>}
                            {filters.state && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-200">State: {filters.state}</span>}
                            {filters.min_population && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2.5 py-1 rounded-full border border-purple-200">Pop: 500k+</span>}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-3xl h-64 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deals.map((deal, i) => (
                            <div
                                key={i}
                                className="group relative bg-white border border-slate-200 p-6 rounded-3xl hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
                            >
                                {/* Status Badge */}
                                <div className="absolute top-0 right-0 p-3">
                                    <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-tight ${getGradeColor(deal.grade)}`}>
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
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Median Price</span>
                                        <span className="text-lg font-black text-slate-800">${(deal.zhvi / 1000).toFixed(0)}k</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Growth Index</span>
                                        <div className="flex items-center gap-1 text-emerald-500 font-black">
                                            <TrendingUp className="w-4 h-4" />
                                            +4.2%
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="shrink-0">
                                        <SparklineChart fips={String(i + 12000)} height={32} width={80} color={deal.grade.startsWith('A') ? '#10b981' : '#3b82f6'} />
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-600 font-bold text-sm group-hover:gap-2 transition-all">
                                        View Details
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>

                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DealFinder;
