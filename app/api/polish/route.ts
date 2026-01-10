import { NextRequest } from "next/server";
import { polishLayer4 } from "@/lib/transcription/layer4";

export const dynamic = "force-dynamic";

/**
 * Layer 4 polish endpoint
 * Called every 2 minutes to create final, beautifully formatted notes
 * Uses Claude via OpenRouter for highest quality output
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { notes, sessionId, previousContext } = await req.json();

  if (!notes || !sessionId) {
    return new Response("Missing notes or sessionId", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendUpdate({ status: "started", sessionId });

        // Run the polish pass
        const result = await polishLayer4(notes, sessionId, previousContext);

        // Split into chunks for streaming effect
        const chunks = splitIntoChunks(result.polishedNotes);

        for (let i = 0; i < chunks.length; i++) {
          sendUpdate({
            status: "chunk",
            chunk: chunks[i],
            index: i,
            total: chunks.length,
            sessionId,
          });
        }

        sendUpdate({
          status: "completed",
          polishedNotes: result.polishedNotes,
          sessionId,
        });

        controller.close();
      } catch (error: unknown) {
        console.error("Polish API error:", error);
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

/**
 * Split HTML content into meaningful chunks for streaming
 */
function splitIntoChunks(html: string): string[] {
  // Match complete HTML elements
  const regex = /<(p|h[1-6]|li|blockquote|ul|ol)[^>]*>[\s\S]*?<\/\1>/gi;
  const matches = html.match(regex);

  if (!matches || matches.length === 0) {
    return html.trim() ? [html] : [];
  }

  return matches;
}

