import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, formData);
      localStorage.setItem('livedesk-token', res.data.token);
      localStorage.setItem('livedesk-user', JSON.stringify(res.data.user));
      localStorage.setItem('livedesk-username', res.data.user.username);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 font-medium">Elevate your collaboration experience</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <span className="text-lg">⚡</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                className="w-full px-6 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all duration-300 font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Password</label>
                <Link to="/forgot-password" title="Recover Password" className="text-[11px] text-primary-500 hover:text-primary-400 font-black uppercase tracking-wider transition-colors">Forgot?</Link>
              </div>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-xl hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              {loading ? <span className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></span> : 'Sign In'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 font-medium">
              New here?{' '}
              <Link to="/register" className="text-white hover:text-primary-400 font-black transition-colors underline underline-offset-8 decoration-white/20 hover:decoration-primary-400">Create Account</Link>
            </p>
          </div>
        </div>
        <p className="text-center mt-8 text-slate-600 text-xs font-bold uppercase tracking-[0.3em]">LiveDesk Pro &copy; 2026</p>
      </div>
    </div>
  );
}

export default Login;
