/**
 * Note Study Generator (Layer 5)
 * 
 * Generates a small set of flashcards and quiz questions for a single note.
 * Designed for on-demand generation from the note editor.
 * Uses a single API call to save tokens.
 */

import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const MODEL = "llama-3.1-8b-instant"

// Types
export interface Flashcard {
  id: string
  front: string
  back: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface StudyContent {
  flashcards: Flashcard[]
  quizQuestions: QuizQuestion[]
  generatedAt: string
}

/**
 * Strip HTML tags from content
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
 * Generate a unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Parse the AI response into structured content
 */
function parseResponse(content: string): { flashcards: any[]; questions: any[] } | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        flashcards: parsed.flashcards || [],
        questions: parsed.questions || parsed.quizQuestions || []
      }
    }
    return null
  } catch (error) {
    console.error("[NoteStudyGenerator] Failed to parse response:", error)
    return null
  }
}

/**
 * Generate study content (flashcards + quiz) for a single note
 */
export async function generateStudyContent(
  noteTitle: string,
  noteContent: string
): Promise<StudyContent> {
  const cleanContent = stripHtml(noteContent)
  
  if (cleanContent.length < 30) {
    return {
      flashcards: [],
      quizQuestions: [],
      generatedAt: new Date().toISOString()
    }
  }

  const prompt = `Analyze these study notes and create study materials.

TITLE: ${noteTitle || "Untitled Note"}

CONTENT:
${cleanContent.slice(0, 3000)}

Create exactly:
- 2-4 flashcards for key concepts/definitions
- 2-3 multiple choice quiz questions

OUTPUT FORMAT (JSON only, no other text):
{
  "flashcards": [
    { "front": "Question about a key concept", "back": "Clear, concise answer" }
  ],
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }
  ]
}

Generate now:`

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a study assistant. Create concise, effective study materials. Return ONLY valid JSON, no markdown or extra text."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    const responseContent = response.choices[0]?.message?.content || ""
    const parsed = parseResponse(responseContent)

    if (!parsed) {
      console.error("[NoteStudyGenerator] Failed to parse AI response")
      return {
        flashcards: [],
        quizQuestions: [],
        generatedAt: new Date().toISOString()
      }
    }

    // Format flashcards
    const flashcards: Flashcard[] = parsed.flashcards
      .filter((f: any) => f.front && f.back)
      .slice(0, 4)
      .map((f: any) => ({
        id: generateId(),
        front: f.front.trim(),
        back: f.back.trim()
      }))

    // Format quiz questions
    const quizQuestions: QuizQuestion[] = parsed.questions
      .filter((q: any) => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length >= 2 &&
        typeof q.correctIndex === "number"
      )
      .slice(0, 3)
      .map((q: any) => ({
        id: generateId(),
        question: q.question.trim(),
        options: q.options.slice(0, 4),
        correctIndex: Math.min(q.correctIndex, q.options.length - 1),
        explanation: q.explanation?.trim() || "This is the correct answer."
      }))

    return {
      flashcards,
      quizQuestions,
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error("[NoteStudyGenerator] Generation error:", error)
    return {
      flashcards: [],
      quizQuestions: [],
      generatedAt: new Date().toISOString()
    }
  }
}

