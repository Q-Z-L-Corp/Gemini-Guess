export interface ReasoningPanelProps {
  reasoning: string;
  confidence: number;
}

export const ReasoningPanel = ({ reasoning }: ReasoningPanelProps) => (
  <div className="reasoning-panel">
    <div className="reasoning-title">
      <span>Thinking trace</span>
      <span className="live-dot" aria-hidden="true" />
    </div>
    {!reasoning ? (
      <p className="reasoning-empty">The reasoning trace will appear here.</p>
    ) : (
      <div className="reasoning-text">
        {reasoning.split("\n").map((line) => (
          <p key={`${line}-${reasoning.indexOf(line)}`}>{line}</p>
        ))}
      </div>
    )}
  </div>
);
