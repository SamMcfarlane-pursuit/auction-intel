import React, { useState, useMemo } from 'react';
import { useAuth } from './AuthContext';

export default function SignUp({ onNavigateToSignIn }) {
    const { signUp, error, clearError } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Password strength calculation
    const passwordStrength = useMemo(() => {
        if (!password) return { score: 0, label: '', color: '' };

        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 10) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const levels = [
            { label: 'Very weak', color: 'bg-red-500' },
            { label: 'Weak', color: 'bg-orange-500' },
            { label: 'Fair', color: 'bg-yellow-500' },
            { label: 'Good', color: 'bg-blue-500' },
            { label: 'Strong', color: 'bg-emerald-500' }
        ];

        return { score, ...levels[Math.min(score, 4)] };
    }, [password]);

    const validateForm = () => {
        const errors = {};

        if (!name.trim()) {
            errors.name = 'Name is required';
        } else if (name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }

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

        if (!confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (!acceptTerms) {
            errors.terms = 'You must accept the terms and conditions';
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
            await signUp(name, email, password);
        } catch (err) {
            // Error is handled by AuthContext
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-slate-900">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>

            {/* Main card */}
            <div className="relative w-full max-w-md animate-fade-in">
                {/* Logo and branding */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl mb-4 border border-white/20">
                        <span className="text-3xl">🏛️</span>
                    </div>
                    <h1 className="font-display text-3xl font-black text-white tracking-tight">
                        Join Auction Intel
                    </h1>
                    <p className="text-purple-200/80 mt-2">Start finding profitable tax liens today</p>
                </div>

                {/* Glass card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                    <h2 className="font-display text-2xl font-bold text-white mb-2">Create account</h2>
                    <p className="text-slate-300 mb-6">Fill in your details to get started</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Full name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); clearError(); }}
                                className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.name
                                        ? 'border-red-400 focus:ring-red-400'
                                        : 'border-white/20 focus:ring-purple-400 focus:border-transparent'
                                    }`}
                                placeholder="John Smith"
                            />
                            {validationErrors.name && (
                                <p className="mt-1.5 text-sm text-red-400">{validationErrors.name}</p>
                            )}
                        </div>

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
                                        : 'border-white/20 focus:ring-purple-400 focus:border-transparent'
                                    }`}
                                placeholder="you@example.com"
                            />
                            {validationErrors.email && (
                                <p className="mt-1.5 text-sm text-red-400">{validationErrors.email}</p>
                            )}
                        </div>

                        {/* Password input with strength indicator */}
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
                                            : 'border-white/20 focus:ring-purple-400 focus:border-transparent'
                                        }`}
                                    placeholder="Create a strong password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>

                            {/* Password strength meter */}
                            {password && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all ${i < passwordStrength.score ? passwordStrength.color : 'bg-white/20'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Password strength: <span className="font-medium">{passwordStrength.label}</span>
                                    </p>
                                </div>
                            )}

                            {validationErrors.password && (
                                <p className="mt-1.5 text-sm text-red-400">{validationErrors.password}</p>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirm password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                                className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.confirmPassword
                                        ? 'border-red-400 focus:ring-red-400'
                                        : password && confirmPassword && password === confirmPassword
                                            ? 'border-emerald-400 focus:ring-emerald-400'
                                            : 'border-white/20 focus:ring-purple-400 focus:border-transparent'
                                    }`}
                                placeholder="Confirm your password"
                            />
                            {validationErrors.confirmPassword && (
                                <p className="mt-1.5 text-sm text-red-400">{validationErrors.confirmPassword}</p>
                            )}
                            {password && confirmPassword && password === confirmPassword && !validationErrors.confirmPassword && (
                                <p className="mt-1.5 text-sm text-emerald-400">✓ Passwords match</p>
                            )}
                        </div>

                        {/* Terms checkbox */}
                        <div>
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-400 focus:ring-offset-0"
                                />
                                <span className="text-sm text-slate-300">
                                    I agree to the{' '}
                                    <button type="button" className="text-purple-400 hover:text-purple-300">Terms of Service</button>
                                    {' '}and{' '}
                                    <button type="button" className="text-purple-400 hover:text-purple-300">Privacy Policy</button>
                                </span>
                            </label>
                            {validationErrors.terms && (
                                <p className="mt-1.5 text-sm text-red-400">{validationErrors.terms}</p>
                            )}
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
                            className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-display font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>
                </div>

                {/* Sign in link */}
                <p className="text-center mt-6 text-slate-300">
                    Already have an account?{' '}
                    <button
                        onClick={onNavigateToSignIn}
                        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                        Sign in instead
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
