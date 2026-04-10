import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { SocketProvider } from './contexts/SocketContext'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Room from './pages/Room'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import React, { Component, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

// OAuth Callback Component - handles token from OAuth redirect
function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const completeOAuthSignIn = async () => {
      if (token) {
        localStorage.setItem('livedesk-token', token);
        try {
          const res = await fetch(`${apiUrl}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to fetch profile');
          const user = await res.json();
          localStorage.setItem('livedesk-user', JSON.stringify(user));
          localStorage.setItem('livedesk-username', user.username || '');
          navigate('/home');
          return;
        } catch (e) {
          console.error('OAuth profile fetch failed:', e);
          // Fallback: keep OAuth token and continue with minimal user payload
          // so user can still land on home after successful provider auth.
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const minimalUser = { id: payload.id };
            localStorage.setItem('livedesk-user', JSON.stringify(minimalUser));
            navigate('/home');
            return;
          } catch {
            localStorage.removeItem('livedesk-token');
            navigate('/login?error=oauth_profile_failed');
          }
          return;
        }
      }
      if (error) {
        navigate(`/login?error=${error}`);
      } else {
        navigate('/login');
      }
    };

    completeOAuthSignIn();
  }, [token, error, navigate, apiUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">AUTHENTICATING...</p>
      </div>
    </div>
  );
}

// Mobile detection
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
};

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('livedesk-token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('livedesk-token');
  return isAuthenticated ? <Navigate to="/home" /> : children;
};

// Mobile Warning Component
class MobileWarning extends Component {
  render() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]">
        <div className="bg-[#141414] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white mb-4">Desktop Only</h1>
          <p className="text-slate-400 mb-6 font-medium">
            LiveDesk is a desktop-supported application and is not optimized for mobile devices.
            Please access this application from a desktop or tablet for the best experience.
          </p>
          <p className="text-slate-500 text-sm">
            Minimum recommended screen width: 768px
          </p>
        </div>
      </div>
    );
  }
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <div className="bg-[#141414] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md">
            <h1 className="text-2xl font-black text-red-500 mb-4">Oops! Something broke</h1>
            <pre className="bg-[#1a1a1a] p-4 rounded-xl text-sm overflow-auto text-slate-400 font-mono">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-primary-600 text-white font-black rounded-xl uppercase tracking-wider text-sm hover:bg-primary-500 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [showMobileWarning, setShowMobileWarning] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      if (isMobile()) {
        setShowMobileWarning(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (showMobileWarning) {
    return (
      <ErrorBoundary>
        <MobileWarning />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141414',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0px',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          }
        }}
      />
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-[#050505]">
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/" element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            } />
            <Route path="/home" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/room/:roomId" element={
              <PrivateRoute>
                <Room />
              </PrivateRoute>
            } />
          </Routes>
          </div>
        </Router>
      </SocketProvider>
    </ErrorBoundary>
  )
}

export default App
