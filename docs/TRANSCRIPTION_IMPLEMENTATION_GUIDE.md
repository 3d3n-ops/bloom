# Transcription System Implementation Guide

## Detailed Technical Implementation

This guide provides detailed code examples and implementation patterns for the three-layer transcription system.

## Architecture Overview

### Data Flow

```
Browser (Client)
  ├─> Audio Capture (MediaRecorder)
  ├─> Chunk Audio (2-3s segments)
  └─> Send to API

Next.js API Route
  ├─> Receive Audio Chunk
  ├─> Layer 1: Parakeet-TDT Transcription
  │   └─> Raw Text Output
  ├─> Layer 2: Groq/DeepSeek Refinement
  │   └─> Cleaned Text Output
  ├─> Layer 3: Claude/Gemini Formatting
  │   └─> Formatted Notes (HTML)
  └─> Stream Response Back

Browser (Client)
  ├─> Receive SSE/WebSocket Updates
  ├─> Update Editor in Real-Time
  └─> Show Progress Indicators
```

## Layer 1: Initial Transcription

### Option 1: Using Hugging Face Inference API

```typescript
// lib/transcription/layer1.ts
import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;
const hf = new HfInference(HF_TOKEN);

export async function transcribeLayer1(
  audioBuffer: ArrayBuffer,
  chunkId: string
): Promise<{
  text: string;
  confidence: number;
  chunkId: string;
}> {
  try {
    // Convert audio to format expected by model
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    
    // Call Parakeet-TDT model via Hugging Face
    const result = await hf.automaticSpeechRecognition({
      model: 'nvidia/parakeet-tdt-0.6b-v2',
      data: audioBlob,
    });

    return {
      text: result.text,
      confidence: result.confidence || 0.95,
      chunkId,
    };
  } catch (error) {
    console.error('Layer 1 transcription error:', error);
    throw new Error('Transcription failed');
  }
}
```

### Option 2: Using NVIDIA NeMo (Self-Hosted)

```typescript
// lib/transcription/layer1-nemo.ts
export async function transcribeLayer1NeMo(
  audioBuffer: ArrayBuffer,
  chunkId: string
): Promise<TranscriptionResult> {
  const NEMO_API_URL = process.env.NVIDIA_NEMO_API_URL;
  
  const formData = new FormData();
  const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
  formData.append('audio', audioBlob, 'chunk.wav');
  formData.append('chunkId', chunkId);

  const response = await fetch(`${NEMO_API_URL}/transcribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NEMO_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('NeMo transcription failed');
  }

  return await response.json();
}
```

### Option 3: Using Web Speech API (Fallback)

```typescript
// lib/transcription/layer1-webspeech.ts
export function createWebSpeechTranscriber() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    throw new Error('Speech recognition not supported');
  }

  const SpeechRecognition = (window as any).SpeechRecognition || 
                           (window as any).webkitSpeechRecognition;
  
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  return recognition;
}
```

## Layer 2: Text Refinement

### Using Groq API (Recommended)

```typescript
// lib/transcription/layer2.ts
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function refineLayer2(
  rawText: string,
  chunkId: string,
  context?: string
): Promise<{
  refinedText: string;
  improvements: string[];
  chunkId: string;
}> {
  const prompt = `You are a text refinement assistant. Clean up the following transcribed text:
- Fix any transcription errors
- Add proper punctuation and capitalization
- Remove filler words (um, uh, like, etc.)
- Fix grammar issues
- Maintain the original meaning

${context ? `Previous context: ${context}\n\n` : ''}Text to refine: "${rawText}"

Return only the refined text, no explanations.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a precise text refinement assistant. Return only the cleaned text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'deepseek-r1-distill-qwen-32b', // or 'gemma2-9b-it' for speed
      temperature: 0.3,
      max_tokens: 500,
    });

    const refinedText = completion.choices[0]?.message?.content || rawText;

    return {
      refinedText: refinedText.trim(),
      improvements: [], // Could analyze differences
      chunkId,
    };
  } catch (error) {
    console.error('Layer 2 refinement error:', error);
    // Fallback to original text
    return {
      refinedText: rawText,
      improvements: [],
      chunkId,
    };
  }
}
```

### Using DeepSeek API (Alternative)

```typescript
// lib/transcription/layer2-deepseek.ts
export async function refineLayer2DeepSeek(
  rawText: string,
  chunkId: string
): Promise<RefinementResult> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Refine transcribed text: fix errors, add punctuation, remove fillers.',
        },
        {
          role: 'user',
          content: `Refine this text: "${rawText}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  return {
    refinedText: data.choices[0]?.message?.content || rawText,
    improvements: [],
    chunkId,
  };
}
```

## Layer 3: Note Formatting

### Using Claude Opus (via Anthropic)

```typescript
// lib/transcription/layer3.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function formatLayer3(
  refinedText: string,
  chunkId: string,
  previousNotes?: string
): Promise<{
  formattedNotes: string; // HTML
  chunkId: string;
}> {
  const prompt = `Convert the following text into well-formatted notes:
- Use appropriate headings for topics
- Create bullet points for key ideas
- Format dates, numbers, and lists properly
- Add emphasis where appropriate
- Organize content logically

${previousNotes ? `Previous notes context:\n${previousNotes}\n\n` : ''}Text to format: "${refinedText}"

Return the formatted notes in HTML format.`;

  try {
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Handle streaming response
    let formattedNotes = '';
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        formattedNotes += chunk.delta.text;
      }
    }

    return {
      formattedNotes: formattedNotes.trim(),
      chunkId,
    };
  } catch (error) {
    console.error('Layer 3 formatting error:', error);
    // Fallback: return as paragraph
    return {
      formattedNotes: `<p>${refinedText}</p>`,
      chunkId,
    };
  }
}
```

### Using Gemini (Alternative)

```typescript
// lib/transcription/layer3-gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function formatLayer3Gemini(
  refinedText: string,
  chunkId: string
): Promise<FormattingResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Format this text into structured notes with headings and bullet points: "${refinedText}"`;

  const result = await model.generateContentStream(prompt);
  
  let formattedNotes = '';
  for await (const chunk of result.stream) {
    formattedNotes += chunk.text();
  }

  return {
    formattedNotes: formattedNotes.trim(),
    chunkId,
  };
}
```

## Pipeline Orchestration

```typescript
// lib/transcription/pipeline.ts
import { transcribeLayer1 } from './layer1';
import { refineLayer2 } from './layer2';
import { formatLayer3 } from './layer3';

export interface TranscriptionPipelineResult {
  layer1: {
    text: string;
    confidence: number;
    latency: number;
  };
  layer2: {
    refinedText: string;
    improvements: string[];
    latency: number;
  };
  layer3: {
    formattedNotes: string;
    latency: number;
  };
  totalLatency: number;
}

export async function processTranscriptionPipeline(
  audioBuffer: ArrayBuffer,
  chunkId: string,
  sessionId: string,
  context?: {
    previousText?: string;
    previousNotes?: string;
  }
): Promise<TranscriptionPipelineResult> {
  const startTime = Date.now();

  // Layer 1: Initial Transcription
  const layer1Start = Date.now();
  const layer1Result = await transcribeLayer1(audioBuffer, chunkId);
  const layer1Latency = Date.now() - layer1Start;

  // Layer 2: Text Refinement
  const layer2Start = Date.now();
  const layer2Result = await refineLayer2(
    layer1Result.text,
    chunkId,
    context?.previousText
  );
  const layer2Latency = Date.now() - layer2Start;

  // Layer 3: Note Formatting
  const layer3Start = Date.now();
  const layer3Result = await formatLayer3(
    layer2Result.refinedText,
    chunkId,
    context?.previousNotes
  );
  const layer3Latency = Date.now() - layer3Start;

  const totalLatency = Date.now() - startTime;

  return {
    layer1: {
      ...layer1Result,
      latency: layer1Latency,
    },
    layer2: {
      ...layer2Result,
      latency: layer2Latency,
    },
    layer3: {
      ...layer3Result,
      latency: layer3Latency,
    },
    totalLatency,
  };
}
```

## API Route Implementation

### Combined Streaming Endpoint

```typescript
// app/api/transcribe/stream/route.ts
import { NextRequest } from 'next/server';
import { processTranscriptionPipeline } from '@/lib/transcription/pipeline';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const chunkId = formData.get('chunkId') as string;
    const sessionId = formData.get('sessionId') as string;
    const previousText = formData.get('previousText') as string | null;
    const previousNotes = formData.get('previousNotes') as string | null;

    if (!audioFile || !chunkId || !sessionId) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Convert File to ArrayBuffer
    const audioBuffer = await audioFile.arrayBuffer();

    // Process through pipeline
    const result = await processTranscriptionPipeline(
      audioBuffer,
      chunkId,
      sessionId,
      {
        previousText: previousText || undefined,
        previousNotes: previousNotes || undefined,
      }
    );

    // Return as JSON (could be SSE for real-time updates)
    return Response.json({
      success: true,
      chunkId,
      sessionId,
      result,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json(
      { success: false, error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
```

### Server-Sent Events for Real-Time Updates

```typescript
// app/api/transcribe/stream-sse/route.ts
import { NextRequest } from 'next/server';
import { transcribeLayer1 } from '@/lib/transcription/layer1';
import { refineLayer2 } from '@/lib/transcription/layer2';
import { formatLayer3 } from '@/lib/transcription/layer3';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const chunkId = formData.get('chunkId') as string;
        const sessionId = formData.get('sessionId') as string;

        const audioBuffer = await audioFile.arrayBuffer();

        // Layer 1
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ layer: 1, status: 'processing' })}\n\n`)
        );
        const layer1Result = await transcribeLayer1(audioBuffer, chunkId);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ layer: 1, result: layer1Result })}\n\n`)
        );

        // Layer 2
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ layer: 2, status: 'processing' })}\n\n`)
        );
        const layer2Result = await refineLayer2(layer1Result.text, chunkId);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ layer: 2, result: layer2Result })}\n\n`)
        );

        // Layer 3
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ layer: 3, status: 'processing' })}\n\n`)
        );
        const layer3Result = await formatLayer3(layer2Result.refinedText, chunkId);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ layer: 3, result: layer3Result, complete: true })}\n\n`)
        );

        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Processing failed' })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

## Client-Side Implementation

### Audio Recording Hook

```typescript
// hooks/use-audio-recording.ts
import { useState, useRef, useCallback } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
}

export function useAudioRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  const chunkCounterRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          await processAudioChunk(event.data);
        }
      };

      mediaRecorder.start(2000); // Collect chunks every 2 seconds
      mediaRecorderRef.current = mediaRecorder;

      setState({ isRecording: true, isProcessing: false, error: null });
    } catch (error) {
      setState({
        isRecording: false,
        isProcessing: false,
        error: 'Failed to start recording',
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      setState(prev => ({ ...prev, isRecording: false }));
    }
  }, []);

  const processAudioChunk = async (audioBlob: Blob) => {
    setState(prev => ({ ...prev, isProcessing: true }));
    
    const chunkId = `chunk-${chunkCounterRef.current++}`;
    const formData = new FormData();
    formData.append('audio', audioBlob, 'chunk.webm');
    formData.append('chunkId', chunkId);
    formData.append('sessionId', sessionIdRef.current);

    try {
      const response = await fetch('/api/transcribe/stream', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        // Handle successful transcription
        return data.result;
      } else {
        throw new Error(data.error || 'Transcription failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Processing failed',
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return {
    ...state,
    startRecording,
    stopRecording,
  };
}
```

### Transcription Hook with SSE

```typescript
// hooks/use-transcription.ts
import { useState, useCallback } from 'react';

export interface TranscriptionUpdate {
  layer: 1 | 2 | 3;
  status: 'processing' | 'complete';
  result?: any;
  error?: string;
}

export function useTranscription(onComplete: (formattedNotes: string) => void) {
  const [updates, setUpdates] = useState<TranscriptionUpdate[]>([]);

  const transcribeChunk = useCallback(async (audioBlob: Blob, chunkId: string, sessionId: string) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('chunkId', chunkId);
    formData.append('sessionId', sessionId);

    const response = await fetch('/api/transcribe/stream-sse', {
      method: 'POST',
      body: formData,
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          setUpdates(prev => [...prev, data]);

          if (data.complete && data.layer === 3) {
            onComplete(data.result.formattedNotes);
          }
        }
      }
    }
  }, [onComplete]);

  return { transcribeChunk, updates };
}
```

## Editor Integration

```typescript
// components/editor/recording-button.tsx
'use client';

import { Mic, Square } from 'lucide-react';
import { useAudioRecording } from '@/hooks/use-audio-recording';
import { useTranscription } from '@/hooks/use-transcription';

interface RecordingButtonProps {
  onTranscriptionComplete: (html: string) => void;
}

export function RecordingButton({ onTranscriptionComplete }: RecordingButtonProps) {
  const { isRecording, isProcessing, error, startRecording, stopRecording } = useAudioRecording();
  const { transcribeChunk, updates } = useTranscription(onTranscriptionComplete);

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="p-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
          title="Start recording"
        >
          <Mic className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          title="Stop recording"
        >
          <Square className="w-5 h-5" />
        </button>
      )}
      
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <span>Transcribing...</span>
        </div>
      )}

      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  );
}
```

## Next Steps

1. Install required dependencies
2. Set up environment variables
3. Implement Layer 1 (choose integration method)
4. Implement Layer 2 (Groq recommended)
5. Implement Layer 3 (Claude or Gemini)
6. Create API routes
7. Build client-side hooks
8. Integrate into Editor component
9. Test and optimize

