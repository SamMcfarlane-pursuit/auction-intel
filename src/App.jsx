import { useState } from 'react';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
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

function App() {
  return (
    <ToastProvider>
      <WatchlistProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </WatchlistProvider>
    </ToastProvider>
  );
}

export default App;
