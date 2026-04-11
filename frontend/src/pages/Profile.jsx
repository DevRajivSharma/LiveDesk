import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Github, Twitter, Globe, MapPin, Briefcase, Code, Save, ChevronLeft, LogOut, ShieldCheck, Camera, Activity, Trash2, FileText, Download, Calendar } from 'lucide-react';
import Logo from '../components/Logo';

function Profile() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    github: '',
    twitter: '',
    website: '',
    location: '',
    occupation: '',
    skills: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('livedesk-token');
        if (!token) {
          navigate('/login');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        // Fetch profile
        const profileRes = await axios.get(`${apiUrl}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(profileRes.data);
        setFormData({
          username: profileRes.data.username || '',
          bio: profileRes.data.bio || '',
          github: profileRes.data.github || '',
          twitter: profileRes.data.twitter || '',
          website: profileRes.data.website || '',
          location: profileRes.data.location || '',
          occupation: profileRes.data.occupation || '',
          skills: (profileRes.data.skills || []).join(', ')
        });

        // Fetch user files
        const filesRes = await axios.get(`${apiUrl}/api/auth/profile/files`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFiles(filesRes.data);

        setLoading(false);
      } catch (err) {
        setError('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setError('Avatar image must be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        setSaving(true);
        const token = localStorage.getItem('livedesk-token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        const res = await axios.put(`${apiUrl}/api/auth/profile/avatar`, 
          { avatar: base64String },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUser({ ...user, avatar: res.data.avatar });
        setMessage('Avatar updated successfully');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update avatar');
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('livedesk-token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      await axios.delete(`${apiUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      handleLogout();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('livedesk-token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const updatedData = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
      };

      const res = await axios.put(`${apiUrl}/api/auth/profile`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(res.data);
      localStorage.setItem('livedesk-user', JSON.stringify(res.data));
      localStorage.setItem('livedesk-username', res.data.username);
      setMessage('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('livedesk-token');
    localStorage.removeItem('livedesk-user');
    localStorage.removeItem('livedesk-username');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans pb-20 relative overflow-hidden">
      
      <nav className="flex items-center justify-between px-6 py-2 bg-[#0a0a0a] border-b border-white/10 z-50 h-14 sticky top-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Logo className="w-8 h-8" textClassName="text-lg" />
          </div>
        </div>
        
        <div className="flex items-center gap-6 h-full">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {error && (
          <div className="mb-8 p-4 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}
        {message && (
          <div className="mb-8 p-4 bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')}>×</button>
          </div>
        )}
        
        <div className="space-y-12">
          
          <div className="bg-black/40 border border-white/10 p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  className="w-40 h-40 flex items-center justify-center text-5xl font-black shadow-2xl border border-white/10 transition-transform group-hover:scale-105 duration-500 overflow-hidden"
                  style={{ backgroundColor: !user?.avatar ? (user?.avatarColor || '#2563eb') : 'transparent' }}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                {editMode && (
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    disabled={saving}
                    className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white shadow-xl hover:scale-110 transition-transform disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{user?.username}</h2>
                  <p className="text-slate-500 font-black text-[11px] uppercase tracking-[0.3em]">{user?.email}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Verified Identity</span>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-2 bg-blue-600/10 border border-blue-600/20">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Operational Status: Active</span>
                  </div>
                </div>
              </div>

              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-10 py-5 bg-white text-black font-black hover:bg-blue-600 hover:text-white transition-all duration-300 uppercase tracking-widest text-[10px] shadow-2xl"
                >
                  Modify Identity
                </button>
              )}
            </div>
          </div>

          
          <div className="grid lg:grid-cols-2 gap-12">
            
            <div className="bg-black/40 border border-white/10 p-10 shadow-2xl space-y-10">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-2 h-2 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">System Biography</h3>
              </div>
              
              {!editMode ? (
                <div className="space-y-10">
                  <p className="text-slate-400 text-sm leading-relaxed font-mono bg-white/[0.02] border border-white/5 p-8">
                    {user?.bio || 'SYSTEM_BIO_EMPTY: No data provided for this sector.'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <span className="block text-[9px] font-black text-slate-600 uppercase tracking-widest">Operational Role</span>
                      <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10">
                        <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase">{user?.occupation || 'Developer'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <span className="block text-[9px] font-black text-slate-600 uppercase tracking-widest">Deployment Station</span>
                      <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase">{user?.location || 'Remote'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Input Biography</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full h-32 bg-black/40 border border-white/10 p-4 text-xs font-mono text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Role</label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-white/10 p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-white/10 p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            
            <div className="bg-black/40 border border-white/10 p-10 shadow-2xl space-y-10">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-2 h-2 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Network Protocol</h3>
              </div>

              {!editMode ? (
                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">GitHub Endpoint</span>
                      <div className="p-4 bg-white/5 border border-white/10 flex items-center gap-3 group">
                        <Github className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-mono text-slate-300 truncate">{user?.github || 'OFFLINE'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Twitter Node</span>
                      <div className="p-4 bg-white/5 border border-white/10 flex items-center gap-3 group">
                        <Twitter className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        <span className="text-[10px] font-mono text-slate-300 truncate">{user?.twitter || 'OFFLINE'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Technical Arsenal</span>
                    <div className="flex flex-wrap gap-2">
                      {user?.skills?.length > 0 ? (
                        user.skills.map((skill, i) => (
                          <span key={i} className="px-4 py-2 bg-blue-600/10 border border-blue-600/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] text-slate-700 uppercase font-black">Arsenal Empty</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">GitHub</label>
                      <input
                        type="text"
                        name="github"
                        value={formData.github}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-white/10 p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Twitter</label>
                      <input
                        type="text"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-white/10 p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Arsenal (COMMA_SEPARATED)</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  
                  <div className="pt-4 flex items-center gap-4">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                    >
                      Commit Changes
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-8 py-4 bg-white/5 text-slate-500 border border-white/10 font-black uppercase tracking-widest text-[10px]"
                    >
                      Abort
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          
          <div className="bg-black/40 border border-white/10 p-10 shadow-2xl space-y-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Data Repository</h3>
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{files.length} System Objects Found</span>
            </div>

            {files.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {files.map((file) => (
                  <div key={file._id} className="p-6 bg-white/[0.02] border border-white/5 group hover:border-blue-600/30 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/10 text-blue-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[150px]">{file.name}</h4>
                          <div className="flex items-center gap-3 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(file.createdAt).toLocaleDateString()}</span>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400">{file.type}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const blob = new Blob([file.content], { type: 'text/plain' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = file.name;
                          a.click();
                        }}
                        className="p-2 text-slate-500 hover:text-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-white/10 bg-white/[0.01]">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No data records located in this sector</p>
              </div>
            )}
          </div>

          
          <div className="bg-red-600/5 border border-red-600/20 p-10 shadow-2xl space-y-8">
            <div className="flex items-center gap-4 border-b border-red-600/10 pb-6">
              <div className="w-2 h-2 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Destructive Operations</h3>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Terminate Digital Identity</p>
                <p className="text-slate-500 text-[10px] max-w-md uppercase leading-relaxed font-black tracking-widest opacity-60">
                  Permanently erase all system data, files, and credentials. This action is irreversible and will result in total data loss.
                </p>
              </div>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-10 py-5 bg-red-600/10 border border-red-600/20 text-red-500 font-black hover:bg-red-600 hover:text-white transition-all duration-300 uppercase tracking-widest text-[10px]"
                >
                  Initiate Termination
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="px-8 py-5 bg-red-600 text-white font-black hover:bg-red-700 transition-all uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                  >
                    {saving ? 'Terminating...' : 'Confirm Destruction'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-8 py-5 bg-white/5 border border-white/10 text-slate-500 font-black uppercase tracking-widest text-[10px]"
                  >
                    Abort
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;