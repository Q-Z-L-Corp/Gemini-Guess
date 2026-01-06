import type { GeminiResponse } from "@/types";

type ProcessTurnInput = {
  history: any[];
  input: {
    text?: string;
    image?: string;
    audio?: string;
  };
  modelName?: string;
};

/**
 * Client-side wrapper for Gemini API route
 */
export async function processTurn(
  history: any[],
  input: { text?: string; image?: string; audio?: string },
  modelName?: string,
): Promise<GeminiResponse> {
  const res = await fetch("/api/gemini/process-turn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      history,
      input,
      modelName,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API failed: ${errorText}`);
  }

  return res.json();
}
