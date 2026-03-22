import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Code2,
  PenTool,
  Users,
  Mic,
  Monitor,
  ArrowRight,
  Play,
  Zap,
  Shield,
  Globe,
  Sparkles,
  Terminal,
  FileCode,
  Layers,
  MessageSquare,
  Activity,
  ShieldCheck,
  Cpu
} from 'lucide-react'
import Logo from '../components/Logo'
import demo1 from '../videos/LiveDesk_Demo1.mp4'
import demo2 from '../videos/LiveDesk)Demo2.mp4'

function Landing() {
  const [videoPlaying, setVideoPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [currentVideo, setCurrentVideo] = useState(null)
  const videoRef = useRef(null)
  const videoList = [demo1, demo2]

  useEffect(() => {
    // Select initial random video
    const randomIdx = Math.floor(Math.random() * videoList.length)
    setCurrentVideo(videoList[randomIdx])
  }, [])

  const handleVideoEnd = () => {
    // Pick another random video when the current one ends
    let nextIdx
    do {
      nextIdx = Math.floor(Math.random() * videoList.length)
    } while (videoList.length > 1 && videoList[nextIdx] === currentVideo)
    
    setCurrentVideo(videoList[nextIdx])
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch(err => {
        console.warn("Autoplay was prevented by browser. Retrying muted.", err);
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play();
        }
      });
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }

  const features = [
    {
      icon: Code2,
      title: 'DEVELOPER_CORE',
      description: 'Professional Monaco editor with syntax highlighting for 8+ languages. Real-time sync with your team.',
      color: 'from-blue-600 to-blue-800',
      glow: 'shadow-blue-500/10'
    },
    {
      icon: PenTool,
      title: 'SESSION_BOARD',
      description: 'Infinite canvas powered by Excalidraw. Draw, sketch, and brainstorm together in real-time.',
      color: 'from-blue-500 to-indigo-600',
      glow: 'shadow-indigo-500/10'
    },
    {
      icon: Users,
      title: 'TEAM_PROTOCOL',
      description: 'Work together seamlessly with multi-user editing, cursors, and presence indicators.',
      color: 'from-blue-400 to-blue-600',
      glow: 'shadow-blue-400/10'
    },
    {
      icon: Mic,
      title: 'VOICE_LINK',
      description: 'Crystal clear audio communication with WebRTC. No downloads required.',
      color: 'from-blue-700 to-blue-900',
      glow: 'shadow-blue-700/10'
    }
  ]

  const tools = [
    { icon: FileCode, label: 'MULTI_LANG', desc: 'JS, PY, TS, GO & MORE' },
    { icon: Terminal, label: 'SHELL_EXEC', desc: 'NODE.JS BACKEND' },
    { icon: Layers, label: 'DUAL_VIEW', desc: 'CODE & BOARD SYNC' },
    { icon: MessageSquare, label: 'SECURE_CHAT', desc: 'END-TO-END ENCRYPTED' }
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px]" />
        
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-8 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <Logo className="w-10 h-10" textClassName="text-xl" />

        <div className="flex items-center gap-8">
          <Link
            to="/login"
            className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
          >
            AUTH_LOGIN
          </Link>
          <Link
            to="/register"
            className="px-8 py-3 bg-white text-black font-black rounded-none uppercase tracking-widest text-[10px] shadow-xl hover:bg-blue-600 hover:text-white transition-all duration-300"
          >
            INITIALIZE_ACCOUNT
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 lg:px-12 pb-20">
        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto pt-20 lg:pt-32 mb-16">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-none mb-10">
            <Activity className="w-3 h-3 text-blue-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">
              SYSTEM_STATUS: OPERATIONAL_V2.5.0
            </span>
          </div>

          <h1 className="text-6xl lg:text-8xl font-black text-white leading-none mb-8 tracking-tighter uppercase">
            BUILD. EXECUTE.
            <span className="block text-blue-600">
              COLLABORATE.
            </span>
          </h1>

          <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] max-w-2xl mx-auto mb-12 leading-relaxed">
            THE ALL-IN-ONE WORKSPACE FOR ELITE DEVELOPERS. <br />
            COMBINE REAL-TIME CODE EXECUTION WITH INFINITE BRAINSTORMING.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/register"
              className="group px-12 py-5 bg-blue-600 text-white font-black rounded-none uppercase tracking-widest text-xs shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition-all duration-300 flex items-center gap-4"
            >
              EXECUTE_START
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button 
              onClick={() => setVideoPlaying(true)}
              className="px-12 py-5 bg-white/5 border border-white/10 text-white font-black rounded-none uppercase tracking-widest text-xs hover:bg-white/10 transition-all duration-300 flex items-center gap-4"
            >
              <Play className="w-4 h-4" />
              VIEW_PROTOCOL
            </button>
          </div>
        </div>

        {/* Video Container - Sharp & Tech */}
        <div className="max-w-6xl mx-auto mb-32">
          <div className="relative group">
            {/* Main Container */}
            <div className="relative bg-[#0a0a0a] border border-white/5 rounded-none overflow-hidden shadow-2xl">
              {/* Browser Chrome */}
              <div className="flex items-center gap-4 px-6 py-4 bg-[#050505] border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-none bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-none bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-none bg-white/10" />
                </div>
                <div className="flex-1 mx-6">
                  <div className="max-w-md mx-auto px-4 py-1.5 bg-black border border-white/5">
                    <div className="flex items-center gap-2 text-slate-700">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">LIVEDESK_SECURE_NODE</span>
                    </div>
                  </div>
                </div>
                <Cpu className="w-3 h-3 text-slate-800" />
              </div>

              {/* Video/Preview Area */}
              <div className="relative aspect-[16/9] bg-[#050505]">
                {!videoPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    {/* Background Loop Video (muted/autoplay) */}
                    {currentVideo && (
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
                      >
                        <source src={currentVideo} type="video/mp4" />
                      </video>
                    )}
                    {/* Mock UI Overlay */}
                    <div className="w-full h-full flex relative z-10">
                      {/* Editor Side */}
                      <div className="w-1/2 border-r border-white/5 bg-[#0a0a0a]/80 backdrop-blur-sm">
                        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 bg-[#050505]/50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">EDITOR_CORE</span>
                          </div>
                        </div>
                        <div className="p-6 font-mono text-[11px] text-slate-400 space-y-2">
                          <div className="flex"><span className="text-slate-800 w-8">01</span><span className="text-blue-500">const</span><span className="text-white"> SESSION</span><span className="text-slate-600"> = </span><span className="text-blue-400">new</span><span className="text-white"> LiveDesk();</span></div>
                          <div className="flex"><span className="text-slate-800 w-8">02</span></div>
                          <div className="flex"><span className="text-slate-800 w-8">03</span><span className="text-white">await</span><span className="text-white"> SESSION.</span><span className="text-blue-400">connect</span>({'{'}</div>
                          <div className="flex"><span className="text-slate-800 w-8">04</span><span className="text-white ml-4">mode:</span><span className="text-blue-500"> 'COLLABORATIVE'</span>,</div>
                          <div className="flex"><span className="text-slate-800 w-8">05</span><span className="text-white ml-4">sync:</span><span className="text-blue-500"> true</span></div>
                          <div className="flex"><span className="text-slate-800 w-8">06</span>{'}'});</div>
                        </div>
                        {/* Cursors */}
                        <div className="absolute top-20 left-40 flex items-center gap-0 animate-pulse">
                          <div className="w-0.5 h-4 bg-blue-500" />
                          <span className="text-[8px] bg-blue-500 px-1.5 py-0.5 text-white font-black uppercase tracking-tighter">YOU</span>
                        </div>
                      </div>

                      {/* Whiteboard Side */}
                      <div className="w-1/2 bg-[#0a0a0a]/80 backdrop-blur-sm">
                        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 bg-[#050505]/50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SESSION_BOARD</span>
                          </div>
                        </div>
                        <div className="relative h-full p-6">
                          {/* Mock Drawing */}
                          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 200">
                            <path d="M50 150 L100 50 L150 100 L250 80 L350 120" stroke="#3b82f6" strokeWidth="1" fill="none" />
                            <rect x="180" y="60" width="80" height="50" stroke="#3b82f6" strokeWidth="1" fill="none" />
                            <circle cx="300" cy="100" r="30" stroke="#3b82f6" strokeWidth="1" fill="none" />
                          </svg>
                          <div className="flex flex-col gap-2">
                            <div className="w-32 h-1 bg-white/5" />
                            <div className="w-24 h-1 bg-white/5" />
                            <div className="w-40 h-1 bg-white/5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Play Button Overlay */}
                    <button
                      onClick={() => setVideoPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/40 transition-colors z-20"
                    >
                      <div className="w-20 h-20 bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
                        <Play className="w-8 h-8 text-white ml-1 fill-white" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    {currentVideo && (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted={isMuted}
                        className="w-full h-full object-contain"
                        onEnded={handleVideoEnd}
                      >
                        <source src={currentVideo} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    <div className="absolute bottom-6 right-6 flex items-center gap-4 z-30">
                      <button 
                        onClick={toggleMute}
                        className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        {isMuted ? 'UNMUTE_SYSTEM' : 'MUTE_SYSTEM'}
                      </button>
                      <button 
                        onClick={() => setVideoPlaying(false)}
                        className="px-4 py-2 bg-black/50 hover:bg-black/80 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        EXIT_DEMO
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Bar */}
              <div className="flex items-center justify-between px-6 py-3 bg-[#050505] border-t border-white/5">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">3_NODES_CONNECTED</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-500/50">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest">VOICE_LINK_ACTIVE</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600/20 border border-blue-600/30" />
                  <div className="w-6 h-6 bg-blue-600/40 border border-blue-600/50 -ml-1" />
                  <div className="w-6 h-6 bg-blue-600/60 border border-blue-600/70 -ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="max-w-6xl mx-auto mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5">
            {tools.map((tool, i) => (
              <div
                key={i}
                className="bg-black p-8 hover:bg-blue-600/5 transition-all duration-300 group"
              >
                <tool.icon className="w-6 h-6 text-slate-700 group-hover:text-blue-500 transition-colors mb-6" />
                <h3 className="font-black text-white text-[10px] uppercase tracking-[0.2em] mb-2">{tool.label}</h3>
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 uppercase tracking-tight">
              CORE_SYSTEM_
              <span className="text-blue-600">
                CAPABILITIES
              </span>
            </h2>
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] max-w-xl mx-auto">
              POWERFUL_MODULES_DESIGNED_FOR_ELITE_ENGINEERING_TEAMS.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-white/5 border border-white/5">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`relative bg-black p-12 hover:bg-blue-600/[0.02] transition-all duration-500 group`}
              >
                <div className={`w-12 h-12 bg-white/5 flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors`}>
                  <feature.icon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </div>
                <h3 className="text-xs font-black text-white mb-4 uppercase tracking-[0.2em]">{feature.title}</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] leading-loose">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-blue-600 p-16 lg:p-24 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            <div className="relative z-10">
              <Zap className="w-10 h-10 text-white mx-auto mb-8 animate-pulse" />
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 uppercase tracking-tighter">
                READY_TO_UPGRADE?
              </h2>
              <p className="text-blue-100 font-black text-[10px] uppercase tracking-[0.2em] mb-12 max-w-md mx-auto leading-relaxed">
                JOIN_THE_ELITE_NETWORK_OF_DEVELOPERS_USING_LIVEDESK_FOR_MISSION_CRITICAL_COLLABORATION.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-4 px-12 py-5 bg-white text-black font-black rounded-none uppercase tracking-widest text-xs shadow-2xl hover:bg-blue-50 transition-all duration-300"
              >
                EXECUTE_REGISTRATION
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[8px] text-blue-200 mt-8 font-black uppercase tracking-[0.3em]">
                NO_CREDIT_CARD_REQUIRED // INSTANT_ACCESS
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-32 bg-black">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <Logo className="w-8 h-8" textClassName="text-lg" />
            
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em]">
              BUILT_FOR_TEAMS_THAT_COMMAND_THE_CODEBASE.
            </p>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Shield className="w-3 h-3 text-slate-800" />
                <span className="text-[8px] text-slate-800 font-black uppercase tracking-widest">
                  ENCRYPTED_PRIVATE
                </span>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <p className="text-[8px] text-slate-800 font-black uppercase tracking-[0.5em]">
              LIVEDESK_SYSTEM_TERMINAL &copy; 2026 // ALL_RIGHTS_RESERVED
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
