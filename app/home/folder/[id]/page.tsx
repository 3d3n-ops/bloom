"use client"

import { Sidebar } from "@/components/sidebar"
import Link from "next/link"
import { Plus, Loader2, ArrowLeft, Trash2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useNotes } from "@/hooks/use-notes"
import { useFolders } from "@/hooks/use-folders"
import { useSupabase } from "@/hooks/use-supabase"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Folder } from "@/lib/supabase/types"
import { NoteIcon } from "@/components/ui/notebook-icon"
import { useTheme } from "@/contexts/theme-context"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function FolderPage({ params }: PageProps) {
  const { id } = use(params)
  const { user, isLoaded } = useUser()
  const { notes, loading: notesLoading } = useNotes(id)
  const { deleteFolder } = useFolders()
  const supabase = useSupabase()
  const router = useRouter()
  const [folder, setFolder] = useState<Folder | null>(null)
  const [folderLoading, setFolderLoading] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  useEffect(() => {
    const fetchFolder = async () => {
      if (!user) return
      
      // RLS will automatically filter by user_id via auth.uid()
      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("id", id)
        .single()
      
      setFolder(data)
      setFolderLoading(false)
    }

    if (id && isLoaded && user) {
      fetchFolder()
    }
  }, [id, supabase, isLoaded, user])

  const handleDeleteFolder = async () => {
    if (confirm("Are you sure you want to delete this notebook? All notes inside will be moved to your space.")) {
      await deleteFolder(id)
      router.push("/home")
    }
  }

  if (!isLoaded || folderLoading) {
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/home"
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <ArrowLeft className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
              </Link>
              <h1 className={`text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {folder?.name || "Notebook"}
              </h1>
            </div>
            <button
              onClick={handleDeleteFolder}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? "text-gray-500 hover:text-red-400 hover:bg-red-900/30" 
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
              title="Delete notebook"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-6 flex-wrap">
            {/* New Note Button */}
            <Link href={`/home/note/new?folder=${id}`}>
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
                    <NoteIcon className="w-full h-full" priority={index === 0} />
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
            {notesLoading && (
              <div className="w-28 h-36 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
              </div>
            )}

            {/* Empty State */}
            {!notesLoading && notes.length === 0 && (
              <div className={`text-sm ml-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                No notes yet. Create your first note!
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
