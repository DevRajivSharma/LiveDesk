import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Global axios interceptor for handling session expiry
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || '';
      if (message.includes('Session expired') || message.includes('Invalid token') || message.includes('Invalid session')) {
        // Clear auth data and redirect to login
        localStorage.removeItem('livedesk-token')
        localStorage.removeItem('livedesk-user')
        localStorage.removeItem('livedesk-username')
        window.location.href = '/login?reason=session_expired'
      }
    }
    return Promise.reject(error)
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)