"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  IconButton,
  Input,
  Progress,
  Spinner,
} from "@qzlcorp/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState, GeminiResponse, Turn } from "../types";
import { MediaCapture } from "./components/MediaCapture";
import { ReasoningPanel } from "./components/ReasoningPanel";
import { processTurn } from "./services/geminiService";

const MicIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8 21h8" />
  </svg>
);

const SendIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M22 2 9.8 14.2M22 2l-7.2 20-5-7.8L2 9.2 22 2Z" />
  </svg>
);

export default function App() {
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
  const latestMessageTimestamp = gameState.history.at(-1)?.timestamp;

  useEffect(() => {
    if (latestMessageTimestamp && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [latestMessageTimestamp]);

  const handleStartGame = () => {
    setGameState({
      status: "playing",
      rounds: 0,
      history: [
        {
          role: "gemini",
          content:
            "I'm ready. Think of an idea, object, place, person, or concept. Give me your first clue.",
          type: "text",
          timestamp: Date.now(),
        },
      ],
      currentReasoning: "Waiting for the first clue...",
      lastGuess: "",
      difficulty: 0,
    });
    setConfidence(0);
    setInputText("");
  };

  const handleSendTurn = async (input: {
    text?: string;
    image?: string;
    audio?: string;
  }) => {
    if (gameState.status !== "playing" || isLoading) return;

    setIsLoading(true);
    let displayContent = input.text || "";
    let turnType: Turn["type"] = "text";
    if (input.image) {
      turnType = "video";
      displayContent = input.text || "Shared a visual clue";
    } else if (input.audio) {
      turnType = "voice";
      displayContent = input.text || "Shared a voice clue";
    }

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
      const apiHistory = gameState.history.map((turn) => ({
        role: turn.role === "user" ? "user" : "model",
        parts: [{ text: turn.content }],
      }));
      const response: GeminiResponse = await processTurn(apiHistory, input);
      const geminiTurn: Turn = {
        role: "gemini",
        content:
          response.guess && response.guess !== "null"
            ? `Is it ${response.guess}?`
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
    } catch (err: unknown) {
      console.error(err);
      const rawMessage =
        err instanceof Error
          ? err.message.replace(/^Gemini API failed:\s*/, "")
          : String(err);
      let displayMsg = rawMessage;
      try {
        displayMsg = JSON.parse(rawMessage).error || rawMessage;
      } catch {
        // Keep the original API message when it is not JSON.
      }
      const rateLimited =
        displayMsg.toLowerCase().includes("rate limit") ||
        displayMsg.toLowerCase().includes("quota") ||
        rawMessage.includes("429");
      setGameState((prev) => ({
        ...prev,
        history: [
          ...prev.history,
          {
            role: "gemini",
            content: displayMsg,
            type: "text",
            timestamp: Date.now(),
            isRateLimited: rateLimited,
          },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTurnRef = useRef(handleSendTurn);
  handleSendTurnRef.current = handleSendTurn;

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

  const onCaptureFrame = useCallback((base64: string) => {
    handleSendTurnRef.current({ image: base64 });
  }, []);

  const submitText = () => {
    if (!inputText.trim() || isLoading) return;
    handleSendTurn({ text: inputText });
  };

  const gameOver = gameState.status === "won" || gameState.status === "lost";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>Gemini Guess</span>
        </div>
        <div className="topbar-actions">
          <Badge variant="neutral">Round {gameState.rounds}/20</Badge>
          {gameState.status === "idle" ? (
            <Badge variant="neutral">Ready</Badge>
          ) : (
            <Badge variant={gameState.status === "won" ? "success" : "primary"}>
              {gameState.status === "playing"
                ? "In progress"
                : gameState.status}
            </Badge>
          )}
        </div>
      </header>

      {gameState.status === "idle" ? (
        <main className="landing">
          <section className="hero-copy">
            <Badge variant="primary">Deep reasoning challenge</Badge>
            <h1>What are you thinking of?</h1>
            <p>
              Challenge Gemini with text, voice, or an image. It will ask,
              infer, and work toward the answer across the conversation.
            </p>
            <Button size="lg" onClick={handleStartGame}>
              Start a new game
            </Button>
          </section>
          <Card className="hero-card" elevated>
            <div className="hero-art">
              <Image
                src="/gemini-guess.png"
                alt="Gemini Guess"
                width={640}
                height={430}
                priority
              />
            </div>
            <div className="clue-types">
              <span>
                <b>01</b> Text clue
              </span>
              <span>
                <b>02</b> Voice clue
              </span>
              <span>
                <b>03</b> Visual clue
              </span>
            </div>
          </Card>
        </main>
      ) : (
        <main className="game-layout">
          <section className="conversation-column">
            <Card className="conversation-card" elevated={false}>
              <div ref={scrollRef} className="message-list" aria-live="polite">
                {gameState.history.map((turn, index) => (
                  <article
                    key={`${turn.timestamp}-${index}`}
                    className={`message-row ${turn.role === "user" ? "message-row--user" : ""}`}
                  >
                    <div className="message-avatar" aria-hidden="true">
                      {turn.role === "user" ? "YOU" : "G"}
                    </div>
                    <div className="message-body">
                      <div className="message-meta">
                        <span>{turn.role === "user" ? "You" : "Gemini"}</span>
                        {turn.type !== "text" && (
                          <Badge variant="neutral">
                            {turn.type === "voice" ? "Voice" : "Visual"}
                          </Badge>
                        )}
                      </div>
                      {turn.imageData && (
                        <Image
                          className="message-image"
                          src={`data:image/jpeg;base64,${turn.imageData}`}
                          alt="Visual clue"
                          width={260}
                          height={180}
                          unoptimized
                        />
                      )}
                      {turn.audioData && (
                        <div className="audio-clue">
                          <span className="audio-pulse">
                            <MicIcon />
                          </span>
                          <span>Voice clue sent</span>
                        </div>
                      )}
                      <p>{turn.content}</p>
                      {turn.isRateLimited && (
                        <a
                          className="support-link"
                          href={
                            process.env.NEXT_PUBLIC_DONATE_URL ||
                            "https://donate.stripe.com/aFa14gb9y44b9JBdOl6c004"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Support this project
                        </a>
                      )}
                      {turn.isGuess && gameState.status === "playing" && (
                        <div className="guess-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleSendTurn({ text: "Yes, you got it!" })
                            }
                            disabled={isLoading}
                          >
                            Yes
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleSendTurn({ text: "No, that's not it." })
                            }
                            disabled={isLoading}
                          >
                            No
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {isLoading && (
                  <div className="thinking-row">
                    <div className="message-avatar">G</div>
                    <div className="thinking-indicator">
                      <Spinner size="sm" />
                      <span>Gemini is thinking</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="composer">
                <IconButton
                  label="Hold to record a voice clue"
                  variant={isRecording ? "danger" : "neutral"}
                  className={`mic-button ${isRecording ? "is-recording" : ""}`}
                  disabled={isLoading}
                  onMouseDown={() => setIsRecording(true)}
                  onMouseUp={() => setIsRecording(false)}
                  onMouseLeave={() => isRecording && setIsRecording(false)}
                  onTouchStart={(event) => {
                    event.preventDefault();
                    setIsRecording(true);
                  }}
                  onTouchEnd={(event) => {
                    event.preventDefault();
                    setIsRecording(false);
                  }}
                >
                  <MicIcon />
                </IconButton>
                <Input
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitText();
                  }}
                  placeholder="Type a clue..."
                  aria-label="Game clue"
                  disabled={isLoading}
                />
                <IconButton
                  label="Send clue"
                  variant="primary"
                  className="send-button"
                  disabled={!inputText.trim() || isLoading}
                  onClick={submitText}
                >
                  <SendIcon />
                </IconButton>
              </div>
            </Card>
          </section>

          <aside className="insight-column">
            <Card className="camera-card" elevated={false}>
              <div className="panel-heading">
                <span>Camera clue</span>
                <Badge variant="neutral">Camera</Badge>
              </div>
              <MediaCapture
                onCaptureFrame={onCaptureFrame}
                isRecording={isRecording}
                onVoiceData={onVoiceData}
              />
            </Card>
            <Card className="reasoning-card" elevated={false}>
              <div className="confidence-head">
                <div>
                  <span>Confidence</span>
                  <strong>{Math.round(confidence * 100)}%</strong>
                </div>
                <Progress
                  label="Gemini reasoning confidence"
                  value={Math.round(confidence * 100)}
                  max={100}
                />
              </div>
              <ReasoningPanel
                reasoning={gameState.currentReasoning}
                confidence={confidence}
              />
            </Card>
          </aside>
        </main>
      )}

      <Dialog
        open={gameOver}
        onOpenChange={(open) => {
          if (!open) {
            setGameState((prev) => ({
              ...prev,
              status: "idle",
              history: [],
              rounds: 0,
              currentReasoning: "",
              lastGuess: "",
            }));
          }
        }}
        title={
          gameState.status === "won" ? "Gemini found it" : "The trail went cold"
        }
        description={
          gameState.status === "won"
            ? `Solved in ${gameState.rounds} rounds`
            : "Gemini gave up this time"
        }
      >
        {gameState.status === "won" ? (
          <Alert variant="success">
            The answer was <strong>{gameState.lastGuess}</strong>.
          </Alert>
        ) : (
          <Alert variant="warning">
            You managed to stump Gemini. Ready for another challenge?
          </Alert>
        )}
        <div className="dialog-actions">
          <Button fullWidth onClick={handleStartGame}>
            Play again
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
