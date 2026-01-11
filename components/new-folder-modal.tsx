"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"

interface NewFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onFolderCreated: () => void
}

// Mini notebook icon for the modal
function MiniNotebookIcon() {
  return (
    <div className="relative w-10 h-12">
      {/* Book spine */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-800 rounded-l-sm" />
      
      {/* Main cover */}
      <div className="relative bg-gray-900 rounded-r-lg rounded-l-sm overflow-hidden shadow-lg ml-1 h-full">
        {/* Speckle pattern */}
        <div className="absolute inset-0 opacity-60">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        
        {/* Label area */}
        <div className="relative z-10 flex items-start justify-center pt-2 px-1">
          <div className="bg-white rounded w-full py-1 px-0.5">
            <div className="space-y-0.5">
              <div className="h-px bg-gray-200 w-full" />
              <div className="h-px bg-gray-200 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NewFolderModal({ isOpen, onClose, onFolderCreated }: NewFolderModalProps) {
  const [folderName, setFolderName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useUser()

  const handleCreate = async () => {
    if (!folderName.trim()) {
      setError("Please enter a notebook name")
      return
    }

    if (!user) {
      setError("You must be logged in to create a notebook")
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
        throw new Error(result.error || "Failed to create notebook")
      }

      setFolderName("")
      onFolderCreated()
      onClose()
      // Reload to refresh all data on the page
      window.location.reload()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create notebook"
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
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-pink-50 flex items-center justify-center mb-4 shadow-inner">
          <MiniNotebookIcon />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Notebook</h2>
        <p className="text-gray-500 mb-6">Organize your notes by creating a notebook</p>

        <div className="w-full space-y-4">
          <div>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Enter notebook name..."
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
              {isLoading ? "Creating..." : "Create Notebook"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
