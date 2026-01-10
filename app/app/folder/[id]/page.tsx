"use client"

import { Sidebar } from "@/components/sidebar"
import Link from "next/link"
import { Plus, FileText, Loader2, ArrowLeft, Trash2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useNotes } from "@/hooks/use-notes"
import { useFolders } from "@/hooks/use-folders"
import { useSupabase } from "@/hooks/use-supabase"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Folder } from "@/lib/supabase/types"

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
    if (confirm("Are you sure you want to delete this folder? All notes inside will be moved to your space.")) {
      await deleteFolder(id)
      router.push("/app")
    }
  }

  if (!isLoaded || folderLoading) {
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-4xl font-bold text-gray-900">{folder?.name || "Folder"}</h1>
            </div>
            <button
              onClick={handleDeleteFolder}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete folder"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <Link href={`/app/note/new?folder=${id}`}>
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

            {notesLoading && (
              <div className="w-36 h-44 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
              </div>
            )}

            {!notesLoading && notes.length === 0 && (
              <div className="text-gray-400 text-sm ml-4">
                No notes yet. Create your first note!
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

