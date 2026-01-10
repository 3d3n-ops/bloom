import { NextResponse } from "next/server"
import { cleanupExpiredContent } from "@/lib/study-tools/generator"

/**
 * POST /api/study-tools/cleanup
 * 
 * Cleanup expired flashcards and quizzes (older than 14 days).
 * This endpoint can be called by a cron job (e.g., Vercel Cron, GitHub Actions).
 * 
 * For security, you should add a secret header check in production:
 * headers: { "Authorization": "Bearer YOUR_CRON_SECRET" }
 */
export async function POST(req: Request) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await cleanupExpiredContent()

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.flashcards} flashcards and ${result.quizzes} quizzes`,
      ...result
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/study-tools/cleanup
 * 
 * Check how many items would be cleaned up
 */
export async function GET() {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date().toISOString()

    const { count: flashcardsCount } = await supabaseAdmin
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .lt("expires_at", now)

    const { count: quizzesCount } = await supabaseAdmin
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .lt("expires_at", now)

    return NextResponse.json({
      expiredFlashcards: flashcardsCount || 0,
      expiredQuizzes: quizzesCount || 0
    })
  } catch (error) {
    console.error("Cleanup check error:", error)
    return NextResponse.json({ error: "Check failed" }, { status: 500 })
  }
}

