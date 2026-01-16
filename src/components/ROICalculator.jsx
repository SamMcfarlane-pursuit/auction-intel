import React, { useState, useMemo } from 'react';

// State interest rates for ROI calculations
const STATE_RATES = {
    // Lien States
    'IA': { rate: 24, type: 'Lien', notes: 'Highest rate in US' },
    'GA': { rate: 20, type: 'Lien', notes: 'Escalates to 30%, then 40%' },
    'FL': { rate: 18, type: 'Lien', notes: 'Bid down from 18%, 5% minimum' },
    'MD': { rate: 21, type: 'Lien', notes: 'Range 18-24%' },
    'AZ': { rate: 16, type: 'Lien', notes: 'Bid down from 16%' },
    'IL': { rate: 18, type: 'Lien', notes: 'Bid down system' },
    'NJ': { rate: 18, type: 'Lien', notes: 'Bid down system' },
    'WY': { rate: 18, type: 'Lien', notes: '15% + 3% penalty' },
    'NE': { rate: 14, type: 'Lien', notes: 'Fixed rate' },
    'CO': { rate: 12, type: 'Lien', notes: 'Fed discount + 9%' },
    'AL': { rate: 12, type: 'Lien', notes: 'Fixed rate' },
    'KY': { rate: 12, type: 'Lien', notes: 'Fixed rate' },
    'SD': { rate: 12, type: 'Lien', notes: 'Fixed rate' },
    'VT': { rate: 12, type: 'Lien', notes: 'Fixed rate' },
    'WV': { rate: 12, type: 'Lien', notes: 'Fixed rate' },
    'IN': { rate: 12.5, type: 'Lien', notes: '10-15% graduated' },
    'MO': { rate: 10, type: 'Lien', notes: 'Fixed rate' },
    'MT': { rate: 10, type: 'Lien', notes: 'Fixed rate' },
    'OK': { rate: 8, type: 'Lien', notes: 'Lower rate' },
    'SC': { rate: 8, type: 'Lien', notes: 'Penalty-based' },

    // Deed States - showing penalty rates
    'TX': { rate: 25, type: 'Deed', notes: '25% penalty if redeemed' },
    'DE': { rate: 15, type: 'Deed', notes: '15% penalty' },
    'ND': { rate: 9, type: 'Deed', notes: 'Max 9% bid down' },
    'CA': { rate: 0, type: 'Deed', notes: 'No interest - deed only' },
    'MI': { rate: 0, type: 'Deed', notes: 'No interest - deed only' },
    'OH': { rate: 0, type: 'Deed', notes: 'No interest - deed only' },
    'PA': { rate: 0, type: 'Deed', notes: 'No interest - deed only' },
    'NY': { rate: 0, type: 'Deed', notes: 'No interest - deed only' },
};

export default function ROICalculator({ onClose }) {
    const [purchasePrice, setPurchasePrice] = useState(5000);
    const [selectedState, setSelectedState] = useState('FL');
    const [holdMonths, setHoldMonths] = useState(12);
    const [showComparison, setShowComparison] = useState(false);

    const stateInfo = STATE_RATES[selectedState] || { rate: 10, type: 'Unknown' };

    // Calculate returns
    const calculations = useMemo(() => {
        const annualRate = stateInfo.rate / 100;
        const monthlyRate = annualRate / 12;
        const interest = purchasePrice * (monthlyRate * holdMonths);
        const totalReturn = purchasePrice + interest;
        const roi = (interest / purchasePrice) * 100;
        const annualizedROI = (roi / holdMonths) * 12;

        return {
            interest: interest.toFixed(2),
            totalReturn: totalReturn.toFixed(2),
            roi: roi.toFixed(2),
            annualizedROI: annualizedROI.toFixed(2),
        };
    }, [purchasePrice, stateInfo.rate, holdMonths]);

    // Top 5 states comparison
    const topStates = useMemo(() => {
        return Object.entries(STATE_RATES)
            .filter(([_, info]) => info.type === 'Lien')
            .sort((a, b) => b[1].rate - a[1].rate)
            .slice(0, 5)
            .map(([abbr, info]) => {
                const annualRate = info.rate / 100;
                const monthlyRate = annualRate / 12;
                const interest = purchasePrice * (monthlyRate * holdMonths);
                return {
                    state: abbr,
                    rate: info.rate,
                    interest: interest.toFixed(2),
                    total: (purchasePrice + interest).toFixed(2),
                };
            });
    }, [purchasePrice, holdMonths]);

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="font-display font-black text-2xl text-slate-900">💰 ROI Calculator</h2>
                    <p className="text-slate-500 text-sm mt-1">Calculate potential returns on tax lien investments</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Investment Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                                className="w-full pl-8 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 font-display font-black text-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">State</label>
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {Object.entries(STATE_RATES)
                                .sort((a, b) => b[1].rate - a[1].rate)
                                .map(([abbr, info]) => (
                                    <option key={abbr} value={abbr}>
                                        {abbr} - {info.rate}% ({info.type})
                                    </option>
                                ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">{stateInfo.notes}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Hold Period: {holdMonths} months</label>
                        <input
                            type="range"
                            min="1"
                            max="36"
                            value={holdMonths}
                            onChange={(e) => setHoldMonths(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>1 month</span>
                            <span>3 years</span>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                    <div className="text-xs font-black text-blue-200 uppercase mb-4">Projected Returns</div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/10 rounded-xl p-4">
                            <div className="text-xs text-blue-200 uppercase font-bold">Interest Earned</div>
                            <div className="font-display font-black text-2xl">${Number(calculations.interest).toLocaleString()}</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4">
                            <div className="text-xs text-blue-200 uppercase font-bold">Total Return</div>
                            <div className="font-display font-black text-2xl">${Number(calculations.totalReturn).toLocaleString()}</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4">
                            <div className="text-xs text-blue-200 uppercase font-bold">ROI ({holdMonths}mo)</div>
                            <div className="font-display font-black text-2xl">{calculations.roi}%</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4">
                            <div className="text-xs text-blue-200 uppercase font-bold">Annualized ROI</div>
                            <div className="font-display font-black text-2xl text-emerald-300">{calculations.annualizedROI}%</div>
                        </div>
                    </div>

                    <div className={`px-3 py-2 rounded-lg text-xs font-bold ${stateInfo.type === 'Lien' ? 'bg-purple-500/30 text-purple-200' : 'bg-indigo-500/30 text-indigo-200'}`}>
                        {stateInfo.type === 'Lien' ? '📜 Tax Lien Certificate' : '📋 Tax Deed Sale'} - {stateInfo.rate}% rate
                    </div>
                </div>
            </div>

            {/* State Comparison Toggle */}
            <div className="mt-6">
                <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                    {showComparison ? '▼' : '▶'} Compare Top 5 Lien States
                </button>

                {showComparison && (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr className="text-slate-400 text-[10px] font-black uppercase">
                                    <th className="px-4 py-3">State</th>
                                    <th className="px-4 py-3">Rate</th>
                                    <th className="px-4 py-3 text-right">Interest ({holdMonths}mo)</th>
                                    <th className="px-4 py-3 text-right">Total Return</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {topStates.map((s, i) => (
                                    <tr key={s.state} className={`${i === 0 ? 'bg-emerald-50' : ''} hover:bg-slate-50`}>
                                        <td className="px-4 py-3 font-display font-black">{s.state} {i === 0 && '🏆'}</td>
                                        <td className="px-4 py-3 font-bold text-blue-600">{s.rate}%</td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-600">${Number(s.interest).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-display font-black">${Number(s.total).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
