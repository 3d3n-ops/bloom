import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH /api/flashcards/[id] - Update a flashcard (difficulty, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { difficulty, front, back } = body

    const updates: Record<string, string> = {}
    if (difficulty) updates.difficulty = difficulty
    if (front) updates.front = front
    if (back) updates.back = back

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    const { data: flashcard, error } = await supabaseAdmin
      .from("flashcards")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating flashcard:", error)
      return NextResponse.json({ error: "Failed to update flashcard" }, { status: 500 })
    }

    return NextResponse.json({ flashcard })
  } catch (error) {
    console.error("Error in flashcard PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/flashcards/[id] - Delete a specific flashcard
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

    const { error } = await supabaseAdmin
      .from("flashcards")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Error deleting flashcard:", error)
      return NextResponse.json({ error: "Failed to delete flashcard" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in flashcard DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
