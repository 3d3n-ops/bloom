import { NextRequest } from "next/server";
import { generateLayer2 } from "@/lib/transcription/layer2";

export const dynamic = "force-dynamic";

/**
 * Generate notes from accumulated transcript (called every 60 seconds)
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { transcript, sessionId, previousNotes } = await req.json();

  if (!transcript || !sessionId) {
    return new Response("Missing transcript or sessionId", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendUpdate({ layer: 2, status: "started", sessionId });
        const l2Result = await generateLayer2(transcript, sessionId, previousNotes);
        sendUpdate({ layer: 2, status: "completed", text: l2Result.polishedNotes, sessionId });
        sendUpdate({ status: "finished", sessionId });
        controller.close();
      } catch (error: unknown) {
        console.error("Notes generation API error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        sendUpdate({ status: "error", error: message, sessionId });
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
