/**
 * Knowledge Graph Embedding Service
 * 
 * Uses OpenRouter's thenlper/gte-base model for generating embeddings.
 * GTE-base produces 768-dimensional embeddings optimized for semantic similarity.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/embeddings"
const EMBEDDING_MODEL = "thenlper/gte-base"
const EMBEDDING_DIMENSIONS = 768

/**
 * Strip HTML tags from content for cleaner embedding generation
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Generate an embedding for a piece of text using OpenRouter
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.error("[Embeddings] OPENROUTER_API_KEY not configured")
    return null
  }

  // Clean and truncate text (gte-base has ~512 token limit)
  const cleanText = stripHtml(text).slice(0, 2000)
  
  if (cleanText.length < 10) {
    console.warn("[Embeddings] Text too short for embedding")
    return null
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Bloom Notes"
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: cleanText
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[Embeddings] OpenRouter API error:", error)
      return null
    }

    const data = await response.json()
    const embedding = data.data?.[0]?.embedding

    if (!embedding || !Array.isArray(embedding)) {
      console.error("[Embeddings] Invalid response format:", data)
      return null
    }

    return embedding
  } catch (error) {
    console.error("[Embeddings] Failed to generate embedding:", error)
    return null
  }
}

/**
 * Generate embedding for a note (title + content combined)
 */
export async function generateNoteEmbedding(
  title: string,
  content: string
): Promise<number[] | null> {
  // Combine title and content with title weighted more heavily
  const text = `${title}\n\n${title}\n\n${content}`
  return generateEmbedding(text)
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    console.error("[Embeddings] Vector dimension mismatch:", a.length, "vs", b.length)
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
  
  if (magnitude === 0) return 0
  
  return dotProduct / magnitude
}

/**
 * Find connections between notes based on embedding similarity
 */
export interface NoteWithEmbedding {
  id: string
  title: string
  folder_id: string | null
  embedding: number[] | null
}

export interface Connection {
  source: string
  target: string
  similarity: number
  strength: "strong" | "moderate" | "weak"
}

/**
 * Compute all connections between notes above a similarity threshold
 */
export function computeConnections(
  notes: NoteWithEmbedding[],
  options: {
    minSimilarity?: number
    strongThreshold?: number
    moderateThreshold?: number
    folderBoost?: number
  } = {}
): Connection[] {
  const {
    minSimilarity = 0.45,
    strongThreshold = 0.75,
    moderateThreshold = 0.60,
    folderBoost = 0.03
  } = options

  const connections: Connection[] = []
  const notesWithEmbeddings = notes.filter(n => n.embedding && n.embedding.length > 0)

  // Compare each pair of notes
  for (let i = 0; i < notesWithEmbeddings.length; i++) {
    for (let j = i + 1; j < notesWithEmbeddings.length; j++) {
      const noteA = notesWithEmbeddings[i]
      const noteB = notesWithEmbeddings[j]

      let similarity = cosineSimilarity(noteA.embedding!, noteB.embedding!)

      // Apply folder boost if notes are in the same folder
      if (noteA.folder_id && noteA.folder_id === noteB.folder_id) {
        similarity = Math.min(1, similarity + folderBoost)
      }

      // Only include connections above threshold
      if (similarity >= minSimilarity) {
        let strength: Connection["strength"]
        if (similarity >= strongThreshold) {
          strength = "strong"
        } else if (similarity >= moderateThreshold) {
          strength = "moderate"
        } else {
          strength = "weak"
        }

        connections.push({
          source: noteA.id,
          target: noteB.id,
          similarity,
          strength
        })
      }
    }
  }

  // Sort by similarity descending
  return connections.sort((a, b) => b.similarity - a.similarity)
}

export { EMBEDDING_DIMENSIONS }

