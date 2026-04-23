import React, { useState, useEffect } from 'react';

/**
 * AlertSettings - User preferences for auction notifications
 */
export function AlertSettings({ onClose }) {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('auction_alert_settings');
        return saved ? JSON.parse(saved) : {
            enabled: true,
            email: '',
            alertTypes: {
                watchlistAuctions: true,  // Alert when watchlist item has auction
                tierOneOpportunities: true, // Alert for new T1 county auctions
                priceDrops: false,        // Alert when property price drops
                newListings: false,       // Alert for new listings in watched states
            },
            timing: {
                daysBeforeAuction: 7,     // Days before auction to send alert
                reminderDays: [7, 3, 1],  // Reminder schedule
            },
            filters: {
                states: [],               // Empty = all states
                minTier: 1,               // Minimum tier to alert on
                maxTier: 3,               // Maximum tier to alert on
            }
        };
    });

    const [saved, setSaved] = useState(false);

    // Save settings to localStorage
    const saveSettings = () => {
        localStorage.setItem('auction_alert_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const updateSetting = (path, value) => {
        setSettings(prev => {
            const keys = path.split('.');
            const newSettings = { ...prev };
            let current = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };

    return (
        <div className="bg-canvas rounded-md shadow-none border border-slate-200 overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-surface p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100/70 rounded-sm flex items-center justify-center text-lg font-mono">
                            🔔
                        </div>
                        <div>
                            <h2 className="text-lg font-mono font-semibold">Alert Settings</h2>
                            <p className="text-amber-100 text-sm">Never miss an investment opportunity</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-white hover:text-slate-200 text-lg font-mono">×</button>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Master Toggle */}
                <div className="flex items-center justify-between p-4 bg-surface rounded-md">
                    <div>
                        <div className="font-bold text-slate-900">Enable Alerts</div>
                        <div className="text-sm text-slate-500">Receive notifications for auction opportunities</div>
                    </div>
                    <button
                        onClick={() => updateSetting('enabled', !settings.enabled)}
                        className={`w-14 h-8 rounded-sm transition-all ${settings.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                        <div className={`w-6 h-6 bg-canvas rounded-sm shadow transition-all ${settings.enabled ? 'ml-7' : 'ml-1'}`} />
                    </button>
                </div>

                {/* Email Input */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => updateSetting('email', e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                </div>

                {/* Alert Types */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-3">Alert Types</h3>
                    <div className="space-y-2">
                        {[
                            { key: 'watchlistAuctions', label: '⭐ Watchlist Auctions', desc: 'When items in your watchlist have upcoming sales' },
                            { key: 'tierOneOpportunities', label: '🔥 T1/T2 Opportunities', desc: 'New auctions in top-tier counties' },
                            { key: 'priceDrops', label: '📉 Price Drops', desc: 'When property prices decrease' },
                            { key: 'newListings', label: '🏠 New Listings', desc: 'New properties in watched states' },
                        ].map(type => (
                            <label key={type.key} className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.alertTypes[type.key]}
                                    onChange={(e) => updateSetting(`alertTypes.${type.key}`, e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                />
                                <div>
                                    <div className="font-semibold text-slate-800">{type.label}</div>
                                    <div className="text-xs text-slate-500">{type.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Timing */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-3">Reminder Timing</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">Alert me</span>
                        <select
                            value={settings.timing.daysBeforeAuction}
                            onChange={(e) => updateSetting('timing.daysBeforeAuction', parseInt(e.target.value))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        >
                            <option value={14}>14 days</option>
                            <option value={7}>7 days</option>
                            <option value={3}>3 days</option>
                            <option value={1}>1 day</option>
                        </select>
                        <span className="text-sm text-slate-600">before auction</span>
                    </div>
                </div>

                {/* Tier Filter */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-3">Tier Filter</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">Only alert for</span>
                        <select
                            value={settings.filters.minTier}
                            onChange={(e) => updateSetting('filters.minTier', parseInt(e.target.value))}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            {[1, 2, 3, 4, 5].map(t => <option key={t} value={t}>T{t}</option>)}
                        </select>
                        <span className="text-sm text-slate-600">to</span>
                        <select
                            value={settings.filters.maxTier}
                            onChange={(e) => updateSetting('filters.maxTier', parseInt(e.target.value))}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            {[1, 2, 3, 4, 5].map(t => <option key={t} value={t}>T{t}</option>)}
                        </select>
                        <span className="text-sm text-slate-600">counties</span>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-200">
                    <button
                        onClick={saveSettings}
                        className={`w-full py-4 rounded-sm font-bold text-white transition-all ${saved
 ? 'bg-emerald-500'
 : 'bg-surface hover: hover:'
 }`}
                    >
                        {saved ? '✓ Settings Saved!' : '💾 Save Alert Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * NotificationBell - Header notification icon with dropdown
 */
export function NotificationBell({ onClick }) {
    const [alerts, setAlerts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // Load alerts from localStorage
    useEffect(() => {
        const savedAlerts = localStorage.getItem('auction_alerts');
        if (savedAlerts) {
            setAlerts(JSON.parse(savedAlerts));
        } else {
            // Demo alerts
            setAlerts([
                { id: 1, type: 'auction', message: 'Maricopa County (AZ) auction in 3 days', time: '2h ago', read: false },
                { id: 2, type: 'watchlist', message: 'Travis County added to your watchlist', time: '1d ago', read: true },
            ]);
        }
    }, []);

    const unreadCount = alerts.filter(a => !a.read).length;

    const markAllRead = () => {
        const updated = alerts.map(a => ({ ...a, read: true }));
        setAlerts(updated);
        localStorage.setItem('auction_alerts', JSON.stringify(updated));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-all"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-sm flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 top-12 w-80 bg-canvas rounded-md shadow-none border border-slate-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-900">Notifications</span>
                        <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                            Mark all read
                        </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="p-6 text-center text-slate-600">No notifications</div>
                        ) : (
                            alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`p-4 border-b border-slate-200 hover:bg-slate-100 cursor-pointer ${!alert.read ? 'bg-amber-50' : ''
 }`}
                                >
                                    <div className="text-sm text-slate-800">{alert.message}</div>
                                    <div className="text-xs text-slate-600 mt-1">{alert.time}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-3 border-t border-slate-200">
                        <button
                            onClick={onClick}
                            className="w-full py-2 text-sm text-amber-600 hover:text-amber-700 font-semibold"
                        >
                            ⚙️ Manage Alert Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AlertSettings;
