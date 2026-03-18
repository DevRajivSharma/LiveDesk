import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocketContext } from '../contexts/SocketContext'

function RoomManager() {
  const [roomId, setRoomId] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const { isConnected } = useSocketContext()
  const navigate = useNavigate()

  // Create a new room
  const handleCreateRoom = async () => {
    try {
      const response = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
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

    if (!roomId.trim()) {
      alert('Please enter a Room ID')
      return
    }

    setIsJoining(true)

    try {
      // Verify room exists
      const response = await fetch(`/api/room/${roomId.trim()}`)

      if (!response.ok) {
        alert('Room not found. Please check the Room ID.')
        setIsJoining(false)
        return
      }

      navigate(`/room/${roomId.trim()}`)
    } catch (error) {
      console.error('Error joining room:', error)
      alert('Failed to join room. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pulse">
          <p className="text-red-400 text-xs font-black uppercase tracking-widest text-center">
            ⚠️ Offline: Reconnecting...
          </p>
        </div>
      )}

      <div className="bg-[#141414] rounded-[2.5rem] shadow-2xl p-10 border border-white/5 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">
            Collaborate
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
            Elite Multi-User Workspace
          </p>
        </div>

        {/* Create Room Button */}
        <button
          onClick={handleCreateRoom}
          disabled={!isConnected}
          className="w-full py-5 px-6 bg-white text-black hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 font-black rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-3"
        >
          <span className="text-xl">✨</span>
          Create New Room
        </button>

        {/* Divider */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-6 bg-[#141414] text-slate-600 font-black uppercase tracking-widest">or</span>
          </div>
        </div>

        {/* Join Room Form */}
        <form onSubmit={handleJoinRoom} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
              Access Code
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="xxxx-xxxx-xxxx"
              className="w-full px-6 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all duration-300 font-mono text-center tracking-widest uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={!isConnected || isJoining || !roomId.trim()}
            className="w-full py-5 px-6 bg-[#1a1a1a] border border-white/5 hover:bg-[#222] hover:border-white/10 disabled:bg-slate-900 disabled:text-slate-700 text-white font-black rounded-2xl transition-all duration-300 active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3"
          >
            {isJoining ? 'Verifying...' : (
              <>
                <span className="text-xl">🚀</span>
                Join Session
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RoomManager