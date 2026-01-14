import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Layer 3: Final Cleanup Pass (Groq Llama)
 * Quick cleanup and formatting fix for all notes after recording stops
 * Ensures proper list formatting and consistent structure
 */
export async function cleanupLayer3(
  notes: string,
  sessionId: string
): Promise<{
  cleanedNotes: string;
  sessionId: string;
}> {
  if (!notes || notes.trim().length < 20) {
    return {
      cleanedNotes: notes,
      sessionId,
    };
  }

  const prompt = `Clean up and fix formatting issues in these study notes. Ensure proper list formatting and consistent structure.

## CRITICAL FORMATTING FIXES

### Lists (MOST IMPORTANT - FIX ALL LIST ISSUES)
- **Bullet lists**: Use proper <ul><li> structure. Each <li> MUST be inside <ul>
- **Numbered lists**: Use <ol><li> for sequential items (steps, rankings, numbered points). Each <li> MUST be inside <ol>
- **NEVER have <li> without a parent <ul> or <ol>**
- **Nested lists**: Properly nest <ul> or <ol> inside parent <li> elements
- **Example correct bullet structure:**
  <ul><li>First item</li><li>Second item<ul><li>Nested item</li></ul></li></ul>
- **Example correct numbered list:**
  <ol><li>Step one</li><li>Step two</li><li>Step three</li></ol>
- **Fix any broken lists**: If you see <li> without <ul> or <ol>, wrap it properly
- **Convert loose items to lists**: If content looks like a list but isn't formatted, convert it

### HTML Structure Rules
- Every <li> must be inside a <ul> or <ol>
- Never have <li> without a parent list container
- Use <ul> for unordered/bullet points (multiple related items)
- Use <ol> for ordered/numbered lists (steps, sequences)
- Use <p> for paragraphs and single points
- Use <h3> for major sections
- Use <strong> for key terms
- Keep HTML compact - no extra spaces between tags
- Lists should only be used when there are multiple related items (3+ items)

### Cleanup Tasks
- Fix any broken list structures
- Convert inappropriate lists to paragraphs (if only 1-2 items, use <p> instead)
- Ensure all lists are properly formatted
- Remove duplicate content
- Fix spacing issues
- Ensure consistent formatting throughout
- Balance between lists and paragraphs - don't overuse lists

## NOTES TO CLEAN UP:
${notes}

Return ONLY the cleaned HTML. Fix all list formatting issues. Start directly with content.`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert at fixing HTML formatting issues in study notes. You ensure proper list structures, fix broken HTML, and maintain consistent formatting. You always use proper <ul>/<li> and <ol>/<li> structures.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    let cleanedNotes = response.choices[0]?.message?.content || notes;

    // Final cleanup pass
    cleanedNotes = cleanedNotes
      .replace(/>\s+</g, '><') // Remove spaces between HTML tags
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();

    return {
      cleanedNotes,
      sessionId,
    };
  } catch (error) {
    console.error("Layer 3 (Groq) cleanup error:", error);
    return {
      cleanedNotes: notes,
      sessionId,
    };
  }
}
