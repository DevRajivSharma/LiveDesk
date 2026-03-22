import { useState, useEffect, useCallback, useRef } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { useSocketContext } from '../contexts/SocketContext'
import { useWhiteboardSync } from '../hooks/useSocket'

function Whiteboard({ roomId, isLocked, onChange }) {
  const { emitWhiteboardUpdate } = useSocketContext()
  const syncedData = useWhiteboardSync(roomId)

  const [excalidrawAPI, setExcalidrawAPI] = useState(null)
  const [files, setFiles] = useState({})

  const debounceTimer = useRef(null)
  const lastProcessedData = useRef(null) // Stores the string of what we last processed (remote or local)
  const isDrawing = useRef(false)
  const isRemoteUpdating = useRef(false) // Flag to skip onChange during remote sync

  // Update whiteboard when synced data changes
  useEffect(() => {
    if (!syncedData || syncedData === 'null' || !excalidrawAPI) return

    // Don't apply updates while the user is actively drawing/dragging to prevent jumps
    if (isDrawing.current) return;

    try {
      // If this matches what we already have, skip to avoid loops
      const sceneDataStr = typeof syncedData === 'string' ? syncedData : JSON.stringify(syncedData);
      if (sceneDataStr === lastProcessedData.current) return;

      const parsedData = typeof syncedData === 'string' ? JSON.parse(syncedData) : syncedData;
      if (!parsedData || !parsedData.elements) return;

      console.log('📥 Applying remote whiteboard sync...');
      
      // Mark this as processed BEFORE updating the scene to avoid re-emitting
      lastProcessedData.current = sceneDataStr;
      
      // Set the remote updating flag to prevent onChange from re-emitting this change
      isRemoteUpdating.current = true;

      excalidrawAPI.updateScene({
        elements: parsedData.elements,
        files: parsedData.files || {},
        commitToHistory: false
      });

      // Also notify parent of the remote change, but only if it's actually different
      onChange?.(parsedData);

      // Reset the flag after a short delay to allow Excalidraw to finish its update cycle
      setTimeout(() => {
        isRemoteUpdating.current = false;
      }, 50);

    } catch (err) {
      console.error('Error parsing whiteboard data:', err)
    }
  }, [syncedData, excalidrawAPI]) // Removed onChange from dependencies to avoid potential loops if parent doesn't memoize it

  // Handle local changes
  const handleElementsChange = useCallback((elements_, appState, files_) => {
    // If the room is locked for this user, do not process or emit any local changes
    if (isLocked) return;

    // Skip if this change was triggered by a remote sync
    if (isRemoteUpdating.current) return;

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
    // If elements is an empty array, we still want to sync the clear state
    if (!elements_) return;

    // Check if the content actually changed (ignoring UI state like selection)
    const currentSceneData = {
      elements: elements_,
      files: files_ || {}
    }
    const currentSceneDataStr = JSON.stringify(currentSceneData);

    // If this change matches what we just processed (remote or local), skip emitting
    if (currentSceneDataStr === lastProcessedData.current) return;

    // Update our tracker so we don't re-process our own change
    lastProcessedData.current = currentSceneDataStr;

    // Notify parent of the change only when data actually changes
    onChange?.(currentSceneData);

    // Personal workspace logic
    if (roomId === 'personal') {
      localStorage.setItem('livedesk-personal-whiteboard', currentSceneDataStr)
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
      
      emitWhiteboardUpdate(roomId, currentSceneDataStr)
    }, delay)
  }, [roomId, emitWhiteboardUpdate, excalidrawAPI, isLocked, onChange])

  // Prepare initial data from synced data if available
  const getInitialData = () => {
    if (!syncedData) return { elements: [], files: {} };
    
    try {
      const data = typeof syncedData === 'string' ? JSON.parse(syncedData) : syncedData;
      if (!data || !data.elements) return { elements: [], files: {} };
      
      return {
        elements: data.elements,
        files: data.files || {}
      };
    } catch (e) {
      console.error('Error in getInitialData:', e);
      return { elements: [], files: {} };
    }
  };

  // Handle manual whiteboard loads (e.g., from snapshots or files)
  useEffect(() => {
    const handleManualLoad = (e) => {
      const { data } = e.detail;
      if (excalidrawAPI && data) {
        console.log('🖼️ Loading manual whiteboard state...');
        
        const sceneDataStr = typeof data === 'string' ? data : JSON.stringify(data);
        lastProcessedData.current = sceneDataStr;
        
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        excalidrawAPI.updateScene({
          elements: parsedData.elements,
          files: parsedData.files || {},
          commitToHistory: true
        });

        // Force local state update to ensure persistence
        onChange?.(parsedData);
        
        if (roomId === 'personal') {
          localStorage.setItem('livedesk-personal-whiteboard', sceneDataStr);
        } else {
          emitWhiteboardUpdate(roomId, sceneDataStr);
        }
      }
    };

    window.addEventListener('livedesk-load-whiteboard', handleManualLoad);
    return () => window.removeEventListener('livedesk-load-whiteboard', handleManualLoad);
  }, [excalidrawAPI, roomId, onChange, emitWhiteboardUpdate]);

  return (
    <div className={`h-full w-full excalidraw-wrapper bg-[#0a0a0a] ${isLocked ? 'pointer-events-none' : ''}`}>
      {isLocked && (
        <div className="absolute top-4 right-4 z-[50] bg-red-500/90 text-white text-[10px] font-black px-2 py-1 rounded-none uppercase tracking-widest shadow-lg">
          Locked by Host
        </div>
      )}
      {Excalidraw ? (
        <Excalidraw
          key={roomId} // Force remount when room changes to reset initialData
          viewModeEnabled={isLocked}
          excalidrawAPI={(api) => {
            if (api) setExcalidrawAPI(api)
          }}
          onChange={handleElementsChange}
          initialData={getInitialData()}
          theme="dark"
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