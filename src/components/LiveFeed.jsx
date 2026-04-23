import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const LiveFeed = ({ apiUrl = 'http://localhost:8080/api' }) => {
    const [events, setEvents] = useState([]);
    const [status, setStatus] = useState('connecting');
    const scrollRef = useRef(null);

    useEffect(() => {
        const sse = new EventSource(`${apiUrl}/sse/feed`);

        sse.onopen = () => {
            setStatus('connected');
            console.log('📡 SSE Connected');
        };

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'Heartbeat') return; // Ignore heartbeats for the ticker

                setEvents((prev) => [data, ...prev].slice(0, 50));
            } catch (err) {
                console.error('SSE Parse Error:', err);
            }
        };

        sse.onerror = (err) => {
            setStatus('error');
            console.error('SSE Error:', err);
            sse.close();
            // Simple retry logic after 5 seconds
            setTimeout(() => {
                // This will trigger a re-render and re-run this effect
                setStatus('reconnecting');
            }, 5000);
        };

        return () => sse.close();
    }, [apiUrl, status === 'reconnecting']);

    const getIcon = (type) => {
        switch (type) {
            case 'AuctionUpdate': return <Zap className="w-4 h-4 text-amber-400" />;
            case 'RateChange': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
            case 'DealAlert': return <Activity className="w-4 h-4 text-cyan-400" />;
            default: return <Clock className="w-4 h-4 text-slate-600" />;
        }
    };

    return (
        <div className="flex items-center gap-4 bg-white backdrop-blur-md border border-slate-300/60 px-4 py-1.5 rounded-sm overflow-hidden max-w-2xl w-full h-9">
            <div className="flex items-center gap-2 shrink-0 border-r border-slate-300 pr-3 mr-1">
                <div className={`w-2 h-2 rounded-sm ${status === 'connected' ? 'bg-emerald-500 animate-none' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    Live Feed
                </span>
            </div>

            <div className="overflow-hidden flex-1 relative h-full">
                <div className="flex items-center gap-8 whitespace-nowrap animate-ticker hover:pause">
                    {events.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">Waiting for market data...</span>
                    ) : (
                        events.map((event, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                {getIcon(event.type)}
                                <span className="text-xs font-medium text-slate-800">
                                    {event.data.message || `${event.type}: ${event.data.county || event.data.state}`}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-sm bg-panel-2" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveFeed;
