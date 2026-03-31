import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, ArrowRight, ShieldCheck, Github, Chrome, KeyRound } from 'lucide-react';
import Logo from '../components/Logo';

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
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-[#0a0a0a] border border-white/5 rounded-none shadow-2xl overflow-hidden z-10">
        
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-900/20 to-black relative overflow-hidden border-r border-white/5 order-last lg:order-first">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          
          <div className="relative z-10 text-right lg:text-left">
            <div className="mb-12">
              <Logo className="w-12 h-12" textClassName="text-3xl" />
            </div>
            
            <h2 className="text-5xl font-black text-white leading-tight mb-6 tracking-tight">
              BUILD. <br />
              EXECUTE. <br />
              <span className="text-blue-500">COLLABORATE.</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium max-w-sm ml-auto lg:ml-0">
              Join the elite workspace for real-time development and session orchestration.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-6 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] justify-end lg:justify-start">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              SYSTEM_SECURED
            </div>
            <div className="w-1 h-1 bg-white/10 rounded-full" />
            <span>PROTOCOL_V2.5.0</span>
          </div>
        </div>

        
        <div className="p-8 lg:p-16 flex flex-col justify-center relative bg-[#050505]">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">
                {otpSent ? 'AUTH_VERIFICATION' : 'INITIALIZE_IDENTITY'}
              </h1>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
                {otpSent ? `SECURE_CODE_SENT: ${formData.email}` : 'JOIN_THE_DEVELOPER_CORE'}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-none text-red-400 text-xs flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="w-6 h-6 rounded-none bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">!</span>
                </div>
                <span className="font-black uppercase tracking-wider">{error}</span>
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">USER_HANDLE</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="JD_DEV_01"
                      className="w-full pl-14 pr-6 py-4 bg-[#0a0a0a] border border-white/5 rounded-none text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-600/60 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">EMAIL_TERMINAL</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="DEV@LIVEDESK.IO"
                      className="w-full pl-14 pr-6 py-4 bg-[#0a0a0a] border border-white/5 rounded-none text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-600/60 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">ACCESS_KEY</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-6 py-4 bg-[#0a0a0a] border border-white/5 rounded-none text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-600/60 transition-all font-mono text-sm"
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
                      EXECUTE_REGISTRATION
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">VALIDATION_CODE</label>
                  <div className="relative group max-w-[280px] mx-auto">
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-800 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      className="w-full pl-14 pr-6 py-6 bg-[#0a0a0a] border border-white/5 rounded-none text-white text-center text-3xl font-black tracking-[0.3em] placeholder:text-slate-900 focus:outline-none focus:border-blue-600/60 transition-all font-mono"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-white text-black font-black rounded-none shadow-xl hover:bg-blue-600 hover:text-white disabled:bg-slate-900 disabled:text-slate-700 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                    ) : 'CONFIRM_VERIFICATION'}
                  </button>
                  <p className="text-center text-[9px] font-black uppercase tracking-widest text-slate-500">
                    MISSING_CODE?{' '}
                    <button type="button" onClick={handleRegisterSubmit} className="text-white hover:text-blue-400 transition-colors underline underline-offset-4 decoration-white/20">RETRY_PROTOCOL</button>
                  </p>
                </div>
              </form>
            )}

            {!otpSent && (
              <>
                <div className="mt-10">
                  <div className="relative flex items-center justify-center mb-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <span className="relative px-4 bg-[#050505] text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">FAST_ACCESS</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-3 py-3 bg-[#0a0a0a] hover:bg-white/5 border border-white/5 rounded-none transition-all text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Github className="w-4 h-4" /> GITHUB
                    </button>
                    <button className="flex items-center justify-center gap-3 py-3 bg-[#0a0a0a] hover:bg-white/5 border border-white/5 rounded-none transition-all text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Chrome className="w-4 h-4" /> GOOGLE
                    </button>
                  </div>
                </div>

                <div className="mt-10 text-center">
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                    ALREADY_REGISTERED?{' '}
                    <Link to="/login" className="text-white hover:text-blue-500 font-black transition-colors underline underline-offset-8 decoration-white/20 hover:decoration-blue-500">SIGN_IN</Link>
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
