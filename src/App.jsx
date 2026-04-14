import React, { useState, Component } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { WatchlistProvider } from './WatchlistContext';
import { ToastProvider } from './ToastContext';
import AuctionPlatform from './AuctionPlatform';
import SignIn from './SignIn';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';
import './App.css';

function AuthenticatedApp() {
  const { isAuthenticated, loading } = useAuth();
  const [view, setView] = useState('signin'); // 'signin' | 'signup' | 'forgot'

  // Show loading state while checking for existing session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/70 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show platform if authenticated
  if (isAuthenticated) {
    return <AuctionPlatform />;
  }

  // Show auth pages based on view
  if (view === 'signup') {
    return <SignUp onNavigateToSignIn={() => setView('signin')} />;
  }

  if (view === 'forgot') {
    return <ForgotPassword onNavigateToSignIn={() => setView('signin')} />;
  }

  return <SignIn onNavigateToSignUp={() => setView('signup')} onNavigateToForgot={() => setView('forgot')} />;
}

// Top-level error boundary — prevents any uncaught error from going full blank white screen
class AppErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[App] Uncaught error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Auction Intel – Unexpected Error</h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '400px', textAlign: 'center' }}>
            Something went wrong. Please refresh the page to resume your session.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '8px', padding: '10px 24px', background: '#f59e0b', color: '#0f172a', borderRadius: '12px', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Reload Platform
          </button>
          <pre style={{ marginTop: '16px', fontSize: '0.6rem', color: '#475569', maxWidth: '600px', overflow: 'auto', background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <ToastProvider>
        <WatchlistProvider>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </WatchlistProvider>
      </ToastProvider>
    </AppErrorBoundary>
  );
}

export default App;
