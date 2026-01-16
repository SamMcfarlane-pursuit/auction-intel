import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

/**
 * Sparkline - Compact inline trend visualization
 * Usage: <Sparkline data={[{value: 5}, {value: 8}, {value: 3}]} />
 */
export function Sparkline({
    data,
    dataKey = 'value',
    width = 80,
    height = 24,
    color = '#3b82f6',
    showDot = false,
    trend = null // 'up', 'down', 'stable' - auto-calculated if null
}) {
    if (!data || data.length < 2) {
        return <span className="text-slate-400 text-xs">—</span>;
    }

    // Auto-calculate trend if not provided
    const calculatedTrend = trend || (() => {
        const first = data[0]?.[dataKey] || 0;
        const last = data[data.length - 1]?.[dataKey] || 0;
        if (last > first * 1.01) return 'up';
        if (last < first * 0.99) return 'down';
        return 'stable';
    })();

    const trendColors = {
        up: '#10b981',    // emerald
        down: '#ef4444',  // red
        stable: '#6b7280' // gray
    };

    const lineColor = color === 'auto' ? trendColors[calculatedTrend] : color;

    return (
        <div className="inline-flex items-center gap-1">
            <div style={{ width, height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={lineColor}
                            strokeWidth={1.5}
                            dot={showDot ? { r: 2, fill: lineColor } : false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            {calculatedTrend !== 'stable' && (
                <span className={`text-[10px] font-bold ${calculatedTrend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {calculatedTrend === 'up' ? '↑' : '↓'}
                </span>
            )}
        </div>
    );
}

/**
 * SparklineCell - For use in tables
 */
export function SparklineCell({ values, color = 'auto' }) {
    const data = values.map(v => ({ value: v }));
    return <Sparkline data={data} color={color} />;
}

/**
 * TrendIndicator - Simple up/down/stable badge
 */
export function TrendIndicator({ value, previousValue, format = 'percent' }) {
    const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;

    let trend = 'stable';
    if (change > 0.5) trend = 'up';
    if (change < -0.5) trend = 'down';

    const colors = {
        up: 'bg-emerald-100 text-emerald-700',
        down: 'bg-red-100 text-red-700',
        stable: 'bg-slate-100 text-slate-600'
    };

    const icons = { up: '↑', down: '↓', stable: '→' };

    const displayValue = format === 'percent'
        ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
        : `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;

    return (
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${colors[trend]}`}>
            <span>{icons[trend]}</span>
            <span>{displayValue}</span>
        </span>
    );
}

export default Sparkline;
