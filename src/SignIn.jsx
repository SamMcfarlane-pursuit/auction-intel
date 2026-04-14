import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Floating Particle Component
const FloatingParticles = () => {
    const particles = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.15 + 0.05,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-sm"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        opacity: p.opacity,
                        background: `linear-gradient(135deg, #818cf8, #a78bfa)`,
                        animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
                    }}
                />
            ))}
            <style>{`
                @keyframes particleFloat {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.2); }
                    66% { transform: translate(-20px, 30px) scale(0.8); }
                    100% { transform: translate(15px, -20px) scale(1.1); }
                }
            `}</style>
        </div>
    );
};

// Animated Counter
const AnimatedCounter = ({ end, suffix = '', prefix = '' }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let current = 0;
        const step = Math.ceil(end / 40);
        const timer = setInterval(() => {
            current = Math.min(current + step, end);
            setCount(current);
            if (current >= end) clearInterval(timer);
        }, 40);
        return () => clearInterval(timer);
    }, [end]);
    return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

export default function SignIn() {
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await signIn(formData.email, formData.password);
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        }
        setLoading(false);
    };

    const demoLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signIn('demo@auctionintel.com', 'demo123');
        } catch (err) {
            setError('Demo login failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)' }}>
            <FloatingParticles />

            {/* Mesh gradient overlays */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-sm blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-sm blur-3xl pointer-events-none"></div>

            {/* ═══ Left Panel — Desktop Only ═══ */}
            <div className="hidden lg:flex flex-col justify-between w-[500px] xl:w-[550px] p-8 xl:p-12 relative z-10"
                style={{
                    transition: 'opacity 0.8s ease, transform 0.8s ease',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                }}
            >
                <div>
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-11 h-11 bg-slate-900 rounded-sm flex items-center justify-center shadow-none shadow-purple-500/20">
                            <span className="text-white font-semibold text-lg">AI</span>
                        </div>
                        <div>
                            <div className="text-white font-mono font-semibold text-xl tracking-tight">Auction Intel</div>
                            <div className="text-blue-300/60 text-[9px] font-bold uppercase tracking-[0.2em]">Intelligence Platform</div>
                        </div>
                    </div>

                    {/* Hero Text */}
                    <h1 className="text-white font-mono font-semibold text-2xl font-mono xl:text-3xl font-mono leading-tight tracking-tight mb-4">
                        Tax Auction
                        <span className="block bg-slate-900 bg-clip-text text-transparent">Intelligence</span>
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-10">
                        Research 3,143 counties across all 50 states. Real data, real returns, real opportunities.
                    </p>

                    {/* Feature Highlights */}
                    <div className="space-y-4">
                        {[
                            { icon: '🗺️', title: 'Interactive US Map', desc: 'Click any state to dive into county-level auction data' },
                            { icon: '📊', title: 'ROI Calculator', desc: 'Model returns for lien and deed investments instantly' },
                            { icon: '📅', title: 'Auction Calendar', desc: 'Never miss a tax sale — all 50 states tracked' },
                            { icon: '🔥', title: 'Live Auction Alerts', desc: 'Countdown timers & notifications for upcoming sales' },
                        ].map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 group">
                                <div className="w-10 h-10 rounded-sm bg-slate-950/5 border border-white/10 flex items-center justify-center text-lg shrink-0 group-hover:bg-slate-950/10 transition-all">
                                    {feature.icon}
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm">{feature.title}</div>
                                    <div className="text-slate-500 text-xs">{feature.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trust Bar */}
                <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-white font-mono font-semibold text-lg font-mono"><AnimatedCounter end={50} /></div>
                            <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">States</div>
                        </div>
                        <div className="w-px h-8 bg-slate-950/10"></div>
                        <div className="text-center">
                            <div className="text-white font-mono font-semibold text-lg font-mono"><AnimatedCounter end={3143} suffix="+" /></div>
                            <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Counties</div>
                        </div>
                        <div className="w-px h-8 bg-slate-950/10"></div>
                        <div className="text-center">
                            <div className="text-emerald-400 font-mono font-semibold text-lg font-mono"><AnimatedCounter end={2500} suffix="+" /></div>
                            <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Investors</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Right Panel — Sign In Form ═══ */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
                <div
                    className="w-full max-w-md"
                    style={{
                        transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    }}
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-10 h-10 bg-slate-900 rounded-sm flex items-center justify-center shadow-none shadow-purple-500/20">
                            <span className="text-white font-semibold text-lg">AI</span>
                        </div>
                        <div className="text-white font-mono font-semibold text-xl tracking-tight">Auction Intel</div>
                    </div>

                    {/* Card */}
                    <div className="backdrop-blur-xl rounded-md p-6 md:p-8 shadow-none border"
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <div className="mb-6">
                            <h2 className="text-white font-mono font-semibold text-lg font-mono tracking-tight">Welcome Back</h2>
                            <p className="text-slate-400 text-sm mt-1">Sign in to access your auction intelligence dashboard</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-sm text-white placeholder-slate-500 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    placeholder="investor@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-sm text-white placeholder-slate-500 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-600" />
                                    <span className="text-xs">Remember me</span>
                                </label>
                                <a href="#" className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-sm font-bold text-white text-sm transition-all relative overflow-hidden disabled:opacity-50 shadow-none shadow-blue-500/20 hover:shadow-blue-500/30"
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-sm animate-spin"></span>
                                        Signing in...
                                    </span>
                                ) : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-px bg-slate-950/10"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-slate-950/10"></div>
                        </div>

                        <button
                            onClick={demoLogin}
                            disabled={loading}
                            className="mt-4 w-full py-3 rounded-sm font-bold text-sm transition-all hover:bg-slate-950/10 disabled:opacity-50"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
                        >
                            🎯 Try Demo Account
                        </button>

                        <p className="text-center text-slate-500 text-xs mt-6">
                            Don't have an account?{' '}
                            <a href="/signup" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">Create one free</a>
                        </p>
                    </div>

                    {/* Mobile Trust Bar */}
                    <div className="lg:hidden mt-6 flex items-center justify-center gap-4">
                        <span className="text-slate-500 text-xs font-bold">50 States</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-sm"></span>
                        <span className="text-slate-500 text-xs font-bold">3,143 Counties</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-sm"></span>
                        <span className="text-emerald-500/60 text-xs font-bold">Live Data</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
