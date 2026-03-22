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
import demo2 from '../videos/LiveDesk_Demo2.mp4'

function Landing() {
  const [currentVideo, setCurrentVideo] = useState(null)
  const videoRef = useRef(null)
  const videoSectionRef = useRef(null)
  const toolsSectionRef = useRef(null)
  const featuresSectionRef = useRef(null)
  const ctaSectionRef = useRef(null)
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
        console.warn("Autoplay was prevented by browser.", err);
      });
    }
  }

  const scrollToSection = (sectionRef) => {
    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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
      <nav className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-12 py-6 border-b border-white/5 bg-black/70 backdrop-blur-md ">
      <div className='mr-10'>
        <Logo className="w-10 h-10" textClassName="text-xl" />
      </div>

        <div className="hidden ml-6 lg:flex items-center gap-3">
          <button
            onClick={() => scrollToSection(videoSectionRef)}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white font-black rounded-none uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            VIEW_PROTOCOL
          </button>
          <button
            onClick={() => scrollToSection(toolsSectionRef)}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white font-black rounded-none uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all duration-300"
          >
            TOOLS
          </button>
          <button
            onClick={() => scrollToSection(featuresSectionRef)}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white font-black rounded-none uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all duration-300"
          >
            FEATURES
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
          >
            AUTH_LOGIN
          </Link>
          <Link
            to="/register"
            className="px-5 py-3 bg-white text-black font-black rounded-none uppercase tracking-widest text-[10px] shadow-xl hover:bg-blue-600 hover:text-white transition-all duration-300"
          >
            INITIALIZE
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
          </div>
        </div>

        {/* Video Container - Sharp & Tech */}
        <div ref={videoSectionRef} className="max-w-6xl mx-auto mb-32">
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
                <div className="absolute inset-0 bg-black">
                  {currentVideo && (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                      onEnded={handleVideoEnd}
                    >
                      <source src={currentVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div ref={toolsSectionRef} className="max-w-6xl mx-auto mb-32">
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
        <div ref={featuresSectionRef} className="max-w-6xl mx-auto mb-32">
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
        <div ref={ctaSectionRef} className="max-w-4xl mx-auto">
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
