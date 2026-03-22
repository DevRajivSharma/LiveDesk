import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

function ResetPassword() {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/reset-password/${token}`, {
        password: formData.password
      });
      setMessage(res.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="bg-[#141414] border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden p-10 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-primary-600 to-blue-600 rounded-3xl mb-6 shadow-2xl shadow-primary-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-white font-black text-4xl tracking-tighter">L</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">New Password</h1>
            <p className="text-slate-500 font-medium italic">Secure your account</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <span className="text-lg">⚡</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <span className="text-lg">✅</span>
              <span className="font-medium">{message} - Redirecting to login...</span>
            </div>
          )}

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">New Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all duration-300 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all duration-300 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-xl hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                {loading ? <span className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></span> : 'Update Password'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <Link
                to="/login"
                className="inline-block w-full py-5 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 uppercase tracking-widest text-sm"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
        <p className="text-center mt-8 text-slate-600 text-xs font-bold uppercase tracking-[0.3em]">LiveDesk Pro &copy; 2026</p>
      </div>
    </div>
  );
}

export default ResetPassword;
