"use client";

import { cn } from "@/lib/utils";

interface BloomCursorProps {
  isActive: boolean;
  currentLine: number;
  totalLines: number;
  className?: string;
}

export function BloomCursor({ isActive, currentLine, totalLines, className }: BloomCursorProps) {
  if (!isActive) return null;

  const progress = totalLines > 0 ? ((currentLine + 1) / totalLines) * 100 : 0;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-2xl",
        "bg-gradient-to-r from-pink-500/95 to-rose-500/95 text-white",
        "shadow-xl shadow-pink-500/30 backdrop-blur-sm",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        "border border-pink-400/30",
        className
      )}
    >
      {/* Bloom emoji */}
      <span className="text-2xl" role="img" aria-label="bloom">
        🌸
      </span>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold tracking-wide">
          Polishing notes...
        </span>
        
        {/* Progress bar */}
        <div className="w-36 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Line counter */}
      {totalLines > 0 && (
        <span className="text-sm font-mono opacity-80 ml-1">
          {currentLine + 1}/{totalLines}
        </span>
      )}
    </div>
  );
}
