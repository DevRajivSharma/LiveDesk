import { useEffect, useRef, useCallback } from 'react'
import { useSocketContext } from '../contexts/SocketContext'

/**
 * Custom hook for socket event handling
 * Provides utilities for listening to specific events
 */
export function useSocketEvent(event, callback) {
  const { socket } = useSocketContext()
  const callbackRef = useRef(callback)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!socket) return

    // Wrap callback to use ref
    const handler = (...args) => {
      callbackRef.current(...args)
    }

    socket.on(event, handler)

    return () => {
      socket.off(event, handler)
    }
  }, [socket, event])
}

/**
 * Hook specifically for code updates from other users
 */
export function useCodeSync(roomId) {
  const { roomState } = useSocketContext()
  
  if (roomId === 'personal') {
    // Return null or personal code from localStorage if we decide to implement persistence later
    return { code: localStorage.getItem('livedesk-personal-code') || '', language: localStorage.getItem('livedesk-personal-lang') || 'javascript' }
  }
  
  return { code: roomState?.code, language: roomState?.language }
}

/**
 * Hook specifically for whiteboard sync
 */
export function useWhiteboardSync(roomId) {
  const { roomState } = useSocketContext()
  
  if (roomId === 'personal') {
    return JSON.parse(localStorage.getItem('livedesk-personal-whiteboard') || 'null')
  }
  
  return roomState?.whiteboardData
}

/**
 * Hook for WebRTC signaling (future scope)
 */
export function useWebRTCSignaling(roomId) {
  const { socket } = useSocketContext()

  const sendOffer = useCallback((targetUserId, offer) => {
    if (!socket || !roomId) return
    socket.emit('webrtc-offer', { roomId, targetUserId, offer, fromUserId: socket.id })
  }, [socket, roomId])

  const sendAnswer = useCallback((targetUserId, answer) => {
    if (!socket || !roomId) return
    socket.emit('webrtc-answer', { roomId, targetUserId, answer, fromUserId: socket.id })
  }, [socket, roomId])

  const sendIceCandidate = useCallback((targetUserId, candidate) => {
    if (!socket || !roomId) return
    socket.emit('webrtc-ice-candidate', { roomId, targetUserId, candidate, fromUserId: socket.id })
  }, [socket, roomId])

  return { sendOffer, sendAnswer, sendIceCandidate }
}

/**
 * Hook for code execution (future scope)
 */
export function useCodeExecution() {
  const executeCode = useCallback(async (code, language, roomId) => {
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, roomId })
      })
      return await response.json()
    } catch (error) {
      console.error('Code execution error:', error)
      return { error: 'Execution failed' }
    }
  }, [])

  return { executeCode }
}

export default useSocketEvent