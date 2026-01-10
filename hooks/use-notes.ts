"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { Note } from "@/lib/supabase/types"

export function useNotes(folderId?: string | null) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoaded } = useUser()

  const fetchNotes = useCallback(async () => {
    if (!isLoaded || !user) {
      setNotes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (folderId !== undefined) {
        params.set("folderId", folderId === null ? "null" : folderId)
      }
      
      const response = await fetch(`/api/notes?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch notes")
      }
      
      setNotes(result.data || [])
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch notes"
      console.error("[useNotes] Fetch error:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, isLoaded, folderId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const createNote = async (title: string, content: string, noteFolderId?: string | null) => {
    if (!user) {
      return { error: new Error("Not authenticated"), data: null }
    }

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          folder_id: noteFolderId ?? null,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to create note")
      }
      
      if (result.data) {
        setNotes((prev) => [result.data, ...prev])
      }
      
      return { data: result.data, error: null }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create note"
      console.error("[useNotes] Create error:", errorMessage)
      return { error: new Error(errorMessage), data: null }
    }
  }

  const updateNote = async (id: string, updates: Partial<Pick<Note, "title" | "content" | "folder_id">>) => {
    if (!user) {
      return { error: new Error("Not authenticated"), data: null }
    }

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to update note")
      }
      
      if (result.data) {
        setNotes((prev) => prev.map((n) => (n.id === id ? result.data : n)))
      }
      
      return { data: result.data, error: null }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update note"
      console.error("[useNotes] Update error:", errorMessage)
      return { error: new Error(errorMessage), data: null }
    }
  }

  const deleteNote = async (id: string) => {
    if (!user) {
      return { error: new Error("Not authenticated") }
    }

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to delete note")
      }
      
      setNotes((prev) => prev.filter((n) => n.id !== id))
      return { error: null }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete note"
      console.error("[useNotes] Delete error:", errorMessage)
      return { error: new Error(errorMessage) }
    }
  }

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  }
}
