import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/flashcards - Get all flashcards for the current user
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: flashcards, error } = await supabaseAdmin
      .from("flashcards")
      .select(`
        id,
        front,
        back,
        difficulty,
        next_review,
        created_at,
        note_id,
        notes (
          title
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching flashcards:", error)
      return NextResponse.json({ error: "Failed to fetch flashcards" }, { status: 500 })
    }

    // Transform to include note title at top level
    const transformedFlashcards = (flashcards || []).map(card => ({
      id: card.id,
      front: card.front,
      back: card.back,
      difficulty: card.difficulty,
      next_review: card.next_review,
      created_at: card.created_at,
      noteTitle: (card.notes as unknown as { title: string } | null)?.title || null,
    }))

    return NextResponse.json({ flashcards: transformedFlashcards })
  } catch (error) {
    console.error("Error in flashcards GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/flashcards - Create a new flashcard
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { front, back, noteId } = body

    if (!front || !back) {
      return NextResponse.json({ error: "Front and back are required" }, { status: 400 })
    }

    const { data: flashcard, error } = await supabaseAdmin
      .from("flashcards")
      .insert({
        user_id: userId,
        front,
        back,
        note_id: noteId || null,
        difficulty: "new",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating flashcard:", error)
      return NextResponse.json({ error: "Failed to create flashcard" }, { status: 500 })
    }

    return NextResponse.json({ flashcard })
  } catch (error) {
    console.error("Error in flashcards POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/flashcards - Delete all flashcards for the user
export async function DELETE() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from("flashcards")
      .delete()
      .eq("user_id", userId)

    if (error) {
      console.error("Error deleting flashcards:", error)
      return NextResponse.json({ error: "Failed to delete flashcards" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in flashcards DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
