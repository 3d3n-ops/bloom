"use client"

import { Sidebar } from "@/components/sidebar"
import { FlashcardDeck } from "@/components/tools/flashcard-deck"
import { useState, useEffect, useCallback } from "react"
import { Layers, Sparkles, Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react"

interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: "new" | "easy" | "medium" | "hard" | "mastered"
  noteTitle?: string
}

interface GenerationResult {
  noteId: string
  noteTitle: string
  success: boolean
  error?: string
  count?: number
}

interface GenerationProgress {
  total: number
  completed: number
  results: GenerationResult[]
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<GenerationProgress | null>(null)

  const fetchFlashcards = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/flashcards")
      if (!res.ok) throw new Error("Failed to fetch flashcards")
      const data = await res.json()
      setFlashcards(data.flashcards || [])
    } catch (err) {
      setError("Failed to load flashcards")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateFlashcards = useCallback(async () => {
    try {
      setGenerating(true)
      setError(null)
      setProgress(null)

      // Use streaming for real-time progress
      const res = await fetch("/api/flashcards/generate?stream=true", { method: "POST" })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to generate flashcards")
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let streamComplete = false
        while (!streamComplete) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                streamComplete = true
                break
              }
              try {
                const progressData = JSON.parse(data) as GenerationProgress
                setProgress(progressData)
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // Refresh flashcards after generation
      await fetchFlashcards()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcards")
      console.error(err)
    } finally {
      setGenerating(false)
      // Keep progress visible for a moment
      setTimeout(() => setProgress(null), 3000)
    }
  }, [])

  const updateCardDifficulty = async (cardId: string, difficulty: Flashcard["difficulty"]) => {
    try {
      const res = await fetch(`/api/flashcards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty })
      })
      
      if (!res.ok) {
        throw new Error("Failed to update card difficulty")
      }
      
      setFlashcards(prev => 
        prev.map(card => card.id === cardId ? { ...card, difficulty } : card)
      )
    } catch (err) {
      console.error("Failed to update card difficulty:", err)
    }
  }

  useEffect(() => {
    fetchFlashcards()
  }, [])

  const stats = {
    total: flashcards.length,
    new: flashcards.filter(c => c.difficulty === "new").length,
    learning: flashcards.filter(c => ["easy", "medium", "hard"].includes(c.difficulty)).length,
    mastered: flashcards.filter(c => c.difficulty === "mastered").length,
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 shadow-lg shadow-pink-500/20">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
                <p className="text-gray-500 text-sm">Study smarter with AI-generated cards</p>
              </div>
            </div>
            
            <button
              onClick={generateFlashcards}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Cards
                </>
              )}
            </button>
          </div>
        </header>

        {/* Generation Progress */}
        {progress && progress.total > 0 && (
          <div className="px-8 py-4 border-b border-gray-100 bg-pink-50/50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Generating flashcards from your notes...
                </span>
                <span className="text-sm text-gray-500">
                  {progress.completed} / {progress.total} notes
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
              {progress.results.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {progress.results.slice(-5).map((result, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                        result.success 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {result.noteTitle.slice(0, 20)}{result.noteTitle.length > 20 ? "..." : ""}
                      {result.success && result.count && (
                        <span className="text-emerald-600">+{result.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="px-8 py-4 border-b border-gray-100 bg-white/50">
          <div className="flex items-center justify-center gap-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-gray-600 text-sm">{stats.total} Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600 text-sm">{stats.new} New</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-gray-600 text-sm">{stats.learning} Learning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-gray-600 text-sm">{stats.mastered} Mastered</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
              <p className="text-gray-500">Loading your flashcards...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-red-50">
                <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchFlashcards}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          ) : flashcards.length === 0 ? (
            <div className="flex flex-col items-center gap-6 text-center max-w-md">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200">
                <Layers className="h-16 w-16 text-pink-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No flashcards yet</h2>
                <p className="text-gray-500">
                  Generate flashcards from your notes to start studying. Our AI will extract key concepts and create study cards automatically.
                </p>
              </div>
              <button
                onClick={generateFlashcards}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg shadow-pink-500/25 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate from Notes
                  </>
                )}
              </button>
            </div>
          ) : (
            <FlashcardDeck 
              cards={flashcards} 
              onUpdateDifficulty={updateCardDifficulty}
            />
          )}
        </main>
      </div>
    </div>
  )
}
