/**
 * Layer 2: Notes Generation (Claude via OpenRouter)
 * Creates beautifully formatted, simplified notes from transcript
 * Uses proper formatting, LaTeX for math, and professional styling
 */
export async function generateLayer2(
  notes: string,
  sessionId: string,
  previousContext?: string
): Promise<{
  polishedNotes: string;
  sessionId: string;
}> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL = process.env.OPENROUTER_MODEL_L2 || "anthropic/claude-sonnet-4";

  if (!notes || notes.trim().length < 20) {
    return {
      polishedNotes: notes,
      sessionId,
    };
  }

  const prompt = `Create brief, detailed study notes from the transcript. Be concise - capture key points only.

## FORMATTING REQUIREMENTS (CRITICAL)
- Use <p> for regular paragraphs and explanations
- Use <ul><li> ONLY for actual bullet point lists (multiple related items)
- Use <ol><li> ONLY for numbered/ordered lists (steps, sequences, rankings)
- Use <h3> for major topic sections
- Use <strong> for key terms only
- Math: $formula$ for inline, $$formula$$ for blocks
- Remove all extra whitespace and line breaks
- Ensure consistent spacing - one space between words, no gaps
- Proper list structure: <ul><li>Item</li><li>Item</li></ul> or <ol><li>Step 1</li><li>Step 2</li></ol>
- DO NOT wrap everything in lists - use paragraphs for single points or explanations

## EXAMPLE

**Transcript:**
"So today we're going to talk about photosynthesis. Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. This happens primarily in the chloroplasts, which contain chlorophyll. The process has two main stages: the light-dependent reactions and the Calvin cycle. During the light-dependent reactions, light energy is captured and used to produce ATP and NADPH. Then in the Calvin cycle, these energy carriers are used to fix carbon dioxide into organic molecules."

**Expected Notes:**
<p><strong>Photosynthesis</strong>: Plants convert sunlight, CO₂, and H₂O into glucose and O₂. Occurs in <strong>chloroplasts</strong> (contain chlorophyll).</p><h3>Two Stages</h3><ul><li>Light-dependent reactions: Capture light → produce ATP and NADPH</li><li>Calvin cycle: Use ATP/NADPH to fix CO₂ into organic molecules</li></ul>

**Numbered List Example (for steps):**
<ol><li>First step: Capture light energy</li><li>Second step: Produce ATP and NADPH</li><li>Third step: Fix carbon dioxide</li></ol>

## RULES
- Keep it SHORT - aim for 30-40% of transcript length
- Use lists ONLY when you have multiple related items (3+ items)
- Use paragraphs for single points or explanations
- Use headings to separate major topics
- No filler, no examples unless critical
- NO extra spaces or gaps in HTML output
- Compact formatting - remove unnecessary whitespace

${previousContext ? `Previous context: ${previousContext.slice(-400)}\n\n` : ""}**Transcript to summarize:**
${notes}

Return ONLY the HTML notes. Start directly with content.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "Create brief, detailed study notes. Summarize transcripts into concise notes using paragraphs, headings, and lists appropriately. Use lists only for multiple related items. Keep notes short and scannable. Use proper LaTeX for math.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.15,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter Layer 2 error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    let polishedNotes = data.choices[0]?.message?.content || notes;

    // Clean up formatting: remove extra whitespace between HTML tags while preserving text content
    polishedNotes = polishedNotes
      .replace(/>\s+</g, '><') // Remove spaces between HTML tags
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space (within text)
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();

    return {
      polishedNotes,
      sessionId,
    };
  } catch (error) {
    console.error("Layer 2 (Claude) error:", error);
    return {
      polishedNotes: notes,
      sessionId,
    };
  }
}

