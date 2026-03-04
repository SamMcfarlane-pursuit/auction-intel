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
                    className="absolute rounded-full"
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
const AnimatedCounter = ({ end, suffix = '' }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let current = 0;
        const step = Math.ceil(end / 40);
        const timer = setInterval(() => {
            current = Math.min(current + step, end);
            setCount(current);
            if (current >= end) clearInterval(timer);
        }, 40);
        return () => clearTimeout(timer);
    }, [end]);
    return <span>{count.toLocaleString()}{suffix}</span>;
};

export default function SignUp() {
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Password strength
    const passwordStrength = (() => {
        const p = formData.password;
        if (!p) return { score: 0, label: '', color: '' };
        let score = 0;
        if (p.length >= 6) score++;
        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;

        if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
        if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' };
        if (score <= 3) return { score, label: 'Good', color: '#3b82f6' };
        return { score, label: 'Strong', color: '#22c55e' };
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (!/[A-Z]/.test(formData.password)) {
            setError('Password must contain at least one uppercase letter');
            return;
        }
        if (!/[0-9]/.test(formData.password)) {
            setError('Password must contain at least one number');
            return;
        }
        if (!/[^A-Za-z0-9]/.test(formData.password)) {
            setError('Password must contain at least one special character');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await signUp(formData.name, formData.email, formData.password);
        } catch (err) {
            setError(err.message || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)' }}>
            <FloatingParticles />

            {/* Mesh gradient overlays */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

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
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <span className="text-white font-black text-lg">AI</span>
                        </div>
                        <div>
                            <div className="text-white font-display font-black text-xl tracking-tight">Auction Intel</div>
                            <div className="text-blue-300/60 text-[9px] font-bold uppercase tracking-[0.2em]">Intelligence Platform</div>
                        </div>
                    </div>

                    {/* Hero Text */}
                    <h1 className="text-white font-display font-black text-4xl xl:text-5xl leading-tight tracking-tight mb-4">
                        Start Your
                        <span className="block bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Investment Journey</span>
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-10">
                        Join thousands of investors using data-driven insights to find the best tax lien and deed opportunities.
                    </p>

                    {/* Investor Success Metrics */}
                    <div className="space-y-4">
                        {[
                            { icon: '📈', value: '18-24%', title: 'Avg. Lien Returns', desc: 'Interest rates across top-performing states' },
                            { icon: '🏠', value: '50+', title: 'States Tracked', desc: 'Every US state with tax sale data' },
                            { icon: '⚡', value: 'Real-Time', title: 'Auction Alerts', desc: 'Never miss a deadline or registration window' },
                            { icon: '🎯', value: 'Free', title: 'Getting Started', desc: 'Full platform access with demo account' },
                        ].map((stat, i) => (
                            <div key={i} className="flex items-start gap-3 group">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0 group-hover:bg-white/10 transition-all">
                                    {stat.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-400 font-display font-black text-sm">{stat.value}</span>
                                        <span className="text-white font-bold text-sm">{stat.title}</span>
                                    </div>
                                    <div className="text-slate-500 text-xs">{stat.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trust Bar */}
                <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-white font-display font-black text-2xl"><AnimatedCounter end={2500} suffix="+" /></div>
                            <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Active Investors</div>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="text-center">
                            <div className="text-emerald-400 font-display font-black text-2xl">$4.2M+</div>
                            <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Tracked ROI</div>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="text-center">
                            <div className="text-white font-display font-black text-2xl">4.9★</div>
                            <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Rating</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Right Panel — Sign Up Form ═══ */}
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
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <span className="text-white font-black text-lg">AI</span>
                        </div>
                        <div className="text-white font-display font-black text-xl tracking-tight">Auction Intel</div>
                    </div>

                    {/* Card */}
                    <div className="backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border"
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <div className="mb-5">
                            <h2 className="text-white font-display font-black text-2xl tracking-tight">Create Account</h2>
                            <p className="text-slate-400 text-sm mt-1">Start analyzing tax auctions across all 50 states</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    placeholder="John Investor"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    placeholder="investor@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
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
                                {formData.password && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-300"
                                                style={{ width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: passwordStrength.color }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold" style={{ color: passwordStrength.color }}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    placeholder="••••••••"
                                />
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="mt-1 text-[10px] text-red-400 font-bold">Passwords don't match</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all relative overflow-hidden disabled:opacity-50 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 mt-2"
                                style={{
                                    background: 'linear-gradient(135deg, #059669, #3b82f6)',
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Creating Account...
                                    </span>
                                ) : 'Create Free Account'}
                            </button>
                        </form>

                        <p className="text-center text-slate-500 text-xs mt-5">
                            Already have an account?{' '}
                            <a href="/signin" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">Sign in</a>
                        </p>
                    </div>

                    {/* Mobile Trust Bar */}
                    <div className="lg:hidden mt-6 flex items-center justify-center gap-4">
                        <span className="text-slate-500 text-xs font-bold">2,500+ Investors</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                        <span className="text-emerald-500/60 text-xs font-bold">Free to Start</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
