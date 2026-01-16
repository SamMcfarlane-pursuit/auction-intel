import React, { useState, useMemo } from 'react';

// 2026 Auction Calendar - Exact dates for each state
const AUCTION_CALENDAR_2026 = {
    // MONTHLY STATES
    'TX': { frequency: 'Monthly', dates: ['Jan 7', 'Feb 3', 'Mar 3', 'Apr 7', 'May 5', 'Jun 2', 'Jul 7', 'Aug 4', 'Sep 1', 'Oct 6', 'Nov 3', 'Dec 1'], note: '1st Tuesday of each month' },
    'GA': { frequency: 'Monthly', dates: ['Jan 6', 'Feb 3', 'Mar 3', 'Apr 7', 'May 5', 'Jun 2', 'Jul 7', 'Aug 4', 'Sep 1', 'Oct 6', 'Nov 3', 'Dec 1'], note: '1st Tuesday of each month' },

    // ANNUAL STATES - Specific months
    'FL': { frequency: 'Annual', dates: ['May 28', 'Jun 1-15'], note: 'County-specific dates in May-June' },
    'AZ': { frequency: 'Annual', dates: ['Feb 10'], note: 'February, 2nd Tuesday - Maricopa largest' },
    'IL': { frequency: 'Annual', dates: ['Oct 20', 'Nov 3'], note: 'October-November' },
    'IN': { frequency: 'Annual', dates: ['Sep 14', 'Oct 5'], note: 'September-October' },
    'CO': { frequency: 'Annual', dates: ['Nov 4', 'Nov 11'], note: 'November' },
    'NJ': { frequency: 'Varies', dates: ['Oct 15', 'Nov 1', 'Dec 1'], note: 'October-December by municipality' },
    'MD': { frequency: 'Annual', dates: ['May 11', 'Jun 8'], note: 'May-June' },
    'IA': { frequency: 'Annual', dates: ['Jun 15'], note: '3rd Monday of June - HIGHEST RATE 24%' },
    'AL': { frequency: 'Annual', dates: ['May 18', 'Jun 1'], note: 'May-June' },
    'KY': { frequency: 'Annual', dates: ['Jul 13', 'Aug 10'], note: 'July-August' },
    'LA': { frequency: 'Varies', dates: ['Jun 8', 'Jul 6'], note: 'June-July by parish' },
    'MS': { frequency: 'Annual', dates: ['Aug 31'], note: 'Last Monday of August' },
    'MO': { frequency: 'Annual', dates: ['Aug 24'], note: '4th Monday of August' },
    'MT': { frequency: 'Annual', dates: ['Jul 13'], note: 'July' },
    'NE': { frequency: 'Annual', dates: ['Mar 2'], note: '1st Monday of March' },
    'NH': { frequency: 'Annual', dates: ['May 18', 'Jun 15'], note: 'May-June' },
    'OK': { frequency: 'Annual', dates: ['Jun 8'], note: '2nd Monday of June' },
    'SC': { frequency: 'Annual', dates: ['Oct 5', 'Nov 2'], note: 'October-November' },
    'SD': { frequency: 'Annual', dates: ['Dec 15'], note: '3rd Tuesday of December' },
    'VT': { frequency: 'Annual', dates: ['Apr 13', 'May 11'], note: 'April-June' },
    'WV': { frequency: 'Annual', dates: ['Oct 19', 'Nov 16'], note: 'October-November' },
    'WY': { frequency: 'Annual', dates: ['Sep 8'], note: 'September' },
    'CT': { frequency: 'Annual', dates: ['Jun 8', 'Jul 6'], note: 'June-July' },
    'DC': { frequency: 'Annual', dates: ['Jul 13'], note: 'July' },

    // DEED STATES
    'CA': { frequency: 'Varies', dates: ['Mar 15', 'Apr 12', 'Sep 20'], note: 'Varies by county - March/April/September' },
    'MI': { frequency: 'Annual', dates: ['Jul 21'], note: '3rd Tuesday of July' },
    'OH': { frequency: 'Year-round', dates: ['Ongoing'], note: 'Sheriff sales year-round by county' },
    'PA': { frequency: 'Monthly', dates: ['Varies'], note: 'Monthly/Quarterly by county' },
    'NY': { frequency: 'Varies', dates: ['Spring', 'Fall'], note: 'Spring and Fall by county' },
    'MN': { frequency: 'Annual', dates: ['May 11'], note: 'May' },
    'NV': { frequency: 'Annual', dates: ['Jun 8'], note: 'June - Clark County' },
    'NC': { frequency: 'Varies', dates: ['Varies'], note: 'By county' },
    'TN': { frequency: 'Varies', dates: ['Varies'], note: 'By county' },
    'VA': { frequency: 'Varies', dates: ['Varies'], note: 'By locality' },
    'WA': { frequency: 'Varies', dates: ['Varies'], note: 'By county' },
};

// Get months for filtering
const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AuctionCalendar({ onSelectState }) {
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'lien', 'deed'

    // State type mapping
    const lienStates = ['FL', 'AZ', 'GA', 'IL', 'IN', 'CO', 'NJ', 'MD', 'IA', 'AL', 'KY', 'LA', 'MS', 'MO', 'MT', 'NE', 'NH', 'OK', 'SC', 'SD', 'VT', 'WV', 'WY', 'CT', 'DC'];

    // Filter and sort calendar entries
    const filteredCalendar = useMemo(() => {
        return Object.entries(AUCTION_CALENDAR_2026)
            .filter(([state, info]) => {
                // Type filter
                if (typeFilter === 'lien' && !lienStates.includes(state)) return false;
                if (typeFilter === 'deed' && lienStates.includes(state)) return false;

                // Month filter
                if (selectedMonth !== 'All') {
                    const hasMonth = info.dates.some(d => d.toLowerCase().includes(selectedMonth.toLowerCase()));
                    if (!hasMonth) return false;
                }
                return true;
            })
            .sort((a, b) => {
                // Sort by frequency (Monthly first) then by first date
                if (a[1].frequency === 'Monthly' && b[1].frequency !== 'Monthly') return -1;
                if (a[1].frequency !== 'Monthly' && b[1].frequency === 'Monthly') return 1;
                return a[0].localeCompare(b[0]);
            });
    }, [selectedMonth, typeFilter]);

    // Count upcoming sales this month
    const currentMonth = MONTHS[new Date().getMonth() + 1];
    const thisMonthCount = Object.entries(AUCTION_CALENDAR_2026)
        .filter(([_, info]) => info.dates.some(d => d.toLowerCase().includes(currentMonth.toLowerCase())))
        .length;

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 md:p-8 h-full overflow-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="font-display font-black text-2xl text-slate-900">📅 2026 Tax Sale Calendar</h2>
                    <p className="text-slate-500 text-sm mt-1">Upcoming auction dates by state</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-black">
                        {thisMonthCount} sales this month
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase">Month:</span>
                    <div className="flex flex-wrap gap-1">
                        {MONTHS.map(month => (
                            <button
                                key={month}
                                onClick={() => setSelectedMonth(month)}
                                className={`px-2 py-1 rounded text-xs font-bold transition-all ${selectedMonth === month ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {month}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase">Type:</span>
                    {['all', 'lien', 'deed'].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all capitalize ${typeFilter === type ? (type === 'lien' ? 'bg-purple-600 text-white' : type === 'deed' ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <div className="text-xs font-bold text-slate-400 mb-4">{filteredCalendar.length} states found</div>

            {/* Calendar Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCalendar.map(([state, info]) => {
                    const isLien = lienStates.includes(state);
                    const isHighRate = ['IA', 'GA', 'FL', 'MD'].includes(state);

                    return (
                        <div
                            key={state}
                            onClick={() => onSelectState && onSelectState(state)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg ${isHighRate ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-white hover:border-blue-200'}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-display font-black text-lg">{state}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${isLien ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                        {isLien ? 'Lien' : 'Deed'}
                                    </span>
                                    {isHighRate && <span className="text-amber-500">🔥</span>}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${info.frequency === 'Monthly' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {info.frequency}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                                {info.dates.slice(0, 4).map((date, i) => (
                                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                                        {date}
                                    </span>
                                ))}
                                {info.dates.length > 4 && (
                                    <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-xs font-bold">
                                        +{info.dates.length - 4} more
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-slate-500">{info.note}</p>
                        </div>
                    );
                })}
            </div>

            {/* High Rate States Highlight */}
            <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                <div className="font-display font-black text-amber-800 mb-2">🔥 Highest Return States</div>
                <div className="flex flex-wrap gap-2">
                    {[
                        { state: 'IA', rate: '24%', date: 'Jun 15' },
                        { state: 'GA', rate: '20%+', date: 'Monthly' },
                        { state: 'FL', rate: '18%', date: 'May-Jun' },
                        { state: 'MD', rate: '18-24%', date: 'May-Jun' },
                    ].map(s => (
                        <button
                            key={s.state}
                            onClick={() => onSelectState && onSelectState(s.state)}
                            className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition-all"
                        >
                            <span className="font-display font-black">{s.state}</span>
                            <span className="text-emerald-600 font-bold text-sm">{s.rate}</span>
                            <span className="text-slate-400 text-xs">→ {s.date}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
