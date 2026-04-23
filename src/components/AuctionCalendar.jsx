import React, { useState, useMemo } from 'react';

// 2026 Auction Calendar - Expanded dates for all states
const AUCTION_CALENDAR_2026 = {
    // MONTHLY STATES
    'TX': { frequency: 'Monthly', type: 'Deed', dates: ['2026-01-06', '2026-02-03', '2026-03-03', '2026-04-07', '2026-05-05', '2026-06-02', '2026-07-07', '2026-08-04', '2026-09-01', '2026-10-06', '2026-11-03', '2026-12-01'], note: '1st Tuesday of each month', rate: '25% penalty' },
    'GA': { frequency: 'Monthly', type: 'Lien', dates: ['2026-01-06', '2026-02-03', '2026-03-03', '2026-04-07', '2026-05-05', '2026-06-02', '2026-07-07', '2026-08-04', '2026-09-01', '2026-10-06', '2026-11-03', '2026-12-01'], note: '1st Tuesday of each month', rate: '20-40%' },
    'PA': { frequency: 'Monthly', type: 'Deed', dates: ['2026-01-21', '2026-02-18', '2026-03-18', '2026-04-15', '2026-05-20', '2026-06-17', '2026-07-15', '2026-08-19', '2026-09-16', '2026-10-21', '2026-11-18', '2026-12-16'], note: 'Monthly/Quarterly by county', rate: 'N/A' },
    'OH': { frequency: 'Year-round', type: 'Deed', dates: ['2026-01-15', '2026-02-12', '2026-03-12', '2026-04-09', '2026-05-14', '2026-06-11', '2026-07-09', '2026-08-13', '2026-09-10', '2026-10-08', '2026-11-12', '2026-12-10'], note: 'Sheriff sales year-round by county', rate: 'N/A' },

    // ANNUAL STATES - Specific months
    'FL': { frequency: 'Annual', type: 'Lien', dates: ['2026-05-28', '2026-06-01', '2026-06-08', '2026-06-15'], note: 'County-specific dates in May-June', rate: '18%' },
    'AZ': { frequency: 'Annual', type: 'Lien', dates: ['2026-02-10', '2026-02-15'], note: 'February - Maricopa largest', rate: '16%' },
    'IL': { frequency: 'Annual', type: 'Lien', dates: ['2026-10-20', '2026-11-03'], note: 'October-November', rate: '18%' },
    'IN': { frequency: 'Annual', type: 'Lien', dates: ['2026-09-14', '2026-10-05'], note: 'September-October', rate: '10-15%' },
    'CO': { frequency: 'Annual', type: 'Lien', dates: ['2026-11-04', '2026-11-11'], note: 'November', rate: 'Fed+9pts' },
    'NJ': { frequency: 'Varies', type: 'Lien', dates: ['2026-10-15', '2026-11-01', '2026-12-01'], note: 'Oct-Dec by municipality', rate: '18%' },
    'MD': { frequency: 'Annual', type: 'Lien', dates: ['2026-05-11', '2026-06-08'], note: 'May-June', rate: '18-24%' },
    'IA': { frequency: 'Annual', type: 'Lien', dates: ['2026-06-15'], note: '3rd Monday of June – HIGHEST RATE 24%', rate: '24%' },
    'AL': { frequency: 'Annual', type: 'Lien', dates: ['2026-05-18', '2026-06-01'], note: 'May-June', rate: '12%' },
    'KY': { frequency: 'Annual', type: 'Lien', dates: ['2026-07-13', '2026-08-10'], note: 'July-August', rate: '12%' },
    'LA': { frequency: 'Varies', type: 'Lien', dates: ['2026-06-08', '2026-07-06'], note: 'June-July by parish', rate: 'Bid-down' },
    'MS': { frequency: 'Annual', type: 'Lien', dates: ['2026-08-31'], note: 'Last Monday of August', rate: '18%' },
    'MO': { frequency: 'Annual', type: 'Lien', dates: ['2026-08-24'], note: '4th Monday of August', rate: '10%' },
    'MT': { frequency: 'Annual', type: 'Lien', dates: ['2026-07-13'], note: 'July', rate: '10%' },
    'NE': { frequency: 'Annual', type: 'Lien', dates: ['2026-03-02'], note: '1st Monday of March', rate: '14%' },
    'NH': { frequency: 'Annual', type: 'Lien', dates: ['2026-05-18', '2026-06-15'], note: 'May-June', rate: '18%' },
    'OK': { frequency: 'Annual', type: 'Lien', dates: ['2026-06-08'], note: '2nd Monday of June', rate: '8%' },
    'SC': { frequency: 'Annual', type: 'Lien', dates: ['2026-10-05', '2026-11-02'], note: 'October-November', rate: '3-12%' },
    'SD': { frequency: 'Annual', type: 'Lien', dates: ['2026-12-15'], note: '3rd Tuesday of December', rate: '10-12%' },
    'VT': { frequency: 'Annual', type: 'Deed', dates: ['2026-04-13', '2026-05-11'], note: 'April-June', rate: 'N/A' },
    'WV': { frequency: 'Annual', type: 'Lien', dates: ['2026-10-19', '2026-11-16'], note: 'October-November', rate: '12%' },
    'WY': { frequency: 'Annual', type: 'Lien', dates: ['2026-09-08'], note: 'September', rate: '15%+3%' },
    'CT': { frequency: 'Annual', type: 'Lien', dates: ['2026-06-08', '2026-07-06'], note: 'June-July', rate: '18%' },
    'DC': { frequency: 'Annual', type: 'Lien', dates: ['2026-07-13'], note: 'July', rate: '18%' },

    // DEED STATES
    'CA': { frequency: 'Varies', type: 'Deed', dates: ['2026-03-15', '2026-04-12', '2026-09-20'], note: 'Varies – March/April/September', rate: 'N/A' },
    'MI': { frequency: 'Annual', type: 'Deed', dates: ['2026-07-21'], note: '3rd Tuesday of July', rate: 'N/A' },
    'NY': { frequency: 'Varies', type: 'Deed', dates: ['2026-04-15', '2026-10-15'], note: 'Spring and Fall by county', rate: 'N/A' },
    'MN': { frequency: 'Annual', type: 'Deed', dates: ['2026-05-11'], note: 'May', rate: 'N/A' },
    'NV': { frequency: 'Annual', type: 'Deed', dates: ['2026-06-08'], note: 'June – Clark County', rate: 'N/A' },
    'NC': { frequency: 'Varies', type: 'Deed', dates: ['2026-03-20', '2026-06-19', '2026-09-18'], note: 'Quarterly by county', rate: 'N/A' },
    'TN': { frequency: 'Varies', type: 'Deed', dates: ['2026-04-10', '2026-07-10', '2026-10-09'], note: 'Quarterly by county', rate: 'N/A' },
    'VA': { frequency: 'Varies', type: 'Deed', dates: ['2026-03-12', '2026-06-11', '2026-09-10', '2026-12-10'], note: 'Quarterly by locality', rate: 'N/A' },
    'WA': { frequency: 'Varies', type: 'Deed', dates: ['2026-03-16', '2026-06-15', '2026-09-14'], note: 'Quarterly by county', rate: 'N/A' },
    'AR': { frequency: 'Varies', type: 'Deed', dates: ['2026-03-10', '2026-06-09'], note: 'Quarterly', rate: 'N/A' },
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AuctionCalendar({ auctions, onSelectState }) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'lien', 'deed'

    // Build an index: dateString -> [{state, info}]
    const dateIndex = useMemo(() => {
        const idx = {};

        // Add static schedule data
        Object.entries(AUCTION_CALENDAR_2026).forEach(([state, info]) => {
            if (typeFilter === 'lien' && info.type !== 'Lien') return;
            if (typeFilter === 'deed' && info.type !== 'Deed') return;
            info.dates.forEach(d => {
                if (!idx[d]) idx[d] = [];
                idx[d].push({ state, ...info });
            });
        });

        // Merge live auction data from backend
        if (auctions && auctions.length > 0) {
            auctions.forEach(a => {
                const dateStr = a.sale_date;
                if (typeFilter === 'lien' && a.sale_type !== 'Tax Lien') return;
                if (typeFilter === 'deed' && (a.sale_type !== 'Tax Deed' && a.sale_type !== 'Sheriff Sale')) return;

                if (!idx[dateStr]) idx[dateStr] = [];
                // Only add if not already present from static data (prefer live data)
                const exists = idx[dateStr].some(e => e.state === a.state && e.county === a.county);
                if (!exists) {
                    idx[dateStr].push({
                        state: a.state,
                        county: a.county,
                        type: a.sale_type === 'Tax Lien' ? 'Lien' : 'Deed',
                        frequency: 'Confirmed',
                        rate: a.interest_rate || 'N/A',
                        note: a.notes || `${a.county} Live Auction`,
                        isLive: true
                    });
                }
            });
        }

        return idx;
    }, [auctions, typeFilter]);

    // Calendar grid generation
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

        const days = [];
        // Previous month trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, currentMonth: false, date: null });
        }
        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const mm = String(currentMonth + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            const dateStr = `${currentYear}-${mm}-${dd}`;
            days.push({ day: d, currentMonth: true, date: dateStr, events: dateIndex[dateStr] || [] });
        }
        // Next month leading days
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, currentMonth: false, date: null });
        }
        return days;
    }, [currentMonth, currentYear, dateIndex]);

    // Monthly stats
    const monthStats = useMemo(() => {
        let totalAuctions = 0;
        let lienCount = 0;
        let deedCount = 0;
        let highRateStates = [];

        calendarDays.forEach(d => {
            if (d.currentMonth && d.events.length > 0) {
                totalAuctions += d.events.length;
                d.events.forEach(e => {
                    if (e.type === 'Lien') lienCount++;
                    else deedCount++;
                    if (['IA', 'GA', 'FL', 'MD', 'CT', 'DC', 'NJ'].includes(e.state)) {
                        if (!highRateStates.includes(e.state)) highRateStates.push(e.state);
                    }
                });
            }
        });
        return { totalAuctions, lienCount, deedCount, highRateStates };
    }, [calendarDays]);

    const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); setSelectedDay(null); };
    const goPrev = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else { setCurrentMonth(m => m - 1); } setSelectedDay(null); };
    const goNext = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else { setCurrentMonth(m => m + 1); } setSelectedDay(null); };

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Events for selected day
    const selectedDayEvents = selectedDay ? (dateIndex[selectedDay] || []) : [];

    return (
        <div className="h-full flex flex-col lg:flex-row gap-4 overflow-hidden">
            {/* Main Calendar */}
            <div className="flex-1 bg-canvas rounded-md shadow-none border border-slate-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-mono font-semibold text-lg font-mono md:text-xl font-mono text-slate-900 tracking-tight">
                                {MONTH_NAMES[currentMonth]} {currentYear}
                            </h2>
                            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-1">Tax Sale Calendar</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={goToday} className="px-3 py-1.5 bg-indigo-600 text-white rounded-sm text-xs font-bold hover:bg-indigo-700 transition-all">
                                Today
                            </button>
                            <button onClick={goPrev} className="w-9 h-9 flex items-center justify-center rounded-sm bg-surface border border-slate-300 hover:bg-slate-100 text-slate-900 font-bold transition-all">
                                ←
                            </button>
                            <button onClick={goNext} className="w-9 h-9 flex items-center justify-center rounded-sm bg-surface border border-slate-300 hover:bg-slate-100 text-slate-900 font-bold transition-all">
                                →
                            </button>
                        </div>
                    </div>

                    {/* Filters + Stats */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {['all', 'lien', 'deed'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all capitalize ${typeFilter === type
                                        ? (type === 'lien' ? 'bg-indigo-600 text-white shadow-none' : type === 'deed' ? 'bg-panel-2 text-white shadow-none' : 'bg-surface text-white shadow-none')
                                        : 'bg-surface text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {type === 'all' ? 'All Types' : type}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 bg-blue-950/40 text-indigo-500 border border-indigo-200 rounded-sm text-xs font-semibold">
                                {monthStats.totalAuctions} auctions
                            </span>
                            {monthStats.lienCount > 0 && (
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-500 border border-blue-800/30 rounded-sm text-[10px] font-semibold">
                                    {monthStats.lienCount} Lien
                                </span>
                            )}
                            {monthStats.deedCount > 0 && (
                                <span className="px-2.5 py-1 bg-surface text-slate-600 border border-slate-300/60 rounded-sm text-[10px] font-semibold">
                                    {monthStats.deedCount} Deed
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-slate-200">
                    {DAY_NAMES.map(d => (
                        <div key={d} className="py-3 text-center text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-1 overflow-auto">
                    {calendarDays.map((cell, i) => {
                        const isToday = cell.date === todayStr;
                        const isSelected = cell.date === selectedDay;
                        const hasEvents = cell.events && cell.events.length > 0;
                        const lienEvents = hasEvents ? cell.events.filter(e => e.type === 'Lien') : [];
                        const deedEvents = hasEvents ? cell.events.filter(e => e.type !== 'Lien') : [];

                        return (
                            <div
                                key={i}
                                onClick={() => cell.currentMonth && cell.date && setSelectedDay(cell.date === selectedDay ? null : cell.date)}
                                className={`min-h-[72px] md:min-h-[90px] p-1.5 md:p-2 border-b border-r border-slate-200 transition-all relative ${!cell.currentMonth ? 'bg-surface/20' :
                                    isSelected ? 'bg-indigo-50 ring-1 ring-indigo-500/50 ring-inset z-10' :
                                        hasEvents ? 'bg-canvas hover:bg-slate-100 cursor-pointer' :
                                            'bg-canvas'
                                    }`}
                            >
                                <div className={`text-sm font-bold mb-1 ${!cell.currentMonth ? 'text-slate-600' :
                                    isToday ? 'text-indigo-500' :
                                        isSelected ? 'text-white' :
                                            'text-slate-900'
                                    }`}>
                                    {isToday ? (
                                        <span className="inline-flex items-center justify-center w-7 h-7 bg-indigo-600 rounded-sm text-white text-xs font-semibold">
                                            {cell.day}
                                        </span>
                                    ) : cell.day}
                                </div>

                                {/* Event dots */}
                                {hasEvents && (
                                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                                        {lienEvents.slice(0, 3).map((e, j) => (
                                            <div key={`l${j}`} className="flex items-center gap-0.5">
                                                <span className="w-1.5 h-1.5 rounded-sm bg-indigo-500 shrink-0"></span>
                                                <span className="text-[8px] font-semibold text-indigo-600 hidden md:inline">{e.state}</span>
                                            </div>
                                        ))}
                                        {deedEvents.slice(0, 3).map((e, j) => (
                                            <div key={`d${j}`} className="flex items-center gap-0.5">
                                                <span className="w-1.5 h-1.5 rounded-sm bg-slate-400 shrink-0"></span>
                                                <span className="text-[8px] font-semibold text-slate-600 hidden md:inline">{e.state}</span>
                                            </div>
                                        ))}
                                        {cell.events.length > 6 && (
                                            <span className="text-[8px] font-bold text-slate-600">+{cell.events.length - 6}</span>
                                        )}
                                    </div>
                                )}

                                {/* Event count badge */}
                                {hasEvents && cell.events.length > 0 && (
                                    <div className="absolute top-1 right-1 w-4 h-4 md:w-5 md:h-5 bg-indigo-600 rounded-sm flex items-center justify-center">
                                        <span className="text-[8px] md:text-[9px] font-semibold text-white">{cell.events.length}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 py-3 border-t border-slate-200 bg-white">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
                        <span className="text-[10px] font-bold text-slate-500">Lien State</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-slate-400"></span>
                        <span className="text-[10px] font-bold text-slate-500">Deed State</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-indigo-600 rounded-sm flex items-center justify-center">
                            <span className="text-[7px] text-white font-bold">3</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500"># of Sales</span>
                    </div>
                </div>
            </div>

            {/* Right Sidebar — Day Detail or Summary */}
            <div className="w-full lg:w-96 flex flex-col gap-4 overflow-auto">
                {/* Selected Day Panel */}
                {selectedDay ? (
                    <div className="bg-canvas rounded-md shadow-none border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Auction Date</div>
                                    <div className="font-mono font-semibold text-xl text-slate-900 mt-0.5">
                                        {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedDay(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface hover:bg-slate-200 text-slate-500 font-bold transition-all text-sm">
                                    ×
                                </button>
                            </div>
                            {selectedDayEvents.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-semibold">
                                        {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'sale' : 'sales'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto p-4 space-y-3">
                            {selectedDayEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-14 h-14 bg-surface rounded-md flex items-center justify-center text-lg font-mono mb-3">📅</div>
                                    <p className="text-slate-600 text-sm font-medium">No auctions scheduled</p>
                                </div>
                            ) : (
                                selectedDayEvents.map((e, i) => {
                                    const isLien = e.type === 'Lien';
                                    const isHighRate = ['IA', 'GA', 'FL', 'MD', 'CT', 'DC', 'NJ', 'NH', 'MS', 'IL'].includes(e.state);
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => onSelectState && onSelectState(e.state)}
                                            className={`p-4 rounded-md border-2 cursor-pointer transition-all hover:shadow-none hover:scale-[1.01] ${isHighRate ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-canvas hover:border-indigo-200'
 }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-semibold text-lg text-slate-900">{e.state}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold text-white ${isLien ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                        {e.type}
                                                    </span>
                                                    {isHighRate && <span className="text-amber-500">🔥</span>}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${e.frequency === 'Monthly' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface text-slate-500'}`}>
                                                    {e.frequency}
                                                </span>
                                            </div>
                                            {e.rate && e.rate !== 'N/A' && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">Rate</span>
                                                    <span className="text-sm font-semibold text-emerald-600">{e.rate}</span>
                                                </div>
                                            )}
                                            <p className="text-xs text-slate-500">{e.note}</p>
                                            <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600 font-bold">
                                                <span>Explore State →</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    /* Summary Panel when no day is selected */
                    <div className="bg-canvas rounded-md shadow-none border border-slate-200 p-5">
                        <h3 className="font-mono font-semibold text-lg text-slate-900 mb-1">📅 Month Summary</h3>
                        <p className="text-xs text-slate-600 mb-4">Click any day with events to see details</p>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-indigo-50 rounded-sm p-3 text-center">
                                <div className="font-mono font-semibold text-xl text-indigo-700">{monthStats.totalAuctions}</div>
                                <div className="text-[9px] font-bold text-indigo-500 uppercase">Total</div>
                            </div>
                            <div className="bg-indigo-50 rounded-sm p-3 text-center">
                                <div className="font-mono font-semibold text-xl text-indigo-600">{monthStats.lienCount}</div>
                                <div className="text-[9px] font-bold text-indigo-500 uppercase">Lien</div>
                            </div>
                            <div className="bg-surface rounded-sm p-3 text-center">
                                <div className="font-mono font-semibold text-xl text-slate-700">{monthStats.deedCount}</div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase">Deed</div>
                            </div>
                        </div>

                        {monthStats.highRateStates.length > 0 && (
                            <div className="bg-surface rounded-sm p-3 border border-amber-200">
                                <div className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider mb-2">🔥 High-Yield States This Month</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {monthStats.highRateStates.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => onSelectState && onSelectState(s)}
                                            className="px-2.5 py-1 bg-canvas rounded-lg border border-amber-200 text-xs font-semibold text-slate-700 hover:border-amber-400 transition-all"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Navigation */}
                <div className="bg-surface rounded-md shadow-none p-5">
                    <h3 className="font-mono font-semibold text-slate-900 mb-3">🚀 Quick Jump</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {MONTH_NAMES.map((name, i) => {
                            const isActive = i === currentMonth;
                            const mm = String(i + 1).padStart(2, '0');
                            const monthHasEvents = Object.keys(dateIndex).some(d => d.startsWith(`2026-${mm}`));
                            return (
                                <button
                                    key={name}
                                    onClick={() => { setCurrentMonth(i); setCurrentYear(2026); setSelectedDay(null); }}
                                    className={`py-2 rounded-lg text-[10px] font-semibold uppercase transition-all ${isActive ? 'bg-indigo-600 text-white shadow-none' : monthHasEvents ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' }`}
                                >
                                    {name.slice(0, 3)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
