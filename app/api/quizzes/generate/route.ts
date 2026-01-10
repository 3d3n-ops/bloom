import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { generateQuizzesStream, getNotesNeedingQuizzes } from "@/lib/study-tools/generator"

/**
 * POST /api/quizzes/generate
 * 
 * Generates quizzes for all notes that haven't been processed yet.
 * Supports streaming for real-time progress updates.
 * 
 * Query params:
 * - stream=true: Returns Server-Sent Events for progress updates
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const useStreaming = searchParams.get("stream") === "true"

    if (useStreaming) {
      // Streaming response using Server-Sent Events
      const encoder = new TextEncoder()
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const progress of generateQuizzesStream(userId)) {
              const data = JSON.stringify(progress)
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
            controller.close()
          } catch (error) {
            console.error("Streaming error:", error)
            const errorData = JSON.stringify({ 
              error: error instanceof Error ? error.message : "Generation failed" 
            })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      })
    }

    // Non-streaming: Process all and return final result
    const notes = await getNotesNeedingQuizzes(userId)
    
    if (notes.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "All notes already have quizzes generated",
        total: 0,
        completed: 0,
        results: []
      })
    }

    // Collect all results
    let finalProgress = { total: 0, completed: 0, results: [] as any[] }
    
    for await (const progress of generateQuizzesStream(userId)) {
      finalProgress = progress
    }

    const successCount = finalProgress.results.filter(r => r.success).length
    const totalQuestions = finalProgress.results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.count || 0), 0)

    return NextResponse.json({ 
      success: true, 
      message: `Generated ${successCount} quizzes with ${totalQuestions} questions`,
      ...finalProgress
    })
  } catch (error) {
    console.error("Error in quizzes generate:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate quizzes" }, 
      { status: 500 }
    )
  }
}

/**
 * GET /api/quizzes/generate
 * 
 * Check how many notes need quiz generation
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notes = await getNotesNeedingQuizzes(userId)
    
    return NextResponse.json({ 
      pendingNotes: notes.length,
      notes: notes.map(n => ({ id: n.id, title: n.title }))
    })
  } catch (error) {
    console.error("Error checking pending quizzes:", error)
    return NextResponse.json({ error: "Failed to check pending notes" }, { status: 500 })
  }
}

