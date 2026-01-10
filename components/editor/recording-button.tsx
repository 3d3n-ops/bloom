"use client";

import { Mic, Square, Loader2 } from "lucide-react";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useTranscription, TranscriptionUpdate } from "@/hooks/use-transcription";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface RecordingButtonProps {
  onTranscription: (text: string, layer: number) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  className?: string;
}

export function RecordingButton({
  onTranscription,
  onRecordingStart,
  onRecordingStop,
  className,
}: RecordingButtonProps) {
  const [activeChunks, setActiveChunks] = useState<Set<string>>(new Set());

  const handleUpdate = useCallback(
    (update: TranscriptionUpdate) => {
      if (update.status === "completed" && update.text) {
        onTranscription(update.text, update.layer || 0);
      }
      
      // Track active chunks for UI
      if (update.status === "started") {
        setActiveChunks(prev => new Set(prev).add(update.chunkId));
      } else if (update.status === "finished" || update.status === "error") {
        setActiveChunks(prev => {
          const next = new Set(prev);
          next.delete(update.chunkId);
          return next;
        });
      }
    },
    [onTranscription]
  );

  const { processChunk, isProcessing, resetContext } = useTranscription({ onUpdate: handleUpdate });

  const { isRecording, startRecording: startRec, stopRecording: stopRec, error } = useAudioRecording({
    onChunkAvailable: processChunk,
  });

  const startRecording = () => {
    resetContext();
    setActiveChunks(new Set());
    onRecordingStart?.();
    startRec();
  };

  const stopRecording = () => {
    stopRec();
    onRecordingStop?.();
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm",
          isRecording 
            ? "bg-red-500 text-white hover:bg-red-600" 
            : "bg-pink-500 text-white hover:bg-pink-600"
        )}
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            <span>Record</span>
          </>
        )}
      </button>

      {isProcessing && activeChunks.size > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-100">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
          <span className="font-medium">
            Processing{activeChunks.size > 1 ? ` (${activeChunks.size})` : "..."}
          </span>
        </div>
      )}

      {error && (
        <span className="text-xs text-red-500 font-medium">{error}</span>
      )}
    </div>
  );
}
