import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, ArrowRight, ShieldCheck, Github, Chrome, KeyRound } from 'lucide-react';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await axios.post(`${apiUrl}/api/auth/register`, formData);
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await axios.post(`${apiUrl}/api/auth/verify-otp`, {
        email: formData.email,
        otp
      });
      localStorage.setItem('livedesk-token', res.data.token);
      localStorage.setItem('livedesk-user', JSON.stringify(res.data.user));
      localStorage.setItem('livedesk-username', res.data.user.username);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden z-10">
        {/* Left Side: Visual/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-900/40 to-black relative overflow-hidden border-r border-white/5 order-last lg:order-first">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          
          <div className="relative z-10 text-right lg:text-left">
            <div className="flex items-center gap-3 mb-12 justify-end lg:justify-start">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl -rotate-3">
                <span className="text-black font-black text-2xl tracking-tighter">L</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase">LiveDesk</span>
            </div>
            
            <h2 className="text-5xl font-black text-white leading-tight mb-6 tracking-tight">
              Create. <br />
              Innovate. <br />
              <span className="text-blue-500">Elevate.</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium max-w-sm ml-auto lg:ml-0">
              Join the future of collaborative development and start building something extraordinary.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-6 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] justify-end lg:justify-start">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Verified Environment
            </div>
            <div className="w-1 h-1 bg-white/10 rounded-full" />
            <span>v2.0.4</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center relative">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                {otpSent ? 'Confirm Identity' : 'Create Identity'}
              </h1>
              <p className="text-slate-500 font-medium">
                {otpSent ? `Verification code sent to ${formData.email}` : 'Join the elite collaboration platform'}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">!</span>
                </div>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Username Handle</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="johndoe"
                      className="w-full pl-14 pr-6 py-4 bg-[#111] border border-white/5 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Terminal</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="dev@livedesk.com"
                      className="w-full pl-14 pr-6 py-4 bg-[#111] border border-white/5 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Secret Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-6 py-4 bg-[#111] border border-white/5 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative py-5 bg-white text-black font-black rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin"></span>
                  ) : (
                    <>
                      Initialize Identity
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Authorization Code</label>
                  <div className="relative group max-w-[280px] mx-auto">
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      className="w-full pl-14 pr-6 py-6 bg-[#111] border border-white/5 rounded-2xl text-white text-center text-3xl font-black tracking-[0.3em] placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin"></span>
                    ) : 'Confirm Verification'}
                  </button>
                  <p className="text-center text-xs font-black uppercase tracking-widest text-slate-500">
                    Missing code?{' '}
                    <button type="button" onClick={handleRegisterSubmit} className="text-white hover:text-blue-400 transition-colors underline underline-offset-4">Resend Protocol</button>
                  </p>
                </div>
              </form>
            )}

            {!otpSent && (
              <>
                <div className="mt-10">
                  <div className="relative flex items-center justify-center mb-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <span className="relative px-4 bg-[#0a0a0a] text-[10px] font-black text-slate-600 uppercase tracking-widest">Rapid Setup</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-3 py-3 bg-[#111] hover:bg-white/5 border border-white/5 rounded-xl transition-all text-xs font-bold text-slate-300">
                      <Github className="w-4 h-4" /> Github
                    </button>
                    <button className="flex items-center justify-center gap-3 py-3 bg-[#111] hover:bg-white/5 border border-white/5 rounded-xl transition-all text-xs font-bold text-slate-300">
                      <Chrome className="w-4 h-4" /> Google
                    </button>
                  </div>
                </div>

                <div className="mt-10 text-center">
                  <p className="text-slate-500 font-medium text-sm">
                    Already registered?{' '}
                    <Link to="/login" className="text-white hover:text-blue-500 font-black transition-colors underline underline-offset-8 decoration-white/20 hover:decoration-blue-500">Sign In</Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="absolute bottom-8 text-slate-700 text-[10px] font-black uppercase tracking-[0.4em] pointer-events-none">LiveDesk System &copy; 2026</p>
    </div>
  );
}

export default Register;
