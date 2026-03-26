import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateItinerary(destination: string, duration: string, budget: number) {
  const model = "gemini-3-flash-preview";
  const prompt = `Generate a detailed travel itinerary for ${destination} for a duration of ${duration} with a budget of ${budget}. 
  Return the response as a JSON array of days, where each day has a 'day' number and an 'activities' array of strings.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.INTEGER },
            activities: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["day", "activities"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}

export async function getTravelAdvice(query: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: query,
    config: {
      systemInstruction: "You are a travel concierge expert for Fiezta. Provide helpful, concise advice on destinations, visas, and travel logistics."
    }
  });

  return response.text;
}

export async function generateText(prompt: string, systemInstruction?: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || "You are a helpful travel assistant."
    }
  });

  return response.text;
}
