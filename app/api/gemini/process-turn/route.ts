import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "@/types";

// ❗ Server-only env access
const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error("Missing API_KEY environment variable");
}

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_PROMPT = `
You are the world's most advanced 20-Questions player. 
A human player is thinking of an idea, object, or concept. 
Your goal is to guess it as quickly and accurately as possible.

You will receive clues in text, transcribed voice, or as image frames (video).
You MUST respond with a JSON object.

DO NOT reveal chain-of-thought.
Provide concise justification instead.

JSON structure:
{
  "question": "Your question to narrow down the concept",
  "guess": "Your official guess if confident, otherwise null",
  "isCorrectGuess": false,
  "reasoningSummary": "Brief explanation",
  "reasoningConfidence": 0.0 to 1.0,
  "giveUp": false
}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { history = [], input, modelName = "gemini-3-pro-preview" } = body;

    const parts: any[] = [];

    if (input?.text) {
      parts.push({ text: input.text });
    }

    if (input?.image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: input.image,
        },
      });
      parts.push({ text: "(User provided an image/video frame as a clue)" });
    }

    const contents = [
      ...history,
      {
        role: "user",
        parts,
      },
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 32768 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            guess: { type: Type.STRING },
            isCorrectGuess: { type: Type.BOOLEAN },
            reasoningSummary: { type: Type.STRING },
            reasoningConfidence: { type: Type.NUMBER },
            giveUp: { type: Type.BOOLEAN },
          },
          required: ["question", "isCorrectGuess", "reasoningConfidence"],
        },
      },
    });

    const text = response.text ?? "{}";
    const parsed = JSON.parse(text) as GeminiResponse;

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    return NextResponse.json(
      { error: "Failed to process Gemini turn" },
      { status: 500 },
    );
  }
}
