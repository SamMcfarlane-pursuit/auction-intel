import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function SignIn({ onNavigateToSignUp, onNavigateToForgot }) {
    const { signIn, error, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Please enter a valid email';
        }
        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) return;

        setLoading(true);
        try {
            await signIn(email, password, rememberMe);
        } catch (err) {
            // Error is handled by AuthContext
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>

            {/* Main card */}
            <div className="relative w-full max-w-md animate-fade-in">
                {/* Logo and branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl mb-4 border border-white/20">
                        <span className="text-3xl">🏛️</span>
                    </div>
                    <h1 className="font-display text-3xl font-black text-white tracking-tight">
                        Auction Intel
                    </h1>
                    <p className="text-blue-200/80 mt-2">Advanced Tax Lien Analytics</p>
                </div>

                {/* Glass card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                    <h2 className="font-display text-2xl font-bold text-white mb-2">Welcome back</h2>
                    <p className="text-slate-300 mb-6">Sign in to access your dashboard</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                                className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.email
                                    ? 'border-red-400 focus:ring-red-400'
                                    : 'border-white/20 focus:ring-blue-400 focus:border-transparent'
                                    }`}
                                placeholder="you@example.com"
                            />
                            {validationErrors.email && (
                                <p className="mt-1.5 text-sm text-red-400">{validationErrors.email}</p>
                            )}
                        </div>

                        {/* Password input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                    className={`w-full px-4 py-3 pr-12 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.password
                                        ? 'border-red-400 focus:ring-red-400'
                                        : 'border-white/20 focus:ring-blue-400 focus:border-transparent'
                                        }`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {validationErrors.password && (
                                <p className="mt-1.5 text-sm text-red-400">{validationErrors.password}</p>
                            )}
                        </div>

                        {/* Remember me & Forgot password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-400 focus:ring-offset-0"
                                />
                                <span className="text-sm text-slate-300">Remember me</span>
                            </label>
                            <button type="button" onClick={onNavigateToForgot} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                Forgot password?
                            </button>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                                <p className="text-sm text-red-300 text-center">{error}</p>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-display font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-transparent text-sm text-slate-400">or continue with</span>
                        </div>
                    </div>

                    {/* Social login buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </button>
                    </div>
                </div>

                {/* Sign up link */}
                <p className="text-center mt-6 text-slate-300">
                    Don't have an account?{' '}
                    <button
                        onClick={onNavigateToSignUp}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        Sign up for free
                    </button>
                </p>
            </div>

            {/* CSS for animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
