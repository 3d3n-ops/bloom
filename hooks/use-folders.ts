"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { Folder } from "@/lib/supabase/types"

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoaded } = useUser()

  const fetchFolders = useCallback(async () => {
    if (!isLoaded || !user) {
      setFolders([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/folders")
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch folders")
      }
      
      setFolders(result.data || [])
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch folders"
      console.error("[useFolders] Fetch error:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, isLoaded])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  const createFolder = async (name: string) => {
    if (!user) {
      return { error: new Error("Not authenticated"), data: null }
    }

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to create folder")
      }
      
      if (result.data) {
        setFolders((prev) => [result.data, ...prev])
      }
      
      return { data: result.data, error: null }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create folder"
      console.error("[useFolders] Create error:", errorMessage)
      return { error: new Error(errorMessage), data: null }
    }
  }

  const deleteFolder = async (id: string) => {
    if (!user) {
      return { error: new Error("Not authenticated") }
    }

    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to delete folder")
      }
      
      setFolders((prev) => prev.filter((f) => f.id !== id))
      return { error: null }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete folder"
      console.error("[useFolders] Delete error:", errorMessage)
      return { error: new Error(errorMessage) }
    }
  }

  return {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    deleteFolder,
  }
}
