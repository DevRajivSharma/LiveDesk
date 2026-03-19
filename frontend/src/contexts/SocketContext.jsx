import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

// Socket server URL - defaults to localhost in development
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [roomState, setRoomState] = useState(null)
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [cursors, setCursors] = useState({})
  const [error, setError] = useState(null)
  const [initialized, setInitialized] = useState(false)

  const lastRoomIdRef = useRef(null)
  const lastUserNameRef = useRef(null)

  useEffect(() => {
    try {
      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000
      })

      newSocket.on('connect', () => {
        console.log('🔌 Connected to socket server')
        setIsConnected(true)
        
        // Auto rejoin if we were in a room before disconnect
        if (lastRoomIdRef.current && lastUserNameRef.current) {
          console.log('🔄 Rejoining room after reconnection:', lastRoomIdRef.current)
          newSocket.emit('join-room', { 
            roomId: lastRoomIdRef.current, 
            userName: lastUserNameRef.current 
          })
        }
      })

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from socket server')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message)
        setError(`Connection failed: ${err.message}. Make sure the server is running on port 3001.`)
      })

      // Room state received when joining
      newSocket.on('room-state', (state) => {
        console.log('📦 Room state received:', state)
        setRoomState(state)
        
        // Filter out duplicate users by ID (just in case)
        const uniqueUsers = (state.users || []).filter((user, index, self) => 
          index === self.findIndex((u) => u.id === user.id)
        )
        setUsers(uniqueUsers)

        if (state.userId) {
          setCurrentUser(prev => ({ 
            ...prev, 
            id: state.userId,
            color: state.userColor 
          }))
        }
      })

      // User joined room
      newSocket.on('user-joined', (user) => {
        console.log('👤 User joined:', user)
        setUsers(prev => {
          // Check if user already exists in the list to prevent duplicates
          if (prev.some(u => u.id === user.id)) return prev;
          return [...prev, user]
        })
      })

      // User left room
      newSocket.on('user-left', ({ userId }) => {
        console.log('👋 User left:', userId)
        setUsers(prev => prev.filter(u => u.id !== userId))
        setCursors(prev => {
          const newCursors = { ...prev }
          delete newCursors[userId]
          return newCursors
        })
      })

      // Listen for code updates from other users
      newSocket.on('code-update', ({ code, language, userId }) => {
        console.log('📝 Code update received from:', userId)
        setRoomState(prev => prev ? { ...prev, code, language } : null)
      })

      // Listen for language updates
      newSocket.on('language-update', ({ language }) => {
        console.log('🌐 Language update received:', language)
        setRoomState(prev => prev ? { ...prev, language } : null)
      })

      // Listen for whiteboard sync
      newSocket.on('whiteboard-sync', ({ whiteboardData }) => {
        console.log('🎨 Whiteboard sync received')
        setRoomState(prev => prev ? { ...prev, whiteboardData } : null)
      })

      // Cursor updates
      newSocket.on('cursor-update', (data) => {
        setCursors(prev => ({
          ...prev,
          [data.userId]: data
        }))
      })

      // Mic status update
      newSocket.on('mic-status-update', ({ userId, isMuted }) => {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isMuted } : u
        ))
      })

      setSocket(newSocket)
      setInitialized(true)

      return () => {
        newSocket.close()
      }
    } catch (err) {
      console.error('Socket initialization error:', err)
      setError(err.message)
    }
  }, [])

  const joinedRooms = useRef(new Set())

  // Join a room
  const joinRoom = useCallback((roomId, userName, userId) => {
    if (!socket || !initialized || joinedRooms.current.has(roomId)) return

    joinedRooms.current.add(roomId)
    lastRoomIdRef.current = roomId
    lastUserNameRef.current = userName
    setCurrentUser({ id: userId, name: userName || 'Anonymous' })
    socket.emit('join-room', { roomId, userName, userId })
  }, [socket, initialized])

  // Emit code change
  const emitCodeChange = useCallback((roomId, code, language) => {
    if (!socket || !initialized) return
    socket.emit('code-change', { roomId, code, language })
  }, [socket, initialized])

  // Emit code complete (for DB save)
  const emitCodeComplete = useCallback((roomId, code, language) => {
    if (!socket || !initialized) return
    socket.emit('code-complete', { roomId, code, language })
  }, [socket, initialized])

  // Emit whiteboard update
  const emitWhiteboardUpdate = useCallback((roomId, whiteboardData) => {
    if (!socket || !initialized) return
    socket.emit('whiteboard-update', { roomId, whiteboardData })
  }, [socket, initialized])

  // Emit mouse move
  const emitMouseMove = useCallback((roomId, x, y) => {
    if (!socket || !initialized) return
    socket.emit('mouse-move', { roomId, x, y })
  }, [socket, initialized])

  // Emit language change
  const emitLanguageChange = useCallback((roomId, language) => {
    if (!socket || !initialized) return
    socket.emit('language-change', { roomId, language })
  }, [socket, initialized])

  // Leave room
  const leaveRoom = useCallback((roomId) => {
    if (!socket || !initialized) return
    socket.emit('leave-room', { roomId })
    joinedRooms.current.delete(roomId)
    lastRoomIdRef.current = null
    lastUserNameRef.current = null
    setRoomState(null)
    setUsers([])
  }, [socket, initialized])

  const value = {
    socket,
    isConnected,
    roomState,
    users,
    currentUser,
    cursors,
    error,
    joinRoom,
    emitCodeChange,
    emitCodeComplete,
    emitWhiteboardUpdate,
    emitMouseMove,
    emitLanguageChange,
    leaveRoom,
    setRoomState,
    setUsers
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocketContext() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}