/**
 * Study Tools Generator Service
 * 
 * Efficiently generates flashcards and quizzes from notes using Groq.
 * Features:
 * - Batch processing with concurrency control
 * - Only processes new/updated notes
 * - 14-day expiry for generated content
 * - Streaming results for better UX
 */

import Groq from "groq-sdk"
import { createClient } from "@supabase/supabase-js"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Use fast, cheap model for generation
const MODEL = "llama-3.1-8b-instant" // Faster and cheaper than 70b

// Types
interface Note {
  id: string
  title: string
  content: string
}

interface GeneratedFlashcard {
  front: string
  back: string
}

interface GeneratedQuizQuestion {
  question: string
  options: string[]
  correct_index: number
  difficulty: "easy" | "medium" | "hard"
  explanation: string
}

interface GenerationResult {
  noteId: string
  noteTitle: string
  success: boolean
  error?: string
  count?: number
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Strip HTML tags from content for cleaner AI processing
 */
function stripHtml(html: string): string {
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
 * Parse JSON from AI response, handling common issues
 */
function parseAIResponse<T>(response: string): T | null {
  try {
    // Try to extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response)
  } catch {
    console.error("Failed to parse AI response:", response.slice(0, 200))
    return null
  }
}

/**
 * Process items with controlled concurrency
 */
async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []

  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result)
    })
    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      // Remove completed promises
      const completed = executing.filter(p => {
        // Check if promise is settled by racing with immediate resolve
        let settled = false
        Promise.race([p, Promise.resolve("pending")]).then(v => {
          if (v !== "pending") settled = true
        })
        return !settled
      })
      executing.length = 0
      executing.push(...completed)
    }
  }

  await Promise.all(executing)
  return results
}

// =============================================================================
// FLASHCARD GENERATION
// =============================================================================

/**
 * Generate flashcards for a single note
 */
async function generateFlashcardsForNote(
  note: Note,
  userId: string
): Promise<GenerationResult> {
  const cleanContent = stripHtml(note.content)
  
  if (cleanContent.length < 50) {
    return {
      noteId: note.id,
      noteTitle: note.title,
      success: false,
      error: "Note content too short"
    }
  }

  const prompt = `Generate 7-10 flashcards from these study notes. Create cards that test understanding of key concepts, definitions, and facts.

NOTES TITLE: ${note.title}
NOTES CONTENT:
${cleanContent.slice(0, 4000)}

OUTPUT FORMAT: Return ONLY a JSON array of objects with "front" (question) and "back" (answer) fields.
Example: [{"front": "What is X?", "back": "X is..."}]

Generate high-quality, study-worthy flashcards now:`

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a study assistant. Generate concise, effective flashcards. Output only valid JSON arrays."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ""
    const flashcards = parseAIResponse<GeneratedFlashcard[]>(content)

    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return {
        noteId: note.id,
        noteTitle: note.title,
        success: false,
        error: "Failed to parse flashcards"
      }
    }

    // Validate and insert flashcards
    const validFlashcards = flashcards
      .filter(f => f.front && f.back)
      .slice(0, 10) // Max 10 per note
      .map(f => ({
        user_id: userId,
        note_id: note.id,
        front: f.front.trim(),
        back: f.back.trim(),
        difficulty: "new" as const,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }))

    if (validFlashcards.length === 0) {
      return {
        noteId: note.id,
        noteTitle: note.title,
        success: false,
        error: "No valid flashcards generated"
      }
    }

    // Insert flashcards
    const { error: insertError } = await supabaseAdmin
      .from("flashcards")
      .insert(validFlashcards)

    if (insertError) {
      console.error("Failed to insert flashcards:", insertError)
      return {
        noteId: note.id,
        noteTitle: note.title,
        success: false,
        error: "Database error"
      }
    }

    // Update note's generation timestamp
    await supabaseAdmin
      .from("notes")
      .update({ flashcards_generated_at: new Date().toISOString() })
      .eq("id", note.id)

    return {
      noteId: note.id,
      noteTitle: note.title,
      success: true,
      count: validFlashcards.length
    }
  } catch (error) {
    console.error("Flashcard generation error for note:", note.id, error)
    return {
      noteId: note.id,
      noteTitle: note.title,
      success: false,
      error: error instanceof Error ? error.message : "Generation failed"
    }
  }
}

// =============================================================================
// QUIZ GENERATION
// =============================================================================

/**
 * Generate quiz for a single note
 */
async function generateQuizForNote(
  note: Note,
  userId: string
): Promise<GenerationResult> {
  const cleanContent = stripHtml(note.content)
  
  if (cleanContent.length < 50) {
    return {
      noteId: note.id,
      noteTitle: note.title,
      success: false,
      error: "Note content too short"
    }
  }

  const prompt = `Create a quiz with 7-10 multiple choice questions from these study notes. Include a mix of easy, medium, and hard questions.

NOTES TITLE: ${note.title}
NOTES CONTENT:
${cleanContent.slice(0, 4000)}

OUTPUT FORMAT: Return ONLY a JSON array of question objects with these fields:
- "question": The question text
- "options": Array of exactly 4 answer choices
- "correct_index": Index (0-3) of the correct answer
- "difficulty": "easy", "medium", or "hard"
- "explanation": Brief explanation of why the answer is correct

Example:
[{
  "question": "What is the capital of France?",
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "correct_index": 1,
  "difficulty": "easy",
  "explanation": "Paris is the capital and largest city of France."
}]

Generate the quiz now:`

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a quiz creator. Generate challenging but fair multiple choice questions. Output only valid JSON arrays."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 3000,
    })

    const content = response.choices[0]?.message?.content || ""
    const questions = parseAIResponse<GeneratedQuizQuestion[]>(content)

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return {
        noteId: note.id,
        noteTitle: note.title,
        success: false,
        error: "Failed to parse quiz questions"
      }
    }

    // Validate questions
    const validQuestions = questions
      .filter(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        typeof q.correct_index === "number" &&
        q.correct_index >= 0 && 
        q.correct_index <= 3 &&
        ["easy", "medium", "hard"].includes(q.difficulty)
      )
      .slice(0, 10) // Max 10 per note

    if (validQuestions.length === 0) {
      return {
        noteId: note.id,
        noteTitle: note.title,
        success: false,
        error: "No valid questions generated"
      }
    }

    // Create quiz
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from("quizzes")
      .insert({
        user_id: userId,
        note_id: note.id,
        title: `Quiz: ${note.title}`,
        description: `Test your knowledge of "${note.title}"`,
        question_count: validQuestions.length,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (quizError || !quiz) {
      console.error("Failed to create quiz:", quizError)
      return {
        noteId: note.id,
        noteTitle: note.title,
        success: false,
        error: "Database error"
      }
    }

    // Insert questions
    const questionsToInsert = validQuestions.map((q, index) => ({
      quiz_id: quiz.id,
      question: q.question.trim(),
      options: q.options,
      correct_index: q.correct_index,
      difficulty: q.difficulty,
      explanation: q.explanation?.trim() || null,
      order_index: index
    }))

    const { error: questionsError } = await supabaseAdmin
      .from("quiz_questions")
      .insert(questionsToInsert)

    if (questionsError) {
      console.error("Failed to insert questions:", questionsError)
      // Cleanup the quiz
      await supabaseAdmin.from("quizzes").delete().eq("id", quiz.id)
      return {
        noteId: note.id,
        noteTitle: note.title,
        success: false,
        error: "Failed to save questions"
      }
    }

    // Update note's generation timestamp
    await supabaseAdmin
      .from("notes")
      .update({ quizzes_generated_at: new Date().toISOString() })
      .eq("id", note.id)

    return {
      noteId: note.id,
      noteTitle: note.title,
      success: true,
      count: validQuestions.length
    }
  } catch (error) {
    console.error("Quiz generation error for note:", note.id, error)
    return {
      noteId: note.id,
      noteTitle: note.title,
      success: false,
      error: error instanceof Error ? error.message : "Generation failed"
    }
  }
}

// =============================================================================
// MAIN GENERATION FUNCTIONS
// =============================================================================

export interface GenerationProgress {
  total: number
  completed: number
  results: GenerationResult[]
}

/**
 * Get notes that need flashcard generation
 */
export async function getNotesNeedingFlashcards(userId: string): Promise<Note[]> {
  const { data: notes, error } = await supabaseAdmin
    .from("notes")
    .select("id, title, content, updated_at, flashcards_generated_at")
    .eq("user_id", userId)
    .or("flashcards_generated_at.is.null,flashcards_generated_at.lt.updated_at")
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching notes for flashcards:", error)
    return []
  }

  // Filter notes with sufficient content
  return (notes || []).filter(note => 
    note.content && stripHtml(note.content).length >= 50
  )
}

/**
 * Get notes that need quiz generation
 */
export async function getNotesNeedingQuizzes(userId: string): Promise<Note[]> {
  const { data: notes, error } = await supabaseAdmin
    .from("notes")
    .select("id, title, content, updated_at, quizzes_generated_at")
    .eq("user_id", userId)
    .or("quizzes_generated_at.is.null,quizzes_generated_at.lt.updated_at")
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching notes for quizzes:", error)
    return []
  }

  return (notes || []).filter(note => 
    note.content && stripHtml(note.content).length >= 50
  )
}

/**
 * Generate flashcards for all unprocessed notes
 * Returns a generator for streaming results
 */
export async function* generateFlashcardsStream(
  userId: string,
  concurrency: number = 2
): AsyncGenerator<GenerationProgress> {
  const notes = await getNotesNeedingFlashcards(userId)
  
  if (notes.length === 0) {
    yield { total: 0, completed: 0, results: [] }
    return
  }

  const results: GenerationResult[] = []
  let completed = 0

  // Process in batches
  for (let i = 0; i < notes.length; i += concurrency) {
    const batch = notes.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(note => generateFlashcardsForNote(note, userId))
    )
    
    results.push(...batchResults)
    completed += batchResults.length

    yield {
      total: notes.length,
      completed,
      results: [...results]
    }
  }
}

/**
 * Generate quizzes for all unprocessed notes
 * Returns a generator for streaming results
 */
export async function* generateQuizzesStream(
  userId: string,
  concurrency: number = 2
): AsyncGenerator<GenerationProgress> {
  const notes = await getNotesNeedingQuizzes(userId)
  
  if (notes.length === 0) {
    yield { total: 0, completed: 0, results: [] }
    return
  }

  const results: GenerationResult[] = []
  let completed = 0

  // Process in batches
  for (let i = 0; i < notes.length; i += concurrency) {
    const batch = notes.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(note => generateQuizForNote(note, userId))
    )
    
    results.push(...batchResults)
    completed += batchResults.length

    yield {
      total: notes.length,
      completed,
      results: [...results]
    }
  }
}

/**
 * Simple non-streaming generation for flashcards
 */
export async function generateAllFlashcards(userId: string): Promise<GenerationProgress> {
  let lastProgress: GenerationProgress = { total: 0, completed: 0, results: [] }
  
  for await (const progress of generateFlashcardsStream(userId)) {
    lastProgress = progress
  }
  
  return lastProgress
}

/**
 * Simple non-streaming generation for quizzes
 */
export async function generateAllQuizzes(userId: string): Promise<GenerationProgress> {
  let lastProgress: GenerationProgress = { total: 0, completed: 0, results: [] }
  
  for await (const progress of generateQuizzesStream(userId)) {
    lastProgress = progress
  }
  
  return lastProgress
}

/**
 * Cleanup expired content
 */
export async function cleanupExpiredContent(): Promise<{ flashcards: number; quizzes: number }> {
  const now = new Date().toISOString()

  // Delete expired flashcards
  const { count: flashcardsDeleted } = await supabaseAdmin
    .from("flashcards")
    .delete({ count: "exact" })
    .lt("expires_at", now)

  // Delete expired quizzes
  const { count: quizzesDeleted } = await supabaseAdmin
    .from("quizzes")
    .delete({ count: "exact" })
    .lt("expires_at", now)

  return {
    flashcards: flashcardsDeleted || 0,
    quizzes: quizzesDeleted || 0
  }
}

