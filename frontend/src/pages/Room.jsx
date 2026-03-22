import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocketContext } from '../contexts/SocketContext'
import CodeEditor from '../components/CodeEditor'
import Whiteboard from '../components/Whiteboard'
import Toolbar from '../components/Toolbar'
import Cursors from '../components/Cursors'
import Sidebar from '../components/Sidebar'
import Loading from '../components/Loading'
import MenuDrawer from '../components/MenuDrawer'
import { 
  Code2, PenTool, Split, Terminal, FolderOpen, Bookmark, 
  StickyNote, Settings, LogOut as LogOutIcon, ChevronLeft, Menu,
  Home as HomeIcon, Play, X, Trash2, ChevronDown, User, Share2, LayoutGrid
} from 'lucide-react'
import toast from 'react-hot-toast';

function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()

  const {
    socket,
    isConnected,
    roomState,
    currentUser,
    joinRoom,
    leaveRoom,
    emitMouseMove
  } = useSocketContext()

  const [viewMode, setViewMode] = useState('split'); // 'editor', 'whiteboard', 'split'
  const [modalTab, setModalTab] = useState(null); // 'notes', 'files', 'snippets'
  const [language, setLanguage] = useState('javascript')
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentCode, setCurrentCode] = useState('// Start coding here')
  const [currentWhiteboardData, setCurrentWhiteboardData] = useState(null)
  const [terminalOutput, setTerminalOutput] = useState([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [roomSettings, setRoomSettings] = useState({
    adminId: null,
    lockEditor: false,
    lockWhiteboard: false,
    lockMic: false,
    muteAll: false
  })
  const hasJoinedRef = useRef(false)

  const handleSaveSession = (type) => {
    const name = sessionName.trim() || `room_${roomId}_${new Date().getTime()}`;
    if (type === 'both') {
      window.dispatchEvent(new CustomEvent('livedesk-snap-full', { detail: { name } }));
    } else if (type === 'editor') {
      window.dispatchEvent(new CustomEvent('livedesk-snap-editor', { detail: { name } }));
    } else if (type === 'whiteboard') {
      window.dispatchEvent(new CustomEvent('livedesk-snap-board', { detail: { name } }));
    }
    setSessionName('');
    toast.success(`SESSION_COMMIT: Room data bundle stored in repository.`);
  };
  const currentUserRef = useRef(currentUser)

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  const handleLoadCode = (e) => {
    setCurrentCode(e.detail.code);
    // Socket will naturally sync this to others if the logic is in CodeEditor or here
  };

  const handleLoadWhiteboard = (e) => {
    setCurrentWhiteboardData(e.detail.data);
  };

  useEffect(() => {
    const handleSnapEditor = async (e) => {
      const { name } = e.detail;
      const fileName = `${name}.js`;
      const fileData = {
        name: fileName,
        type: 'text/plain',
        size: currentCode.length,
        content: currentCode,
        roomId,
        isSnapshot: true,
        timestamp: new Date().toISOString()
      };

      const token = localStorage.getItem('livedesk-token');
      if (token) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
          await fetch(`${apiUrl}/api/files`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fileData)
          });
        } catch (err) {
          console.error('Error saving snapshot to backend:', err);
        }
      }

      const files = JSON.parse(localStorage.getItem(`livedesk-files-${roomId}`) || '[]');
      localStorage.setItem(`livedesk-files-${roomId}`, JSON.stringify([fileData, ...files]));
      window.dispatchEvent(new CustomEvent('livedesk-files-updated'));
    };

    const handleSnapBoard = async (e) => {
      const { name } = e.detail;
      if (!currentWhiteboardData) return;
      const fileName = `${name}.excalidraw`;
      const fileData = {
        name: fileName,
        type: 'application/json',
        size: JSON.stringify(currentWhiteboardData).length,
        content: JSON.stringify(currentWhiteboardData),
        roomId,
        isBoardSnapshot: true,
        timestamp: new Date().toISOString()
      };

      const token = localStorage.getItem('livedesk-token');
      if (token) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
          await fetch(`${apiUrl}/api/files`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fileData)
          });
        } catch (err) {
          console.error('Error saving board snapshot to backend:', err);
        }
      }

      const files = JSON.parse(localStorage.getItem(`livedesk-files-${roomId}`) || '[]');
      localStorage.setItem(`livedesk-files-${roomId}`, JSON.stringify([fileData, ...files]));
      window.dispatchEvent(new CustomEvent('livedesk-files-updated'));
    };

    const handleSnapFull = async (e) => {
      const { name } = e.detail;
      const fileName = `${name}.livedesk`;
      const sessionData = {
        code: currentCode,
        language: language,
        whiteboardData: currentWhiteboardData
      };
      const fileData = {
        name: fileName,
        type: 'application/json',
        size: JSON.stringify(sessionData).length,
        content: JSON.stringify(sessionData),
        roomId,
        isFullSnapshot: true,
        timestamp: new Date().toISOString()
      };

      const token = localStorage.getItem('livedesk-token');
      if (token) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
          await fetch(`${apiUrl}/api/files`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fileData)
          });
        } catch (err) {
          console.error('Error saving full snapshot to backend:', err);
        }
      }

      const files = JSON.parse(localStorage.getItem(`livedesk-files-${roomId}`) || '[]');
      localStorage.setItem(`livedesk-files-${roomId}`, JSON.stringify([fileData, ...files]));
      window.dispatchEvent(new CustomEvent('livedesk-files-updated'));
    };

    window.addEventListener('livedesk-snap-editor', handleSnapEditor);
    window.addEventListener('livedesk-snap-board', handleSnapBoard);
    window.addEventListener('livedesk-snap-full', handleSnapFull);
    window.addEventListener('livedesk-load-code', handleLoadCode);
    window.addEventListener('livedesk-load-whiteboard', handleLoadWhiteboard);
    return () => {
      window.removeEventListener('livedesk-snap-editor', handleSnapEditor);
      window.removeEventListener('livedesk-snap-board', handleSnapBoard);
      window.removeEventListener('livedesk-snap-full', handleSnapFull);
      window.removeEventListener('livedesk-load-code', handleLoadCode);
      window.removeEventListener('livedesk-load-whiteboard', handleLoadWhiteboard);
    };
  }, [roomId, currentCode, currentWhiteboardData]);

  // Handle mobile responsiveness and window resizing
  useEffect(() => {
    if (!roomId || !isConnected) return
    localStorage.setItem('livedesk-active-room', roomId);
    const handleMouseMove = (e) => {
      const now = Date.now()
      if (now - (window._lastMouseMove || 0) > 50) {
        emitMouseMove(roomId, e.clientX, e.clientY)
        window._lastMouseMove = now
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [roomId, isConnected, emitMouseMove])

  useEffect(() => {
    if (!roomId || !socket || !isConnected) return
    socket.on('room-settings-sync', (newSettings) => setRoomSettings(prev => ({ ...prev, ...newSettings })));
    socket.on('user-kicked', ({ targetUserId }) => {
      if (targetUserId === currentUserRef.current?.id) {
        alert('You have been removed from the room.');
        navigate('/home');
      }
    });
    socket.on('room-terminated', () => {
      alert('Session terminated by host.');
      navigate('/home');
    });

    if (!hasJoinedRef.current) {
      const userStr = localStorage.getItem('livedesk-user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) { navigate('/login'); return; }
      joinRoom(roomId, user.username || 'Anonymous', user.id || user._id);
      setIsLoading(false);
      hasJoinedRef.current = true;
    }

    return () => {
      socket.off('room-settings-sync');
      socket.off('user-kicked');
      socket.off('room-terminated');
      leaveRoom(roomId)
    }
  }, [roomId, socket, isConnected])

  useEffect(() => {
    if (roomState) {
      if (roomState.language) setLanguage(roomState.language);
      if (roomState.adminId) setRoomSettings(prev => ({ ...prev, adminId: roomState.adminId }));
      if (roomState.settings) setRoomSettings(prev => ({ ...prev, ...roomState.settings }));
      if (roomState.code) setCurrentCode(roomState.code);
    }
  }, [roomState])

  const handleRunCode = async () => {
    if (!currentCode || isExecuting) return
    setIsExecuting(true);
    const timestamp = new Date().toLocaleTimeString()
    setTerminalOutput(prev => [...prev, { type: 'command', text: `$ run ${language} script`, time: timestamp }])

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode, language, roomId })
      })
      const result = await response.json()
      if (result.error) {
        setTerminalOutput(prev => [...prev, { type: 'error', text: result.error, time: new Date().toLocaleTimeString() }])
      } else {
        const lines = result.output ? result.output.split('\n') : ['Execution finished (no output)']
        lines.forEach(line => setTerminalOutput(prev => [...prev, { type: 'output', text: line, time: new Date().toLocaleTimeString() }]))
      }
    } catch (err) {
      setTerminalOutput(prev => [...prev, { type: 'error', text: err.message, time: new Date().toLocaleTimeString() }])
    } finally {
      setIsExecuting(false)
    }
  }

  if (!isConnected || isLoading) {
    return <Loading message={!isConnected ? "Connecting..." : `Joining ${roomId}...`} />
  }

  const user = JSON.parse(localStorage.getItem('livedesk-user') || '{}');

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-slate-200 overflow-hidden font-sans">
      <Cursors />

      {/* 1. Top Navigation - Sharp Edges */}
      <nav className="flex items-center justify-between px-6 py-2 bg-[#0a0a0a] border-b border-white/10 z-50 h-14">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg italic">R</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white tracking-tighter uppercase leading-none block">Room Session</span>
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] block mt-0.5">{roomId}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 h-full">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Share Protocol:</span>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 group cursor-pointer hover:bg-white/10 transition-all" onClick={() => {
              navigator.clipboard.writeText(roomId);
              toast.success('Session ID copied to clipboard');
            }}>
              <span className="text-[10px] font-mono text-blue-400 font-bold">{roomId}</span>
              <Share2 className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          <button 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <HomeIcon className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Thin Sidebar - Sharp Edges */}
        <aside className="w-16 bg-[#0a0a0a] border-r border-white/10 flex flex-col items-center py-6 shadow-2xl">
          <div className="flex-1 flex flex-col gap-4 w-full">
            {[
              { id: 'dashboard', label: 'Home', icon: HomeIcon },
              { id: 'notes', label: 'Notes', icon: StickyNote },
              { id: 'files', label: 'Files', icon: FolderOpen },
              { id: 'snippets', label: 'Library', icon: Bookmark },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard') { setModalTab(null); setViewMode('split'); }
                  else setModalTab(item.id);
                }}
                className={`w-full flex flex-col items-center gap-1 py-3 transition-all duration-300 group relative ${
                  modalTab === item.id 
                    ? 'text-blue-400' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                {modalTab === item.id && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500" />}
                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110`} />
                <span className="text-[7px] font-black uppercase tracking-tighter mt-1">{item.label}</span>
              </button>
            ))}
          </div>

          {/* User Icon in Sidebar */}
          <div className="mt-auto flex flex-col gap-4 w-full px-3">
            <button 
              onClick={() => window.open('/profile', '_blank')}
              className="w-full aspect-square bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs hover:bg-blue-500 hover:text-white transition-all"
              title={user.username}
            >
              {user.username?.charAt(0).toUpperCase()}
            </button>
          </div>
        </aside>

        {/* 3. Main Workspace Area - Sharp Edges */}
        <main className="flex-1 bg-[#0a0a0a] flex flex-col relative overflow-hidden">
          
          {/* Main Container Header with View Toggles */}
          <div className="px-6 py-2 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Session View</span>
              </div>
              <div className="h-4 w-[1px] bg-white/10 mx-2" />
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="SESSION_ID..."
                  className="bg-black/40 border border-white/10 px-3 py-1 text-[9px] font-mono text-white focus:outline-none focus:border-blue-500 w-32"
                />
                <div className="flex border border-white/10 bg-black/60 p-0.5">
                  <button onClick={() => handleSaveSession('editor')} className="px-3 py-1 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all">Save Code</button>
                  <button onClick={() => handleSaveSession('whiteboard')} className="px-3 py-1 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all border-l border-white/10">Save Board</button>
                  <button onClick={() => handleSaveSession('both')} className="px-3 py-1 text-[8px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all border-l border-white/10">Save All</button>
                </div>
              </div>
            </div>

            {/* View Toggles */}
            <div className="flex bg-black/60 border border-white/10 p-0.5 shadow-inner">
              {[
                { id: 'editor', label: 'Editor', icon: Code2 },
                { id: 'whiteboard', label: 'Whiteboard', icon: PenTool },
                { id: 'split', label: 'Split', icon: Split },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                    viewMode === mode.id 
                      ? 'bg-white text-black' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <mode.icon className="w-3 h-3" />
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
              >
                <Settings className="w-3.5 h-3.5" />
                Room settings
              </button>
              <button 
                onClick={() => { if(confirm('TERMINATE_SESSION: Are you sure?')) { localStorage.removeItem('livedesk-active-room'); navigate('/home'); } }}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
                Leave Room
              </button>
            </div>
          </div>

          {/* Content Container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Section */}
            {(viewMode === 'editor' || viewMode === 'split') && (
              <div className="flex flex-col h-full overflow-hidden" style={{ width: viewMode === 'split' ? '50%' : '100%' }}>
                <div className="flex-1 min-h-0">
                  <CodeEditor
                    roomId={roomId}
                    onLanguageChange={setLanguage}
                    onCodeChange={setCurrentCode}
                    externalLanguage={language}
                    isLocked={roomSettings.lockEditor && roomSettings.adminId !== currentUser?.id}
                    onRun={handleRunCode}
                    isExecuting={isExecuting}
                  />
                </div>
                
                {/* Integrated Terminal below Editor */}
                <div className="h-64 border-t border-white/10 bg-black/60 flex flex-col">
                  <div className="px-6 py-2 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">System Terminal</span>
                    </div>
                    <button onClick={() => setTerminalOutput([])} className="p-1.5 hover:bg-white/5 text-slate-600 hover:text-white transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 p-6 font-mono text-[11px] overflow-y-auto custom-scrollbar">
                    {terminalOutput.length === 0 ? (
                      <p className="text-slate-700 italic">No output yet...</p>
                    ) : (
                      terminalOutput.map((line, i) => (
                        <div key={i} className={`mb-1.5 leading-relaxed ${line.type === 'error' ? 'text-red-400' : line.type === 'command' ? 'text-blue-400' : 'text-slate-300'}`}>
                          <span className="text-slate-600 mr-3 text-[9px]">[{line.time}]</span>
                          {line.text}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'split' && <div className="w-[1px] h-full bg-white/10" />}

            {/* Whiteboard Section */}
            {(viewMode === 'whiteboard' || viewMode === 'split') && (
              <div className="h-full overflow-hidden" style={{ width: viewMode === 'split' ? '50%' : '100%' }}>
                <Whiteboard
                  roomId={roomId}
                  onChange={setCurrentWhiteboardData}
                  isLocked={roomSettings.lockWhiteboard && roomSettings.adminId !== currentUser?.id}
                />
              </div>
            )}
          </div>

          {/* Modal Overlay for Sidebar Tools */}
          {modalTab && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-12 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-5xl h-full bg-[#0a0a0a] border border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
                <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">
                      {modalTab} System / Interface
                    </h2>
                  </div>
                  <button 
                    onClick={() => setModalTab(null)} 
                    className="group flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-all"
                  >
                    <span className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest transition-colors">Close Portal</span>
                    <X className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MenuDrawer 
                    isOpen={true} 
                    inline={true}
                    onClose={() => setModalTab(null)} 
                    roomId={roomId}
                    activeTab={modalTab}
                    onTabChange={setModalTab}
                    code={currentCode}
                    whiteboardData={currentWhiteboardData}
                    language={language}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        roomId={roomId}
        settings={roomSettings}
        onSettingsChange={setRoomSettings}
      />
    </div>
  )
}

export default Room