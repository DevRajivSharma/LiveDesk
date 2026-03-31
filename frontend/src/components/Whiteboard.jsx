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

  useEffect(() => {
    if (!syncedData || syncedData === 'null' || !excalidrawAPI) return

    if (isDrawing.current) return;

    try {
      const sceneDataStr = typeof syncedData === 'string' ? syncedData : JSON.stringify(syncedData);
      if (sceneDataStr === lastProcessedData.current) return;

      const parsedData = typeof syncedData === 'string' ? JSON.parse(syncedData) : syncedData;
      if (!parsedData || !parsedData.elements) return;

      console.log('📥 Applying remote whiteboard sync...');
      
      lastProcessedData.current = sceneDataStr;
      
      isRemoteUpdating.current = true;

      excalidrawAPI.updateScene({
        elements: parsedData.elements,
        files: parsedData.files || {},
        commitToHistory: false
      });

      onChange?.(parsedData);

      setTimeout(() => {
        isRemoteUpdating.current = false;
      }, 50);

    } catch (err) {
      console.error('Error parsing whiteboard data:', err)
    }
  }, [syncedData, excalidrawAPI]) // Removed onChange from dependencies to avoid potential loops if parent doesn't memoize it

  const handleElementsChange = useCallback((elements_, appState, files_) => {
    if (isLocked) return;

    if (isRemoteUpdating.current) return;

    if (!excalidrawAPI || !appState) return

    const interactionActive = appState.isResizing || 
                              appState.isRotating || 
                              !!appState.draggingElement || 
                              !!appState.editingElement || 
                              !!appState.multiElement;

    isDrawing.current = interactionActive && !appState.pointerInteractionFinished;

    if (!elements_) return;

    const currentSceneData = {
      elements: elements_,
      files: files_ || {}
    }
    const currentSceneDataStr = JSON.stringify(currentSceneData);

    if (currentSceneDataStr === lastProcessedData.current) return;

    lastProcessedData.current = currentSceneDataStr;

    onChange?.(currentSceneData);

    if (roomId === 'personal') {
      localStorage.setItem('livedesk-personal-whiteboard', currentSceneDataStr)
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    const delay = appState.pointerInteractionFinished ? 10 : 30;

    debounceTimer.current = setTimeout(() => {
      console.log('📤 Sending whiteboard update...');
      
      emitWhiteboardUpdate(roomId, currentSceneDataStr)
    }, delay)
  }, [roomId, emitWhiteboardUpdate, excalidrawAPI, isLocked, onChange])

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