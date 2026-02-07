"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { MediaCapture } from "./components/MediaCapture";
import { ReasoningPanel } from "./components/ReasoningPanel";
import { processTurn } from "./services/geminiService";
import { GameState, Turn, GeminiResponse } from "../types";

const App = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: "idle",
    rounds: 0,
    history: [],
    currentReasoning: "",
    lastGuess: "",
    difficulty: 0,
  });

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.history]);

  const handleStartGame = () => {
    setGameState({
      status: "playing",
      rounds: 0,
      history: [
        {
          role: "gemini",
          content:
            "I'm ready! Think of an idea, object, or concept. Give me a first clue—you can type it, say it, or even show me something through your camera.",
          type: "text",
          timestamp: Date.now(),
        },
      ],
      currentReasoning:
        "Initializing deep reasoning game loop. Awaiting user context...",
      lastGuess: "",
      difficulty: 0,
    });
    setConfidence(0);
  };

  const handleSendTurn = async (input: {
    text?: string;
    image?: string;
    audio?: string;
  }) => {
    if (gameState.status !== "playing" || isLoading) return;

    setIsLoading(true);

    // Determine display content and type
    let displayContent = input.text || "";
    let turnType: Turn["type"] = "text";

    if (input.image) {
      turnType = "video";
      displayContent = input.text || "📷 Shared a visual clue";
    } else if (input.audio) {
      turnType = "voice";
      displayContent = input.text || "🎤 Shared a voice clue";
    }

    // Add user turn to history with media data for previews
    const userTurn: Turn = {
      role: "user",
      content: displayContent,
      type: turnType,
      timestamp: Date.now(),
      imageData: input.image,
      audioData: input.audio,
    };

    setGameState((prev) => ({
      ...prev,
      history: [...prev.history, userTurn],
      rounds: prev.rounds + 1,
    }));

    try {
      // Map history for API — only send text parts (don't re-send old media)
      const apiHistory = gameState.history.map((h) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      }));

      const response: GeminiResponse = await processTurn(apiHistory, input);
      console.log("ai res", response);

      const geminiTurn: Turn = {
        role: "gemini",
        content:
          response.guess && response.guess !== "null"
            ? `Is it a... ${response.guess}?`
            : response.question,
        type: "text",
        timestamp: Date.now(),
        reasoning: response.thoughtProcess || response.reasoningSummary,
        isGuess: !!(response.guess && response.guess !== "null"),
      };

      setGameState((prev) => ({
        ...prev,
        history: [...prev.history, geminiTurn],
        currentReasoning:
          response.thoughtProcess ||
          response.reasoningSummary ||
          prev.currentReasoning,
        lastGuess: response.guess || prev.lastGuess,
        status: response.isCorrectGuess
          ? "won"
          : response.giveUp
            ? "lost"
            : "playing",
      }));
      setConfidence(response.reasoningConfidence);
      setInputText("");
    } catch (err) {
      console.error(err);
      // Add error message to chat
      setGameState((prev) => ({
        ...prev,
        history: [
          ...prev.history,
          {
            role: "gemini",
            content:
              "Sorry, I encountered an error processing that clue. Please try again.",
            type: "text",
            timestamp: Date.now(),
          },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Keep handleSendTurn in a ref so child callbacks always call the latest version
  const handleSendTurnRef = useRef(handleSendTurn);
  handleSendTurnRef.current = handleSendTurn;

  /** Convert audio blob to base64 and send as audio clue */
  const onVoiceData = useCallback(async (blob: Blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );
      handleSendTurnRef.current({ audio: base64 });
    } catch (err) {
      console.error("Error converting audio:", err);
    }
  }, []);

  /** Capture frame from camera and send as image clue */
  const onCaptureFrame = useCallback((base64: string) => {
    handleSendTurnRef.current({ image: base64 });
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden selection:bg-indigo-500/30">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
              G
            </div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Gemini Guess
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                Round
              </span>
              <span className="text-indigo-400 font-mono text-lg">
                {gameState.rounds}/20
              </span>
            </div>
            {gameState.status === "won" && (
              <span className="text-emerald-400 font-bold animate-pulse">
                VICTORY
              </span>
            )}
          </div>
        </header>

        {/* Chat/Interaction Window */}
        <main className="flex-1 flex flex-col p-6 overflow-hidden relative">
          {gameState.status === "idle" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
              <div className="mb-8 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
                <h2 className="text-4xl font-bold mb-4">
                  Challenge Gemini's Reasoning
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Think of something secret. A historical figure, a rare animal,
                  a philosophical concept, or even an object in your room.
                  Gemini will try to guess it using multi-turn deep reasoning.
                </p>
              </div>
              <button
                onClick={handleStartGame}
                className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-600/30"
              >
                Start New Challenge
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity"></div>
              </button>

              <div className="mt-6">
                <Image
                  src="/gemini-guess.png"
                  alt="Gemini Guess Game Idea"
                  width={384} // adjust size as needed
                  height={256} // adjust size as needed
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                {gameState.history.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                        turn.role === "user"
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 rounded-tr-none"
                          : "bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest">
                          {turn.role}
                        </span>
                        {turn.type === "voice" && (
                          <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest text-pink-300">
                            🎤 Voice
                          </span>
                        )}
                        {turn.type === "video" && (
                          <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest text-cyan-300">
                            📷 Visual
                          </span>
                        )}
                      </div>

                      {/* Image preview for visual clues */}
                      {turn.imageData && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                          <img
                            src={`data:image/jpeg;base64,${turn.imageData}`}
                            alt="Visual clue"
                            className="w-full max-w-[280px] h-auto rounded-lg"
                          />
                        </div>
                      )}

                      {/* Audio indicator for voice clues */}
                      {turn.audioData && (
                        <div className="mb-3 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                          <svg
                            className="w-5 h-5 text-pink-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                          </svg>
                          <div className="flex gap-0.5 items-end h-4">
                            {[3, 5, 3, 7, 4, 6, 3, 5, 7, 4, 3, 6, 5, 3].map(
                              (h, i) => (
                                <div
                                  key={i}
                                  className="w-0.5 bg-pink-300/60 rounded-full"
                                  style={{ height: `${h * 2}px` }}
                                />
                              ),
                            )}
                          </div>
                          <span className="text-xs text-pink-200/70 ml-1">
                            Voice clue sent
                          </span>
                        </div>
                      )}

                      <p className="text-base leading-relaxed">
                        {turn.content}
                      </p>
                      {turn.isGuess && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() =>
                              handleSendTurn({ text: "Yes, you got it!" })
                            }
                            className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() =>
                              handleSendTurn({ text: "No, that's not it." })
                            }
                            className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded-full border border-red-500/30 hover:bg-red-500/30 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 flex gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.1s]"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.2s]"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Control Area */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80 rounded-b-3xl">
                <div className="flex items-end gap-3 max-w-5xl mx-auto">
                  <div className="flex gap-2">
                    <button
                      onMouseDown={() => setIsRecording(true)}
                      onMouseUp={() => setIsRecording(false)}
                      onMouseLeave={() => isRecording && setIsRecording(false)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        setIsRecording(true);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        setIsRecording(false);
                      }}
                      disabled={isLoading}
                      title="Hold to record a voice clue"
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isRecording
                          ? "bg-red-600 text-white animate-pulse scale-110"
                          : "bg-slate-800 text-slate-400 hover:text-indigo-400 disabled:opacity-50"
                      }`}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        inputText.trim() &&
                        handleSendTurn({ text: inputText })
                      }
                      placeholder="Type a clue or 'Yes'/'No' to Gemini's guess..."
                      className="w-full bg-slate-800 border-none rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                  <button
                    disabled={!inputText.trim() || isLoading}
                    onClick={() => handleSendTurn({ text: inputText })}
                    className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 transition-all"
                  >
                    <svg
                      className="w-5 h-5 transform rotate-90"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sidebar: Thinking & Media */}
      <aside className="w-96 flex flex-col border-l border-slate-800">
        <div className="p-4 h-1/2">
          <MediaCapture
            onCaptureFrame={onCaptureFrame}
            isRecording={isRecording}
            onVoiceData={onVoiceData}
          />
          <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
              How to give clues
            </h3>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="text-indigo-400">⌨️</span> Type a text clue
                below
              </li>
              <li className="flex items-center gap-2">
                <span className="text-pink-400">🎤</span> Hold the mic button to
                record voice
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">📷</span> Hover camera and click
                "Show Clue"
              </li>
            </ul>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ReasoningPanel
            reasoning={gameState.currentReasoning}
            confidence={confidence}
          />
        </div>
      </aside>

      {/* Game Over Overlays */}
      {gameState.status === "won" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/30 p-10 rounded-3xl text-center max-w-sm shadow-2xl shadow-emerald-500/10">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
              ✓
            </div>
            <h2 className="text-3xl font-bold mb-2">Gemini Won!</h2>
            <p className="text-slate-400 mb-8">
              It correctly identified "{gameState.lastGuess}" in{" "}
              {gameState.rounds} rounds.
            </p>
            <button
              onClick={handleStartGame}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-all"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      {gameState.status === "lost" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/30 p-10 rounded-3xl text-center max-w-sm shadow-2xl shadow-red-500/10">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
              !
            </div>
            <h2 className="text-3xl font-bold mb-2">Gemini Gave Up</h2>
            <p className="text-slate-400 mb-8">
              You managed to stump the neural engine! Truly an obscure concept.
            </p>
            <button
              onClick={handleStartGame}
              className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all"
            >
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
