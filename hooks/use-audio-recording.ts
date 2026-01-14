"use client";

import { useState, useRef, useCallback } from "react";

export type AudioSource = "microphone" | "system" | "both";

export interface RecordingOptions {
  onChunkAvailable: (blob: Blob, chunkId: string) => void;
  timeslice?: number;
}

export function useAudioRecording({ onChunkAvailable, timeslice = 3500 }: RecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<AudioSource | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const chunkCounterRef = useRef(0);

  const getMicrophoneStream = async (): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  };

  const getSystemAudioStream = async (): Promise<MediaStream> => {
    // getDisplayMedia captures screen/tab audio
    // The user will see a picker to select which tab/window to capture
    // They must check "Share audio" for the audio to be included
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true, // Required by the API, but we'll ignore the video track
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    // Check if audio track was included (user checked "Share audio")
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      // Stop video tracks since we don't need them
      stream.getVideoTracks().forEach((track) => track.stop());
      throw new Error("No audio shared. Please check 'Share audio' when selecting a tab or window.");
    }

    // Stop video tracks - we only need the audio
    stream.getVideoTracks().forEach((track) => track.stop());

    // Return a new stream with only audio
    return new MediaStream(audioTracks);
  };

  const mixAudioStreams = (streams: MediaStream[]): MediaStream => {
    // Create an AudioContext to mix multiple audio sources
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    streams.forEach((stream) => {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(destination);
    });

    return destination.stream;
  };

  const startRecording = useCallback(
    async (source: AudioSource = "microphone") => {
      try {
        setError(null);
        const streams: MediaStream[] = [];

        if (source === "microphone" || source === "both") {
          const micStream = await getMicrophoneStream();
          streams.push(micStream);
        }

        if (source === "system" || source === "both") {
          try {
            const systemStream = await getSystemAudioStream();
            streams.push(systemStream);
          } catch (err: any) {
            // If user cancels the screen picker or doesn't share audio
            // Clean up any mic stream we already got
            streams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
            throw err;
          }
        }

        streamsRef.current = streams;

        // Mix streams if we have multiple, otherwise use the single stream
        const finalStream = streams.length > 1 ? mixAudioStreams(streams) : streams[0];

        // Determine supported mime type
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const mediaRecorder = new MediaRecorder(finalStream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            const chunkId = `chunk-${Date.now()}-${chunkCounterRef.current++}`;
            onChunkAvailable(event.data, chunkId);
          }
        };

        // Restart recorder at intervals to ensure valid headers on each chunk
        const intervalId = setInterval(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.start();
          }
        }, timeslice);

        (mediaRecorder as any)._intervalId = intervalId;

        mediaRecorder.start();
        setIsRecording(true);
        setActiveSource(source);
      } catch (err: any) {
        console.error("Failed to start recording:", err);
        setError(err.message || "Failed to start recording");
        setActiveSource(null);
      }
    },
    [onChunkAvailable, timeslice]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      if ((mediaRecorderRef.current as any)._intervalId) {
        clearInterval((mediaRecorderRef.current as any)._intervalId);
      }
      mediaRecorderRef.current.stop();

      // Stop the recorder's stream
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

      // Also stop all original streams (important for mixed streams)
      streamsRef.current.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });

      mediaRecorderRef.current = null;
      streamsRef.current = [];
      setIsRecording(false);
      setActiveSource(null);
    }
  }, []);

  return {
    isRecording,
    activeSource,
    startRecording,
    stopRecording,
    error,
  };
}
