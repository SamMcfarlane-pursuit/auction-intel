import React from 'react';

/**
 * MapToolbar — Simplified 2-mode toggle for Globe & Map views.
 * Clean pill-style segmented control with fullscreen toggle.
 */
export default function MapToolbar({ 
    currentMode, 
    onModeChange, 
    isExpanded,
    onToggleFullscreen
}) {
    const modes = [
        { id: 'globe', label: 'Globe', icon: '🌐' },
        { id: 'map', label: 'Map', icon: '🗺️' },
    ];

    return (
        <div className="flex items-center gap-2">
            {/* Mode Toggle — Pill-style segmented control */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white/10 rounded-sm p-1 flex gap-0.5 shadow-none ring-1 ring-white/5">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-sm transition-all duration-300 ${
 currentMode === mode.id 
 ? 'bg-canvas text-slate-900 shadow-none' 
 : 'text-slate-600 hover:text-white hover:bg-slate-50/5'
 }`}
                    >
                        <span className="text-sm">{mode.icon}</span>
                        <span className={`text-[10px] font-semibold uppercase tracking-widest ${
 currentMode === mode.id ? 'text-slate-900' : ''
 }`}>
                            {mode.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Fullscreen Toggle */}
            <button
                onClick={onToggleFullscreen}
                className={`w-9 h-9 flex items-center justify-center rounded-sm transition-all duration-300 backdrop-blur-2xl border shadow-none ${
 isExpanded 
 ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/25' 
 : 'bg-white/80 text-slate-600 border-white/10 hover:text-white hover:bg-slate-50/5'
 }`}
                title={isExpanded ? "Exit Fullscreen" : "Fullscreen Mode"}
            >
                <span className="text-xs font-bold">{isExpanded ? '⤦' : '⤢'}</span>
            </button>
        </div>
    );
}
