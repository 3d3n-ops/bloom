/**
 * Knowledge Graph API
 * 
 * Returns graph data (nodes and edges) for visualization.
 * Computes connections based on embedding similarity.
 */

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { computeConnections, type NoteWithEmbedding } from "@/lib/knowledge-graph"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface GraphNode {
  id: string
  title: string
  folderId: string | null
  folderName: string | null
  hasEmbedding: boolean
  connectionCount: number
}

export interface GraphEdge {
  source: string
  target: string
  similarity: number
  strength: "strong" | "moderate" | "weak"
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    totalNotes: number
    notesWithEmbeddings: number
    totalConnections: number
    strongConnections: number
  }
}

// GET - Fetch graph data for the authenticated user
export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch all notes with their embeddings and folder info
    const { data: notes, error: notesError } = await supabaseAdmin
      .from("notes")
      .select(`
        id,
        title,
        folder_id,
        embedding,
        folders (
          name
        )
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (notesError) {
      console.error("[Graph API] Notes fetch error:", notesError)
      return NextResponse.json({ error: notesError.message }, { status: 500 })
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json({
        nodes: [],
        edges: [],
        stats: {
          totalNotes: 0,
          notesWithEmbeddings: 0,
          totalConnections: 0,
          strongConnections: 0
        }
      } satisfies GraphData)
    }

    // Prepare notes for connection computation
    const notesWithEmbeddings: NoteWithEmbedding[] = notes.map(note => ({
      id: note.id,
      title: note.title,
      folder_id: note.folder_id,
      embedding: note.embedding as number[] | null
    }))

    // Compute connections
    const connections = computeConnections(notesWithEmbeddings)

    // Count connections per node
    const connectionCounts = new Map<string, number>()
    for (const conn of connections) {
      connectionCounts.set(conn.source, (connectionCounts.get(conn.source) || 0) + 1)
      connectionCounts.set(conn.target, (connectionCounts.get(conn.target) || 0) + 1)
    }

    // Build graph nodes
    const graphNodes: GraphNode[] = notes.map(note => {
      // Handle folders relation - Supabase returns object for many-to-one relations
      const folder = note.folders as unknown as { name: string } | null
      return {
        id: note.id,
        title: note.title,
        folderId: note.folder_id,
        folderName: folder?.name || null,
        hasEmbedding: !!note.embedding,
        connectionCount: connectionCounts.get(note.id) || 0
      }
    })

    // Build graph edges
    const graphEdges: GraphEdge[] = connections.map(conn => ({
      source: conn.source,
      target: conn.target,
      similarity: Math.round(conn.similarity * 100) / 100,
      strength: conn.strength
    }))

    // Compute stats
    const stats = {
      totalNotes: notes.length,
      notesWithEmbeddings: notes.filter(n => n.embedding).length,
      totalConnections: connections.length,
      strongConnections: connections.filter(c => c.strength === "strong").length
    }

    return NextResponse.json({
      nodes: graphNodes,
      edges: graphEdges,
      stats
    } satisfies GraphData)
  } catch (error) {
    console.error("[Graph API] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate graph data" },
      { status: 500 }
    )
  }
}

