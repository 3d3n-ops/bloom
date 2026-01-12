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
import { useBloomFormatter, FormattingLine } from "@/hooks/use-bloom-formatter"
import { usePolishFormatter, PolishChunk } from "@/hooks/use-polish-formatter"
import { useState, useRef, useCallback } from "react"

interface EditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
}

// Track content ranges for each layer
interface ContentRange {
  start: number
  end: number
}

export function Editor({ content = "", onChange, placeholder = "Start writing..." }: EditorProps) {
  const [isRecording, setIsRecording] = useState(false)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  
  // Position tracking for each layer
  // Layer 2 content accumulates at the end
  // Layer 3 processes content from layer3StartRef onwards
  // Layer 4 processes content from layer4StartRef onwards
  const layer3StartRef = useRef<number>(0)
  const layer3ProcessingRangeRef = useRef<ContentRange | null>(null)
  const layer4StartRef = useRef<number>(0)
  const layer4ProcessingRangeRef = useRef<ContentRange | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
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

  // ============ LAYER 4: Polish Formatter (Claude) ============
  
  const handleChunkPolished = useCallback((chunk: PolishChunk) => {
    if (!editor || !layer4ProcessingRangeRef.current) return
    
    // Insert polished content at the layer 4 start position
    // This builds up the polished content progressively
    const insertPos = layer4StartRef.current
    editor.commands.insertContentAt(insertPos, chunk.content)
    
    // Adjust positions after insertion
    const insertedLength = editor.state.doc.content.size - (layer4ProcessingRangeRef.current.end - layer4ProcessingRangeRef.current.start) - insertPos
    layer4StartRef.current = editor.state.doc.content.size - (layer4ProcessingRangeRef.current.end - layer4ProcessingRangeRef.current.start)
    
    editor.commands.scrollIntoView()
  }, [editor])

  const handlePolishStart = useCallback(() => {
    if (!editor) return
    
    // Capture the range we're about to process (from layer4Start to layer3Start)
    // This is content that layer 3 has formatted but layer 4 hasn't polished yet
    const startPos = layer4StartRef.current
    const endPos = layer3StartRef.current
    
    if (startPos >= endPos) return // Nothing to process
    
    layer4ProcessingRangeRef.current = { start: startPos, end: endPos }
    
    // Delete the content we're processing - new content is AFTER layer3StartRef
    editor.chain().focus().deleteRange({ from: startPos, to: endPos }).run()
    
    // Adjust layer3Start since we deleted content before it
    const deletedLength = endPos - startPos
    layer3StartRef.current -= deletedLength
    
    editorContainerRef.current?.classList.add('bloom-is-polishing')
  }, [editor])

  const handlePolishComplete = useCallback(() => {
    if (!editor) return
    
    editorContainerRef.current?.classList.remove('bloom-is-polishing')
    layer4ProcessingRangeRef.current = null
    
    // Update layer 4 boundary to current position
    layer4StartRef.current = layer3StartRef.current
  }, [editor])

  const {
    isPolishing,
    addNotes: addNotesToPolish,
    startPolishing,
    stopPolishing,
    reset: resetPolisher,
  } = usePolishFormatter({
    onChunkPolished: handleChunkPolished,
    onPolishComplete: handlePolishComplete,
    onPolishStart: handlePolishStart,
    polishInterval: 30000, // Polish every 30 seconds
  })

  // ============ LAYER 3: Bloom Formatter (Groq Llama) ============

  const handleLineFormatted = useCallback((line: FormattingLine) => {
    if (!editor || !layer3ProcessingRangeRef.current) return
    
    // Insert formatted content at layer 3 start position
    const insertPos = layer3StartRef.current
    editor.commands.insertContentAt(insertPos, line.content)
    
    // Track how much we've inserted for layer 4
    addNotesToPolish(line.content)
    
    editor.commands.scrollIntoView()
  }, [editor, addNotesToPolish])

  const handleFormattingStart = useCallback(() => {
    if (!editor) return
    
    // Capture the range we're processing (from layer3Start to document end)
    const startPos = layer3StartRef.current
    const endPos = editor.state.doc.content.size
    
    if (startPos >= endPos) return // Nothing to process
    
    layer3ProcessingRangeRef.current = { start: startPos, end: endPos }
    
    // Delete the raw content we're going to format
    // New content from layer 2 will be blocked during this operation
    // but we'll minimize this window
    editor.chain().focus().deleteRange({ from: startPos, to: endPos }).run()
    
    editorContainerRef.current?.classList.add('bloom-is-formatting')
  }, [editor])

  const handleFormattingComplete = useCallback(() => {
    if (!editor) return
    
    editorContainerRef.current?.classList.remove('bloom-is-formatting')
    layer3ProcessingRangeRef.current = null
    
    // Update layer 3 boundary
    layer3StartRef.current = editor.state.doc.content.size
  }, [editor])

  const {
    isFormatting,
    addNotes,
    startFormatting,
    stopFormatting,
    reset: resetFormatter,
  } = useBloomFormatter({
    onLineFormatted: handleLineFormatted,
    onFormattingComplete: handleFormattingComplete,
    onFormattingStart: handleFormattingStart,
    formatInterval: 60000, // Format every 1 minute
  })

  // ============ LAYER 1 & 2: Transcription (Always runs) ============

  const handleTranscription = useCallback((text: string, layer: number) => {
    if (!editor || !text) return

    if (layer === 2) {
      // Always append at the end - never blocked by other layers
      addNotes(text)

      editor.commands.focus()
      const insertPos = editor.state.doc.content.size
      editor.commands.insertContentAt(insertPos, text)
    }
  }, [editor, addNotes])

  // ============ Recording Controls ============

  const handleRecordingStart = useCallback(() => {
    setIsRecording(true)
    resetFormatter()
    resetPolisher()
    
    if (editor) {
      const currentPos = editor.state.doc.content.size
      layer3StartRef.current = currentPos
      layer4StartRef.current = currentPos
    }
    
    startFormatting()
    startPolishing()
  }, [editor, resetFormatter, resetPolisher, startFormatting, startPolishing])

  const handleRecordingStop = useCallback(() => {
    setIsRecording(false)
    stopFormatting()
    stopPolishing()
  }, [stopFormatting, stopPolishing])

  // Status indicator
  const getStatusIndicator = () => {
    if (isPolishing) {
      return { text: "Polishing...", emoji: "✨", color: "bg-purple-500/90" }
    }
    if (isFormatting) {
      return { text: "Formatting...", emoji: "🌸", color: "bg-pink-500/90" }
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
        }
        .ProseMirror li {
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
        
        /* Bloom cursor - Layer 3 formatting */
        .bloom-is-formatting .ProseMirror > *:last-child::after {
          content: '🌸';
          display: inline-block;
          margin-left: 0.5rem;
          font-size: 1.25rem;
          animation: bloom-bounce 0.5s ease-in-out infinite;
          vertical-align: middle;
        }
        
        @keyframes bloom-bounce {
          0%, 100% { 
            transform: translateY(0) scale(1); 
            opacity: 1;
          }
          50% { 
            transform: translateY(-3px) scale(1.15); 
            opacity: 0.9;
          }
        }
        
        /* Glow effect - Layer 3 */
        .bloom-is-formatting .ProseMirror > *:last-child {
          animation: bloom-glow 0.8s ease-out;
        }
        
        @keyframes bloom-glow {
          0% { 
            background: linear-gradient(90deg, rgba(236, 72, 153, 0.15), transparent);
          }
          100% { 
            background: transparent;
          }
        }
        
        /* Polish cursor - Layer 4 polishing */
        .bloom-is-polishing .ProseMirror > *:last-child::after {
          content: '✨';
          display: inline-block;
          margin-left: 0.5rem;
          font-size: 1.25rem;
          animation: sparkle 0.6s ease-in-out infinite;
          vertical-align: middle;
        }
        
        @keyframes sparkle {
          0%, 100% { 
            transform: rotate(0deg) scale(1); 
            opacity: 1;
          }
          50% { 
            transform: rotate(15deg) scale(1.2); 
            opacity: 0.8;
          }
        }
        
        /* Glow effect - Layer 4 */
        .bloom-is-polishing .ProseMirror > *:last-child {
          animation: polish-glow 0.8s ease-out;
        }
        
        @keyframes polish-glow {
          0% { 
            background: linear-gradient(90deg, rgba(147, 51, 234, 0.15), transparent);
          }
          100% { 
            background: transparent;
          }
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
