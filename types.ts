export interface Turn {
  role: "user" | "gemini";
  content: string;
  type: "text" | "voice" | "video";
  timestamp: number;
  reasoning?: string;
  isGuess?: boolean;
  /** Base64 image data for image/video clues */
  imageData?: string;
  /** Base64 audio data for voice clues */
  audioData?: string;
  /** Whether this message is a rate-limit error */
  isRateLimited?: boolean;
}

export interface GameState {
  status: "idle" | "playing" | "won" | "lost";
  rounds: number;
  history: Turn[];
  currentReasoning: string;
  lastGuess: string;
  difficulty: number;
}

export interface GeminiResponse {
  question: string;
  guess?: string;
  isCorrectGuess: boolean;
  reasoningSummary: string;
  reasoningConfidence: number;
  giveUp?: boolean;
  /** Extracted thinking/chain-of-thought from Gemini's thinking model */
  thoughtProcess?: string;
}
