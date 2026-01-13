"use client"

import { Sidebar } from "@/components/sidebar"
import Link from "next/link"
import { Plus, Loader2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useFolders } from "@/hooks/use-folders"
import { useNotes } from "@/hooks/use-notes"
import { NotebookIcon, NoteIcon } from "@/components/ui/notebook-icon"
import { useTheme } from "@/contexts/theme-context"

export default function AppPage() {
  const { user, isLoaded } = useUser()
  const { folders, loading: foldersLoading } = useFolders()
  const { notes, loading: notesLoading } = useNotes(null)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const getUserName = () => {
    if (!user) return "My"
    if (user.firstName) {
      return user.firstName + "'s"
    }
    return "My"
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto p-8">
          <h1 className={`text-4xl font-bold mb-8 ${isDark ? "text-white" : "text-gray-900"}`}>
            {getUserName()} space
          </h1>
          
          {/* Notebooks Section (formerly Folders) */}
          {folders.length > 0 && (
            <div className="mb-10">
              <h2 className={`text-lg font-semibold mb-5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Notebooks
              </h2>
              <div className="flex gap-6 flex-wrap">
                {folders.map((folder, index) => (
                  <Link key={folder.id} href={`/home/folder/${folder.id}`}>
                    <div className="flex flex-col items-center gap-3 group cursor-pointer">
                      {/* Notebook Icon */}
                      <div className="w-28 h-36 transform transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
                        <NotebookIcon className="w-full h-full" priority={index === 0} />
                      </div>
                      {/* Title below */}
                      <span className={`text-sm font-medium text-center max-w-28 truncate transition-colors ${
                        isDark 
                          ? "text-gray-300 group-hover:text-pink-400" 
                          : "text-gray-700 group-hover:text-pink-600"
                      }`}>
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
            <h2 className={`text-lg font-semibold mb-5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Notes
            </h2>
            <div className="flex gap-6 flex-wrap">
              {/* New Note Button */}
              <Link href="/home/note/new">
                <div className="flex flex-col items-center gap-3 group cursor-pointer">
                  <div className={`
                    w-28 h-36 rounded-xl border-2 border-dashed flex items-center justify-center
                    transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1
                    ${isDark 
                      ? "border-gray-600 bg-gray-800/50 group-hover:border-pink-500 group-hover:bg-gray-700/50" 
                      : "border-gray-300 bg-white/50 group-hover:border-pink-400 group-hover:bg-pink-50"
                    }
                  `}>
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-colors
                      ${isDark 
                        ? "bg-gray-700 group-hover:bg-pink-900/50" 
                        : "bg-gray-100 group-hover:bg-pink-100"
                      }
                    `}>
                      <Plus className={`h-6 w-6 transition-colors ${
                        isDark 
                          ? "text-gray-400 group-hover:text-pink-400" 
                          : "text-gray-400 group-hover:text-pink-500"
                      }`} />
                    </div>
                  </div>
                  <span className={`text-sm font-medium transition-colors ${
                    isDark 
                      ? "text-gray-400 group-hover:text-pink-400" 
                      : "text-gray-600 group-hover:text-pink-600"
                  }`}>
                    New Note
                  </span>
                </div>
              </Link>

              {/* Existing Notes */}
              {notes.map((note, index) => (
                <Link key={note.id} href={`/home/note/${note.id}`}>
                  <div className="flex flex-col items-center gap-3 group cursor-pointer">
                    {/* Note Icon */}
                    <div className="w-28 h-36 transform transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
                      <NoteIcon className="w-full h-full" priority={folders.length === 0 && index === 0} />
                    </div>
                    {/* Title below */}
                    <span className={`text-sm font-medium text-center max-w-28 truncate transition-colors ${
                      isDark 
                        ? "text-gray-300 group-hover:text-pink-400" 
                        : "text-gray-700 group-hover:text-pink-600"
                    }`}>
                      {note.title || "Untitled"}
                    </span>
                  </div>
                </Link>
              ))}

              {/* Loading State */}
              {(foldersLoading || notesLoading) && (
                <div className="w-28 h-36 flex items-center justify-center">
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
