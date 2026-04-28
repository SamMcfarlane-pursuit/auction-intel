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
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md" onClick={handleDismiss} />

            {/* Card */}
            <div className="relative z-10 w-full max-w-2xl bg-surface rounded-sm border border-slate-300/60 shadow-none overflow-hidden animate-scale-in">
                {/* Decorative gradient orbs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-sm filter blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-sm filter blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative p-8 md:p-12">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-panel border border-slate-300 rounded-sm mb-4 shadow-none">
                            <span className="text-2xl font-mono text-white">🏛️</span>
                        </div>
                        <h1 className="font-mono text-xl font-mono md:text-2xl font-mono font-semibold text-white tracking-tight mb-2">
                            Welcome, {user?.name?.split(' ')[0] || 'Investor'}!
                        </h1>
                        <p className="text-slate-600 text-lg">
                            Your tax lien intelligence platform is ready
                        </p>
                    </div>

                    {/* Feature cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-canvas border border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 hover:border-indigo-300 transition-all group shadow-sm hover:shadow-md">
                            <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg flex items-center justify-center border border-indigo-400 group-hover:border-indigo-300 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all">
                                <span className="text-2xl font-mono font-bold">D</span>
                            </div>
                            <div className="text-[9px] uppercase tracking-[0.2em] text-indigo-600 font-bold mb-2">Discover</div>
                            <h3 className="font-mono font-bold text-slate-900 text-sm mb-3 uppercase tracking-tighter">State Data</h3>
                            <p className="text-[10px] text-slate-600 leading-relaxed">Cross-jurisdictional tax lien inventory scanning</p>
                        </div>

                        <div className="bg-canvas border border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 hover:border-emerald-300 transition-all group shadow-sm hover:shadow-md">
                            <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg flex items-center justify-center border border-emerald-400 group-hover:border-emerald-300 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all">
                                <span className="text-2xl font-mono font-bold">A</span>
                            </div>
                            <div className="text-[9px] uppercase tracking-[0.2em] text-emerald-600 font-bold mb-2">Analyze</div>
                            <h3 className="font-mono font-bold text-slate-900 text-sm mb-3 uppercase tracking-tighter">AI Alpha</h3>
                            <p className="text-[10px] text-slate-600 leading-relaxed">Yield modeling, redemption tracking & ROI analytics</p>
                        </div>

                        <div className="bg-canvas border border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 hover:border-amber-300 transition-all group shadow-sm hover:shadow-md">
                            <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg flex items-center justify-center border border-amber-400 group-hover:border-amber-300 group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-all">
                                <span className="text-2xl font-mono font-bold">T</span>
                            </div>
                            <div className="text-[9px] uppercase tracking-[0.2em] text-amber-600 font-bold mb-2">Execute</div>
                            <h3 className="font-mono font-bold text-slate-900 text-sm mb-3 uppercase tracking-tighter">Action</h3>
                            <p className="text-[10px] text-slate-600 leading-relaxed">Monitor watchlists & execute auction strategies</p>
                        </div>
                    </div>

                    {/* Quick tips */}
                    <div className="bg-slate-100 rounded-sm p-4 mb-6 border border-slate-300/60">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">💡</span>
                            <div>
                                <h4 className="font-bold text-white text-sm mb-1">Quick Tip</h4>
                                <p className="text-xs text-slate-600">
                                    Start by exploring the <span className="text-indigo-500 font-semibold">US Map</span> or check the <span className="text-amber-400 font-semibold">Best Opportunities</span> heat map to find high-yield states. Use the sidebar to navigate between features.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleDismiss}
                        className="w-full py-4 bg-indigo-600 text-white font-mono font-bold text-lg rounded-sm shadow-none hover:bg-indigo-700 transition-all"
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
