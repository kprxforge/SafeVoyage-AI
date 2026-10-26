import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export async function generateSafetyAlert(locationString: string): Promise<string> {
  try {
    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Provide a very short, realistic safety alert or tip for a tourist currently located at or near: ${locationString}. Keep it under 2 sentences. Focus on common travel safety (e.g., pickpockets, weather, local emergency info).`,
    });
    return result.text || "Stay alert and aware of your surroundings.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Could not fetch local safety tips. Stay aware of your surroundings.";
  }
}

export async function translateText(text: string, targetLanguage: string): Promise<{ translated: string; pronunciation: string }> {
  try {
    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Translate the following text to ${targetLanguage}.\n\nText: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translated: {
              type: Type.STRING,
              description: "The translated text in the target language.",
            },
            pronunciation: {
              type: Type.STRING,
              description: "The English romanized pronunciation of the translated text (e.g., romaji, pinyin). Omit if the language naturally uses standard Latin alphabet without diacritics that need romanization.",
            }
          },
          required: ["translated", "pronunciation"]
        }
      }
    });
    
    const data = JSON.parse(result.text || "{}");
    return {
      translated: data.translated || "Translation failed.",
      pronunciation: data.pronunciation || ""
    };
  } catch (error) {
    console.error("AI Error:", error);
    return { translated: "Translation failed.", pronunciation: "" };
  }
}
