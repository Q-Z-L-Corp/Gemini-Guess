export interface Turn {
  role: "user" | "gemini";
  content: string;
  type: "text" | "voice" | "video";
  timestamp: number;
  reasoning?: string;
  isGuess?: boolean;
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
  thoughtProcess: string;
  reasoningConfidence: number;
  giveUp?: boolean;
}
