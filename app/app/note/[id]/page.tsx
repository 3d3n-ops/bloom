"use client"

import { Sidebar } from "@/components/sidebar"
import { Editor } from "@/components/editor"
import { useState, useEffect, use, useCallback } from "react"
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Note } from "@/lib/supabase/types"
import { FloatingStudyButton } from "@/components/floating-study-button"
import { StudyPane } from "@/components/study-pane"
import { useTheme } from "@/contexts/theme-context"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function NotePage({ params }: PageProps) {
  const { id } = use(params)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [note, setNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isStudyPaneOpen, setIsStudyPaneOpen] = useState(false)
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  useEffect(() => {
    const fetchNote = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/notes/${id}`)
        const result = await response.json()

        if (response.ok && result.data) {
          setNote(result.data)
          setTitle(result.data.title)
          setContent(result.data.content)
        }
      } catch (err) {
        console.error("[NotePage] Fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (id && user && isLoaded) {
      fetchNote()
    }
  }, [id, user, isLoaded])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setHasChanges(true)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(true)
  }

  const handleSave = useCallback(async () => {
    if (!user || !note) {
      console.log("[Save] Skipping - user:", !!user, "note:", !!note)
      return
    }

    console.log("[Save] Starting save for note:", id)
    setIsSaving(true)
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled Note",
          content,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save note")
      }

      console.log("[Save] Success:", result.data)
      setHasChanges(false)
    } catch (err) {
      console.error("[Save] Error saving note:", err)
    } finally {
      setIsSaving(false)
    }
  }, [user, note, title, content, id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this note?")) return
    if (!user) return

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push(note?.folder_id ? `/app/folder/${note.folder_id}` : "/app")
      }
    } catch (err) {
      console.error("[Delete] Error:", err)
    }
  }

  // Auto-save on changes
  useEffect(() => {
    if (!hasChanges) return

    const timer = setTimeout(() => {
      handleSave()
    }, 2000)

    return () => clearTimeout(timer)
  }, [hasChanges, handleSave])

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className={isDark ? "text-gray-400 mb-4" : "text-gray-500 mb-4"}>Note not found</p>
          <Link href="/app" className="text-pink-500 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className={`flex items-center justify-between px-8 py-4 border-b backdrop-blur-sm ${
          isDark 
            ? "border-gray-700 bg-gray-800/80" 
            : "border-gray-100 bg-white/80"
        }`}>
          <Link
            href={note.folder_id ? `/app/folder/${note.folder_id}` : "/app"}
            className={`flex items-center gap-2 transition-colors ${
              isDark 
                ? "text-gray-400 hover:text-pink-400" 
                : "text-gray-600 hover:text-pink-600"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{isSaving ? "Saving..." : "Save"}</span>
            </button>
            <button
              onClick={handleDelete}
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? "text-gray-500 hover:text-red-400 hover:bg-red-900/30" 
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Note"
              className={`w-full text-4xl font-bold bg-transparent border-none outline-none mb-6 ${
                isDark 
                  ? "text-white placeholder:text-gray-600" 
                  : "text-gray-900 placeholder:text-gray-300"
              }`}
            />

            {/* Editor */}
            <Editor
              content={content}
              onChange={handleContentChange}
              placeholder="Start writing your thoughts..."
            />
          </div>
        </main>
      </div>

      {/* Floating Study Button */}
      <FloatingStudyButton onClick={() => setIsStudyPaneOpen(true)} />

      {/* Study Pane */}
      <StudyPane
        isOpen={isStudyPaneOpen}
        onClose={() => setIsStudyPaneOpen(false)}
        noteId={id}
        noteTitle={title || "Untitled Note"}
      />
    </div>
  )
}
