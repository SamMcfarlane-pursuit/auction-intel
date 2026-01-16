import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Mock user database (in production, this would be a backend API)
const MOCK_USERS_KEY = 'auction_intel_users';
const CURRENT_USER_KEY = 'auction_intel_current_user';

function getStoredUsers() {
    try {
        const users = localStorage.getItem(MOCK_USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    try {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

function saveCurrentUser(user) {
    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(CURRENT_USER_KEY);
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const signIn = async (email, password, rememberMe = true) => {
        setError(null);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const users = getStoredUsers();
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!foundUser) {
            const err = 'No account found with this email';
            setError(err);
            throw new Error(err);
        }

        if (foundUser.password !== password) {
            const err = 'Incorrect password';
            setError(err);
            throw new Error(err);
        }

        // Remove password from user object for security
        const safeUser = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            createdAt: foundUser.createdAt
        };

        setUser(safeUser);
        if (rememberMe) {
            saveCurrentUser(safeUser);
        }

        return safeUser;
    };

    const signUp = async (name, email, password) => {
        setError(null);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const users = getStoredUsers();

        // Check if user already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            const err = 'An account with this email already exists';
            setError(err);
            throw new Error(err);
        }

        // Create new user
        const newUser = {
            id: crypto.randomUUID(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password, // In production, this would be hashed
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        // Auto sign in after registration
        const safeUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            createdAt: newUser.createdAt
        };

        setUser(safeUser);
        saveCurrentUser(safeUser);

        return safeUser;
    };

    const signOut = () => {
        setUser(null);
        setError(null);
        saveCurrentUser(null);
    };

    const resetPassword = async (email) => {
        setError(null);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const users = getStoredUsers();
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!foundUser) {
            const err = 'No account found with this email';
            setError(err);
            throw new Error(err);
        }

        // Generate temporary password (in production, this would send an email)
        const tempPassword = Math.random().toString(36).slice(-8);
        foundUser.password = tempPassword;
        saveUsers(users);

        return { tempPassword, email: foundUser.email };
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
