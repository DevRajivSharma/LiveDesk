import { useState, useCallback } from 'react'
import UserModal from './UserModal'
import { useSocketContext } from '../contexts/SocketContext'

function Toolbar({ roomId, onViewChange, currentView, language, onOpenSidebar }) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [showCopyMenu, setShowCopyMenu] = useState(false)
  const { users } = useSocketContext()

  // Future scope: Code execution with Judge0 API
  const handleRunCode = useCallback(async () => {
    if (isExecuting) return

    setIsExecuting(true)
    setExecutionResult(null)

    try {
      // Get code from Monaco editor
      const codeElement = document.querySelector('.monaco-editor')
      // Note: In production, you'd use a ref to access the editor instance

      // Get code from localStorage as fallback (set by CodeEditor)
      const code = localStorage.getItem(`livedesk-code-${roomId}`) || '// No code found'

      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: language || 'javascript',
          roomId
        })
      })

      const result = await response.json()
      setExecutionResult(result)
    } catch (error) {
      console.error('Execution error:', error)
      setExecutionResult({ error: 'Failed to execute code' })
    } finally {
      setIsExecuting(false)
    }
  }, [roomId, language, isExecuting])

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
      window.location.href = '/'
    }
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
      {/* Left: View Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => onViewChange?.('code')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              currentView === 'code'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            💻 Code
          </button>
          <button
            onClick={() => onViewChange?.('whiteboard')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              currentView === 'whiteboard'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎨 Whiteboard
          </button>
          <button
            onClick={() => onViewChange?.('both')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              currentView === 'both'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⬚ Split
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
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
                    <span className="text-xs font-black">🔗</span>
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
        {/* Management Sidebar Toggle */}
        <button
          onClick={onOpenSidebar}
          className="relative flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] text-slate-200 text-sm font-bold rounded-xl transition-all border border-white/5 active:scale-95 group shadow-lg"
          title="Room Management"
        >
          <span className="text-base group-hover:rotate-12 transition-transform">⚙️</span>
          <span className="hidden sm:inline">Settings</span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500 border-2 border-slate-900"></span>
          </span>
        </button>

        {/* Run Code Button */}
        <button
          onClick={handleRunCode}
          disabled={isExecuting || currentView === 'whiteboard'}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-green-900/20"
        >
          {isExecuting ? (
            <span className="animate-spin text-base">⏳</span>
          ) : (
            <>▶️ Run</>
          )}
        </button>

        {/* Leave Room */}
        <button
          onClick={handleLeave}
          className="px-4 py-1.5 text-red-400 hover:bg-red-900/20 text-sm font-bold rounded-lg transition-all"
        >
          Leave
        </button>
      </div>

      {/* Execution Result Modal */}
      {executionResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Execution Result</h3>
              <button
                onClick={() => setExecutionResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-auto max-h-60">
              {executionResult.output || executionResult.error || 'No output'}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Exit Code: {executionResult.exitCode ?? 'N/A'}</span>
              <span>Time: {executionResult.executionTime || 'N/A'}</span>
            </div>

            {executionResult.note && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ℹ️ {executionResult.note}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Online Users Modal */}
      <UserModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
      />
    </div>
  )
}

export default Toolbar