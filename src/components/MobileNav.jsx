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
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-900 via-slate-900 to-slate-900/95 border-t border-slate-700/50 backdrop-blur-xl md:hidden safe-area-pb">
            <div className="flex items-center justify-around px-2 py-1">
                {navItems.map((item) => {
                    const isActive = activeView === item.id ||
                        (item.id === 'map' && ['map', 'list', 'state-info', 'heatmap', 'calendar'].includes(activeView));

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[56px] ${isActive
                                ? 'bg-gradient-to-t from-blue-500/20 to-cyan-500/20 text-blue-400'
                                : 'text-slate-400 hover:text-slate-200 active:scale-95'
                                }`}
                        >
                            <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
