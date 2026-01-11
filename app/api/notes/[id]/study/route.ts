import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateStudyContent } from "@/lib/study-tools/note-study-generator"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/notes/[id]/study
 * 
 * Generates flashcards and quiz questions for a specific note
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    const { id: noteId } = await params
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the note and verify ownership (user_id stores the Clerk userId directly)
    const { data: note, error: noteError } = await supabaseAdmin
      .from("notes")
      .select("id, title, content, user_id")
      .eq("id", noteId)
      .eq("user_id", userId)
      .single()

    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    // Generate study content
    const studyContent = await generateStudyContent(
      note.title || "Untitled Note",
      note.content || ""
    )

    return NextResponse.json({
      success: true,
      data: studyContent
    })
  } catch (error) {
    console.error("[StudyRoute] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate study content" },
      { status: 500 }
    )
  }
}
