import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowRight, ShieldCheck, KeyRound, ChevronLeft } from 'lucide-react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });
      setMessage(res.data.message);
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
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden p-10 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
          
          <div className="text-center mb-10 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6 shadow-2xl rotate-3">
              <span className="text-black font-black text-3xl tracking-tighter">L</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Access Recovery</h1>
            <p className="text-slate-500 font-medium">Initialize password reset protocol</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2 relative z-10">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">!</span>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex flex-col items-center gap-4 text-center animate-in zoom-in relative z-10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="font-medium">{message}</span>
            </div>
          )}

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Terminal Email</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dev@livedesk.com"
                    className="w-full pl-14 pr-6 py-4 bg-[#111] border border-white/5 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600/40 focus:border-primary-600/40 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative py-5 bg-white text-black font-black rounded-2xl shadow-xl hover:bg-primary-500 hover:text-white disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                {loading ? (
                  <span className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin"></span>
                ) : (
                  <>
                    Request New Key
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center relative z-10">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-5 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                Return to Login
              </Link>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-white/5 text-center relative z-10">
            <p className="text-slate-500 font-medium text-sm">
              Remembered?{' '}
              <Link to="/login" className="text-white hover:text-primary-500 font-black transition-colors underline underline-offset-8 decoration-white/20 hover:decoration-primary-500">Sign In</Link>
            </p>
          </div>
        </div>
        <p className="absolute bottom-8 text-slate-700 text-[10px] font-black uppercase tracking-[0.4em] pointer-events-none">LiveDesk System &copy; 2026</p>
      </div>
    </div>
  );
}

export default ForgotPassword;
