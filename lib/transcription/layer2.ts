import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Layer 2: Quick organization of transcribed text
 * Runs immediately after transcription to structure raw speech into readable notes
 */
export async function organizeLayer2(
  transcribedText: string,
  chunkId: string,
  previousNotes?: string
): Promise<{
  organizedNotes: string;
  chunkId: string;
}> {
  // If the transcription is too short or empty, skip
  if (!transcribedText || transcribedText.trim().length < 5) {
    return {
      organizedNotes: "",
      chunkId,
    };
  }

  const prompt = `Organize this spoken transcription into readable notes. Keep it simple and faithful to what was said.

RULES:
- Follow the transcription CLOSELY
- Don't add information that wasn't spoken
- Keep the speaker's words and meaning
- Be concise

FORMAT:
- Use **bold** for key terms
- Use bullet points for lists
- Keep paragraphs short

${previousNotes ? `PREVIOUS (don't repeat):
${previousNotes.slice(-300)}
---
` : ""}TRANSCRIPTION:
"${transcribedText}"

Return clean HTML only. No intro text.`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Organize spoken words into readable notes. Be faithful. Don't embellish.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const organizedNotes = response.choices[0]?.message?.content || transcribedText;

    return {
      organizedNotes: organizedNotes.trim(),
      chunkId,
    };
  } catch (error) {
    console.error("Layer 2 (Groq) error:", error);
    return {
      organizedNotes: `<p>${transcribedText}</p>`,
      chunkId,
    };
  }
}
