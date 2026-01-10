/**
 * Layer 4: Final Polish Pass (Claude via OpenRouter)
 * Creates beautifully formatted, simplified notes with quality examples
 * Uses proper formatting, LaTeX for math, and professional styling
 */
export async function polishLayer4(
  notes: string,
  sessionId: string,
  previousContext?: string
): Promise<{
  polishedNotes: string;
  sessionId: string;
}> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL = process.env.OPENROUTER_MODEL_L4 || "anthropic/claude-sonnet-4";

  if (!notes || notes.trim().length < 20) {
    return {
      polishedNotes: notes,
      sessionId,
    };
  }

  const prompt = `You are creating the FINAL, polished version of study notes. Transform these notes into beautifully formatted, professional-quality study materials.

## YOUR MISSION
Take these notes and create the BEST possible version - clean, clear, well-organized, and genuinely useful for studying.

## FORMATTING REQUIREMENTS

### Structure
- Use <h2> for major sections, <h3> for subsections
- Use <p> for explanatory text
- Use <ul>/<li> for bullet points and lists
- Use <ol>/<li> for numbered steps or sequences
- Use <blockquote> for key principles, theorems, or important quotes
- Use <strong> for key terms (first mention)
- Use <em> for emphasis

### Mathematics (REQUIRED for any math content)
- Inline math: $formula$ (e.g., $E = mc^2$)
- Block math: $$formula$$ (e.g., $$\\int_a^b f(x)dx$$)
- Always use proper LaTeX notation
- Format equations cleanly with proper spacing

### Examples
- Add 1-2 concrete, helpful examples for complex concepts
- Use realistic scenarios that aid understanding
- Keep examples concise but illustrative

### Quality Standards
- Simplify complex language without losing meaning
- Remove redundancy and filler
- Ensure logical flow between sections
- Make every sentence count
- Use clear, accessible language

${previousContext ? `## PREVIOUS CONTEXT (for continuity - do not repeat):
${previousContext.slice(-600)}

---

` : ""}## NOTES TO POLISH:
${notes}

## OUTPUT
Return ONLY the polished HTML notes. No commentary, no preamble. Start directly with the content.`;

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
            content: "You are a world-class note editor and academic writer. You transform rough notes into polished, professional study materials. Your notes are known for their clarity, beautiful formatting, and genuinely helpful examples. You use proper LaTeX for all mathematical content.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.25,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter Layer 4 error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const polishedNotes = data.choices[0]?.message?.content || notes;

    return {
      polishedNotes: polishedNotes.trim(),
      sessionId,
    };
  } catch (error) {
    console.error("Layer 4 (Claude) polish error:", error);
    return {
      polishedNotes: notes,
      sessionId,
    };
  }
}

