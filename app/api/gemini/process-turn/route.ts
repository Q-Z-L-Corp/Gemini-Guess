import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "@/types";

// ❗ Server-only env access
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing API_KEY environment variable");
}

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_PROMPT = `
You are the world's most advanced 20-Questions player. 
A human player is thinking of an idea, object, or concept. 
Your goal is to guess it as quickly and accurately as possible.

You will receive clues in text, transcribed voice, or as image frames (video).
When you receive an audio clip, listen to it carefully for any spoken words, sounds, or contextual clues.
When you receive an image, analyze it carefully for any visual clues about what the player is thinking of.
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

    const { history = [], input, modelName = "gemini-3-flash-preview" } = body;

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
      parts.push({
        text: "(The user is showing you a visual clue via their camera. Analyze this image carefully to help you guess what they're thinking of.)",
      });
    }

    if (input?.audio) {
      parts.push({
        inlineData: {
          mimeType: "audio/webm",
          data: input.audio,
        },
      });
      parts.push({
        text: "(The user recorded a voice clue. Listen carefully to what they said and use it as a clue to guess what they're thinking of.)",
      });
    }

    // If no parts were added (shouldn't happen), add a fallback
    if (parts.length === 0) {
      parts.push({ text: "(The user provided a clue but it was empty.)" });
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

    // Extract thinking/reasoning from the response parts
    let thoughtProcess = "";
    try {
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        const thinkingParts = candidate.content.parts.filter(
          (p: any) => p.thought === true,
        );
        if (thinkingParts.length > 0) {
          thoughtProcess = thinkingParts.map((p: any) => p.text).join("\n");
        }
      }
    } catch {
      // If thinking extraction fails, continue without it
    }

    const text = response.text ?? "{}";
    const parsed = JSON.parse(text);

    const result: GeminiResponse = {
      question: parsed.question || "",
      guess: parsed.guess,
      isCorrectGuess: parsed.isCorrectGuess || false,
      reasoningSummary: parsed.reasoningSummary || "",
      reasoningConfidence: parsed.reasoningConfidence || 0,
      giveUp: parsed.giveUp || false,
      thoughtProcess: thoughtProcess || parsed.reasoningSummary || "",
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Extract a user-friendly message from the Gemini error
    let message = "Failed to process Gemini turn.";
    const status = error?.status || error?.response?.status || 500;

    if (status === 429) {
      // Parse retry delay if available
      const retryMatch = error?.message?.match(/retry in ([\d.]+s)/i);
      const retryHint = retryMatch
        ? ` Try again in ~${retryMatch[1]}.`
        : " Please wait a moment and try again.";
      message = `Rate limit reached — you've hit the free-tier quota for this model.${retryHint}`;
    } else if (error?.message) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status });
  }
}
