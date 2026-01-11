/**
 * Embedding Generation API
 * 
 * Generates embeddings for notes that don't have them yet.
 * Can process a single note or batch process all notes.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { generateNoteEmbedding, stripHtml } from "@/lib/knowledge-graph"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EmbeddingResult {
  noteId: string
  noteTitle: string
  success: boolean
  error?: string
}

// POST - Generate embeddings for notes
export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { noteId, batchAll } = body as { noteId?: string; batchAll?: boolean }

  try {
    let notesToProcess: Array<{ id: string; title: string; content: string }>

    if (noteId) {
      // Process a single note
      const { data: note, error } = await supabaseAdmin
        .from("notes")
        .select("id, title, content")
        .eq("id", noteId)
        .eq("user_id", userId)
        .single()

      if (error || !note) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 })
      }

      notesToProcess = [note]
    } else if (batchAll) {
      // Process all notes without embeddings
      const { data: notes, error } = await supabaseAdmin
        .from("notes")
        .select("id, title, content")
        .eq("user_id", userId)
        .is("embedding", null)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("[Embed API] Fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      notesToProcess = notes || []
    } else {
      return NextResponse.json(
        { error: "Must provide noteId or batchAll: true" },
        { status: 400 }
      )
    }

    if (notesToProcess.length === 0) {
      return NextResponse.json({
        message: "No notes to process",
        results: [],
        processed: 0,
        failed: 0
      })
    }

    // Process notes (with rate limiting for batch)
    const results: EmbeddingResult[] = []
    const batchSize = 5
    const delayMs = 200 // Small delay between batches to avoid rate limits

    for (let i = 0; i < notesToProcess.length; i += batchSize) {
      const batch = notesToProcess.slice(i, i + batchSize)

      const batchResults = await Promise.all(
        batch.map(async (note): Promise<EmbeddingResult> => {
          // Skip notes with insufficient content
          const cleanContent = stripHtml(note.content || "")
          if (cleanContent.length < 20) {
            return {
              noteId: note.id,
              noteTitle: note.title,
              success: false,
              error: "Content too short"
            }
          }

          // Generate embedding
          const embedding = await generateNoteEmbedding(note.title, note.content)

          if (!embedding) {
            return {
              noteId: note.id,
              noteTitle: note.title,
              success: false,
              error: "Failed to generate embedding"
            }
          }

          // Store embedding
          const { error: updateError } = await supabaseAdmin
            .from("notes")
            .update({
              embedding,
              embedding_updated_at: new Date().toISOString()
            })
            .eq("id", note.id)

          if (updateError) {
            console.error("[Embed API] Update error:", updateError)
            return {
              noteId: note.id,
              noteTitle: note.title,
              success: false,
              error: "Failed to save embedding"
            }
          }

          return {
            noteId: note.id,
            noteTitle: note.title,
            success: true
          }
        })
      )

      results.push(...batchResults)

      // Add delay between batches for rate limiting
      if (i + batchSize < notesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    const processed = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Processed ${processed} notes, ${failed} failed`,
      results,
      processed,
      failed
    })
  } catch (error) {
    console.error("[Embed API] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate embeddings" },
      { status: 500 }
    )
  }
}

