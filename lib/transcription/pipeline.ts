import { transcribeLayer1 } from "./layer1";
import { organizeLayer2 } from "./layer2";

export interface PipelineResult {
  rawText: string;
  organizedNotes: string;
  chunkId: string;
}

export async function runTranscriptionPipeline(
  audioBlob: Blob,
  chunkId: string,
  context?: {
    previousNotes?: string;
  }
): Promise<PipelineResult> {
  // Layer 1: Whisper via Groq
  const l1 = await transcribeLayer1(audioBlob, chunkId);

  // Layer 2: Quick organization via Groq Llama
  const l2 = await organizeLayer2(l1.text, chunkId, context?.previousNotes);

  return {
    rawText: l1.text,
    organizedNotes: l2.organizedNotes,
    chunkId,
  };
}
