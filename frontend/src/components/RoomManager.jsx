import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocketContext } from '../contexts/SocketContext'
import { Plus, Rocket, Shield, Activity, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast';

function RoomManager() {
  const [roomId, setRoomId] = useState('')
  const [roomName, setRoomName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const { isConnected } = useSocketContext()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const navigate = useNavigate()

  // Create a new room
  const handleCreateRoom = async () => {
    try {
      const response = await fetch(`${API_URL}/api/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName.trim() || 'Unnamed Session' })
      })
      const data = await response.json()

      if (data.roomId) {
        navigate(`/room/${data.roomId}`)
      }
    } catch (error) {
      console.error('Error creating room:', error)
    }
  }

  // Join existing room
  const handleJoinRoom = async (e) => {
    e.preventDefault()
    if (!roomId.trim()) return
    setIsJoining(true)

    try {
      const response = await fetch(`${API_URL}/api/room/${roomId.trim()}`)
      if (!response.ok) {
        toast.error('CRITICAL_ERROR: Session not found in database.')
        setIsJoining(false)
        return
      }
      navigate(`/room/${roomId.trim()}`)
    } catch (error) {
      console.error('Error joining room:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const handleCopyId = () => {
    if (!roomId) return
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full bg-[#0a0a0a] text-slate-200 font-sans p-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-10 p-4 bg-red-600 text-white flex items-center justify-center gap-3">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Offline: Attempting Reconnection</span>
        </div>
      )}

      <div className="space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
            <h1 className="text-sm font-black text-white uppercase tracking-[0.4em]">Session Manager</h1>
          </div>
          <Shield className="w-5 h-5 text-slate-700" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Create Section */}
          <div className="flex flex-col">
            <div className="space-y-3 mb-10">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Initialize Session</h3>
              <p className="text-[9px] text-slate-700 uppercase tracking-widest leading-relaxed h-8">Create a new encrypted collaborative environment.</p>
            </div>

            <div className="space-y-6 mt-auto">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Session Identifier (Optional)</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. CORE_SPRINT_01"
                  className="w-full h-14 px-6 bg-black/40 border border-white/10 text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-600 transition-all font-mono text-xs"
                />
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={!isConnected}
                className="w-full h-16 bg-white text-black hover:bg-blue-600 hover:text-white disabled:bg-slate-900 disabled:text-slate-700 font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] shadow-xl"
              >
                <Plus className="" />
                Create New 
              </button>
            </div>
          </div>

          {/* Join Section */}
          <div className="flex flex-col">
            <div className="space-y-3 mb-10">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Join Protocol</h3>
              <p className="text-[9px] text-slate-700 uppercase tracking-widest leading-relaxed h-8">Enter an existing session hash to synchronize.</p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-6 mt-auto">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Session Hash (ID)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="xxxx-xxxx-xxxx"
                    className="w-full h-14 px-6 bg-black/40 border border-white/10 text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-600 transition-all font-mono text-xs uppercase tracking-widest"
                  />
                  {roomId && (
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isConnected || isJoining || !roomId.trim()}
                className="w-full h-16 bg-black/60 border border-white/10 hover:bg-blue-600 hover:text-white disabled:bg-slate-900 disabled:text-slate-700 text-white font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
              >
                {isJoining ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                     Join
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomManager
