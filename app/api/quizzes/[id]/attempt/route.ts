import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AttemptAnswer {
  questionId: string
  selectedIndex: number
}

/**
 * POST /api/quizzes/[id]/attempt
 * Submit a quiz attempt and get results
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: quizId } = await params
    const body = await req.json()
    const { answers } = body as { answers: AttemptAnswer[] }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 })
    }

    // Verify quiz belongs to user
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from("quizzes")
      .select("id, question_count")
      .eq("id", quizId)
      .eq("user_id", userId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Fetch correct answers
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("quiz_questions")
      .select("id, correct_index, explanation")
      .eq("quiz_id", quizId)

    if (questionsError || !questions) {
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
    }

    // Grade the quiz
    const questionMap = new Map(questions.map(q => [q.id, q]))
    let score = 0
    const gradedAnswers = answers.map(answer => {
      const question = questionMap.get(answer.questionId)
      const isCorrect = question?.correct_index === answer.selectedIndex
      if (isCorrect) score++
      
      return {
        question_id: answer.questionId,
        selected_index: answer.selectedIndex,
        correct_index: question?.correct_index,
        correct: isCorrect,
        explanation: question?.explanation
      }
    })

    // Save attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("quiz_attempts")
      .insert({
        user_id: userId,
        quiz_id: quizId,
        score,
        total_questions: questions.length,
        answers: gradedAnswers
      })
      .select()
      .single()

    if (attemptError) {
      console.error("Error saving attempt:", attemptError)
      return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 })
    }

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      answers: gradedAnswers
    })
  } catch (error) {
    console.error("Error in quiz attempt:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET /api/quizzes/[id]/attempt
 * Get previous attempts for a quiz
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

    const { id: quizId } = await params

    const { data: attempts, error } = await supabaseAdmin
      .from("quiz_attempts")
      .select("id, score, total_questions, completed_at")
      .eq("quiz_id", quizId)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })

    if (error) {
      console.error("Error fetching attempts:", error)
      return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 })
    }

    return NextResponse.json({
      attempts: (attempts || []).map(a => ({
        id: a.id,
        score: a.score,
        totalQuestions: a.total_questions,
        percentage: Math.round((a.score / a.total_questions) * 100),
        completedAt: a.completed_at
      }))
    })
  } catch (error) {
    console.error("Error in quiz attempts GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

