import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SocketProvider } from './contexts/SocketContext'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Room from './pages/Room'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import { Component } from 'react'
import { Toaster } from 'react-hot-toast'

// Private Route Component
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('livedesk-token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (for Landing page)
const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('livedesk-token');
  return isAuthenticated ? <Navigate to="/home" /> : children;
};

// Error Boundary Class Component
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
