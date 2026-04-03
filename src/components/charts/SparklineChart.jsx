import React, { useState, useEffect } from 'react';

const SparklineChart = ({ fips, height = 32, width = 120, color = '#10b981', apiUrl = 'http://localhost:8080/api' }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!fips) return;

        const fetchTrend = async () => {
            try {
                const res = await fetch(`${apiUrl}/trends/${fips}?days=90`);
                const json = await res.json();
                // Extract values for the sparkline
                setData(json.map(d => d.zhvi));
            } catch (err) {
                console.error('Trend Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrend();
    }, [fips, apiUrl]);

    if (loading || data.length < 2) {
        return <div style={{ width, height }} className="bg-slate-800/20 rounded animate-pulse" />;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <defs>
                <linearGradient id={`grad-${fips}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d={`M 0,${height} L ${points} L ${width},${height} Z`}
                fill={`url(#grad-${fips})`}
                className="opacity-50"
            />
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
            <circle
                cx={width}
                cy={height - ((data[data.length - 1] - min) / range) * height}
                r="2"
                fill={color}
            />
        </svg>
    );
};

export default SparklineChart;
