import React from 'react';

/**
 * MobileNav - Bottom navigation bar for mobile devices
 * Shows only on viewports < 768px
 */
export default function MobileNav({ activeView, onNavigate }) {
    const navItems = [
        { id: 'map', icon: '🗺️', label: 'Map' },
        { id: 'properties', icon: '🏠', label: 'Properties' },
        { id: 'watchlist', icon: '⭐', label: 'Watchlist' },
        { id: 'alerts', icon: '🔔', label: 'Alerts' },
        { id: 'settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface /95 border-t border-slate-300/60 backdrop-blur-xl md:hidden safe-area-pb">
            <div className="flex items-center justify-around px-2 py-1">
                {navItems.map((item) => {
                    const isActive = activeView === item.id ||
                        (item.id === 'map' && ['map', 'list', 'state-info', 'heatmap', 'calendar'].includes(activeView));

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center justify-center py-2 px-3 rounded-sm transition-all min-w-[56px] ${isActive
 ? 'bg-surface /20 /20 text-indigo-500'
 : 'text-slate-600 hover:text-slate-800 active:scale-95'
 }`}
                        >
                            <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-indigo-500' : 'text-slate-500'}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 w-8 h-0.5 bg-surface rounded-sm" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
