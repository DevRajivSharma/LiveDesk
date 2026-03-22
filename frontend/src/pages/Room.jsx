import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocketContext } from '../contexts/SocketContext'
import CodeEditor from '../components/CodeEditor'
import Whiteboard from '../components/Whiteboard'
import Toolbar from '../components/Toolbar'
import Cursors from '../components/Cursors'
import Sidebar from '../components/Sidebar'
import Loading from '../components/Loading'
import { Code2, PenTool } from 'lucide-react'

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

  const [viewMode, setViewMode] = useState('both') // 'code', 'whiteboard', 'both'
  const [language, setLanguage] = useState('javascript')
  const [isLoading, setIsLoading] = useState(true)
  const [splitPosition, setSplitPosition] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [roomSettings, setRoomSettings] = useState({
    adminId: null,
    lockEditor: false,
    lockWhiteboard: false,
    lockMic: false,
    muteAll: false
  })
  const containerRef = useRef(null)
  const isResizingRef = useRef(false)
  const hasJoinedRef = useRef(false)
  const currentUserRef = useRef(currentUser)

  // Sync ref with state
  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  // Track mouse movement for cursors and resizing
  useEffect(() => {
    if (!roomId || !isConnected) return

    const handleMouseMove = (e) => {
      // Handle split resizing with the ref for stability
      if (isResizingRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const newX = e.clientX - containerRect.left
        const newPosition = (newX / containerRect.width) * 100
        
        // Clamp between 15% and 85% for better usability
        if (newPosition >= 15 && newPosition <= 85) {
          setSplitPosition(newPosition)
        }
        return
      }

      // Throttle mouse move events for cursors
      const now = Date.now()
      if (now - (window._lastMouseMove || 0) > 50) {
        emitMouseMove(roomId, e.clientX, e.clientY)
        window._lastMouseMove = now
      }
    }

    const handleMouseUp = () => {
      isResizingRef.current = false
      setIsResizing(false)
      document.body.style.cursor = 'default'
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [roomId, isConnected, emitMouseMove])

  // Handle resizing start
  const handleResizeStart = (e) => {
    e.preventDefault()
    isResizingRef.current = true
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
  }

  // Join room on mount
  useEffect(() => {
    if (!roomId || !socket || !isConnected) return

    // Listen for room settings sync
    socket.on('room-settings-sync', (newSettings) => {
      setRoomSettings(prev => ({ ...prev, ...newSettings }));
    });

    // Listen for kicks
    socket.on('user-kicked', ({ targetUserId }) => {
      if (targetUserId === currentUserRef.current?.id) {
        alert('You have been removed from the room by the host.');
        navigate('/home');
      }
    });

    // Listen for room termination
    socket.on('room-terminated', () => {
      alert('The session has been terminated by the host.');
      navigate('/home');
    });

    // Use a ref to prevent multiple joins in the same session
    if (!hasJoinedRef.current) {
      // Get user from localStorage
      const userStr = localStorage.getItem('livedesk-user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user) {
        console.error('❌ User not found in localStorage. Redirecting to login.');
        navigate('/login');
        return;
      }

      const userName = user.username || 'Anonymous';
      const userId = user.id || user._id; // Support both id and _id

      if (!userId) {
        console.error('❌ User ID not found in localStorage user object.');
        navigate('/login');
        return;
      }

      console.log(`🔑 Joining room ${roomId} as ${userName} (${userId})`);
      joinRoom(roomId, userName, userId);
      setIsLoading(false);
      hasJoinedRef.current = true;
    }

    // Cleanup on unmount
    return () => {
      socket.off('room-settings-sync');
      socket.off('user-kicked');
      socket.off('room-terminated');
      leaveRoom(roomId)
    }
  }, [roomId, socket, isConnected]) // Removed currentUser dependency

  // Set language and settings from synced state
  useEffect(() => {
    if (roomState) {
      if (roomState.language) setLanguage(roomState.language);
      if (roomState.adminId) setRoomSettings(prev => ({ ...prev, adminId: roomState.adminId }));
      if (roomState.settings) setRoomSettings(prev => ({ ...prev, ...roomState.settings }));
    }
  }, [roomState])

  // Handle view change
  const handleViewChange = (view) => {
    if (view === 'both' && viewMode !== 'both') {
      setSplitPosition(50)
    }
    setViewMode(view)
  }

  // Handle language change from CodeEditor
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
  }

  // Redirect if not connected
  if (!isConnected) {
    return <Loading message="Connecting to server..." />
  }

  // Loading state
  if (isLoading) {
    return <Loading message={`Joining room ${roomId}...`} />
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-slate-200 overflow-hidden relative">
      {/* Real-time cursors */}
      <Cursors />

      {/* Toolbar */}
      <Toolbar
        roomId={roomId}
        onViewChange={handleViewChange}
        currentView={viewMode}
        language={language}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Sidebar (Management & Admin) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        roomId={roomId}
        settings={roomSettings}
        onSettingsChange={setRoomSettings}
      />

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className={`flex-1 flex overflow-hidden ${isResizing ? 'select-none' : ''}`}
      >
        {/* Editor / Whiteboard Area */}
        <div className="flex-1 flex relative">
          {/* Overlay to catch mouse events during resize (prevents lag from iframes/editors) */}
          {isResizing && (
            <div className="absolute inset-0 z-[60] cursor-col-resize bg-transparent" />
          )}

          {/* Code Editor Panel */}
          {(viewMode === 'code' || viewMode === 'both') && (
            <div
              className="flex flex-col h-full overflow-hidden"
              style={{
                width: viewMode === 'both' ? `${splitPosition}%` : '100%',
                display: viewMode === 'whiteboard' ? 'none' : 'flex'
              }}
            >
              {viewMode === 'both' && (
                <div className="px-4 py-2 bg-[#111] border-b border-white/5 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Editor
                  </span>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  roomId={roomId}
                  onLanguageChange={handleLanguageChange}
                  externalLanguage={language}
                  isLocked={roomSettings.lockEditor && roomSettings.adminId !== currentUser?.id}
                />
              </div>
            </div>
          )}

          {/* Resizable Divider */}
          {viewMode === 'both' && (
            <div
              onMouseDown={handleResizeStart}
              className={`w-1 h-full z-[70] transition-colors cursor-col-resize flex items-center justify-center group ${
                isResizing ? 'bg-primary-500' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="w-[1px] h-12 bg-white/10 group-hover:bg-white/20 rounded-full"></div>
            </div>
          )}

          {/* Whiteboard Panel */}
          {(viewMode === 'whiteboard' || viewMode === 'both') && (
            <div
              className="flex flex-col h-full overflow-hidden"
              style={{
                width: viewMode === 'both' ? `${100 - splitPosition}%` : '100%',
                display: viewMode === 'code' ? 'none' : 'flex'
              }}
            >
              {viewMode === 'both' && (
                <div className="px-4 py-2 bg-[#111] border-b border-white/5 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-violet-400" />
                    Whiteboard
                  </span>
                </div>
              )}
              <div className="flex-1 overflow-hidden relative">
                <Whiteboard
                  roomId={roomId}
                  isLocked={roomSettings.lockWhiteboard && roomSettings.adminId !== currentUser?.id}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Room