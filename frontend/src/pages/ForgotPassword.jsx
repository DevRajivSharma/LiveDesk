import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/forgot-password`, { email });
      setMessage(res.data.message);
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
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Reset Access</h1>
            <p className="text-slate-500 font-medium italic">Recover your LiveDesk workspace</p>
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
              <span className="font-medium">{message}</span>
            </div>
          )}

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Registered Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-6 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all duration-300 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-xl hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                {loading ? <span className="animate-spin text-xl">⏳</span> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-slate-400 mb-8 font-medium">Please check your inbox for instructions to reset your password.</p>
              <Link
                to="/login"
                className="inline-block w-full py-5 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 uppercase tracking-widest text-sm"
              >
                Return to Login
              </Link>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 font-medium">
              Remembered your password?{' '}
              <Link to="/login" className="text-white hover:text-primary-400 font-black transition-colors underline underline-offset-8 decoration-white/20 hover:decoration-primary-400">Sign In</Link>
            </p>
          </div>
        </div>
        <p className="text-center mt-8 text-slate-600 text-xs font-bold uppercase tracking-[0.3em]">LiveDesk Pro &copy; 2026</p>
      </div>
    </div>
  );
}

export default ForgotPassword;
