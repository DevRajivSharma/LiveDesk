import { useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useSocketContext } from '../contexts/SocketContext'
import { useCodeSync } from '../hooks/useSocket'
import { Code2 } from 'lucide-react'

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' }
]

function CodeEditor({ roomId, onLanguageChange, externalLanguage, isLocked }) {
  const { emitCodeChange, emitCodeComplete, emitLanguageChange, currentUser } = useSocketContext()
  const { code, language: syncedLanguage } = useCodeSync(roomId)
  const user = JSON.parse(localStorage.getItem('livedesk-user') || '{}');
  // Use external language if provided, otherwise use synced
  const currentLanguage = externalLanguage || syncedLanguage || 'javascript'
  const editorRef = useRef(null)
  const isLocalChange = useRef(false)
  const debounceTimer = useRef(null)

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

    // Configure editor settings
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      fontFamily: "'Fira Code', 'Consolas', monospace",
      tabSize: 2,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      padding: { top: 16 },
      readOnly: isLocked
    })
  }

  // Update readOnly status when isLocked changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: isLocked })
    }
  }, [isLocked])

  // Handle code change with debounce
  const handleCodeChange = useCallback((value) => {
    if (!value || !roomId) return

    isLocalChange.current = true

    // Personal workspace logic
    if (roomId === 'personal') {
      localStorage.setItem('livedesk-personal-code', value)
      return
    }

    // Collaborative logic
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      emitCodeChange(roomId, value, currentLanguage)
    }, 150)

    // Clear debounce after emit
    setTimeout(() => {
      isLocalChange.current = false
    }, 200)
  }, [roomId, currentLanguage, emitCodeChange])

  // Handle code change complete (for DB save)
  const handleEditorChange = useCallback((value) => {
    if (!value || !roomId) return

    handleCodeChange(value)
  }, [roomId, handleCodeChange])

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value
    onLanguageChange?.(newLanguage)
    
    if (roomId === 'personal') {
      localStorage.setItem('livedesk-personal-lang', newLanguage)
    } else {
      emitLanguageChange(roomId, newLanguage)
    }
  }

  // Initialize code from room state if available
  useEffect(() => {
    if (code && editorRef.current && !isLocalChange.current) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== code) {
        editorRef.current.setValue(code)
      }
    }
  }, [code])

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Editor Header with Language Selector */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
        <div className="flex items-center gap-3">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Editor</span>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Language:</span>
          <select
            value={currentLanguage}
            onChange={handleLanguageChange}
            className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-[#222] transition-colors font-medium"
          >
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs font-medium text-slate-500">
          {user?.username || 'Anonymous'}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 monaco-editor-container">
        <Editor
          height="100%"
          language={currentLanguage}
          value={code || '// Start coding here...\nconsole.log("Hello, LiveDesk!");'}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          loading={
            <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400">
              <span>Loading editor...</span>
            </div>
          }
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'Fira Code', 'Consolas', monospace",
            tabSize: 2,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 16 },
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true }
          }}
        />
      </div>
    </div>
  )
}

export default CodeEditor