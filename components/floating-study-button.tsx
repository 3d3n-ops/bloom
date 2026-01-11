"use client"

import { Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingStudyButtonProps {
  onClick: () => void
  className?: string
}

export function FloatingStudyButton({ onClick, className }: FloatingStudyButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-30",
        "w-14 h-14 rounded-full",
        "bg-pink-500 hover:bg-pink-600",
        "shadow-lg shadow-pink-500/30",
        "flex items-center justify-center",
        "hover:shadow-xl hover:shadow-pink-500/40 hover:scale-110",
        "active:scale-95",
        "transition-all duration-200",
        "group",
        className
      )}
      title="Study Tools"
    >
      <Wrench className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Study Tools
      </span>
    </button>
  )
}
