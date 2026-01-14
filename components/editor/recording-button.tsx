"use client";

import { Mic, Square, Loader2, Monitor, AudioLines, ChevronDown, Check, Sparkles } from "lucide-react";
import { useAudioRecording, AudioSource } from "@/hooks/use-audio-recording";
import { useTranscription, TranscriptionUpdate } from "@/hooks/use-transcription";
import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface RecordingButtonProps {
  onTranscription: (text: string, layer: number) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  className?: string;
}

const SOURCE_OPTIONS: { value: AudioSource; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "microphone",
    label: "Microphone",
    icon: <Mic className="w-4 h-4" />,
    description: "Record your voice",
  },
  {
    value: "system",
    label: "System Audio",
    icon: <Monitor className="w-4 h-4" />,
    description: "Capture from a tab or app",
  },
  {
    value: "both",
    label: "Mic + System",
    icon: <AudioLines className="w-4 h-4" />,
    description: "Mix both audio sources",
  },
];

interface DropdownPosition {
  top: number;
  left: number;
}

export function RecordingButton({
  onTranscription,
  onRecordingStart,
  onRecordingStop,
  className,
}: RecordingButtonProps) {
  const [activeChunks, setActiveChunks] = useState<Set<string>>(new Set());
  const [selectedSource, setSelectedSource] = useState<AudioSource>("microphone");
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position when opening (aligned to right edge of button)
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 288; // w-72 = 18rem = 288px
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - dropdownWidth,
      });
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowSourcePicker(false);
      }
    };

    const handleScroll = () => {
      if (showSourcePicker) {
        updateDropdownPosition();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [showSourcePicker, updateDropdownPosition]);

  const handleUpdate = useCallback(
    (update: TranscriptionUpdate) => {
      if (update.status === "completed" && update.text) {
        onTranscription(update.text, update.layer || 0);
      }

      if (update.status === "started") {
        setActiveChunks((prev) => new Set(prev).add(update.chunkId));
      } else if (update.status === "finished" || update.status === "error") {
        setActiveChunks((prev) => {
          const next = new Set(prev);
          next.delete(update.chunkId);
          return next;
        });
      }
    },
    [onTranscription]
  );

  const { processChunk, isProcessing, resetContext } = useTranscription({ onUpdate: handleUpdate });

  const {
    isRecording,
    activeSource,
    startRecording: startRec,
    stopRecording: stopRec,
    error,
  } = useAudioRecording({
    onChunkAvailable: processChunk,
  });

  const startRecording = () => {
    resetContext();
    setActiveChunks(new Set());
    onRecordingStart?.();
    startRec(selectedSource);
  };

  const stopRecording = () => {
    stopRec();
    onRecordingStop?.();
  };

  const toggleSourcePicker = () => {
    if (!isRecording) {
      if (!showSourcePicker) {
        updateDropdownPosition();
      }
      setShowSourcePicker(!showSourcePicker);
    }
  };

  const currentSourceOption = SOURCE_OPTIONS.find((s) => s.value === selectedSource)!;
  const activeSourceOption = activeSource ? SOURCE_OPTIONS.find((s) => s.value === activeSource) : null;

  // Dropdown portal content
  const dropdownContent = showSourcePicker && !isRecording && (
    <div
      ref={dropdownRef}
      className="fixed w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-gray-200/50 overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
      }}
    >
      <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Audio Source</h3>
      </div>

      <div className="p-2">
        {SOURCE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setSelectedSource(option.value);
              setShowSourcePicker(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150",
              selectedSource === option.value
                ? "bg-gradient-to-r from-pink-100 to-rose-100"
                : "hover:bg-gray-50"
            )}
          >
            <div
              className={cn(
                "p-2.5 rounded-xl transition-all",
                selectedSource === option.value
                  ? "bg-gradient-to-br from-pink-500 to-rose-400 text-white shadow-md shadow-pink-500/30"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {option.icon}
            </div>
            <div className="flex-1 text-left">
              <div
                className={cn(
                  "font-semibold text-sm",
                  selectedSource === option.value ? "text-pink-700" : "text-gray-700"
                )}
              >
                {option.label}
              </div>
              <div className="text-xs text-gray-400">{option.description}</div>
            </div>
            {selectedSource === option.value && (
              <div className="p-1 bg-pink-500 rounded-full">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Tip section */}
      <div className="mx-2 mb-2 p-3 bg-amber-50/80 rounded-xl border border-amber-200/50">
        <div className="flex gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">Pro tip:</span> For system audio, select a browser tab and
            enable &quot;Share audio&quot; in the prompt.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative" ref={buttonRef}>
        {/* Main button group with glass effect */}
        <div
          className={cn(
            "flex items-center rounded-full transition-all duration-300",
            isRecording
              ? "bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/25"
              : "bg-gradient-to-r from-pink-500 to-rose-400 shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 hover:scale-[1.02]"
          )}
        >
          {/* Record/Stop button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className="flex items-center gap-2 pl-4 pr-3 py-2.5 text-white font-medium"
          >
            {isRecording ? (
              <>
                <div className="relative">
                  <Square className="w-4 h-4 fill-current" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
                <span className="text-sm">Stop</span>
              </>
            ) : (
              <>
                <div className="p-1 bg-white/20 rounded-full">
                  {currentSourceOption.icon}
                </div>
                <span className="text-sm">Record</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/20" />

          {/* Source dropdown trigger */}
          <button
            onClick={toggleSourcePicker}
            disabled={isRecording}
            className={cn(
              "flex items-center px-3 py-2.5 text-white transition-opacity",
              isRecording ? "opacity-40 cursor-not-allowed" : "hover:bg-white/10"
            )}
            style={{ borderRadius: "0 9999px 9999px 0" }}
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                showSourcePicker && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* Portal for dropdown - renders outside of overflow:hidden containers */}
      {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}

      {/* Recording indicator pill */}
      {isRecording && activeSourceOption && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full border border-red-200/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs font-semibold text-red-600">{activeSourceOption.label}</span>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && activeChunks.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 rounded-full border border-pink-200/50">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
          <span className="text-xs font-semibold text-pink-600">
            {activeChunks.size > 1 ? `Processing ${activeChunks.size}` : "Transcribing"}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full border border-red-200/50">
          <span className="text-xs font-medium text-red-600 max-w-[180px] truncate">{error}</span>
        </div>
      )}
    </div>
  );
}
