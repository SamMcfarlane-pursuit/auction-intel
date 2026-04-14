import React, { useState, useEffect } from 'react';

/**
 * UnderwritingPanel - Institutional-grade deal analysis component
 * Calculates Max Bid, ROI, and Safety Margins based on professional real estate models
 */
export default function UnderwritingPanel({ property, onCalculate }) {
    const [inputs, setInputs] = useState({
        arv: property?.estimatedValue || 250000,
        repair_estimate: 35000,
        carrying_costs: 8000,
        tax_delinquency: property?.openingBid || 12000,
        target_profit_pct: 18,
    });

    const [results, setResults] = useState(null);
    const [clearingBounds, setClearingBounds] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchUnderwriting = async (currentInputs) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/underwriting/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentInputs),
            });
            const data = await response.json();
            setResults(data);

            // Fetch AI Clearing bounds
            const fips = property?.fips || '12345';
            const clearingRes = await fetch(`http://localhost:8080/api/forecaster/clearing/${fips}?arv=${currentInputs.arv}`);
            if (clearingRes.ok) {
                const clearingData = await clearingRes.json();
                setClearingBounds(clearingData);
            }

            if (onCalculate) onCalculate({ ...data, clearingBounds });
        } catch (error) {
            console.error("Calculation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUnderwriting(inputs);
        }, 500);
        return () => clearTimeout(timer);
    }, [inputs]);

    const handleInputChange = (name, value) => {
        setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 shadow-none animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-700 bg-slate-800/40">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <span className="text-amber-400">⚡</span> Institutional Underwriting
                </h2>
                <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Model 70.3 Premium</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Inputs Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adjustment Parameters</h3>
                    
                    <div className="space-y-3">
                        <InputGroup 
                            label="After Repair Value (ARV)" 
                            value={inputs.arv} 
                            onChange={(v) => handleInputChange('arv', v)}
                            prefix="$"
                        />
                        <InputGroup 
                            label="Repair Estimate" 
                            value={inputs.repair_estimate} 
                            onChange={(v) => handleInputChange('repair_estimate', v)}
                            prefix="$"
                            color="text-red-400"
                        />
                        <InputGroup 
                            label="Hold/Carrying Costs" 
                            value={inputs.carrying_costs} 
                            onChange={(v) => handleInputChange('carrying_costs', v)}
                            prefix="$"
                        />
                        <InputGroup 
                            label="Tax Delinquency" 
                            value={inputs.tax_delinquency} 
                            onChange={(v) => handleInputChange('tax_delinquency', v)}
                            prefix="$"
                        />
                    </div>
                </div>

                {/* Scorecards */}
                {results && (
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="bg-slate-900 /20 /5 rounded-md p-5 border border-emerald-500/20">
                            <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest mb-1">Max Allowable Bid</div>
                            <div className="text-xl font-mono font-semibold text-white">${Math.round(results.max_allowed_bid).toLocaleString()}</div>
                            <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-sm overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700" 
                                    style={{ width: `${(results.max_allowed_bid / inputs.arv) * 100}%` }}
                                />
                            </div>
                        </div>

                        {clearingBounds && (
                            <div className="bg-slate-800/60 rounded-md p-5 border border-slate-700">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest flex items-center gap-2">
                                        <span>🔮</span> AI Clearing Prediction
                                    </div>
                                    <div className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-md ${
 clearingBounds.safety_sentiment === 'Favorable Buyer Market' ? 'bg-emerald-500/20 text-emerald-400' :
 clearingBounds.safety_sentiment === 'Aggressive Market' ? 'bg-amber-500/20 text-amber-400' :
 'bg-blue-500/20 text-blue-400'
 }`}>
                                        {clearingBounds.safety_sentiment}
                                    </div>
                                </div>
                                
                                <div className="text-xl font-semibold text-white mb-1">
                                    ${Math.round(clearingBounds.estimated_clearing_price).toLocaleString()} <span className="text-xs font-bold text-slate-500 line-through">Est.</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                                    <span>Safe Bid Range: Up to ${Math.round(clearingBounds.safe_bid_max).toLocaleString()}</span>
                                    <span className="text-red-400">Danger: {'>'}$ {Math.round(clearingBounds.danger_zone_threshold).toLocaleString()}</span>
                                </div>
                                
                                {/* Trinary Range Slider Bar */}
                                <div className="h-2 w-full bg-slate-800 rounded-sm overflow-hidden flex">
                                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(clearingBounds.safe_bid_max / inputs.arv) * 100}%` }} />
                                    <div className="bg-amber-400 h-full transition-all" style={{ width: `${((clearingBounds.danger_zone_threshold - clearingBounds.safe_bid_max) / inputs.arv) * 100}%` }} />
                                    <div className="bg-red-500 h-full transition-all" style={{ flex: 1 }} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <StatBox 
                                label="Projected ROI" 
                                value={`${Math.round(results.estimated_roi_pct)}%`} 
                                sub="Institutional Target"
                            />
                            <StatBox 
                                label="Safety Margin" 
                                value={`${Math.round(results.safety_margin)}%`} 
                                sub="Equity Buffer"
                            />
                        </div>

                        <div className="bg-slate-800/40 rounded-sm p-4 border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-400">Total Acquisition Cost</span>
                                <span className="text-sm font-bold text-white">${Math.round(results.total_acquisition_cost).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Equity at Max Bid</span>
                                <span className="text-sm font-bold text-emerald-400">${Math.round(results.equity_position).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-800/50 border-t border-slate-700">
                <button className="w-full py-3 bg-slate-900 hover: hover: text-white font-semibold rounded-sm shadow-none transition-all active:scale-[0.98]">
                    GENERATE PRO-FORMA PDF
                </button>
            </div>
        </div>
    );
}

function InputGroup({ label, value, onChange, prefix, color = "text-white" }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">{label}</label>
            <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{prefix}</span>
                <input 
                    type="number" 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full bg-slate-800 border border-slate-700 rounded-sm py-3 pl-8 pr-4 text-sm font-bold ${color} outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 group-hover:border-slate-600 transition-all`}
                />
            </div>
        </div>
    );
}

function StatBox({ label, value, sub }) {
    return (
        <div className="bg-slate-800/30 border border-slate-700 rounded-sm p-4">
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">{label}</div>
            <div className="text-xl font-semibold text-white my-0.5">{value}</div>
            <div className="text-[8px] text-slate-600 font-bold uppercase">{sub}</div>
        </div>
    );
}
