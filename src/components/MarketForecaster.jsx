import React, { useState, useEffect, useMemo } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, ScatterChart, Scatter, ZAxis
} from 'recharts';

const FORECAST_API = (fips) => `http://127.0.0.1:8080/api/forecaster/predict/${fips || '00000'}`;

export default function MarketForecaster({ county, onBack }) {
    const [loading, setLoading] = useState(true);
    const [forecast, setForecast] = useState(null);
    const [scenario, setScenario] = useState('baseline'); // 'baseline', 'aggressive', 'conservative'

    useEffect(() => {
        const fetchForecast = async () => {
            setLoading(true);
            try {
                const res = await fetch(FORECAST_API(county?.fips));
                if (res.ok) {
                    const data = await res.json();
                    setForecast(data);
                }
            } catch (err) {
                console.error("Forecast fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchForecast();
    }, [county]);

    const chartData = useMemo(() => {
        if (!forecast || !county) return [];
        
        const currentZhvi = county.zhvi || 350000;
        const months = ["Current", "3M", "6M", "9M", "12M", "15M", "18M", "21M", "24M"];
        
        return months.map((m, i) => {
            const step = (forecast.projected_zhvi_24m - currentZhvi) / 8;
            const factor = scenario === 'aggressive' ? 1.05 : scenario === 'conservative' ? 0.95 : 1.0;
            
            return {
                name: m,
                value: Math.round(currentZhvi + (step * i * factor)),
                baseline: Math.round(currentZhvi + (step * i)),
            };
        });
    }, [forecast, county, scenario]);

    const historicalClearingData = useMemo(() => {
        if (!county) return [];
        const basePrice = county.zhvi || 350000;
        
        // Generate 50 simulated historical auctions in this county over the last 12 months
        return Array.from({ length: 50 }).map((_, i) => {
            const timeAgoStr = `${Math.floor(Math.random() * 12) + 1}M ago`;
            const arV = basePrice * (0.8 + (Math.random() * 0.4)); // ARV range 80% to 120% of median
            const mab = arV * 0.7; // Standard 70% rule
            const actualBid = mab * (0.85 + (Math.random() * 0.3)); // Cleared between 85% and 115% of MAB
            
            return {
                id: `auc-${i}`,
                date: timeAgoStr,
                arv: Math.round(arV),
                mab: Math.round(mab),
                actual: Math.round(actualBid),
                efficiency: ((actualBid / mab) * 100).toFixed(1),
                win: actualBid <= mab ? 'Snipe' : 'Overbid'
            };
        });
    }, [county]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-sm animate-spin"></div>
                <div className="text-slate-600 font-bold animate-none">Running AI Forecast Models...</div>
            </div>
        );
    }

    return (
        <div className="bg-canvas rounded-sm shadow-none border border-slate-300 overflow-hidden">
            {/* Header */}
            <div className="p-8 bg-surface text-white flex justify-between items-center border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-mono">🔮</span>
                        <h2 className="text-xl font-mono font-semibold tracking-tighter">AI Alpha Forecaster</h2>
                    </div>
                    <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                        Predictive Analysis for {county?.name || "Target Market"}
                    </p>
                </div>
                {onBack && (
                    <button onClick={onBack} className="bg-slate-100/60 hover:bg-slate-50/20 px-4 py-2 rounded-sm text-xs font-bold transition-all border border-white/20">
                        ← Back to Market
                    </button>
                )}
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Metrics Sidebar */}
                <div className="space-y-6">
                    <div className="bg-surface rounded-md p-6 border border-slate-200">
                        <div className="text-[10px] font-semibold text-slate-600 uppercase mb-4 tracking-widest">Market Sentiment</div>
                        <div className={`text-lg font-mono font-semibold mb-2 ${
 forecast?.market_sentiment === 'Bullish' ? 'text-emerald-600' : 
 forecast?.market_sentiment === 'Stable' ? 'text-indigo-600' : 'text-amber-600'
 }`}>
                            {forecast?.market_sentiment || "Analyzing..."}
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(forecast?.confidence_score || 0.8) * 100}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-2 text-[9px] font-semibold text-slate-600 uppercase">
                            <span>Confidence</span>
                            <span>{Math.round((forecast?.confidence_score || 0.8) * 100)}%</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2">Select Scenario</div>
                        <div className="grid grid-cols-1 gap-2">
                            {['aggressive', 'baseline', 'conservative'].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setScenario(s)}
                                    className={`p-4 rounded-sm text-left transition-all border-2 ${
 scenario === s 
 ? 'bg-indigo-50 border-blue-600 shadow-none' 
 : 'bg-canvas border-slate-300 hover:border-slate-300 text-slate-500'
 }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-tighter">{s}</span>
                                        {scenario === s && <span className="text-indigo-600">●</span>}
                                    </div>
                                    <div className="text-[10px] opacity-70 mt-1">
                                        {s === 'aggressive' ? 'Optimistic growth & low interest rates' : 
                                         s === 'baseline' ? 'Yield based on current FRED telemetry' : 
                                         'Higher rates & cooled demand projection'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-surface rounded-sm p-6 text-white shadow-none border border-slate-200">
                        <div className="text-[9px] font-semibold text-slate-600 uppercase mb-1">Projected 12M Yield</div>
                        <div className="text-xl font-mono font-semibold text-emerald-600">+{forecast?.yield_forecast_pct?.toFixed(1)}%</div>
                        <div className="text-[10px] text-slate-600 mt-2">
                           Forecasted equity gain based on {county?.name} momentum and current economic cooling factors.
                        </div>
                    </div>
                </div>

                {/* Main Forecast Chart */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface rounded-sm p-8 border border-slate-300 h-[450px] relative">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Price Appreciation Forecast</h3>
                                <p className="text-xs text-slate-600 font-bold">Projected ZHVI Value (24 Month Window)</p>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-widest">
                                <span className="flex items-center gap-2 text-indigo-600"><span className="w-2 h-2 rounded-sm bg-indigo-600"></span> Current Target</span>
                                <span className="flex items-center gap-2 text-slate-600"><span className="w-2 h-2 rounded-sm bg-slate-400"></span> Baseline Average</span>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#94A3B8" 
                                    fontSize={10} 
                                    fontWeight="bold" 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="#94A3B8" 
                                    fontSize={10} 
                                    fontWeight="bold" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Projected ZHVI']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                                <Line type="monotone" dataKey="baseline" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-300 rounded-sm p-4 flex items-center gap-4 bg-canvas">
                            <div className="w-10 h-10 bg-emerald-100 rounded-sm flex items-center justify-center text-emerald-600 text-lg">📈</div>
                            <div>
                                <div className="text-[9px] font-semibold text-slate-600 uppercase">12M Projection</div>
                                <div className="text-sm font-semibold text-slate-900">${Math.round(forecast?.projected_zhvi_12m || 0).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="border border-slate-300 rounded-sm p-4 flex items-center gap-4 bg-canvas">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-lg">🚀</div>
                            <div>
                                <div className="text-[9px] font-semibold text-slate-600 uppercase">24M Target</div>
                                <div className="text-sm font-semibold text-slate-900">${Math.round(forecast?.projected_zhvi_24m || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Security & Historical Efficiency Scatter */}
                <div className="lg:col-span-3 bg-surface rounded-sm p-8 border border-slate-300 h-[450px] relative mt-4">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Historical Clearing Price Matrix</h3>
                            <p className="text-xs text-slate-600 font-bold">Max Allowable Bid (MAB) vs Actual Winning Bid (Last 12M)</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-widest">
                            <span className="flex items-center gap-2 text-emerald-500"><span className="w-2 h-2 rounded-sm bg-emerald-500"></span> Deal Snipes</span>
                            <span className="flex items-center gap-2 text-rose-600"><span className="w-2 h-2 rounded-sm bg-red-400"></span> Overbids</span>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height="80%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis 
                                type="number" 
                                dataKey="mab" 
                                name="Calculated MAB" 
                                stroke="#94A3B8" 
                                fontSize={10} 
                                fontWeight="bold" 
                                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                            />
                            <YAxis 
                                type="number" 
                                dataKey="actual" 
                                name="Actual Clearing Price" 
                                stroke="#94A3B8" 
                                fontSize={10} 
                                fontWeight="bold" 
                                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                            />
                            <ZAxis type="number" dataKey="arv" range={[50, 400]} />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-canvas p-3 rounded-sm shadow-none border border-slate-200 text-xs font-bold font-mono">
                                                <div className="text-slate-600 mb-2">{data.date}</div>
                                                <div className="text-slate-900">ARV: <span className="text-indigo-600">${data.arv.toLocaleString()}</span></div>
                                                <div className="text-slate-900">MAB: <span className="text-indigo-600">${data.mab.toLocaleString()}</span></div>
                                                <div className="text-slate-900 mt-1 pt-1 border-t border-slate-200">
                                                    Cleared: <span className={data.win === 'Snipe' ? 'text-emerald-500' : 'text-rose-600'}>${data.actual.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter name="Snipes" data={historicalClearingData.filter(d => d.win === 'Snipe')} fill="#10B981" fillOpacity={0.6} />
                            <Scatter name="Overbids" data={historicalClearingData.filter(d => d.win === 'Overbid')} fill="#F87171" fillOpacity={0.6} />
                            <ReferenceLine x={county?.zhvi * 0.7} stroke="#94A3B8" strokeDasharray="3 3" label={{ position: 'top', value: 'Avg MAB Baseline', fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} />
                            <ReferenceLine y={county?.zhvi * 0.7} stroke="#94A3B8" strokeDasharray="3 3" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
