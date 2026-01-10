"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface PolishChunk {
  content: string;
  index: number;
  total: number;
}

export interface UsePolishFormatterOptions {
  onChunkPolished: (chunk: PolishChunk) => void;
  onPolishComplete: () => void;
  onPolishStart: () => void;
  polishInterval?: number; // ms between polish passes (default 30000 = 30s)
}

export function usePolishFormatter({
  onChunkPolished,
  onPolishComplete,
  onPolishStart,
  polishInterval = 30000, // 30 seconds
}: UsePolishFormatterOptions) {
  const [isPolishing, setIsPolishing] = useState(false);
  const [currentChunk, setCurrentChunk] = useState<number>(-1);
  const [totalChunks, setTotalChunks] = useState<number>(0);

  // Notes waiting to be polished (accumulated from layer 3)
  const pendingNotesRef = useRef<string>("");
  // Previously polished content (for context)
  const polishedContextRef = useRef<string>("");
  
  const sessionIdRef = useRef<string>(`polish-${Date.now()}`);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(false);

  // Add notes to the pending buffer
  const addNotes = useCallback((notes: string) => {
    if (notes && notes.trim()) {
      pendingNotesRef.current += notes;
    }
  }, []);

  // Trigger a polish pass
  const triggerPolish = useCallback(async () => {
    const notesToPolish = pendingNotesRef.current.trim();
    if (!notesToPolish || isPolishing) return;

    // Clear pending immediately
    pendingNotesRef.current = "";
    
    setIsPolishing(true);
    setCurrentChunk(0);
    
    onPolishStart();

    try {
      const response = await fetch("/api/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notesToPolish,
          sessionId: sessionIdRef.current,
          previousContext: polishedContextRef.current.slice(-800),
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let allPolishedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.status === "chunk") {
                setCurrentChunk(data.index);
                setTotalChunks(data.total);
                
                onChunkPolished({
                  content: data.chunk,
                  index: data.index,
                  total: data.total,
                });
                
                allPolishedContent += data.chunk;
                
                // Delay between chunks for visual effect
                await new Promise((r) => setTimeout(r, 100));
                
              } else if (data.status === "completed") {
                // Add to context for future passes
                polishedContextRef.current += "\n" + allPolishedContent;
                if (polishedContextRef.current.length > 3000) {
                  polishedContextRef.current = polishedContextRef.current.slice(-2500);
                }
                
                onPolishComplete();
              }
            } catch (e) {
              console.error("Error parsing polish SSE:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Polish formatter error:", error);
      // On error, put notes back
      pendingNotesRef.current = notesToPolish + pendingNotesRef.current;
      onPolishComplete();
    } finally {
      setIsPolishing(false);
      setCurrentChunk(-1);
      setTotalChunks(0);
    }
  }, [isPolishing, onChunkPolished, onPolishComplete, onPolishStart]);

  // Start periodic polishing
  const startPolishing = useCallback(() => {
    if (isActiveRef.current) return;

    isActiveRef.current = true;
    sessionIdRef.current = `polish-${Date.now()}`;

    intervalRef.current = setInterval(() => {
      if (pendingNotesRef.current.trim()) {
        triggerPolish();
      }
    }, polishInterval);
  }, [polishInterval, triggerPolish]);

  // Stop periodic polishing
  const stopPolishing = useCallback(() => {
    isActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Final polish if content is pending
    if (pendingNotesRef.current.trim()) {
      triggerPolish();
    }
  }, [triggerPolish]);

  // Reset the formatter
  const reset = useCallback(() => {
    pendingNotesRef.current = "";
    polishedContextRef.current = "";
    sessionIdRef.current = `polish-${Date.now()}`;
    setCurrentChunk(-1);
    setTotalChunks(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isPolishing,
    currentChunk,
    totalChunks,
    addNotes,
    triggerPolish,
    startPolishing,
    stopPolishing,
    reset,
  };
}

