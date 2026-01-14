import { NextRequest } from "next/server";
import { cleanupLayer3 } from "@/lib/transcription/layer3";

export const dynamic = "force-dynamic";

/**
 * Layer 3 cleanup endpoint
 * Called after recording stops to clean up all notes
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { notes, sessionId } = await req.json();

  if (!notes || !sessionId) {
    return new Response("Missing notes or sessionId", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendUpdate({ layer: 3, status: "started", sessionId });
        const l3Result = await cleanupLayer3(notes, sessionId);
        sendUpdate({ layer: 3, status: "completed", text: l3Result.cleanedNotes, sessionId });
        sendUpdate({ status: "finished", sessionId });
        controller.close();
      } catch (error: unknown) {
        console.error("Cleanup API error:", error);
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
