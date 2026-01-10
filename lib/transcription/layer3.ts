import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Layer 3: Deep formatting pass
 * Formats accumulated notes into polished, well-structured content
 * Enriches content with additional context and explanations
 */
export async function formatLayer3(
  newNotes: string,
  sessionId: string,
  previousContext?: string
): Promise<{
  formattedNotes: string;
  sessionId: string;
}> {
  if (!newNotes || newNotes.trim().length < 10) {
    return {
      formattedNotes: newNotes,
      sessionId,
    };
  }

  const prompt = `Transform these lecture notes into RICH, comprehensive study notes.

YOUR GOAL: Take the raw transcript and create beefier, more detailed notes that a student would love to study from.

ENRICHMENT RULES:
1. Keep ALL original information but EXPAND on key concepts
2. Add brief clarifying explanations for technical terms
3. Include relevant context that helps understanding
4. Add examples or analogies where helpful
5. Connect ideas to broader concepts when obvious
6. Make definitions more complete and clear

STRUCTURE:
- Use <h3> for topics/sections
- Use <strong> for key terms and definitions
- Use <ul>/<li> for lists and key points
- Use <blockquote> for important principles, formulas, or quotes
- Use <p> for explanatory paragraphs
- For math, use $...$ inline or $$...$$ for blocks

STYLE:
- Write like a knowledgeable tutor explaining to a student
- Be thorough but not verbose - every sentence should add value
- Make complex ideas accessible
- Use clear, direct language

${previousContext ? `PREVIOUS CONTEXT (for continuity - DO NOT repeat):
${previousContext.slice(-400)}
---

` : ""}RAW NOTES TO ENRICH:
${newNotes}

Return ONLY the enriched HTML notes. No meta-commentary.`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert note-taker who transforms raw transcripts into rich, comprehensive study materials. You add helpful context, clarifications, and examples while preserving the original content. Your notes are thorough, well-organized, and genuinely useful for learning.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2500,
    });

    const formattedNotes = response.choices[0]?.message?.content || newNotes;

    return {
      formattedNotes: formattedNotes.trim(),
      sessionId,
    };
  } catch (error) {
    console.error("Layer 3 (Groq) formatting error:", error);
    return {
      formattedNotes: newNotes,
      sessionId,
    };
  }
}
