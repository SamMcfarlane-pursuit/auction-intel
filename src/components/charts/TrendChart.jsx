import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

/**
 * TrendChart - Displays time-series data with trend lines
 * Usage: <TrendChart data={[{date: '2024-01', value: 6.5}]} />
 */
export function TrendChart({
    data,
    dataKey = 'value',
    xKey = 'date',
    title = 'Trend',
    color = '#3b82f6',
    height = 300,
    showGrid = true,
    showArea = false,
    formatValue = (v) => v?.toFixed(2)
}) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-400">
                No data available
            </div>
        );
    }

    const ChartComponent = showArea ? AreaChart : LineChart;

    return (
        <div className="w-full">
            {title && (
                <h3 className="text-sm font-bold text-slate-700 mb-3">{title}</h3>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <ChartComponent data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                    <XAxis
                        dataKey={xKey}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatValue}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#f1f5f9'
                        }}
                        formatter={(value) => [formatValue(value), dataKey]}
                    />
                    {showArea ? (
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.1}
                            strokeWidth={2}
                        />
                    ) : (
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: color, strokeWidth: 0, r: 3 }}
                            activeDot={{ r: 5, fill: color }}
                        />
                    )}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * MultiLineChart - Multiple trend lines on one chart
 */
export function MultiLineChart({
    data,
    lines = [{ key: 'value', color: '#3b82f6', name: 'Value' }],
    xKey = 'date',
    title,
    height = 300
}) {
    if (!data || data.length === 0) {
        return <div className="text-slate-400 text-center py-8">No data</div>;
    }

    return (
        <div className="w-full">
            {title && <h3 className="text-sm font-bold text-slate-700 mb-3">{title}</h3>}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                        }}
                    />
                    <Legend />
                    {lines.map(line => (
                        <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            stroke={line.color}
                            name={line.name}
                            strokeWidth={2}
                            dot={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default TrendChart;
