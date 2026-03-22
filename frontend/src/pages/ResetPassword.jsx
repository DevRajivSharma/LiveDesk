import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import Logo from '../components/Logo';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await axios.post(`${apiUrl}/api/auth/reset-password/${token}`, {
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
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-none shadow-2xl overflow-hidden p-10 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
          
          <div className="text-center mb-10 relative z-10">
            <div className="flex justify-center mb-8">
              <Logo className="w-12 h-12" textClassName="text-2xl" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">UPDATE_KEY</h1>
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">RECONFIGURE_SECURITY_CREDENTIALS</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-none text-red-400 text-xs flex items-center gap-3 animate-in slide-in-from-top-2 relative z-10">
              <div className="w-6 h-6 rounded-none bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">!</span>
              </div>
              <span className="font-black uppercase tracking-wider">{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-none text-emerald-400 text-xs flex flex-col items-center gap-4 text-center animate-in zoom-in relative z-10">
              <div className="w-10 h-10 rounded-none bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-black uppercase tracking-widest">{message} - REDIRECTING...</span>
            </div>
          )}

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">NEW_ACCESS_KEY</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-[#050505] border border-white/5 rounded-none text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-600/60 transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">CONFIRM_ACCESS_KEY</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-[#050505] border border-white/5 rounded-none text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-600/60 transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative py-5 bg-white text-black font-black rounded-none shadow-xl hover:bg-blue-600 hover:text-white disabled:bg-slate-900 disabled:text-slate-700 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                ) : (
                  <>
                    UPDATE_CREDENTIALS
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center relative z-10">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-5 bg-white/5 text-white font-black rounded-none border border-white/10 hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]"
              >
                GO_TO_LOGIN
              </Link>
            </div>
          )}
        </div>
        <p className="absolute bottom-8 text-slate-700 text-[10px] font-black uppercase tracking-[0.4em] pointer-events-none">LiveDesk System &copy; 2026</p>
      </div>
    </div>
  );
}

export default ResetPassword;
