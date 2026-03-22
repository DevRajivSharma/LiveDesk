import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RoomManager from '../components/RoomManager'
import CodeEditor from '../components/CodeEditor'
import Whiteboard from '../components/Whiteboard'
import MenuDrawer from '../components/MenuDrawer'
import { 
  Code2, PenTool, Split, LogOut, User, LayoutGrid, Menu, 
  Terminal, FolderOpen, Bookmark, StickyNote, Settings, LogOut as LogOutIcon,
  Home as HomeIcon, Play, X, Trash2, ChevronDown, Users
} from 'lucide-react'
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('livedesk-user') || '{}');
  const [showRoomManager, setShowRoomManager] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'editor', 'whiteboard', 'split'
  const [modalTab, setModalTab] = useState(null); // 'notes', 'files', 'snippets'
  const [currentCode, setCurrentCode] = useState('// Start coding here');
  const [language, setLanguage] = useState('javascript');
  const [currentWhiteboardData, setCurrentWhiteboardData] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sessionName, setSessionName] = useState('');

  const activeRoomId = localStorage.getItem('livedesk-active-room');

  const handleSaveSession = (type) => {
    const name = sessionName.trim() || `session_${new Date().getTime()}`;
    if (type === 'both') {
      window.dispatchEvent(new CustomEvent('livedesk-snap-full', { detail: { name } }));
    } else if (type === 'editor') {
      window.dispatchEvent(new CustomEvent('livedesk-snap-editor', { detail: { name } }));
    } else if (type === 'whiteboard') {
      window.dispatchEvent(new CustomEvent('livedesk-snap-board', { detail: { name } }));
    }
    setSessionName('');
    toast.success(`SESSION_COMMIT: Data ${type === 'both' ? 'bundle' : 'fragment'} stored in repository.`);
  };

  const handleLoadCode = (e) => {
    setCurrentCode(e.detail.code);
    if (e.detail.language) setLanguage(e.detail.language);
  };

  const handleLoadWhiteboard = (e) => {
    setCurrentWhiteboardData(e.detail.data);
    localStorage.setItem('livedesk-personal-whiteboard', JSON.stringify(e.detail.data));
  };

  useEffect(() => {
    const handleSnapEditor = async (e) => {
      const { name } = e.detail;
      const fileName = `${name}.js`; // Defaulting to js for personal
      const fileData = {
        name: fileName,
        type: 'text/plain',
        size: currentCode.length,
        content: currentCode,
        roomId: 'personal',
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

      const files = JSON.parse(localStorage.getItem('livedesk-files-personal') || '[]');
      localStorage.setItem('livedesk-files-personal', JSON.stringify([fileData, ...files]));
      // Trigger a re-render in MenuDrawer if it's open
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
        roomId: 'personal',
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

      const files = JSON.parse(localStorage.getItem('livedesk-files-personal') || '[]');
      localStorage.setItem('livedesk-files-personal', JSON.stringify([fileData, ...files]));
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
        roomId: 'personal',
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

      const files = JSON.parse(localStorage.getItem('livedesk-files-personal') || '[]');
      localStorage.setItem('livedesk-files-personal', JSON.stringify([fileData, ...files]));
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
  }, [currentCode, currentWhiteboardData]);

  const handleLogout = () => {
    localStorage.removeItem('livedesk-token');
    localStorage.removeItem('livedesk-user');
    localStorage.removeItem('livedesk-username');
    localStorage.removeItem('livedesk-active-room');
    navigate('/');
  };

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
        body: JSON.stringify({ code: currentCode, language: language, roomId: 'personal' })
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

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-slate-200 overflow-hidden font-sans">
      {/* 1. Top Navigation - Sharp Edges */}
      <nav className="flex items-center justify-between px-6 py-2 bg-[#0a0a0a] border-b border-white/10 z-50 h-14 sticky top-0">
        <div className="flex items-center gap-8">
          <Logo className="w-8 h-8" textClassName="text-lg" />
        </div>
        
        <div className="flex items-center gap-6 h-full">
          <button 
            onClick={() => setShowRoomManager(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            Collaborate
          </button>
          
          <div className="h-8 w-[1px] bg-white/10" />

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-1.5 h-10 group cursor-pointer hover:bg-white/10 transition-all" onClick={() => window.open('/profile', '_blank')}>
            <div className="w-6 h-6 bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-[10px]">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{user.username}</span>
            <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-500/5 transition-all"
            title="Exit Session"
          >
            <LogOutIcon className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Thin Sidebar - Sharp Edges */}
        <aside className="w-16 bg-[#0a0a0a] border-r border-white/10 flex flex-col items-center py-6 shadow-2xl">
          <div className="flex-1 flex flex-col gap-4 w-full">
            {[
              { id: 'dashboard', label: 'Home', icon: HomeIcon },
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

            {activeRoomId && (
              <button
                onClick={() => navigate(`/room/${activeRoomId}`)}
                className="w-full flex flex-col items-center gap-1 py-3 text-emerald-500 hover:bg-emerald-500/5 transition-all group border-t border-white/5 mt-2 pt-6"
                title="Active Session"
              >
                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[7px] font-black uppercase tracking-tighter mt-1">In Room</span>
              </button>
            )}
          </div>
        </aside>

        {/* 3. Main Workspace Area - Sharp Edges */}
        <main className="flex-1 bg-[#0a0a0a] flex flex-col relative overflow-hidden">
          
          {/* Main Container Header with View Toggles */}
          <div className="px-6 py-2 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Workspace View</span>
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

            <div className="w-48" /> {/* Spacer to balance header */}
          </div>

          {/* Content Container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Section */}
            {(viewMode === 'editor' || viewMode === 'split') && (
              <div className="flex flex-col h-full overflow-hidden" style={{ width: viewMode === 'split' ? '50%' : '100%' }}>
                <div className="flex-1 min-h-0">
                  <CodeEditor 
                    roomId="personal" 
                    onCodeChange={setCurrentCode} 
                    onLanguageChange={setLanguage}
                    externalLanguage={language}
                    onRun={handleRunCode}
                    isExecuting={isExecuting}
                  />
                </div>
                
                {/* Integrated Terminal below Editor */}
                <div className="h-64 border-t border-white/10 bg-black/60 flex flex-col">
                  <div className="px-6 py-2 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Execution Console</span>
                    </div>
                    <button onClick={() => setTerminalOutput([])} className="p-1.5 hover:bg-white/5 text-slate-600 hover:text-white transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 p-6 font-mono text-[11px] overflow-y-auto custom-scrollbar">
                    {terminalOutput.length === 0 ? (
                      <p className="text-slate-700 italic">Ready for commands...</p>
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
                <Whiteboard roomId="personal" onChange={setCurrentWhiteboardData} />
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
                    roomId="personal"
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

      {/* Room Manager Modal */}
      {showRoomManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 p-1 shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowRoomManager(false)} className="absolute -top-4 -right-4 w-10 h-10 bg-blue-600 flex items-center justify-center text-white z-[110] hover:bg-blue-500 transition-all">
              <X className="w-6 h-6" />
            </button>
            <RoomManager />
          </div>
        </div>
      )}
    </div>
  )
}

export default Home