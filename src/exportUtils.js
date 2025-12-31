/**
 * Export Utilities for Auction Intel Platform
 * Browser-native data export functions (no external dependencies)
 */

/**
 * Export data to CSV file and trigger download
 * @param {Array} data - Array of objects or arrays to export
 * @param {Array} columns - Column definitions [{key, label}] or simple strings
 * @param {string} filename - Name for the downloaded file (without extension)
 */
export function exportToCSV(data, columns, filename) {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Build header row
    const headers = columns.map(col =>
        typeof col === 'string' ? col : col.label
    );

    // Build data rows
    const rows = data.map(row => {
        return columns.map(col => {
            const key = typeof col === 'string' ? col : col.key;
            let value = Array.isArray(row) ? row[key] : row[key];

            // Handle special cases
            if (value === null || value === undefined) value = '';
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text content to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (e) {
            document.body.removeChild(textArea);
            console.error('Copy failed:', e);
            return false;
        }
    }
}

/**
 * Convert table data to tab-separated text for clipboard
 * @param {Array} data - Array of objects or arrays
 * @param {Array} columns - Column definitions
 * @returns {string} - Tab-separated text
 */
export function tableToText(data, columns) {
    const headers = columns.map(col =>
        typeof col === 'string' ? col : col.label
    );

    const rows = data.map(row => {
        return columns.map(col => {
            const key = typeof col === 'string' ? col : col.key;
            const value = Array.isArray(row) ? row[key] : row[key];
            return value ?? '';
        }).join('\t');
    });

    return [headers.join('\t'), ...rows].join('\n');
}

/**
 * Open print dialog with formatted content
 * @param {string} title - Report title
 * @param {string} htmlContent - HTML content to print
 */
export function printReport(title, htmlContent) {
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 40px;
                    color: #1e293b;
                    line-height: 1.5;
                }
                .header {
                    border-bottom: 3px solid #3b82f6;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    font-size: 28px;
                    font-weight: 900;
                    color: #0f172a;
                    margin-bottom: 5px;
                }
                .header .subtitle {
                    color: #64748b;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .metrics {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .metric {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 15px;
                }
                .metric-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #64748b;
                    margin-bottom: 5px;
                }
                .metric-value {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .metric-sub {
                    font-size: 11px;
                    color: #94a3b8;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th {
                    background: #f1f5f9;
                    text-align: left;
                    padding: 12px 15px;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #64748b;
                    border-bottom: 2px solid #e2e8f0;
                }
                td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 13px;
                }
                tr:nth-child(even) { background: #f8fafc; }
                .tier-badge {
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 800;
                    color: white;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 11px;
                    color: #94a3b8;
                    text-align: center;
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${htmlContent}
            <div class="footer">
                Generated by Auction Intel Platform • ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Delay print to ensure content loads
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

/**
 * Generate HTML report for a county
 * @param {Object} county - County data array [name, pop, income, zhvi, growth, dom, tier, notes]
 * @param {Array} parcels - Parcel/auction data
 * @param {string} stateName - State name
 * @param {Object} tierInfo - Tier configuration
 * @returns {string} - HTML string
 */
export function generateCountyReportHTML(county, parcels, stateName, tierInfo) {
    const [name, pop, income, zhvi, growth, dom, tier, notes] = county;

    const metricsHTML = `
        <div class="metrics">
            <div class="metric">
                <div class="metric-label">Housing Value (ZHVI)</div>
                <div class="metric-value">$${(zhvi / 1000).toFixed(0)}K</div>
                <div class="metric-sub">${growth}% YoY Growth</div>
            </div>
            <div class="metric">
                <div class="metric-label">Population</div>
                <div class="metric-value">${pop.toLocaleString()}</div>
                <div class="metric-sub">Residents</div>
            </div>
            <div class="metric">
                <div class="metric-label">Median Income</div>
                <div class="metric-value">$${(income / 1000).toFixed(0)}K</div>
                <div class="metric-sub">Household</div>
            </div>
            <div class="metric">
                <div class="metric-label">Days on Market</div>
                <div class="metric-value">${dom}</div>
                <div class="metric-sub">Average DOM</div>
            </div>
        </div>
    `;

    const parcelsHTML = parcels.length > 0 ? `
        <h3 style="font-size: 16px; font-weight: 800; margin: 30px 0 15px; color: #0f172a;">Tax Sale Inventory</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Parcel</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${parcels.map(p => `
                    <tr>
                        <td style="font-weight: 700; color: #3b82f6;">${p.id}</td>
                        <td>${p.parcelId}</td>
                        <td style="font-size: 11px; text-transform: uppercase;">${p.owner}</td>
                        <td>${p.type}</td>
                        <td style="font-weight: 700;">${p.amount}</td>
                        <td>${p.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : '';

    return `
        <div class="header">
            <h1>${name} County, ${stateName}</h1>
            <div class="subtitle">
                <span class="tier-badge" style="background: ${tierInfo.color};">${tierInfo.label} - ${tierInfo.name}</span>
                ${notes ? ` • ${notes}` : ''}
            </div>
        </div>
        ${metricsHTML}
        ${parcelsHTML}
    `;
}

/**
 * Generate HTML for state county list
 * @param {Array} counties - Array of county data
 * @param {string} stateName - State name
 * @param {Object} tiers - Tier configuration object
 * @returns {string} - HTML string
 */
export function generateStateReportHTML(counties, stateName, tiers) {
    return `
        <div class="header">
            <h1>${stateName} - County Analysis</h1>
            <div class="subtitle">Investment Tier Assessment • ${counties.length} Counties</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>County</th>
                    <th>Tier</th>
                    <th>Population</th>
                    <th>Income</th>
                    <th>ZHVI</th>
                    <th>Growth</th>
                    <th>DOM</th>
                </tr>
            </thead>
            <tbody>
                ${counties.map(c => {
        const [name, pop, income, zhvi, growth, dom, tier] = c;
        const t = tiers[tier];
        return `
                        <tr>
                            <td style="font-weight: 700;">${name}</td>
                            <td><span class="tier-badge" style="background: ${t.color};">${t.label}</span></td>
                            <td>${(pop / 1000).toFixed(0)}K</td>
                            <td>$${(income / 1000).toFixed(0)}K</td>
                            <td>$${(zhvi / 1000).toFixed(0)}K</td>
                            <td style="color: ${growth >= 0 ? '#16a34a' : '#dc2626'};">${growth > 0 ? '▴' : '▾'} ${Math.abs(growth)}%</td>
                            <td>${dom}d</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}
