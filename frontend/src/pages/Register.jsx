import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`, formData);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/verify-otp`, {
        email: formData.email,
        otp
      });
      localStorage.setItem('livedesk-token', res.data.token);
      localStorage.setItem('livedesk-user', JSON.stringify(res.data.user));
      localStorage.setItem('livedesk-username', res.data.user.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="bg-[#141414] border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden p-10 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-primary-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/20 -rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-white font-black text-4xl tracking-tighter">L</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
              {otpSent ? 'Verification' : 'Get Started'}
            </h1>
            <p className="text-slate-500 font-medium">
              {otpSent ? `We've sent a code to ${formData.email}` : 'Join the elite collaboration platform'}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <span className="text-lg">⚡</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="w-full px-6 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all duration-300 font-medium"
                />
              </div>

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
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
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
                {loading ? <span className="animate-spin text-xl">⏳</span> : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Enter 6-digit Code</label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  className="w-full px-4 py-6 bg-[#1a1a1a] border border-white/5 rounded-2xl text-white text-center text-4xl font-black tracking-[0.5em] placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600/50 transition-all duration-300"
                  maxLength={6}
                />
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-xl hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                >
                  {loading ? <span className="animate-spin text-xl">⏳</span> : 'Verify & Continue'}
                </button>
                <p className="text-center text-sm font-medium text-slate-500">
                  Didn't receive it?{' '}
                  <button type="button" onClick={handleRegisterSubmit} className="text-white hover:text-primary-400 font-black transition-colors underline underline-offset-4">Resend Code</button>
                </p>
              </div>
            </form>
          )}

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 font-medium">
              Already a member?{' '}
              <Link to="/login" className="text-white hover:text-primary-400 font-black transition-colors underline underline-offset-8 decoration-white/20 hover:decoration-primary-400">Sign In</Link>
            </p>
          </div>
        </div>
        <p className="text-center mt-8 text-slate-600 text-xs font-bold uppercase tracking-[0.3em]">LiveDesk Pro &copy; 2026</p>
      </div>
    </div>
  );
}

export default Register;
