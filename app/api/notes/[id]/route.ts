import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { generateNoteEmbedding } from "@/lib/knowledge-graph"

// Create a Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Queue for background embedding generation
// This prevents blocking the response while generating embeddings
async function queueEmbeddingGeneration(noteId: string, title: string, content: string) {
  // Generate embedding in the background (fire and forget)
  generateNoteEmbedding(title, content).then(async (embedding) => {
    if (embedding) {
      await supabaseAdmin
        .from("notes")
        .update({
          embedding,
          embedding_updated_at: new Date().toISOString()
        })
        .eq("id", noteId)
      console.log(`[Embeddings] Generated embedding for note: ${noteId}`)
    }
  }).catch((error) => {
    console.error(`[Embeddings] Failed to generate embedding for note: ${noteId}`, error)
  })
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Fetch a single note
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  const { id } = await params
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("[API] Note fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 })
  }

  return NextResponse.json({ data })
}

// PATCH - Update a note
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  const { id } = await params
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { title, content, folder_id } = body

  // First verify the user owns this note
  const { data: existing } = await supabaseAdmin
    .from("notes")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content
  if (folder_id !== undefined) updates.folder_id = folder_id

  const { data, error } = await supabaseAdmin
    .from("notes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    console.error("[API] Note update error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If content was updated, regenerate the embedding in the background
  if (content !== undefined && data) {
    queueEmbeddingGeneration(data.id, data.title, data.content)
  }

  return NextResponse.json({ data })
}

// DELETE - Delete a note
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  const { id } = await params
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) {
    console.error("[API] Note delete error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

