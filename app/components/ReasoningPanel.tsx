export interface ReasoningPanelProps {
  reasoning: string;
  confidence: number;
}

export const ReasoningPanel = ({
  reasoning,
  confidence,
}: ReasoningPanelProps) => {
  return (
    <div className="h-full bg-slate-900 border-l border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400">
          Gemini's Neural Engine
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">CONFIDENCE:</span>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000"
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!reasoning ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center opacity-50">
            <svg
              className="w-12 h-12 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="text-sm italic">
              Thinking process will appear here...
            </p>
          </div>
        ) : (
          <div className="mono text-xs leading-relaxed text-slate-300">
            {reasoning.split("\n").map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">
                <span className="text-indigo-500 mr-2 opacity-50">&gt;</span>
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
