"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import FontFamily from "@tiptap/extension-font-family"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Typography from "@tiptap/extension-typography"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Mathematics from "@tiptap/extension-mathematics"
import "katex/dist/katex.min.css"
import { MenuBar } from "./menu-bar"
import { RecordingButton } from "./recording-button"
import { useState, useRef, useCallback, useEffect } from "react"

interface EditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  onTranscriptUpdate?: (text: string, layer: number) => void
  onRecordingStart?: () => void
}


export function Editor({ content = "", onChange, placeholder = "Start writing...", onTranscriptUpdate, onRecordingStart }: EditorProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  
  // Buffer transcript for 60 seconds before generating notes
  const transcriptBufferRef = useRef<string>("")
  const bufferTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionIdRef = useRef<string>(`session-${Date.now()}`)
  const previousNotesRef = useRef<string>("")
  const isRecordingRef = useRef<boolean>(false)
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (bufferTimerRef.current) {
        clearTimeout(bufferTimerRef.current)
      }
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-pink-600 underline cursor-pointer hover:text-pink-700",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto my-4",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      FontFamily.configure({
        types: ["textStyle"],
      }),
      Color.configure({
        types: ["textStyle"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none px-8 py-6",
      },
    },
  })

  // Layer 2 notes are generated every 60 seconds from transcription API
  // Layer 3 does final cleanup after recording stops

  // ============ LAYER 1: Transcription -> StudyPane ============
  // ============ LAYER 2: Notes Generation -> Editor (every 60 seconds) ============
  // ============ LAYER 3: Final Cleanup -> Editor (after recording stops) ============

  // Process buffered transcript every 60 seconds
  const processBufferedTranscript = useCallback(async () => {
    if (!transcriptBufferRef.current.trim() || !editor) {
      // If no transcript, schedule next check
      if (isRecordingRef.current) {
        bufferTimerRef.current = setTimeout(() => {
          processBufferedTranscript()
        }, 60000)
      }
      return
    }

    const transcriptToProcess = transcriptBufferRef.current.trim()
    transcriptBufferRef.current = "" // Clear buffer after processing

    try {
      setIsGeneratingNotes(true)
      const response = await fetch("/api/transcribe/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptToProcess,
          sessionId: sessionIdRef.current,
          previousNotes: previousNotesRef.current.slice(-500),
        }),
      })

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.layer === 2 && data.status === "completed" && data.text) {
                // Insert notes into editor
                editor.commands.focus()
                const insertPos = editor.state.doc.content.size
                editor.commands.insertContentAt(insertPos, data.text)
                editor.commands.scrollIntoView()

                // Track for context
                previousNotesRef.current += "\n" + data.text
                if (previousNotesRef.current.length > 1500) {
                  previousNotesRef.current = previousNotesRef.current.slice(-1500)
                }
              }
            } catch (e) {
              console.error("Error parsing notes SSE:", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating notes:", error)
    } finally {
      setIsGeneratingNotes(false)
      // Schedule next processing cycle if still recording
      if (isRecordingRef.current) {
        bufferTimerRef.current = setTimeout(() => {
          processBufferedTranscript()
        }, 60000)
      }
    }
  }, [editor])

  const handleTranscription = useCallback((text: string, layer: number) => {
    if (!text) return

    if (layer === 1) {
      // Route layer 1 (raw transcript) to transcript pane
      onTranscriptUpdate?.(text, layer)
      
      // Buffer transcript for 60-second processing
      transcriptBufferRef.current += (transcriptBufferRef.current ? " " : "") + text

      // Start timer on first chunk if not already running
      if (!bufferTimerRef.current && isRecordingRef.current) {
        bufferTimerRef.current = setTimeout(() => {
          processBufferedTranscript()
        }, 60000) // 60 seconds
      }
    }
  }, [onTranscriptUpdate, processBufferedTranscript])

  // ============ Recording Controls ============

  const handleRecordingStart = useCallback(() => {
    setIsRecording(true)
    isRecordingRef.current = true
    // Reset buffers and session
    transcriptBufferRef.current = ""
    previousNotesRef.current = ""
    sessionIdRef.current = `session-${Date.now()}`
    if (bufferTimerRef.current) {
      clearTimeout(bufferTimerRef.current)
      bufferTimerRef.current = null
    }
    // Timer will be started when first transcript chunk arrives
    // Notify parent to open StudyPane
    onRecordingStart?.()
  }, [onRecordingStart])

  const handleRecordingStop = useCallback(async () => {
    setIsRecording(false)
    isRecordingRef.current = false
    
    // Process any remaining buffered transcript immediately
    if (transcriptBufferRef.current.trim()) {
      if (bufferTimerRef.current) {
        clearTimeout(bufferTimerRef.current)
        bufferTimerRef.current = null
      }
      await processBufferedTranscript()
    }
    
    // Run Layer 3 final cleanup on all notes
    if (editor) {
      const allNotes = editor.getHTML()
      if (allNotes.trim()) {
        try {
          setIsGeneratingNotes(true)
          const response = await fetch("/api/transcribe/cleanup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              notes: allNotes,
              sessionId: sessionIdRef.current,
            }),
          })

          if (response.body) {
            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split("\n")

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    if (data.layer === 3 && data.status === "completed" && data.text) {
                      // Replace all content with cleaned version
                      editor.commands.setContent(data.text)
                      editor.commands.scrollIntoView()
                    }
                  } catch (e) {
                    console.error("Error parsing cleanup SSE:", e)
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Error running cleanup:", error)
        } finally {
          setIsGeneratingNotes(false)
        }
      }
    }
  }, [processBufferedTranscript, editor])

  // Status indicator
  const getStatusIndicator = () => {
    if (isGeneratingNotes) {
      return { text: "Cleaning up notes...", emoji: "✨", color: "bg-purple-500/90" }
    }
    if (isRecording) {
      return { text: "Recording...", emoji: "", color: "bg-red-500/90" }
    }
    return null
  }

  const status = getStatusIndicator()

  return (
    <div 
      ref={editorContainerRef}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative flex flex-col h-full"
    >
      <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-2">
        <MenuBar editor={editor} />
        <RecordingButton
          onTranscription={handleTranscription}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status indicator */}
      {status && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-xl ${status.color} text-white text-sm font-medium shadow-lg animate-pulse`}>
          {status.emoji ? (
            <span className="text-lg">{status.emoji}</span>
          ) : (
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          )}
          {status.text}
        </div>
      )}

      <style jsx global>{`
        .ProseMirror {
          min-height: 100%;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #111827;
        }
        .ProseMirror h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #1f2937;
        }
        .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          line-height: 1.75;
          color: #4b5563;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
          list-style-position: outside;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
          display: list-item;
        }
        .ProseMirror ul ul,
        .ProseMirror ol ol,
        .ProseMirror ul ol,
        .ProseMirror ol ul {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #f472b6;
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: #6b7280;
        }
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: ui-monospace, monospace;
        }
        .ProseMirror pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1rem;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }
        .ProseMirror img {
          border-radius: 0.75rem;
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
        }
        .ProseMirror mark {
          background-color: #fef08a;
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
        }
        
        /* Math Extension Styles */
        .Tiptap-mathematics-editor {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        .Tiptap-mathematics-render {
          cursor: pointer;
          padding: 0 0.25rem;
          transition: background 0.2s;
        }
        .Tiptap-mathematics-render:hover {
          background: #fdf2f8;
        }
        /* Task List Styles */
        ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        ul[data-type="taskList"] input[type="checkbox"] {
          margin-top: 0.4rem;
          cursor: pointer;
        }
        ul[data-type="taskList"] div {
          flex: 1;
        }
      `}</style>
    </div>
  )
}
