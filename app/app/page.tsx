"use client"

import { Sidebar } from "@/components/sidebar"
import Link from "next/link"
import { Plus, Folder, FileText, Loader2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useFolders } from "@/hooks/use-folders"
import { useNotes } from "@/hooks/use-notes"

export default function AppPage() {
  const { user, isLoaded } = useUser()
  const { folders, loading: foldersLoading } = useFolders()
  const { notes, loading: notesLoading } = useNotes(null) // Notes without folder

  const getUserName = () => {
    if (!user) return "My"
    if (user.firstName) {
      return user.firstName + "'s"
    }
    return "My"
  }

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
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{getUserName()} space</h1>
          
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Folders</h2>
              <div className="flex gap-4 flex-wrap">
                {folders.map((folder) => (
                  <Link key={folder.id} href={`/app/folder/${folder.id}`}>
                    <div className="w-36 h-36 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-pink-400 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-pink-50 group-hover:bg-pink-100 flex items-center justify-center transition-colors">
                        <Folder className="h-6 w-6 text-pink-400 group-hover:text-pink-500 transition-colors" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium text-center px-2 truncate w-full">
                        {folder.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Notes</h2>
            <div className="flex gap-4 flex-wrap">
              <Link href="/app/note/new">
                <button className="w-36 h-44 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-pink-400 hover:bg-pink-50 hover:shadow-lg transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-pink-100 flex items-center justify-center transition-colors">
                    <Plus className="h-6 w-6 text-gray-400 group-hover:text-pink-500 transition-colors" />
                  </div>
                  <span className="text-sm text-gray-600 font-medium group-hover:text-pink-600 transition-colors">New Note</span>
                </button>
              </Link>

              {notes.map((note) => (
                <Link key={note.id} href={`/app/note/${note.id}`}>
                  <div className="w-36 h-44 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-pink-400 hover:shadow-lg transition-all duration-300 group cursor-pointer p-4">
                    <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-pink-50 flex items-center justify-center transition-colors">
                      <FileText className="h-6 w-6 text-gray-400 group-hover:text-pink-500 transition-colors" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium text-center truncate w-full">
                      {note.title || "Untitled"}
                    </span>
                  </div>
                </Link>
              ))}

              {(foldersLoading || notesLoading) && (
                <div className="w-36 h-44 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

