"use client";

import { useState, useRef, useCallback } from "react";

export interface RecordingOptions {
  onChunkAvailable: (blob: Blob, chunkId: string) => void;
  timeslice?: number;
}

export function useAudioRecording({ onChunkAvailable, timeslice = 3500 }: RecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkCounterRef = useRef(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const chunkId = `chunk-${Date.now()}-${chunkCounterRef.current++}`;
          onChunkAvailable(event.data, chunkId);
        }
      };

      // To ensure every chunk is a valid standalone media file with headers,
      // we use a shorter interval and stop/start the recorder, 
      // or we can just use the timeslice and accept that the browser 
      // might not include headers in subsequent chunks.
      // However, most APIs (like Groq) require a valid header.
      // A more robust way is to collect the data and stop/start.
      
      const intervalId = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
        }
      }, timeslice);

      (mediaRecorder as any)._intervalId = intervalId;

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError(err.message || "Failed to start recording");
    }
  }, [onChunkAvailable, timeslice]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      if ((mediaRecorderRef.current as any)._intervalId) {
        clearInterval((mediaRecorderRef.current as any)._intervalId);
      }
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  };
}

