import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import RoomManager from '../components/RoomManager'
import CodeEditor from '../components/CodeEditor'
import Whiteboard from '../components/Whiteboard'

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('livedesk-user') || '{}');
  const [showRoomManager, setShowRoomManager] = useState(false);
  const [viewMode, setViewMode] = useState('both');
  const [splitPosition, setSplitPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('livedesk-token');
    localStorage.removeItem('livedesk-user');
    localStorage.removeItem('livedesk-username');
    navigate('/login');
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const handleMouseMove = (moveEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newX = moveEvent.clientX - containerRect.left;
        const newPosition = (newX / containerRect.width) * 100;
        if (newPosition >= 15 && newPosition <= 85) {
          setSplitPosition(newPosition);
        }
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-slate-200 overflow-hidden font-sans">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[#111] border-b border-white/5 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/10">
              <span className="text-white font-black text-xl">L</span>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tighter uppercase">LiveDesk</span>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] block">Personal Space</span>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-white/5 mx-2" />
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
            <button 
              onClick={() => setViewMode('code')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'code' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Code
            </button>
            <button 
              onClick={() => setViewMode('whiteboard')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'whiteboard' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Board
            </button>
            <button 
              onClick={() => setViewMode('both')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'both' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Split
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowRoomManager(true)}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-[11px] font-black rounded-xl transition-all shadow-lg shadow-primary-500/20 uppercase tracking-widest active:scale-95"
          >
            Collaborate
          </button>
          <div className="h-6 w-[1px] bg-white/5 mx-2" />
          <div className="flex items-center gap-3 px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 font-black text-xs">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{user.username}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </nav>

      {/* Workspace Area */}
      <main ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Personal Code Editor */}
        {(viewMode === 'code' || viewMode === 'both') && (
          <div
            className="h-full overflow-hidden"
            style={{ width: viewMode === 'both' ? `${splitPosition}%` : '100%' }}
          >
            <CodeEditor roomId="personal" />
          </div>
        )}

        {/* Resizer */}
        {viewMode === 'both' && (
          <div
            onMouseDown={handleResizeStart}
            className={`w-1 h-full z-10 cursor-col-resize flex items-center justify-center transition-colors ${isResizing ? 'bg-primary-500' : 'bg-white/5 hover:bg-white/10'}`}
          >
            <div className="w-[1px] h-8 bg-white/10" />
          </div>
        )}

        {/* Personal Whiteboard */}
        {(viewMode === 'whiteboard' || viewMode === 'both') && (
          <div
            className="h-full overflow-hidden"
            style={{ width: viewMode === 'both' ? `${100 - splitPosition}%` : '100%' }}
          >
            <Whiteboard roomId="personal" />
          </div>
        )}

        {/* Room Manager Modal Overlay */}
        {showRoomManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setShowRoomManager(false)} 
            />
            <div className="relative w-full max-w-md animate-in zoom-in duration-300">
              <button 
                onClick={() => setShowRoomManager(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-[#1a1a1a] border border-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white z-[110] shadow-2xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <RoomManager />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home