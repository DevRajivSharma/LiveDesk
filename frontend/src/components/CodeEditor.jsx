import { useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useSocketContext } from '../contexts/SocketContext'
import { useCodeSync } from '../hooks/useSocket'
import { Code2 } from 'lucide-react'

import { Play } from 'lucide-react'

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

function CodeEditor({ roomId, onLanguageChange, onCodeChange, externalLanguage, isLocked, onRun, isExecuting }) {
  const { emitCodeChange, emitCodeComplete, emitLanguageChange, currentUser } = useSocketContext()
  const { code, language: syncedLanguage } = useCodeSync(roomId)
  const user = JSON.parse(localStorage.getItem('livedesk-user') || '{}');
  const currentLanguage = externalLanguage || syncedLanguage || 'javascript'
  const editorRef = useRef(null)
  const isLocalChange = useRef(false)
  const debounceTimer = useRef(null)

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

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

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: isLocked })
    }
  }, [isLocked])

  const handleCodeChange = useCallback((value) => {
    if (value === undefined || !roomId) return

    isLocalChange.current = true
    onCodeChange?.(value)

    if (roomId === 'personal') {
      localStorage.setItem('livedesk-personal-code', value)
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      emitCodeChange(roomId, value, currentLanguage)
    }, 150)

    setTimeout(() => {
      isLocalChange.current = false
    }, 200)
  }, [roomId, currentLanguage, emitCodeChange, onCodeChange])

  const handleEditorChange = useCallback((value) => {
    if (!value || !roomId) return

    handleCodeChange(value)
  }, [roomId, handleCodeChange])

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value
    onLanguageChange?.(newLanguage)
    
    if (roomId === 'personal') {
      localStorage.setItem('livedesk-personal-lang', newLanguage)
    } else {
      emitLanguageChange(roomId, newLanguage)
    }
  }

  useEffect(() => {
    if (code && editorRef.current && !isLocalChange.current) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== code) {
        editorRef.current.setValue(code)
      }
    }
  }, [code])

  useEffect(() => {
    const handleManualLoad = (e) => {
      const { code: newCode, language: newLang } = e.detail;
      if (editorRef.current) {
        editorRef.current.setValue(newCode);
        if (newLang) {
          onLanguageChange?.(newLang);
        }
        onCodeChange?.(newCode);
        
        if (roomId === 'personal') {
          localStorage.setItem('livedesk-personal-code', newCode);
          if (newLang) localStorage.setItem('livedesk-personal-lang', newLang);
        } else {
          emitCodeChange(roomId, newCode, newLang || currentLanguage);
        }
      }
    };

    window.addEventListener('livedesk-load-code', handleManualLoad);
    return () => window.removeEventListener('livedesk-load-code', handleManualLoad);
  }, [roomId, currentLanguage, emitCodeChange, onCodeChange, onLanguageChange]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      
      <div className="flex items-center justify-between px-6 py-2 bg-[#0a0a0a] border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Code2 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Editor</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Language:</span>
            <select
              value={currentLanguage}
              onChange={handleLanguageChange}
              className="px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-bold text-slate-300 uppercase focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#0a0a0a]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        
        {onRun && (
          <button 
            onClick={onRun}
            disabled={isExecuting}
            className="flex items-center gap-2 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            {isExecuting ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-3 h-3" />}
            Run Script
          </button>
        )}
      </div>

      
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