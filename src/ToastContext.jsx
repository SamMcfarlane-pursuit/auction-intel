import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type };

        setToasts(prev => [...prev, toast]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((message) => addToast(message, 'success'), [addToast]);
    const error = useCallback((message) => addToast(message, 'error', 5000), [addToast]);
    const info = useCallback((message) => addToast(message, 'info'), [addToast]);
    const warning = useCallback((message) => addToast(message, 'warning', 4000), [addToast]);

    const value = { addToast, removeToast, success, error, info, warning };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 transform transition-all duration-300 animate-slide-in-right ${toast.type === 'success' ? 'bg-emerald-500/95 text-white border-emerald-400/50' :
                                toast.type === 'error' ? 'bg-red-500/95 text-white border-red-400/50' :
                                    toast.type === 'warning' ? 'bg-amber-500/95 text-white border-amber-400/50' :
                                        'bg-blue-500/95 text-white border-blue-400/50'
                            }`}
                    >
                        <span className="text-lg">
                            {toast.type === 'success' ? '✓' :
                                toast.type === 'error' ? '✗' :
                                    toast.type === 'warning' ? '⚠' : 'ℹ'}
                        </span>
                        <span className="font-medium text-sm">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 text-white/70 hover:text-white transition-colors"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export default ToastContext;
