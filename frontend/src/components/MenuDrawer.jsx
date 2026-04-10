import { useState, useRef, useEffect } from 'react'
import { 
  X, FileText, Upload, Download, Trash2, Save, FolderOpen,
  Terminal, FileCode, FileJson, Image, File, Copy, Check,
  ChevronRight, StickyNote, MoreVertical, Play, Copy as CopyIcon, Camera, Bookmark, Plus, FileUp, PenTool, Eye, FileStack
} from 'lucide-react'
import toast from 'react-hot-toast';

const tabs = [
    { id: 'files', label: 'File Manager', icon: FolderOpen },
    { id: 'snippets', label: 'Session Library', icon: Bookmark },
  ]

function MenuDrawer({ isOpen, onClose, roomId, code, whiteboardData, language, inline = false, activeTab: externalActiveTab, onTabChange }) {
  const [internalActiveTab, setInternalActiveTab] = useState('files')
  const activeTab = externalActiveTab || internalActiveTab
  const setActiveTab = onTabChange || setInternalActiveTab

  const [notes, setNotes] = useState('')
  const [snapshotName, setRoomSnapshotName] = useState('')
  const [savedNotes, setSavedNotes] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [consoleOutput, setConsoleOutput] = useState([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState([])
  const [snippets, setSnippets] = useState([])
  const [newSnippetName, setNewSnippetName] = useState('')
  const [viewingSnapshot, setViewingSnapshot] = useState(null)
  const fileInputRef = useRef(null)
  const terminalRef = useRef(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('livedesk-token');
        if (token) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
          const response = await fetch(`${apiUrl}/api/files`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const backendFiles = await response.json();
            setUploadedFiles(backendFiles);
            return;
          }
        }
        setUploadedFiles(JSON.parse(localStorage.getItem(`livedesk-files-${roomId}`) || '[]'))
      } catch (e) {
        console.error('Error loading files:', e);
        setUploadedFiles(JSON.parse(localStorage.getItem(`livedesk-files-${roomId}`) || '[]'))
      }
      
      setTerminalOutput(JSON.parse(localStorage.getItem(`livedesk-terminal-${roomId}`) || '[]'))
      setSnippets(JSON.parse(localStorage.getItem('livedesk-snippets') || '[]'))
    };

    loadData();
    window.addEventListener('livedesk-files-updated', loadData);
    return () => window.removeEventListener('livedesk-files-updated', loadData);
  }, [roomId])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalOutput])

  const handleSnapshotEditor = (customName) => {
    if (!code) return;
    const timestamp = new Date().getTime();
    const name = customName || `snapshot_${timestamp}`;
    const fileName = `${name}.${language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'txt'}`;
    
    const newFile = {
      name: fileName,
      type: 'text/plain',
      size: code.length,
      content: code,
      roomId,
      isSnapshot: true,
      timestamp: new Date().toISOString()
    };

    const updatedFiles = [newFile, ...uploadedFiles];
    setUploadedFiles(updatedFiles);
    localStorage.setItem(`livedesk-files-${roomId}`, JSON.stringify(updatedFiles));
    
    setActiveTab('files');
  }

  const handleSnapshotBoard = async (customName) => {
    if (!whiteboardData) return;
    
    const timestamp = new Date().getTime();
    const name = customName || `board_capture_${timestamp}`;
    const fileName = `${name}.excalidraw`;
    
    const newFile = {
      name: fileName,
      type: 'application/json',
      size: JSON.stringify(whiteboardData).length,
      content: JSON.stringify(whiteboardData),
      roomId,
      isBoardSnapshot: true,
      timestamp: new Date().toISOString()
    };

    const updatedFiles = [newFile, ...uploadedFiles];
    setUploadedFiles(updatedFiles);
    localStorage.setItem(`livedesk-files-${roomId}`, JSON.stringify(updatedFiles));
    
    setActiveTab('files');
  }

  const handleFullSnapshot = () => {
    const name = snapshotName.trim() || `full_session_${Date.now()}`;
    handleSnapshotEditor(`${name}_code`);
    handleSnapshotBoard(`${name}_board`);
    setRoomSnapshotName('');
    alert('FULL_SESSION_CAPTURE: Both Editor and Whiteboard states stored.');
  }

  const handleLoadSnippet = (snippet) => {
    if (confirm(`INITIALIZE_SESSION: Load "${snippet.name}" state? This will overwrite active data.`)) {
      const data = snippet.isFullSnapshot ? (typeof snippet.code === 'string' ? JSON.parse(snippet.code) : snippet.code) : snippet;
      
      if (data.code !== undefined && !snippet.isBoardSnapshot) {
        window.dispatchEvent(new CustomEvent('livedesk-load-code', { 
          detail: { code: data.code, language: data.language || 'javascript' } 
        }));
      }
      
      if (data.whiteboardData) {
        window.dispatchEvent(new CustomEvent('livedesk-load-whiteboard', { 
          detail: { data: data.whiteboardData } 
        }));
      } else if (snippet.isBoardSnapshot) {
        window.dispatchEvent(new CustomEvent('livedesk-load-whiteboard', { 
          detail: { data: typeof snippet.code === 'string' ? JSON.parse(snippet.code) : snippet.code } 
        }));
      }
      
      onClose();
    }
  }

  const handleViewSnapshot = (file) => {
    setViewingSnapshot(file);
  }

  const handleSaveNotes = () => {
    localStorage.setItem(`livedesk-notes-${roomId}`, notes)
    const notesList = JSON.parse(localStorage.getItem('livedesk-notes-list') || '[]')
    const newNote = { id: Date.now(), roomId, preview: notes.substring(0, 50), date: new Date().toISOString() }
    localStorage.setItem('livedesk-notes-list', JSON.stringify([newNote, ...notesList]))
    setSavedNotes([newNote, ...notesList])
    alert('Notes saved successfully!');
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    const token = localStorage.getItem('livedesk-token');

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const isExcalidraw = file.name.endsWith('.excalidraw') || (file.type === 'application/json' && file.name.includes('board'));

        // Get file type, fallback to a default based on extension if empty
        let fileType = file.type;
        if (!fileType) {
          if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) fileType = 'text/javascript';
          else if (file.name.endsWith('.py')) fileType = 'text/python';
          else if (file.name.endsWith('.txt')) fileType = 'text/plain';
          else if (file.name.endsWith('.json')) fileType = 'application/json';
          else if (file.name.endsWith('.excalidraw')) fileType = 'application/json';
          else if (file.name.endsWith('.png')) fileType = 'image/png';
          else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) fileType = 'image/jpeg';
          else if (file.name.endsWith('.gif')) fileType = 'image/gif';
          else if (file.name.endsWith('.svg')) fileType = 'image/svg+xml';
          else fileType = 'application/octet-stream';
        }

        const fileData = {
          name: file.name,
          type: fileType,
          size: file.size,
          content: e.target.result,
          roomId,
          isSnapshot: !isExcalidraw && (file.name.endsWith('.js') || file.name.endsWith('.py') || file.name.endsWith('.txt')),
          isBoardSnapshot: isExcalidraw,
          timestamp: new Date().toISOString()
        };

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
            console.error('Error saving file to backend:', err);
          }
        }

        const updatedFiles = [fileData, ...uploadedFiles];
        setUploadedFiles(updatedFiles);
        localStorage.setItem(`livedesk-files-${roomId}`, JSON.stringify(updatedFiles));
        window.dispatchEvent(new CustomEvent('livedesk-files-updated'));
      }
      reader.readAsText(file)
    })
  }

  const handleDeleteFile = async (file) => {
    const token = localStorage.getItem('livedesk-token');
    if (token && file._id) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        await fetch(`${apiUrl}/api/files/${file._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Error deleting file from backend:', err);
      }
    }

    const updatedFiles = uploadedFiles.filter(f => f._id !== file._id && f.name !== file.name)
    setUploadedFiles(updatedFiles)
    localStorage.setItem(`livedesk-files-${roomId}`, JSON.stringify(updatedFiles))
    window.dispatchEvent(new CustomEvent('livedesk-files-updated'));
  }

  const handleDeleteAllFiles = async () => {
    if (!confirm('Delete ALL files for this room?')) return;

    const token = localStorage.getItem('livedesk-token');
    const roomFiles = uploadedFiles.filter(f => f.roomId === roomId);

    // Delete from backend
    if (token) {
      for (const file of roomFiles) {
        if (file._id) {
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
            await fetch(`${apiUrl}/api/files/${file._id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (err) {
            console.error('Error deleting file from backend:', err);
          }
        }
      }
    }

    const updatedFiles = uploadedFiles.filter(f => f.roomId !== roomId)
    setUploadedFiles(updatedFiles)
    localStorage.setItem(`livedesk-files-${roomId}`, JSON.stringify(updatedFiles))
    window.dispatchEvent(new CustomEvent('livedesk-files-updated'));
  }

  const handleDeleteAllSnippets = async () => {
    if (!confirm('Delete ALL snapshots from this room?')) return;

    const token = localStorage.getItem('livedesk-token');
    const snapshotFiles = uploadedFiles.filter(f => f.roomId === roomId && (f.isSnapshot || f.isBoardSnapshot || f.isFullSnapshot));

    // Delete from backend
    if (token) {
      for (const file of snapshotFiles) {
        if (file._id) {
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
            await fetch(`${apiUrl}/api/files/${file._id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (err) {
            console.error('Error deleting snippet from backend:', err);
          }
        }
      }
    }

    const updatedFiles = uploadedFiles.filter(f => !(f.roomId === roomId && (f.isSnapshot || f.isBoardSnapshot || f.isFullSnapshot)))
    setUploadedFiles(updatedFiles)
    localStorage.setItem(`livedesk-files-${roomId}`, JSON.stringify(updatedFiles))
    window.dispatchEvent(new CustomEvent('livedesk-files-updated'));
  }

  const handleDownloadFile = (file) => {
    const blob = new Blob([file.content], { type: file.type || 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRunCode = async () => {
    if (!code || isExecuting) return

    setIsExecuting(true)
    setConsoleOutput([])

    const timestamp = new Date().toLocaleTimeString()
    setTerminalOutput(prev => [...prev, { type: 'command', text: `$ run ${language || 'javascript'} script`, time: timestamp }])

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: language || 'javascript',
          roomId
        })
      })

      const result = await response.json()
      
      if (result.error) {
        setConsoleOutput([`Error: ${result.error}`])
        setTerminalOutput(prev => [...prev, { type: 'error', text: result.error, time: new Date().toLocaleTimeString() }])
      } else {
        const outputLines = result.output ? result.output.split('\n') : ['Execution finished (no output)']
        setConsoleOutput(outputLines)
        outputLines.forEach(line => {
          setTerminalOutput(prev => [...prev, { type: 'output', text: line, time: new Date().toLocaleTimeString() }])
        })
      }
    } catch (err) {
      const errMsg = `Execution failed: ${err.message}`
      setConsoleOutput([errMsg])
      setTerminalOutput(prev => [...prev, { type: 'error', text: errMsg, time: new Date().toLocaleTimeString() }])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveSnippet = () => {
    if (!newSnippetName.trim()) {
      toast.error('IDENTIFIER_MISSING: Assign a name to this snippet.');
      return;
    }
    const snippet = {
      id: Date.now(),
      name: newSnippetName,
      code,
      language,
      whiteboardData: whiteboardData ? JSON.parse(JSON.stringify(whiteboardData)) : null,
      timestamp: new Date().toISOString()
    }
    const updated = [snippet, ...snippets]
    setSnippets(updated)
    localStorage.setItem('livedesk-snippets', JSON.stringify(updated))
    setNewSnippetName('')
    toast.success('SNIPPET_STORED: Data added to library.');
  }

  const handleDeleteSnippet = (id) => {
    const updated = snippets.filter(s => s.id !== id)
    setSnippets(updated)
    localStorage.setItem('livedesk-snippets', JSON.stringify(updated))
    toast.success('SNIPPET_REMOVED: Item purged from library.');
  }

  const handleCopySnippet = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('DATA_COPIED: Snippet text in clipboard.');
    setTimeout(() => setCopied(false), 2000)
  }

  const getFileIcon = (file) => {
    if (file.isFullSnapshot) return FileStack;
    if (file.isBoardSnapshot) return PenTool;
    const ext = file.name.split('.').pop()
    switch (ext) {
      case 'js': case 'jsx': case 'ts': case 'tsx': return FileCode
      case 'json': case 'excalidraw': return FileJson
      case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': return Image
      case 'livedesk': return FileStack
      default: return File
    }
  }

  if (inline) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {activeTab === 'files' && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-blue-500" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Data Repository</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Upload Data
                  </button>
                  {uploadedFiles.filter(f => f.roomId === roomId).length > 0 && (
                    <button
                      onClick={handleDeleteAllFiles}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 text-[10px] font-black uppercase tracking-widest hover:bg-red-600/30 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete All
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
              </div>

              {uploadedFiles.length === 0 ? (
                <div className="text-center py-24 border border-white/5 bg-black/20">
                  <FolderOpen className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Repository Offline</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {uploadedFiles.filter(f => f.roomId === roomId).map((file, i) => {
                    const Icon = getFileIcon(file)
                    return (
                      <div key={i} className="flex flex-col bg-black/40 border border-white/10 group hover:border-blue-500/30 transition-all duration-300">
                        <div className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-5 cursor-pointer" onDoubleClick={() => handleLoadSnippet({ code: file.content, language: file.name.split('.').pop() === 'js' ? 'javascript' : 'python', name: file.name, whiteboardData: file.isBoardSnapshot ? JSON.parse(file.content) : null, isBoardSnapshot: file.isBoardSnapshot, isFullSnapshot: file.isFullSnapshot })}>
                            <div className={`w-12 h-12 flex items-center justify-center border border-white/5 transition-all ${file.isSnapshot ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : file.isBoardSnapshot ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : file.isFullSnapshot ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-slate-500'}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest truncate">{file.name}</p>
                              <p className="text-[8px] text-slate-600 font-bold mt-1.5 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • {file.isSnapshot ? 'Editor Snap' : file.isBoardSnapshot ? 'Board Snap' : file.isFullSnapshot ? 'Full Session' : 'External'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleViewSnapshot(file)} className="p-2 hover:bg-white/5 text-blue-400 transition-all" title="Quick View"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleLoadSnippet({ code: file.content, language: file.name.split('.').pop() === 'js' ? 'javascript' : 'python', name: file.name, whiteboardData: file.isBoardSnapshot ? JSON.parse(file.content) : null, isBoardSnapshot: file.isBoardSnapshot, isFullSnapshot: file.isFullSnapshot })} className="p-2 hover:bg-white/5 text-emerald-400 transition-all" title="Open in Workspace"><Play className="w-4 h-4" /></button>
                            <button onClick={() => handleDownloadFile(file)} className="p-2 hover:bg-white/5 text-slate-500 hover:text-white transition-all"><Download className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteFile(file)} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        
                        
                        {viewingSnapshot?.name === file.name && (
                          <div className="border-t border-white/5 p-6 bg-black/60 animate-in slide-in-from-top-2">
                            <div className="bg-[#050505] p-6 border border-white/10 font-mono text-[10px] text-slate-400 max-h-60 overflow-y-auto custom-scrollbar">
                              {file.isBoardSnapshot ? (
                                <div className="text-center py-4 space-y-4">
                                  <PenTool className="w-8 h-8 mx-auto text-violet-500 opacity-50" />
                                  <p className="text-[9px] uppercase tracking-widest">EXCALIDRAW_DATA_BLOB: Cannot preview vector data directly. Click "Open" to load into workspace.</p>
                                </div>
                              ) : (
                                <pre className="whitespace-pre-wrap">{file.content}</pre>
                              )}
                            </div>
                            <button 
                              onClick={() => setViewingSnapshot(null)}
                              className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-slate-500 transition-all"
                            >
                              Minimize Preview
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'snippets' && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-blue-500" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Session Library</h3>
                </div>
                {uploadedFiles.filter(f => (f.isSnapshot || f.isBoardSnapshot || f.isFullSnapshot) && f.roomId === roomId).length > 0 && (
                  <button
                    onClick={handleDeleteAllSnippets}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 text-[10px] font-black uppercase tracking-widest hover:bg-red-600/30 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete All
                  </button>
                )}
              </div>

              {uploadedFiles.filter(f => f.isSnapshot || f.isBoardSnapshot || f.isFullSnapshot).length === 0 ? (
                <div className="text-center py-24 border border-white/5 bg-black/20">
                  <Bookmark className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">No Active Snapshots</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  
                  <div className="space-y-4">
                    <h4 className="text-[8px] font-black text-blue-500 uppercase tracking-[0.4em] border-b border-blue-500/10 pb-2">Full Session Bundles</h4>
                    {uploadedFiles.filter(f => f.isFullSnapshot && f.roomId === roomId).map((file, i) => (
                      <div key={i} className="bg-blue-500/5 border border-blue-500/20 p-4 flex items-center justify-between group hover:border-blue-500/40 transition-all">
                        <div className="flex items-center gap-4">
                          <FileStack className="w-4 h-4 text-blue-400" />
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{file.name}</span>
                        </div>
                        <button onClick={() => handleLoadSnippet({ code: file.content, name: file.name, isFullSnapshot: true })} className="px-4 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all">Restore Session</button>
                      </div>
                    ))}
                  </div>

                  
                  <div className="space-y-4 mt-8">
                    <h4 className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] border-b border-white/5 pb-2">Editor Snapshots</h4>
                    {uploadedFiles.filter(f => f.isSnapshot && f.roomId === roomId).map((file, i) => (
                      <div key={i} className="bg-black/40 border border-white/10 p-4 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <FileCode className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{file.name}</span>
                        </div>
                        <button onClick={() => handleLoadSnippet({ code: file.content, language: 'javascript', name: file.name })} className="px-4 py-1 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">Initialize</button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 mt-8">
                    <h4 className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] border-b border-white/5 pb-2">Whiteboard Snapshots</h4>
                    {uploadedFiles.filter(f => f.isBoardSnapshot && f.roomId === roomId).map((file, i) => (
                      <div key={i} className="bg-black/40 border border-white/10 p-4 flex items-center justify-between group hover:border-violet-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <PenTool className="w-4 h-4 text-violet-500" />
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{file.name}</span>
                        </div>
                        <button onClick={() => handleLoadSnippet({ whiteboardData: JSON.parse(file.content), name: file.name })} className="px-4 py-1 bg-violet-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-violet-500 transition-all">Initialize</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] animate-in fade-in duration-300" onClick={onClose} />
      )}

      
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-[#0f0f0f] border-l border-white/10 z-[100] shadow-2xl transition-transform duration-500 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#141414]">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Workspace Tools</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        
        <div className="flex border-b border-white/5 bg-[#111]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-primary-400 border-primary-500 bg-primary-500/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        
        <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100% - 130px)' }}>
          
        </div>
      </div>
    </>
  );
}

export default MenuDrawer