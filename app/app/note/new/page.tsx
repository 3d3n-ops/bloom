"use client"

import { Sidebar } from "@/components/sidebar"
import { Editor } from "@/components/editor"
import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

function NewNoteContent() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const searchParams = useSearchParams()
  const folderId = searchParams.get("folder")
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const isCreatingRef = useRef(false)

  const handleSave = useCallback(async () => {
    if (!user || isCreatingRef.current) return
    
    isCreatingRef.current = true
    setIsSaving(true)
    
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled Note",
          content,
          folder_id: folderId,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to create note")
      }
      
      if (result.data) {
        router.push(`/app/note/${result.data.id}`)
      }
    } catch (err) {
      console.error("[NewNote] Error creating note:", err)
      isCreatingRef.current = false
    } finally {
      setIsSaving(false)
    }
  }, [user, title, content, folderId, router])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setHasChanges(true)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(true)
  }

  // Auto-save on changes
  useEffect(() => {
    if (!hasChanges || isCreatingRef.current) return

    const timer = setTimeout(() => {
      handleSave()
    }, 2000)

    return () => clearTimeout(timer)
  }, [hasChanges, handleSave])

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-white via-pink-50/30 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <Link
            href={folderId ? `/app/folder/${folderId}` : "/app"}
            className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-gray-400">Unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{isSaving ? "Saving..." : "Save"}</span>
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
              className="w-full text-4xl font-bold text-gray-900 bg-transparent border-none outline-none mb-6 placeholder:text-gray-300"
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
    </div>
  )
}

export default function NewNotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-white via-pink-50/30 to-white">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <NewNoteContent />
    </Suspense>
  )
}
