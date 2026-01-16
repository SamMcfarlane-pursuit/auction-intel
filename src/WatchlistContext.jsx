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
                    priority: item.priority || 'medium' // low, medium, high
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

    const value = {
        watchlist,
        addToWatchlist,
        updateWatchlistItem,
        removeFromWatchlist,
        clearWatchlist,
        isInWatchlist,
        getWatchlistStats
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
