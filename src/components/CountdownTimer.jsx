import React, { useState, useEffect } from 'react';

// Calculate next first Tuesday of month
function getNextFirstTuesday() {
    const now = new Date();
    let date = new Date(now.getFullYear(), now.getMonth(), 1);
    while (date.getDay() !== 2) date.setDate(date.getDate() + 1);
    if (date < now) {
        date = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        while (date.getDay() !== 2) date.setDate(date.getDate() + 1);
    }
    return date;
}

// 2026 State auction dates
const AUCTION_DATES = {
    'TX': { next: getNextFirstTuesday(), note: '1st Tuesday monthly' },
    'GA': { next: getNextFirstTuesday(), note: '1st Tuesday monthly' },
    'FL': { next: new Date('2026-05-28'), note: 'May-June' },
    'AZ': { next: new Date('2026-02-10'), note: 'February' },
    'IL': { next: new Date('2026-10-20'), note: 'October' },
    'IA': { next: new Date('2026-06-15'), note: 'June - 24% HIGHEST' },
    'CA': { next: new Date('2026-03-15'), note: 'Varies by county' },
    'MI': { next: new Date('2026-07-21'), note: 'July 3rd Tuesday' },
};

export function CountdownTimer({ targetDate, label }) {
    const [timeLeft, setTimeLeft] = useState(calcTime(targetDate));

    useEffect(() => {
        const t = setInterval(() => setTimeLeft(calcTime(targetDate)), 1000);
        return () => clearInterval(t);
    }, [targetDate]);

    function calcTime(d) {
        if (!d) return null;
        const diff = new Date(d) - Date.now();
        if (diff <= 0) return { expired: true };
        return {
            d: Math.floor(diff / 864e5),
            h: Math.floor((diff / 36e5) % 24),
            m: Math.floor((diff / 6e4) % 60),
            s: Math.floor((diff / 1e3) % 60)
        };
    }

    if (!timeLeft) return <span className="text-slate-400 text-sm">{label || 'Check calendar'}</span>;
    if (timeLeft.expired) return <span className="text-emerald-600 font-bold">🎉 Auction Day!</span>;

    const urgent = timeLeft.d < 7;
    const bg = urgent ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-slate-700';

    return (
        <div className="flex gap-1">
            {timeLeft.d > 0 && <div className={`px-2 py-1 rounded ${bg}`}><div className="font-bold text-lg">{timeLeft.d}</div><div className="text-[8px]">days</div></div>}
            <div className={`px-2 py-1 rounded ${bg}`}><div className="font-bold text-lg">{String(timeLeft.h).padStart(2, '0')}</div><div className="text-[8px]">hrs</div></div>
            <div className={`px-2 py-1 rounded ${bg}`}><div className="font-bold text-lg">{String(timeLeft.m).padStart(2, '0')}</div><div className="text-[8px]">min</div></div>
        </div>
    );
}

export function StateCountdown({ stateAbbr }) {
    const info = AUCTION_DATES[stateAbbr];
    return (
        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="text-[10px] font-bold text-blue-600 uppercase mb-2">⏱️ Next Auction</div>
            <CountdownTimer targetDate={info?.next} label={info?.note} />
            {info?.next && <div className="text-xs text-slate-500 mt-2">{info.next.toLocaleDateString()}</div>}
        </div>
    );
}

export default CountdownTimer;
