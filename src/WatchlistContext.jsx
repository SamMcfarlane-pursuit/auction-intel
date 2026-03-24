import React, { createContext, useContext, useState, useEffect } from 'react';

const WatchlistContext = createContext(null);

const STORAGE_KEY = 'auction_intel_watchlist';

// Default due diligence checklist items
const DEFAULT_DUE_DILIGENCE = {
    titleSearch: false,
    propertyInspection: false,
    taxStatusVerified: false,
    neighborhoodResearch: false,
    auctionRegistered: false,
    fundsSecured: false
};

export function WatchlistProvider({ children }) {
    const [watchlist, setWatchlist] = useState([]);

    // Load watchlist from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                // Migrate old items to include new fields
                const parsed = JSON.parse(stored);
                const migrated = parsed.map(item => ({
                    ...item,
                    userNotes: item.userNotes || '',
                    dueDiligence: item.dueDiligence || { ...DEFAULT_DUE_DILIGENCE },
                    investmentAmount: item.investmentAmount || null,
                    targetPrice: item.targetPrice || null,
                    priority: item.priority || 'medium', // low, medium, high
                    alertEnabled: item.alertEnabled || false,
                    mabThreshold: item.mabThreshold || null
                }));
                setWatchlist(migrated);
            }
        } catch (err) {
            console.warn('Failed to load watchlist:', err);
        }
    }, []);

    // Save watchlist to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
            
            // Auto Webhook Sync Feature (CRM / Sheets)
            const webhookUrl = localStorage.getItem('auction_portfolio_webhook');
            if (webhookUrl && webhookUrl.startsWith('http') && watchlist.length > 0) {
                // Debounce sync slightly to avoid rapid firing
                const syncTimeout = setTimeout(() => {
                    fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: "auto_sync", count: watchlist.length, portfolio: watchlist })
                    }).catch(e => console.warn("Webhook Sync Failed:", e));
                }, 3000);
                return () => clearTimeout(syncTimeout);
            }
        } catch (err) {
            console.warn('Failed to save watchlist:', err);
        }
    }, [watchlist]);

    const addToWatchlist = (county, stateAbbr, stateName) => {
        const id = `${stateAbbr}-${county[0]}`;
        // Check if already exists
        if (watchlist.find(item => item.id === id)) {
            return false; // Already in watchlist
        }
        const newItem = {
            id,
            county: county[0],
            stateAbbr,
            stateName,
            tier: county[6],
            population: county[1],
            income: county[2],
            zhvi: county[3],
            growth: county[4],
            dom: county[5],
            notes: county[7] || '',
            // New fields for enhanced watchlist
            userNotes: '',
            dueDiligence: { ...DEFAULT_DUE_DILIGENCE },
            investmentAmount: null,
            targetPrice: null,
            priority: 'medium',
            alertEnabled: false,
            mabThreshold: null,
            addedAt: new Date().toISOString()
        };
        setWatchlist(prev => [...prev, newItem]);
        return true;
    };

    // Update a watchlist item (for notes, due diligence, etc.)
    const updateWatchlistItem = (id, updates) => {
        setWatchlist(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
        ));
    };

    const removeFromWatchlist = (id) => {
        setWatchlist(prev => prev.filter(item => item.id !== id));
    };

    const clearWatchlist = () => {
        setWatchlist([]);
    };

    const isInWatchlist = (stateAbbr, countyName) => {
        const id = `${stateAbbr}-${countyName}`;
        return watchlist.some(item => item.id === id);
    };

    // Get watchlist stats
    const getWatchlistStats = () => {
        const total = watchlist.length;
        const completed = watchlist.filter(item =>
            item.dueDiligence && Object.values(item.dueDiligence).every(v => v)
        ).length;
        const highPriority = watchlist.filter(item => item.priority === 'high').length;
        return { total, completed, highPriority };
    };

    const togglePredictiveAlert = async (id, mabThreshold, contactMethod = 'email') => {
        const item = watchlist.find(i => i.id === id);
        if (!item) return false;

        const isCurrentlyEnabled = item.alertEnabled;

        if (!isCurrentlyEnabled) {
            try {
                const token = localStorage.getItem('auction_intel_token');
                const API_BASE = import.meta.env.VITE_API_URL || 'https://auction-intel-api-sm.fly.dev/api';
                const settingsStr = localStorage.getItem('auction_alert_settings');
                const userEmail = settingsStr ? JSON.parse(settingsStr).email : contactMethod;
                
                const response = await fetch(`${API_BASE}/alerts/subscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        property_fips: id,
                        mab_threshold: parseInt(mabThreshold, 10) || 0,
                        contact_method: userEmail || 'guest@example.com'
                    })
                });

                if (response.ok) {
                    updateWatchlistItem(id, { alertEnabled: true, mabThreshold });
                    return true;
                }
                console.error("Alert server error");
                return false;
            } catch (err) {
                console.error("Failed to enable predictive alert:", err);
                return false;
            }
        } else {
            // Disable locally
            updateWatchlistItem(id, { alertEnabled: false, mabThreshold: null });
            return true;
        }
    };

    const value = {
        watchlist,
        addToWatchlist,
        updateWatchlistItem,
        removeFromWatchlist,
        clearWatchlist,
        isInWatchlist,
        getWatchlistStats,
        togglePredictiveAlert
    };

    return (
        <WatchlistContext.Provider value={value}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    const context = useContext(WatchlistContext);
    if (!context) {
        throw new Error('useWatchlist must be used within a WatchlistProvider');
    }
    return context;
}

export default WatchlistContext;
