"use client"

import { useState, useEffect } from "react"
import { X, Sparkles, RotateCcw, ChevronLeft, ChevronRight, Check, Loader2, BookOpen, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface Flashcard {
  id: string
  front: string
  back: string
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface StudyContent {
  flashcards: Flashcard[]
  quizQuestions: QuizQuestion[]
  generatedAt: string
}

interface StudyPaneProps {
  isOpen: boolean
  onClose: () => void
  noteId: string
  noteTitle: string
}

type TabType = "flashcards" | "quiz"

export function StudyPane({ isOpen, onClose, noteId, noteTitle }: StudyPaneProps) {
  const [activeTab, setActiveTab] = useState<TabType>("flashcards")
  const [studyContent, setStudyContent] = useState<StudyContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Flashcard state
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  // Generate study content
  const generateContent = async () => {
    setIsLoading(true)
    setError(null)
    setStudyContent(null)
    resetStudyState()

    try {
      const response = await fetch(`/api/notes/${noteId}/study`, {
        method: "POST"
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to generate study content")
      }
      
      setStudyContent(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  // Reset study state
  const resetStudyState = () => {
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setQuizScore(0)
    setQuizCompleted(false)
  }

  // Generate on open if no content
  useEffect(() => {
    if (isOpen && !studyContent && !isLoading) {
      generateContent()
    }
  }, [isOpen])

  // Flashcard navigation
  const nextCard = () => {
    if (!studyContent) return
    setIsFlipped(false)
    setCurrentCardIndex((prev) => 
      prev < studyContent.flashcards.length - 1 ? prev + 1 : 0
    )
  }

  const prevCard = () => {
    if (!studyContent) return
    setIsFlipped(false)
    setCurrentCardIndex((prev) => 
      prev > 0 ? prev - 1 : studyContent.flashcards.length - 1
    )
  }

  // Quiz handling
  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null || !studyContent) return
    
    setSelectedAnswer(index)
    setShowExplanation(true)
    
    if (index === studyContent.quizQuestions[currentQuestionIndex].correctIndex) {
      setQuizScore((prev) => prev + 1)
    }
  }

  const nextQuestion = () => {
    if (!studyContent) return
    
    if (currentQuestionIndex < studyContent.quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setQuizScore(0)
    setQuizCompleted(false)
  }

  const currentFlashcard = studyContent?.flashcards[currentCardIndex]
  const currentQuestion = studyContent?.quizQuestions[currentQuestionIndex]

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Sliding Pane */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h2 className="font-semibold text-gray-900">Study Tools</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("flashcards")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative",
              activeTab === "flashcards" 
                ? "text-pink-600" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Flashcards
            {activeTab === "flashcards" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative",
              activeTab === "quiz" 
                ? "text-pink-600" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Brain className="w-4 h-4" />
            Quiz
            {activeTab === "quiz" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              <p className="text-gray-500 text-sm">Generating study materials...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={generateContent}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : studyContent ? (
            <>
              {/* Flashcards Tab */}
              {activeTab === "flashcards" && (
                <div className="flex flex-col h-full">
                  {studyContent.flashcards.length > 0 ? (
                    <>
                      {/* Card counter */}
                      <div className="text-center text-sm text-gray-500 mb-4">
                        Card {currentCardIndex + 1} of {studyContent.flashcards.length}
                      </div>
                      
                      {/* Flashcard */}
                      <div 
                        className="flex-1 flex items-center justify-center perspective-1000"
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        <div 
                          className={cn(
                            "w-full max-w-sm h-48 cursor-pointer transition-transform duration-500 preserve-3d relative",
                            isFlipped && "rotate-y-180"
                          )}
                          style={{ 
                            transformStyle: "preserve-3d",
                            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                          }}
                        >
                          {/* Front */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-100 p-6 flex items-center justify-center backface-hidden"
                            style={{ backfaceVisibility: "hidden" }}
                          >
                            <p className="text-gray-800 text-center font-medium">
                              {currentFlashcard?.front}
                            </p>
                          </div>
                          
                          {/* Back */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6 flex items-center justify-center backface-hidden"
                            style={{ 
                              backfaceVisibility: "hidden",
                              transform: "rotateY(180deg)"
                            }}
                          >
                            <p className="text-gray-700 text-center">
                              {currentFlashcard?.back}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-center text-xs text-gray-400 mt-2 mb-4">
                        Tap card to flip
                      </p>
                      
                      {/* Navigation */}
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={prevCard}
                          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          onClick={nextCard}
                          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <BookOpen className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No flashcards available</p>
                      <p className="text-gray-400 text-sm">Add more content to your note</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Tab */}
              {activeTab === "quiz" && (
                <div className="flex flex-col h-full">
                  {studyContent.quizQuestions.length > 0 ? (
                    quizCompleted ? (
                      /* Quiz Complete */
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                          <Check className="w-10 h-10 text-pink-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Quiz Complete!</h3>
                        <p className="text-gray-600">
                          You scored {quizScore} out of {studyContent.quizQuestions.length}
                        </p>
                        <div className="text-4xl font-bold text-pink-500">
                          {Math.round((quizScore / studyContent.quizQuestions.length) * 100)}%
                        </div>
                        <button
                          onClick={restartQuiz}
                          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors mt-4"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Try Again
                        </button>
                      </div>
                    ) : (
                      /* Quiz Questions */
                      <>
                        {/* Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-500 mb-2">
                            <span>Question {currentQuestionIndex + 1} of {studyContent.quizQuestions.length}</span>
                            <span>{quizScore} correct</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-pink-500 transition-all duration-300"
                              style={{ width: `${((currentQuestionIndex + 1) / studyContent.quizQuestions.length) * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Question */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                          <p className="text-gray-900 font-medium">
                            {currentQuestion?.question}
                          </p>
                        </div>
                        
                        {/* Options */}
                        <div className="space-y-2 flex-1">
                          {currentQuestion?.options.map((option, index) => {
                            const isSelected = selectedAnswer === index
                            const isCorrect = index === currentQuestion.correctIndex
                            const showResult = selectedAnswer !== null
                            
                            return (
                              <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={selectedAnswer !== null}
                                className={cn(
                                  "w-full p-3 rounded-xl text-left transition-all duration-200 border-2",
                                  !showResult && "border-gray-100 hover:border-pink-200 hover:bg-pink-50",
                                  showResult && isCorrect && "border-green-500 bg-green-50",
                                  showResult && isSelected && !isCorrect && "border-red-500 bg-red-50",
                                  showResult && !isSelected && !isCorrect && "border-gray-100 opacity-50"
                                )}
                              >
                                <span className={cn(
                                  "text-sm",
                                  showResult && isCorrect && "text-green-700 font-medium",
                                  showResult && isSelected && !isCorrect && "text-red-700"
                                )}>
                                  {option}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                        
                        {/* Explanation */}
                        {showExplanation && currentQuestion && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Explanation: </span>
                              {currentQuestion.explanation}
                            </p>
                          </div>
                        )}
                        
                        {/* Next button */}
                        {selectedAnswer !== null && (
                          <button
                            onClick={nextQuestion}
                            className="mt-4 w-full py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors"
                          >
                            {currentQuestionIndex < studyContent.quizQuestions.length - 1 
                              ? "Next Question" 
                              : "See Results"
                            }
                          </button>
                        )}
                      </>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Brain className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No quiz available</p>
                      <p className="text-gray-400 text-sm">Add more content to your note</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={generateContent}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Regenerate
          </button>
        </div>
      </div>
    </>
  )
}

