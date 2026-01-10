"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Folder } from "lucide-react"
import { useUser } from "@clerk/nextjs"

interface NewFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onFolderCreated: () => void
}

export function NewFolderModal({ isOpen, onClose, onFolderCreated }: NewFolderModalProps) {
  const [folderName, setFolderName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useUser()

  const handleCreate = async () => {
    if (!folderName.trim()) {
      setError("Please enter a folder name")
      return
    }

    if (!user) {
      setError("You must be logged in to create a folder")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName.trim() }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create folder")
      }

      setFolderName("")
      onFolderCreated()
      onClose()
      // Reload to refresh all data on the page
      window.location.reload()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create folder"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFolderName("")
    setError("")
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
          <Folder className="w-8 h-8 text-pink-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Folder</h2>
        <p className="text-gray-500 mb-6">Organize your notes by creating a folder</p>

        <div className="w-full space-y-4">
          <div>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Enter folder name..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 py-3 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl"
              style={{ backgroundColor: "#FF79CB" }}
            >
              {isLoading ? "Creating..." : "Create Folder"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
