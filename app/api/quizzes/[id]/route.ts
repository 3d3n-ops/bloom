import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/quizzes/[id]
 * Get a specific quiz with all its questions
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabaseAdmin
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
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("quiz_questions")
      .select("id, question, options, correct_index, difficulty, explanation, order_index")
      .eq("quiz_id", id)
      .order("order_index", { ascending: true })

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questionCount: quiz.question_count,
        createdAt: quiz.created_at,
        expiresAt: quiz.expires_at,
        noteTitle: (quiz.notes as unknown as { title: string } | null)?.title || null,
      },
      questions: questions || []
    })
  } catch (error) {
    console.error("Error in quiz GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/quizzes/[id]
 * Delete a specific quiz
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get quiz's note_id before deleting
    const { data: quiz } = await supabaseAdmin
      .from("quizzes")
      .select("note_id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    // Delete quiz (cascade deletes questions)
    const { error } = await supabaseAdmin
      .from("quizzes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Error deleting quiz:", error)
      return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 })
    }

    // Reset quiz generation timestamp for the note
    if (quiz?.note_id) {
      await supabaseAdmin
        .from("notes")
        .update({ quizzes_generated_at: null })
        .eq("id", quiz.note_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in quiz DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

