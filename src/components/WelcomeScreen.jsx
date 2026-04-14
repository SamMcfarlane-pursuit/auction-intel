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
            <div className="relative z-10 w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden animate-scale-in">
                {/* Decorative gradient orbs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative p-8 md:p-12">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 border border-slate-700 rounded-xl mb-4 shadow-lg">
                            <span className="text-4xl text-white">🏛️</span>
                        </div>
                        <h1 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                            Welcome, {user?.name?.split(' ')[0] || 'Investor'}!
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Your tax lien intelligence platform is ready
                        </p>
                    </div>

                    {/* Feature cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-center hover:bg-slate-800 transition-all">
                            <div className="w-12 h-12 mx-auto mb-3 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center border border-blue-500/20">
                                <span className="text-2xl">🗺️</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">Step 1</div>
                            <h3 className="font-display font-bold text-white mb-1">Discover</h3>
                            <p className="text-xs text-slate-400">Explore tax lien opportunities across all 50 states</p>
                        </div>

                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-center hover:bg-slate-800 transition-all">
                            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-500/20">
                                <span className="text-2xl">📊</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Step 2</div>
                            <h3 className="font-display font-bold text-white mb-1">Analyze</h3>
                            <p className="text-xs text-slate-400">Research interest rates, redemption periods & ROI</p>
                        </div>

                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-center hover:bg-slate-800 transition-all">
                            <div className="w-12 h-12 mx-auto mb-3 bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center border border-amber-500/20">
                                <span className="text-2xl">⭐</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">Step 3</div>
                            <h3 className="font-display font-bold text-white mb-1">Take Action</h3>
                            <p className="text-xs text-slate-400">Track watchlists & monitor upcoming auctions</p>
                        </div>
                    </div>

                    {/* Quick tips */}
                    <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
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
                        className="w-full py-4 bg-blue-600 text-white font-display font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 transition-all"
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
