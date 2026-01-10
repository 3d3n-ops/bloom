"use client"

import { Sidebar } from "@/components/sidebar"
import { useState, useEffect, useCallback } from "react"
import { Brain, Sparkles, Loader2, Clock, Trophy, ChevronRight, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

interface Quiz {
  id: string
  title: string
  description: string
  questionCount: number
  createdAt: string
  expiresAt: string
  noteTitle: string | null
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

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<GenerationProgress | null>(null)

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/quizzes")
      if (!res.ok) throw new Error("Failed to fetch quizzes")
      const data = await res.json()
      setQuizzes(data.quizzes || [])
    } catch (err) {
      setError("Failed to load quizzes")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateQuizzes = useCallback(async () => {
    try {
      setGenerating(true)
      setError(null)
      setProgress(null)

      // Use streaming for real-time progress
      const res = await fetch("/api/quizzes/generate?stream=true", { method: "POST" })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to generate quizzes")
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

      // Refresh quizzes after generation
      await fetchQuizzes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quizzes")
      console.error(err)
    } finally {
      setGenerating(false)
      setTimeout(() => setProgress(null), 3000)
    }
  }, [])

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
    })
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 shadow-lg shadow-pink-500/20">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
                <p className="text-gray-500 text-sm">Test your knowledge with AI-powered quizzes</p>
              </div>
            </div>
            
            <button
              onClick={generateQuizzes}
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
                  Generate Quiz
                </>
              )}
            </button>
          </div>

          {/* Generation Progress */}
          {progress && progress.total > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-pink-50 border border-pink-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Generating quizzes from your notes...
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
                        <span className="text-emerald-600">+{result.count}q</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-4" />
              <p className="text-gray-500">Loading your quizzes...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-full bg-red-50 mb-4">
                <XCircle className="h-10 w-10 text-red-400" />
              </div>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchQuizzes}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 mb-6">
                <Brain className="h-20 w-20 text-pink-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">No quizzes yet</h2>
              <p className="text-gray-500 max-w-md mb-8">
                Generate quizzes from your notes to test your knowledge. Our AI will create challenging questions to help you learn.
              </p>
              
              <button
                onClick={generateQuizzes}
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
              
              {/* Preview of features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-12">
                {[
                  { icon: Brain, title: "Multiple Choice", desc: "4 options per question" },
                  { icon: Clock, title: "Auto-Generated", desc: "7-10 questions per note" },
                  { icon: Trophy, title: "Track Progress", desc: "See your scores" },
                ].map((feature) => (
                  <div key={feature.title} className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                    <feature.icon className="h-6 w-6 text-pink-400 mb-2" />
                    <h3 className="text-gray-900 font-medium text-sm">{feature.title}</h3>
                    <p className="text-gray-500 text-xs">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{quizzes.length} quizzes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">
                    {quizzes.reduce((sum, q) => sum + q.questionCount, 0)} questions total
                  </span>
                </div>
              </div>

              {/* Quiz List */}
              <div className="grid gap-4">
                {quizzes.map((quiz) => {
                  const daysLeft = getDaysUntilExpiry(quiz.expiresAt)
                  return (
                    <Link key={quiz.id} href={`/app/tools/quizzes/${quiz.id}`}>
                      <div className="group p-5 bg-white rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-200 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                                {quiz.title}
                              </h3>
                              <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full">
                                {quiz.questionCount} questions
                              </span>
                            </div>
                            {quiz.noteTitle && (
                              <p className="text-sm text-gray-500 mb-2">
                                From: {quiz.noteTitle}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>Created {formatDate(quiz.createdAt)}</span>
                              <span className={daysLeft <= 3 ? "text-amber-500" : ""}>
                                Expires in {daysLeft} days
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-pink-500 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
