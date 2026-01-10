import { NextRequest } from "next/server";
import { transcribeLayer1 } from "@/lib/transcription/layer1";
import { organizeLayer2 } from "@/lib/transcription/layer2";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const formData = await req.formData();
  const audioFile = formData.get("audio") as Blob;
  const chunkId = formData.get("chunkId") as string;
  const previousNotes = formData.get("previousNotes") as string | undefined;

  if (!audioFile) {
    return new Response("Missing audio file", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Layer 1: Whisper via Groq (fast speech-to-text)
        sendUpdate({ layer: 1, status: "started", chunkId });
        const l1Result = await transcribeLayer1(audioFile, chunkId);
        sendUpdate({ layer: 1, status: "completed", text: l1Result.text, chunkId });

        // Layer 2: Quick organization via Groq Llama (fast structuring)
        sendUpdate({ layer: 2, status: "started", chunkId });
        const l2Result = await organizeLayer2(l1Result.text, chunkId, previousNotes);
        sendUpdate({ layer: 2, status: "completed", text: l2Result.organizedNotes, chunkId });

        sendUpdate({ status: "finished", chunkId });
        controller.close();
      } catch (error: unknown) {
        console.error("Transcription API error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        sendUpdate({ status: "error", error: message, chunkId });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
