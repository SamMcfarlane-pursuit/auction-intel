import React, { useState, useEffect } from 'react';

// Check if user has been welcomed before
const hasBeenWelcomed = (userId) => {
    return localStorage.getItem(`auction_intel_welcomed_${userId}`) === 'true';
};

// Mark user as welcomed
const markAsWelcomed = (userId) => {
    localStorage.setItem(`auction_intel_welcomed_${userId}`, 'true');
};

export default function WelcomeScreen({ user, onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if this user has seen the welcome screen
        if (user && !hasBeenWelcomed(user.id)) {
            setIsVisible(true);
        }
    }, [user]);

    const handleDismiss = () => {
        if (user) {
            markAsWelcomed(user.id);
        }
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={handleDismiss} />

            {/* Card */}
            <div className="relative z-10 w-full max-w-2xl bg-slate-900 rounded-sm border border-slate-700/50 shadow-none overflow-hidden animate-scale-in">
                {/* Decorative gradient orbs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-sm filter blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-sm filter blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative p-8 md:p-12">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 border border-slate-700 rounded-sm mb-4 shadow-none">
                            <span className="text-2xl font-mono text-white">🏛️</span>
                        </div>
                        <h1 className="font-mono text-xl font-mono md:text-2xl font-mono font-semibold text-white tracking-tight mb-2">
                            Welcome, {user?.name?.split(' ')[0] || 'Investor'}!
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Your tax lien intelligence platform is ready
                        </p>
                    </div>

                    {/* Feature cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-950 border border-slate-800 rounded-sm p-6 text-center hover:bg-slate-900 transition-all group">
                            <div className="w-12 h-12 mx-auto mb-4 bg-blue-900/20 text-blue-400 rounded-sm flex items-center justify-center border border-blue-900/30 group-hover:border-blue-500/50 transition-colors">
                                <span className="text-xl font-mono">D_01</span>
                            </div>
                            <div className="text-[9px] uppercase tracking-[0.2em] text-blue-500 font-bold mb-1">STATEDATA_DISCOVERY</div>
                            <h3 className="font-mono font-bold text-slate-100 text-sm mb-2 uppercase tracking-tighter">DISCOVER</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">Cross-jurisdictional tax lien inventory scanning</p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-sm p-6 text-center hover:bg-slate-900 transition-all group">
                            <div className="w-12 h-12 mx-auto mb-4 bg-emerald-900/20 text-emerald-400 rounded-sm flex items-center justify-center border border-emerald-900/30 group-hover:border-emerald-500/50 transition-colors">
                                <span className="text-xl font-mono">A_02</span>
                            </div>
                            <div className="text-[9px] uppercase tracking-[0.2em] text-emerald-500 font-bold mb-1">ALPHA_GENERATION</div>
                            <h3 className="font-mono font-bold text-slate-100 text-sm mb-2 uppercase tracking-tighter">ANALYZE</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">Yield modeling, redemption tracking & asset ROI</p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-sm p-6 text-center hover:bg-slate-900 transition-all group">
                            <div className="w-12 h-12 mx-auto mb-4 bg-amber-900/20 text-amber-500 rounded-sm flex items-center justify-center border border-amber-900/30 group-hover:border-amber-500/50 transition-colors">
                                <span className="text-xl font-mono">T_03</span>
                            </div>
                            <div className="text-[9px] uppercase tracking-[0.2em] text-amber-500 font-bold mb-1">TERMINAL_EXECUTION</div>
                            <h3 className="font-mono font-bold text-slate-100 text-sm mb-2 uppercase tracking-tighter">ACTION</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">Monitor watchlists & execute auction strategies</p>
                        </div>
                    </div>

                    {/* Quick tips */}
                    <div className="bg-slate-800/50 rounded-sm p-4 mb-6 border border-slate-700/50">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">💡</span>
                            <div>
                                <h4 className="font-bold text-white text-sm mb-1">Quick Tip</h4>
                                <p className="text-xs text-slate-400">
                                    Start by exploring the <span className="text-blue-400 font-semibold">US Map</span> or check the <span className="text-amber-400 font-semibold">Best Opportunities</span> heat map to find high-yield states. Use the sidebar to navigate between features.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleDismiss}
                        className="w-full py-4 bg-blue-600 text-white font-mono font-bold text-lg rounded-sm shadow-none hover:bg-blue-700 transition-all"
                    >
                        Access Command Center
                    </button>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                .animate-scale-in {
                    animation: scale-in 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
