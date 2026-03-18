import { useState, useEffect, useCallback, useRef } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { useSocketContext } from '../contexts/SocketContext'
import { useWhiteboardSync } from '../hooks/useSocket'

function Whiteboard({ roomId, isLocked }) {
  const { emitWhiteboardUpdate } = useSocketContext()
  const syncedData = useWhiteboardSync(roomId)

  const [excalidrawAPI, setExcalidrawAPI] = useState(null)
  const [files, setFiles] = useState({})

  const debounceTimer = useRef(null)
  const lastProcessedData = useRef(null) // Stores the string of what we last processed (remote or local)
  const isDrawing = useRef(false)

  // Update whiteboard when synced data changes
  useEffect(() => {
    if (!syncedData || !excalidrawAPI) return

    // Don't apply updates while the user is actively drawing/dragging to prevent jumps
    // isDrawing.current is fine here as it will prevent jumps while local interaction is active
    if (isDrawing.current) return;

    try {
      const sceneDataStr = typeof syncedData === 'string' ? syncedData : JSON.stringify(syncedData);
      
      // If this matches what we already have, skip to avoid loops
      if (sceneDataStr === lastProcessedData.current) return;

      const sceneData = typeof syncedData === 'string' ? JSON.parse(syncedData) : syncedData;
      if (!sceneData.elements) return;

      console.log('📥 Applying remote whiteboard sync...');
      
      // Mark this as processed BEFORE updating the scene to avoid re-emitting
      lastProcessedData.current = sceneDataStr;

      excalidrawAPI.updateScene({
        elements: sceneData.elements,
        files: sceneData.files || {},
        commitToHistory: false
      })
    } catch (err) {
      console.error('Error parsing whiteboard data:', err)
    }
  }, [syncedData, excalidrawAPI])

  // Handle local changes
  const handleElementsChange = useCallback((elements_, appState, files_) => {
    // If we don't have the API yet, we can't do anything
    if (!excalidrawAPI || !appState) return

    // Track if user is currently interacting
    const interactionActive = appState.isResizing || 
                              appState.isRotating || 
                              !!appState.draggingElement || 
                              !!appState.editingElement || 
                              !!appState.multiElement;

    isDrawing.current = interactionActive && !appState.pointerInteractionFinished;

    // Check if there are elements to sync
    if (!elements_ || elements_.length === 0) return;

    // Check if the content actually changed (ignoring UI state like selection)
    const currentSceneData = {
      elements: elements_,
      files: files_ || {}
    }
    const currentSceneDataStr = JSON.stringify(currentSceneData);

    // If this change matches what we just processed (remote or local), skip emitting
    if (currentSceneDataStr === lastProcessedData.current) return;

    // Personal workspace logic
    if (roomId === 'personal') {
      localStorage.setItem('livedesk-personal-whiteboard', currentSceneDataStr)
      lastProcessedData.current = currentSceneDataStr;
      return
    }

    // Debounce the socket emit
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Fast real-time sync for better experience
    // 30ms when drawing/dragging for smooth real-time, 10ms when finished
    const delay = appState.pointerInteractionFinished ? 10 : 30;

    debounceTimer.current = setTimeout(() => {
      // Re-verify that the data hasn't changed since we started the timeout
      // to avoid race conditions
      console.log('📤 Sending whiteboard update...');
      
      // Update our tracker so we don't re-process our own emit
      lastProcessedData.current = currentSceneDataStr;
      
      emitWhiteboardUpdate(roomId, currentSceneDataStr)
    }, delay)
  }, [roomId, emitWhiteboardUpdate, excalidrawAPI])

  return (
    <div className={`h-full w-full excalidraw-wrapper bg-white ${isLocked ? 'pointer-events-none' : ''}`}>
      {isLocked && (
        <div className="absolute top-4 right-4 z-[50] bg-red-500/90 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-lg">
          Locked by Host
        </div>
      )}
      {Excalidraw ? (
        <Excalidraw
          viewModeEnabled={isLocked}
          excalidrawAPI={(api) => {
            if (api) setExcalidrawAPI(api)
          }}
          onChange={handleElementsChange}
          initialData={{
            elements: [],
            files: {}
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-500">Loading whiteboard...</p>
        </div>
      )}
    </div>
  )
}

export default Whiteboard