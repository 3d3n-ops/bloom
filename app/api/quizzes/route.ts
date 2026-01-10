import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/quizzes
 * Get all quizzes for the current user
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: quizzes, error } = await supabaseAdmin
      .from("quizzes")
      .select(`
        id,
        title,
        description,
        question_count,
        created_at,
        expires_at,
        note_id,
        notes (
          title
        )
      `)
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching quizzes:", error)
      return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 })
    }

    // Transform to include note title at top level
    const transformedQuizzes = (quizzes || []).map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questionCount: quiz.question_count,
      createdAt: quiz.created_at,
      expiresAt: quiz.expires_at,
      noteTitle: (quiz.notes as unknown as { title: string } | null)?.title || null,
    }))

    return NextResponse.json({ quizzes: transformedQuizzes })
  } catch (error) {
    console.error("Error in quizzes GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/quizzes
 * Delete all quizzes for the current user
 */
export async function DELETE() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete quizzes (cascade deletes questions)
    const { error } = await supabaseAdmin
      .from("quizzes")
      .delete()
      .eq("user_id", userId)

    if (error) {
      console.error("Error deleting quizzes:", error)
      return NextResponse.json({ error: "Failed to delete quizzes" }, { status: 500 })
    }

    // Reset quiz generation timestamps
    await supabaseAdmin
      .from("notes")
      .update({ quizzes_generated_at: null })
      .eq("user_id", userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in quizzes DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

