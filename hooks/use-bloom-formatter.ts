"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface FormattingLine {
  content: string;
  index: number;
  total: number;
}

export interface UseBloomFormatterOptions {
  onLineFormatted: (line: FormattingLine) => void;
  onFormattingComplete: () => void;
  onFormattingStart: () => void;
  formatInterval?: number; // ms between format passes (default 7000 = 7s)
}

export function useBloomFormatter({
  onLineFormatted,
  onFormattingComplete,
  onFormattingStart,
  formatInterval = 7000,
}: UseBloomFormatterOptions) {
  const [isFormatting, setIsFormatting] = useState(false);
  const [currentLine, setCurrentLine] = useState<number>(-1);
  const [totalLines, setTotalLines] = useState<number>(0);

  // New notes waiting to be formatted
  const pendingNotesRef = useRef<string>("");
  // Previously formatted content (for context)
  const formattedContextRef = useRef<string>("");
  
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(false);

  // Add notes to the pending buffer
  const addNotes = useCallback((notes: string) => {
    if (notes && notes.trim()) {
      pendingNotesRef.current += notes;
    }
  }, []);

  // Trigger a formatting pass on pending notes
  const triggerFormat = useCallback(async () => {
    const notesToFormat = pendingNotesRef.current.trim();
    if (!notesToFormat || isFormatting) return;

    // Clear pending immediately to avoid double-processing
    pendingNotesRef.current = "";
    
    setIsFormatting(true);
    setCurrentLine(0);
    
    // Call onFormattingStart BEFORE the API call so editor can prepare
    onFormattingStart();

    try {
      const response = await fetch("/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notesToFormat,
          sessionId: sessionIdRef.current,
          previousContext: formattedContextRef.current.slice(-500),
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let allFormattedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.status === "line") {
                setCurrentLine(data.index);
                setTotalLines(data.total);
                
                // Call the line formatted handler
                onLineFormatted({
                  content: data.line,
                  index: data.index,
                  total: data.total,
                });
                
                allFormattedContent += data.line;
                
                // Delay between lines for visual effect
                await new Promise((r) => setTimeout(r, 80));
                
              } else if (data.status === "completed") {
                // Add to context for future formatting passes
                formattedContextRef.current += "\n" + allFormattedContent;
                if (formattedContextRef.current.length > 2000) {
                  formattedContextRef.current = formattedContextRef.current.slice(-1500);
                }
                
                // Signal completion
                onFormattingComplete();
              }
            } catch (e) {
              console.error("Error parsing format SSE:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Bloom formatter error:", error);
      // On error, put the notes back so they can be retried
      pendingNotesRef.current = notesToFormat + pendingNotesRef.current;
      // Still call complete to clean up the bloom marker
      onFormattingComplete();
    } finally {
      setIsFormatting(false);
      setCurrentLine(-1);
      setTotalLines(0);
    }
  }, [isFormatting, onLineFormatted, onFormattingComplete, onFormattingStart]);

  // Start the periodic formatting
  const startFormatting = useCallback(() => {
    if (isActiveRef.current) return;

    isActiveRef.current = true;
    sessionIdRef.current = `session-${Date.now()}`;

    // Start interval for periodic formatting
    intervalRef.current = setInterval(() => {
      if (pendingNotesRef.current.trim()) {
        triggerFormat();
      }
    }, formatInterval);
  }, [formatInterval, triggerFormat]);

  // Stop the periodic formatting
  const stopFormatting = useCallback(() => {
    isActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Do one final format pass if there's pending content
    if (pendingNotesRef.current.trim()) {
      triggerFormat();
    }
  }, [triggerFormat]);

  // Reset the formatter for a new session
  const reset = useCallback(() => {
    pendingNotesRef.current = "";
    formattedContextRef.current = "";
    sessionIdRef.current = `session-${Date.now()}`;
    setCurrentLine(-1);
    setTotalLines(0);
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
    isFormatting,
    currentLine,
    totalLines,
    addNotes,
    triggerFormat,
    startFormatting,
    stopFormatting,
    reset,
  };
}
