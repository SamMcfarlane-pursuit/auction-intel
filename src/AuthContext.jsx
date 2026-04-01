import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Point to the local Rust backend by default instead of dead fly.io layer
const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api') + '/auth';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                // Bypass backend validation for the demo token
                if (token === 'mcfarlane-demo-token-2026') {
                    setUser({
                        id: 'demo-user',
                        name: 'Demo Investor',
                        email: 'demo@auction-intel.com',
                        role: 'PRO'
                    });
                    setLoading(false);
                    return;
                }

                try {
                    const res = await fetch(`${API_URL}/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (res.ok) {
                        const userData = await res.json();
                        setUser(userData);
                    } else {
                        // Token invalid/expired
                        localStorage.removeItem('auth_token');
                        setUser(null);
                    }
                } catch (err) {
                    console.error('Auth check failed:', err);
                    localStorage.removeItem('auth_token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const signIn = async (email, password, rememberMe = true) => {
        setError(null);
        // Mock demo account for development/demo purposes
        if (email === 'demo@auction-intel.com') {
            const demoData = {
                token: 'mcfarlane-demo-token-2026',
                user: {
                    id: 'demo-user',
                    name: 'Demo Investor',
                    email: 'demo@auction-intel.com',
                    role: 'PRO'
                }
            };
            setUser(demoData.user);
            localStorage.setItem('auth_token', demoData.token);
            return demoData.user;
        }

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Login failed');
            }

            const data = await res.json(); // Expects { token, user }

            setUser(data.user);
            // We always store the token for now to maintain session state on refresh,
            // regardless of 'rememberMe', as React state is ephemeral.
            // 'rememberMe' could control long-term persistence (e.g., localStorage vs sessionStorage),
            // but for this MVP, we use localStorage.
            localStorage.setItem('auth_token', data.token);

            return data.user;
        } catch (err) {
            console.error('Sign In Error:', err);
            setError(err.message);
            throw err;
        }
    };

    const signUp = async (name, email, password) => {
        setError(null);
        try {
            const res = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Sign up failed');
            }

            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('auth_token', data.token);
            return data.user;
        } catch (err) {
            console.error('Sign Up Error:', err);
            setError(err.message);
            throw err;
        }
    };

    const signOut = () => {
        setUser(null);
        setError(null);
        localStorage.removeItem('auth_token');
    };

    const resetPassword = async (email) => {
        setError(null);
        // Backend implementation not done yet.
        await new Promise(resolve => setTimeout(resolve, 500));
        return { message: "Password reset not implemented yet" };
    };

    const clearError = () => setError(null);

    const value = {
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        clearError,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
