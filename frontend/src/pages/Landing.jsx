import { useState } from 'react'
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
  MessageSquare
} from 'lucide-react'

function Landing() {
  const [videoPlaying, setVideoPlaying] = useState(false)

  const features = [
    {
      icon: Code2,
      title: 'Code Editor',
      description: 'Professional Monaco editor with syntax highlighting for 8+ languages. Real-time sync with your team.',
      color: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/20'
    },
    {
      icon: PenTool,
      title: 'Whiteboard',
      description: 'Infinite canvas powered by Excalidraw. Draw, sketch, and brainstorm together in real-time.',
      color: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/20'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Work together seamlessly with multi-user editing, cursors, and presence indicators.',
      color: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/20'
    },
    {
      icon: Mic,
      title: 'Voice Chat',
      description: 'Crystal clear audio communication with WebRTC. No downloads required.',
      color: 'from-rose-500 to-pink-600',
      glow: 'shadow-rose-500/20'
    }
  ]

  const tools = [
    { icon: FileCode, label: 'Multi-language', desc: 'JS, TS, Python & more' },
    { icon: Terminal, label: 'Terminal Ready', desc: 'Full IDE experience' },
    { icon: Layers, label: 'Split View', desc: 'Code & draw together' },
    { icon: MessageSquare, label: 'Real-time Chat', desc: 'Built-in messaging' }
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-600/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[180px]" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-primary-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="text-white font-black text-2xl">L</span>
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">LiveDesk</span>
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em] block">Collaborate & Code</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-8 py-3 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-white/10 hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 lg:px-12 pb-20">
        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto pt-12 lg:pt-20 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Real-time Collaboration Platform
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
            Brainstorm.
            <span className="block bg-gradient-to-r from-primary-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Code Together.
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one platform for remote teams. Combine creative brainstorming with
            professional coding in a single, seamless workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group px-10 py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-2xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
            >
              Start Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-3">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Video Container - Huge & Modern */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 via-blue-600 to-violet-600 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

            {/* Main Container */}
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-6 py-4 bg-[#111] border-b border-white/5">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 mx-6">
                  <div className="max-w-md mx-auto px-4 py-2 bg-[#1a1a1a] rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Globe className="w-4 h-4" />
                      <span className="text-xs font-medium">livedesk.app/workspace</span>
                    </div>
                  </div>
                </div>
                <Monitor className="w-4 h-4 text-slate-600" />
              </div>

              {/* Video/Preview Area */}
              <div className="relative aspect-[16/9] bg-gradient-to-b from-[#0d0d0d] to-[#080808]">
                {!videoPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Mock UI Preview */}
                    <div className="w-full h-full flex">
                      {/* Editor Side */}
                      <div className="w-1/2 border-r border-white/5 bg-[#0f0f0f]">
                        <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Editor</span>
                          </div>
                        </div>
                        <div className="p-4 font-mono text-sm text-slate-400 space-y-2">
                          <div className="flex"><span className="text-slate-600 w-8">1</span><span className="text-blue-400">const</span><span className="text-white"> collab</span><span className="text-slate-300"> = </span><span className="text-amber-400">true</span>;</div>
                          <div className="flex"><span className="text-slate-600 w-8">2</span></div>
                          <div className="flex"><span className="text-slate-600 w-8">3</span><span className="text-white">function</span><span className="text-yellow-300"> brainstorm</span>() {'{'}</div>
                          <div className="flex"><span className="text-slate-600 w-8">4</span><span className="text-white ml-4">return</span><span className="text-violet-400"> </span><span className="text-primary-400">await</span><span className="text-white"> create();</span></div>
                          <div className="flex"><span className="text-slate-600 w-8">5</span>{'}'}</div>
                        </div>
                        {/* Cursors */}
                        <div className="absolute top-16 left-32 flex items-center gap-1 animate-pulse">
                          <div className="w-0.5 h-5 bg-primary-500" />
                          <span className="text-[10px] bg-primary-500 px-1.5 py-0.5 rounded text-white font-bold">You</span>
                        </div>
                        <div className="absolute top-24 left-56 flex items-center gap-1">
                          <div className="w-0.5 h-5 bg-amber-500" />
                          <span className="text-[10px] bg-amber-500 px-1.5 py-0.5 rounded text-white font-bold">Alex</span>
                        </div>
                      </div>

                      {/* Whiteboard Side */}
                      <div className="w-1/2 bg-[#0f0f0f]">
                        <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <PenTool className="w-4 h-4 text-violet-400" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Whiteboard</span>
                          </div>
                        </div>
                        <div className="relative h-full p-4">
                          {/* Mock Drawing */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200">
                            <path d="M50 150 Q100 50 150 100 T250 80 T350 120" stroke="#8b5cf6" strokeWidth="3" fill="none" strokeLinecap="round" />
                            <rect x="180" y="60" width="80" height="50" stroke="#10b981" strokeWidth="2" fill="none" rx="4" />
                            <circle cx="300" cy="100" r="30" stroke="#f59e0b" strokeWidth="2" fill="none" />
                            <text x="80" y="180" fill="#6b7280" fontSize="12" fontFamily="monospace">// Brainstorming session</text>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Play Button Overlay */}
                    <button
                      onClick={() => setVideoPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors"
                    >
                      <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/20">
                        <Play className="w-10 h-10 text-white ml-1" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d]">
                    <p className="text-slate-500">Video player would play here</p>
                  </div>
                )}
              </div>

              {/* Bottom Bar */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#111] border-t border-white/5">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium">3 collaborators</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mic className="w-4 h-4" />
                    <span className="text-xs font-medium">Voice active</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 border-2 border-[#111]" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-[#111] -ml-2" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 border-2 border-[#111] -ml-2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tools.map((tool, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <tool.icon className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors mb-4" />
                <h3 className="font-bold text-white mb-1">{tool.label}</h3>
                <p className="text-xs text-slate-500">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
                collaborate
              </span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Powerful tools designed for modern remote teams. Create, code, and communicate in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`relative bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500 group hover:-translate-y-1 ${feature.glow}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              How it{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                works
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up in seconds. No credit card required.' },
              { step: '02', title: 'Start Workspace', desc: 'Create a room or join an existing session.' },
              { step: '03', title: 'Collaborate', desc: 'Code and brainstorm together in real-time.' }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-black text-white/5 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 via-violet-600 to-blue-600 rounded-[2.5rem] blur-2xl opacity-30" />
            <div className="relative bg-[#111] border border-white/10 rounded-[2rem] p-12 lg:p-16 text-center">
              <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
                Ready to transform your workflow?
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Join thousands of developers and teams who use LiveDesk for real-time collaboration.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-2xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-slate-600 mt-6 font-medium uppercase tracking-wider">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg">L</span>
              </div>
              <span className="text-lg font-black text-white uppercase tracking-tight">LiveDesk</span>
            </div>
            <p className="text-sm text-slate-500">
              Built for teams who dream bigger.
            </p>
            <div className="flex items-center gap-6">
              <Shield className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                Secure & Private
              </span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">
              LiveDesk &copy; 2026. Crafted with precision.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing