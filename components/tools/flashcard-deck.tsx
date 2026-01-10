"use client"

import { useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: "new" | "easy" | "medium" | "hard" | "mastered"
  noteTitle?: string
}

interface FlashcardDeckProps {
  cards: Flashcard[]
  onUpdateDifficulty: (cardId: string, difficulty: Flashcard["difficulty"]) => void
}

export function FlashcardDeck({ cards, onUpdateDifficulty }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [flipAnimation, setFlipAnimation] = useState(false)

  const currentCard = cards[currentIndex]

  const goToNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false)
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, cards.length])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false)
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const flipCard = useCallback(() => {
    setFlipAnimation(true)
    setTimeout(() => {
      setIsFlipped(prev => !prev)
      setFlipAnimation(false)
    }, 150)
  }, [])

  const handleDifficulty = (difficulty: Flashcard["difficulty"]) => {
    onUpdateDifficulty(currentCard.id, difficulty)
    goToNext()
  }

  const getDifficultyColor = (difficulty: Flashcard["difficulty"]) => {
    switch (difficulty) {
      case "new": return "bg-blue-500"
      case "easy": return "bg-emerald-500"
      case "medium": return "bg-amber-500"
      case "hard": return "bg-red-500"
      case "mastered": return "bg-purple-500"
      default: return "bg-gray-500"
    }
  }

  if (!currentCard) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <div className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium text-white",
            getDifficultyColor(currentCard.difficulty)
          )}>
            {currentCard.difficulty}
          </div>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div 
        className="relative w-full aspect-[4/3] cursor-pointer perspective-1000"
        onClick={flipCard}
      >
        <div 
          className={cn(
            "absolute inset-0 rounded-3xl transition-all duration-300 transform-style-3d",
            flipAnimation && "scale-95 opacity-80"
          )}
        >
          {/* Card Front */}
          <div 
            className={cn(
              "absolute inset-0 rounded-3xl p-8 flex flex-col backface-hidden",
              "bg-white border border-gray-200",
              "shadow-xl shadow-gray-200/50",
              isFlipped && "opacity-0 pointer-events-none"
            )}
          >
            {currentCard.noteTitle && (
              <span className="text-xs text-pink-500 font-medium mb-4 truncate">
                From: {currentCard.noteTitle}
              </span>
            )}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xl md:text-2xl text-gray-900 text-center font-medium leading-relaxed">
                {currentCard.front}
              </p>
            </div>
            <div className="text-center text-gray-400 text-sm mt-4">
              Click to reveal answer
            </div>
          </div>

          {/* Card Back */}
          <div 
            className={cn(
              "absolute inset-0 rounded-3xl p-8 flex flex-col backface-hidden",
              "bg-gradient-to-br from-pink-50 to-white border border-pink-200",
              "shadow-xl shadow-pink-200/30",
              !isFlipped && "opacity-0 pointer-events-none"
            )}
          >
            <span className="text-xs text-pink-500 font-medium mb-4">
              Answer
            </span>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-lg md:text-xl text-gray-800 text-center leading-relaxed">
                {currentCard.back}
              </p>
            </div>
            <div className="text-center text-gray-400 text-sm mt-4">
              Rate your recall below
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={flipCard}
            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Flip
          </button>
          
          <button
            onClick={goToNext}
            disabled={currentIndex === cards.length - 1}
            className="p-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Difficulty Rating */}
        {isFlipped && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-sm text-gray-500 mr-2">How well did you know this?</span>
            <button
              onClick={() => handleDifficulty("hard")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
            >
              <X className="h-4 w-4" />
              Hard
            </button>
            <button
              onClick={() => handleDifficulty("medium")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors border border-amber-200"
            >
              <Minus className="h-4 w-4" />
              Medium
            </button>
            <button
              onClick={() => handleDifficulty("easy")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200"
            >
              <Check className="h-4 w-4" />
              Easy
            </button>
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <div className="text-center text-gray-400 text-xs">
        Tip: Use arrow keys to navigate, spacebar to flip
      </div>
    </div>
  )
}
