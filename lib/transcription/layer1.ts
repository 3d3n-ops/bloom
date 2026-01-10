import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function transcribeLayer1(
  audioBlob: Blob,
  chunkId: string
): Promise<{
  text: string;
  chunkId: string;
}> {
  try {
    // Convert Blob to Buffer for Groq SDK compatibility in Node.js
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Groq's SDK expects a file-like object. In Node, we can provide a 
    // buffer with a name, or a Readable stream.
    // We'll use a named buffer as it's the most reliable for small chunks.
    const transcription = await groq.audio.transcriptions.create({
      file: await Groq.toFile(buffer, `chunk-${chunkId}.webm`, { type: 'audio/webm' }),
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "en",
    });

    return {
      text: transcription.text,
      chunkId,
    };
  } catch (error) {
    console.error("Layer 1 (Groq Whisper) error:", error);
    throw error;
  }
}

