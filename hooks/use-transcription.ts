"use client";

import { useState, useCallback, useRef } from "react";

export interface TranscriptionUpdate {
  layer?: number;
  status: "started" | "completed" | "finished" | "error";
  text?: string;
  chunkId: string;
  error?: string;
}

export interface UseTranscriptionOptions {
  onUpdate: (update: TranscriptionUpdate) => void;
}

export function useTranscription({ onUpdate }: UseTranscriptionOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingCountRef = useRef(0);
  const previousNotesRef = useRef<string>("");

  const processChunk = useCallback(
    async (audioBlob: Blob, chunkId: string) => {
      processingCountRef.current++;
      setIsProcessing(true);
      
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("chunkId", chunkId);
      
      // Send previous notes for context (last 500 chars to keep it focused)
      if (previousNotesRef.current) {
        formData.append("previousNotes", previousNotesRef.current.slice(-500));
      }

      try {
        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data: TranscriptionUpdate = JSON.parse(line.slice(6));
                onUpdate(data);

                // Track the formatted notes for context continuity
                if (data.layer === 2 && data.status === "completed" && data.text) {
                  // Append to running notes context
                  previousNotesRef.current += "\n" + data.text;
                  // Keep only last ~1500 chars to avoid context bloat
                  if (previousNotesRef.current.length > 1500) {
                    previousNotesRef.current = previousNotesRef.current.slice(-1500);
                  }
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
          }
        }
      } catch (err) {
        console.error("Transcription error:", err);
        onUpdate({ 
          status: "error", 
          error: err instanceof Error ? err.message : "Unknown error", 
          chunkId 
        });
      } finally {
        processingCountRef.current--;
        if (processingCountRef.current === 0) {
          setIsProcessing(false);
        }
      }
    },
    [onUpdate]
  );

  // Reset context when starting a fresh recording session
  const resetContext = useCallback(() => {
    previousNotesRef.current = "";
  }, []);

  return {
    processChunk,
    isProcessing,
    resetContext,
  };
}
