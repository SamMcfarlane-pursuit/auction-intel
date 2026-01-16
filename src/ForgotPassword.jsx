import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function ForgotPassword({ onNavigateToSignIn }) {
    const { resetPassword, error, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tempPassword, setTempPassword] = useState('');

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setValidationError('');
        setSuccess(false);

        if (!email.trim()) {
            setValidationError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setValidationError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const result = await resetPassword(email);
            setTempPassword(result.tempPassword);
            setSuccess(true);
        } catch (err) {
            // Error is handled by AuthContext
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>

            {/* Main card */}
            <div className="relative w-full max-w-md animate-fade-in">
                {/* Logo and branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl mb-4 border border-white/20">
                        <span className="text-3xl">🔐</span>
                    </div>
                    <h1 className="font-display text-3xl font-black text-white tracking-tight">
                        Reset Password
                    </h1>
                    <p className="text-indigo-200/80 mt-2">We'll help you get back in</p>
                </div>

                {/* Glass card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                    {success ? (
                        /* Success state */
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <span className="text-3xl">✓</span>
                            </div>
                            <h2 className="font-display text-2xl font-bold text-white mb-2">Password Reset</h2>
                            <p className="text-slate-300 mb-4">
                                Your temporary password has been generated.
                            </p>

                            {/* Show temp password (mock mode) */}
                            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-bold">Temporary Password</p>
                                <p className="font-mono text-xl text-emerald-400 font-bold tracking-wider">{tempPassword}</p>
                                <p className="text-xs text-slate-500 mt-2">Use this to sign in, then change your password in settings</p>
                            </div>

                            <button
                                onClick={onNavigateToSignIn}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-display font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        /* Form state */
                        <>
                            <h2 className="font-display text-2xl font-bold text-white mb-2">Forgot your password?</h2>
                            <p className="text-slate-300 mb-6">
                                Enter your email address and we'll reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Email input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); clearError(); setValidationError(''); }}
                                        className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${validationError || error
                                                ? 'border-red-400 focus:ring-red-400'
                                                : 'border-white/20 focus:ring-indigo-400 focus:border-transparent'
                                            }`}
                                        placeholder="you@example.com"
                                        autoFocus
                                    />
                                    {validationError && (
                                        <p className="mt-1.5 text-sm text-red-400">{validationError}</p>
                                    )}
                                </div>

                                {/* Error message from AuthContext */}
                                {error && (
                                    <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                                        <p className="text-sm text-red-300 text-center">{error}</p>
                                    </div>
                                )}

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-display font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Resetting...
                                        </span>
                                    ) : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                {/* Back to sign in link */}
                {!success && (
                    <p className="text-center mt-6 text-slate-300">
                        Remember your password?{' '}
                        <button
                            onClick={onNavigateToSignIn}
                            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                            Sign in instead
                        </button>
                    </p>
                )}
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
