"use client"

import { Sidebar } from "@/components/sidebar"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Brain, ArrowLeft, CheckCircle2, XCircle, Loader2, Trophy, RotateCcw } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Question {
  id: string
  question: string
  options: string[]
  correct_index: number
  difficulty: "easy" | "medium" | "hard"
  explanation: string | null
  order_index: number
}

interface Quiz {
  id: string
  title: string
  description: string
  questionCount: number
  noteTitle: string | null
}

interface QuizResult {
  score: number
  totalQuestions: number
  percentage: number
  answers: {
    question_id: string
    selected_index: number
    correct_index: number
    correct: boolean
    explanation: string | null
  }[]
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, number>>(new Map())
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/quizzes/${quizId}`)
        if (!res.ok) throw new Error("Quiz not found")
        const data = await res.json()
        setQuiz(data.quiz)
        setQuestions(data.questions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz")
      } finally {
        setLoading(false)
      }
    }

    if (quizId) {
      fetchQuiz()
    }
  }, [quizId])

  const currentQuestion = questions[currentIndex]

  const selectAnswer = (optionIndex: number) => {
    if (showResult) return
    setSelectedAnswers(prev => {
      const newMap = new Map(prev)
      newMap.set(currentQuestion.id, optionIndex)
      return newMap
    })
  }

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const submitQuiz = async () => {
    try {
      setSubmitting(true)
      
      const answers = questions.map(q => ({
        questionId: q.id,
        selectedIndex: selectedAnswers.get(q.id) ?? -1
      }))

      const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      })

      if (!res.ok) throw new Error("Failed to submit quiz")
      
      const data = await res.json()
      setResult(data)
      setShowResult(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz")
    } finally {
      setSubmitting(false)
    }
  }

  const retryQuiz = () => {
    setSelectedAnswers(new Map())
    setCurrentIndex(0)
    setShowResult(false)
    setResult(null)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-emerald-100 text-emerald-700"
      case "medium": return "bg-amber-100 text-amber-700"
      case "hard": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const answeredCount = selectedAnswers.size
  const allAnswered = answeredCount === questions.length

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <XCircle className="h-16 w-16 text-red-400 mb-4" />
          <p className="text-red-500 mb-4">{error || "Quiz not found"}</p>
          <Link href="/app/tools/quizzes">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Back to Quizzes
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // Result Screen
  if (showResult && result) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/app/tools/quizzes">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
            </div>

            {/* Score Card */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 mb-8 text-center">
              <div className={cn(
                "w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center",
                result.percentage >= 80 ? "bg-emerald-100" :
                result.percentage >= 60 ? "bg-amber-100" : "bg-red-100"
              )}>
                <Trophy className={cn(
                  "h-16 w-16",
                  result.percentage >= 80 ? "text-emerald-500" :
                  result.percentage >= 60 ? "text-amber-500" : "text-red-500"
                )} />
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                {result.percentage}%
              </h2>
              <p className="text-gray-500 mb-6">
                You got {result.score} out of {result.totalQuestions} questions correct
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={retryQuiz}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry Quiz
                </button>
                <Link href="/app/tools/quizzes">
                  <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition-colors">
                    Back to Quizzes
                  </button>
                </Link>
              </div>
            </div>

            {/* Answer Review */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Answers</h3>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const answer = result.answers.find(a => a.question_id === question.id)
                const isCorrect = answer?.correct
                
                return (
                  <div 
                    key={question.id}
                    className={cn(
                      "p-5 rounded-2xl border",
                      isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                    )}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {index + 1}. {question.question}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="text-red-600">Your answer:</span> {question.options[answer?.selected_index ?? 0]}
                            <br />
                            <span className="text-emerald-600">Correct answer:</span> {question.options[question.correct_index]}
                          </p>
                        )}
                        {answer?.explanation && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            {answer.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Quiz Taking Screen
  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 border-b border-gray-200 bg-white/80">
          <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <Link href="/app/tools/quizzes">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
                {quiz.noteTitle && (
                  <p className="text-sm text-gray-500">From: {quiz.noteTitle}</p>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {answeredCount} / {questions.length} answered
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="px-8 py-3 border-b border-gray-100">
          <div className="max-w-3xl mx-auto">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl mx-auto">
            {currentQuestion && (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getDifficultyColor(currentQuestion.difficulty)
                  )}>
                    {currentQuestion.difficulty}
                  </span>
                </div>

                {/* Question Text */}
                <h2 className="text-xl font-semibold text-gray-900 mb-8">
                  {currentQuestion.question}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswers.get(currentQuestion.id) === index
                    return (
                      <button
                        key={index}
                        onClick={() => selectAnswer(index)}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                          isSelected
                            ? "border-pink-500 bg-pink-50 text-pink-900"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            isSelected
                              ? "bg-pink-500 text-white"
                              : "bg-gray-100 text-gray-600"
                          )}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="px-8 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Question Dots */}
            <div className="flex items-center gap-1">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-pink-500 scale-125"
                      : selectedAnswers.has(q.id)
                        ? "bg-pink-300"
                        : "bg-gray-200"
                  )}
                />
              ))}
            </div>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={!allAnswered || submitting}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Quiz"
                )}
              </button>
            ) : (
              <button
                onClick={goToNext}
                className="px-4 py-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

