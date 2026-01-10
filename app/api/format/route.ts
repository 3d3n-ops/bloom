import { NextRequest } from "next/server";
import { formatLayer3 } from "@/lib/transcription/layer3";

export const dynamic = "force-dynamic";

/**
 * Layer 3 formatting endpoint
 * Called periodically (every 5-10s) to format NEW accumulated notes
 * Streams back the formatted content line-by-line for the bloom cursor effect
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

        // Run the formatting pass on NEW notes only
        const result = await formatLayer3(notes, sessionId, previousContext);

        // Split formatted notes into lines for the bloom cursor effect
        const lines = splitIntoFormattedChunks(result.formattedNotes);

        // Stream each line
        for (let i = 0; i < lines.length; i++) {
          sendUpdate({
            status: "line",
            line: lines[i],
            index: i,
            total: lines.length,
            sessionId,
          });
        }

        sendUpdate({
          status: "completed",
          formattedNotes: result.formattedNotes,
          sessionId,
        });

        controller.close();
      } catch (error: unknown) {
        console.error("Format API error:", error);
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
 * Split HTML content into meaningful chunks for line-by-line animation
 */
function splitIntoFormattedChunks(html: string): string[] {
  // Match complete HTML elements (paragraphs, headings, list items, blockquotes)
  const regex = /<(p|h[1-6]|li|blockquote|ul|ol)[^>]*>[\s\S]*?<\/\1>/gi;
  const matches = html.match(regex);

  if (!matches || matches.length === 0) {
    // Fallback: return as single chunk if no matches
    return html.trim() ? [html] : [];
  }

  return matches;
}
