/**
 * CSV Export Utilities
 * Exports data tables to CSV format
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data, columns = null) {
    if (!data || data.length === 0) return '';

    // Use provided columns or extract from first object
    const headers = columns || Object.keys(data[0]);

    // Create header row
    const headerRow = headers.map(h => `"${h}"`).join(',');

    // Create data rows
    const rows = data.map(row =>
        headers.map(header => {
            const value = row[header];
            // Handle strings with commas or quotes
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
        }).join(',')
    );

    return [headerRow, ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(data, filename = 'export.csv', columns = null) {
    const csv = arrayToCSV(data, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export state data to CSV
 */
export function exportStateDataCSV(stateData, stateName) {
    const filename = `${stateName.replace(/\s+/g, '_')}_data_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(stateData, filename);
}

/**
 * Export county data to CSV
 */
export function exportCountyDataCSV(countyData, columns) {
    const filename = `county_data_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(countyData, filename, columns);
}

/**
 * Export watchlist to CSV
 */
export function exportWatchlistCSV(watchlistItems) {
    const data = watchlistItems.map(item => ({
        State: item.stateAbbr,
        County: item.county,
        Tier: item.tier,
        'Added Date': new Date(item.addedAt).toLocaleDateString(),
        Notes: item.notes || ''
    }));

    const filename = `watchlist_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(data, filename);
}

/**
 * Export market data to CSV
 */
export function exportMarketDataCSV(rates, indicators) {
    const data = [
        { Metric: '30-Year Fixed', Value: `${rates.mortgage_30yr}%`, Change: rates.mortgage_30yr_change },
        { Metric: '15-Year Fixed', Value: `${rates.mortgage_15yr}%`, Change: '-' },
        ...indicators.map(ind => ({
            Metric: ind.name,
            Value: `${ind.value}${ind.unit}`,
            Change: `${ind.change >= 0 ? '+' : ''}${ind.change}`
        }))
    ];

    const filename = `market_data_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(data, filename);
}

export default { downloadCSV, arrayToCSV, exportStateDataCSV, exportCountyDataCSV, exportWatchlistCSV, exportMarketDataCSV };
