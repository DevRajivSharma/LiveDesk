import { useState, useCallback } from 'react'
import UserModal from './UserModal'
import { useSocketContext } from '../contexts/SocketContext'
import { Code2, PenTool, Split, Settings, Play, LogOut, Share2, X, Menu, Terminal } from 'lucide-react'

function Toolbar({ roomId, onViewChange, currentView, language, onOpenSidebar, onOpenMenu }) {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [showCopyMenu, setShowCopyMenu] = useState(false)
  const { users } = useSocketContext()

  // Copy room info
  const handleCopy = useCallback((type) => {
    let text = roomId;
    let message = 'Room ID copied!';
    
    if (type === 'url') {
      text = `${window.location.origin}/room/${roomId}`;
      message = 'Room URL copied!';
    }
    
    navigator.clipboard.writeText(text);
    setShowCopyMenu(false);
    
    // Custom toast-like alert would be better, but for now:
    alert(message);
  }, [roomId])

  // Leave room
  const handleLeave = useCallback(() => {
    if (confirm('Are you sure you want to leave this room?')) {
      window.location.href = '/home'
    }
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
      {/* Left: View Toggle & Menu */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenMenu}
          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white group"
          title="Open Tools Menu"
        >
          <Menu className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => onViewChange?.('code')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${
              currentView === 'code'
                ? 'bg-white text-black shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Code2 className="w-3 h-3" />
            Editor
          </button>
          <button
            onClick={() => onViewChange?.('whiteboard')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${
              currentView === 'whiteboard'
                ? 'bg-white text-black shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <PenTool className="w-3 h-3" />
            Whiteboard
          </button>
          <button
            onClick={() => onViewChange?.('both')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${
              currentView === 'both'
                ? 'bg-white text-black shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Split className="w-3 h-3" />
            Split
          </button>
        </div>
      </div>

      {/* Center: Room Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 group relative">
          <div className="flex flex-col items-end pr-3 border-r border-white/5">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Room Session</span>
            <span className="text-xs font-black text-white tracking-tight">{roomId}</span>
          </div>

          <button
            onClick={() => setShowCopyMenu(!showCopyMenu)}
            className="pl-3 text-slate-500 hover:text-white transition-colors"
            title="Share Room"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Copy Dropdown */}
          {showCopyMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowCopyMenu(false)}
              />
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                <button
                  onClick={() => handleCopy('id')}
                  className="w-full px-5 py-4 text-left hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                    <span className="text-[10px] font-black italic">ID</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-white uppercase tracking-widest">Copy ID</span>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Unique Room Code</span>
                  </div>
                </button>
                <button
                  onClick={() => handleCopy('url')}
                  className="w-full px-5 py-4 text-left hover:bg-white/5 flex items-center gap-3 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-white uppercase tracking-widest">Copy URL</span>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Full Invite Link</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Run Code Button (Opens Terminal in Drawer) */}
        <button
          onClick={onOpenMenu}
          disabled={currentView === 'whiteboard'}
          className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
        >
          <Terminal className="w-4 h-4" />
          Terminal
        </button>

        {/* Management Sidebar Toggle */}
        <button
          onClick={onOpenSidebar}
          className="relative flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] text-slate-200 text-sm font-bold rounded-xl transition-all border border-white/5 active:scale-95 group shadow-lg"
          title="Room Management"
        >
          <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span className="hidden sm:inline">Settings</span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500 border-2 border-[#111]"></span>
          </span>
        </button>

        {/* Leave Room */}
        <button
          onClick={handleLeave}
          className="px-4 py-1.5 text-red-400 hover:bg-red-900/20 text-sm font-bold rounded-lg transition-all flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Leave
        </button>
      </div>

      {/* Online Users Modal */}
      <UserModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
      />
    </div>
  )
}

export default Toolbar