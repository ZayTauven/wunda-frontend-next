interface ReputationProps { score: number; size?: number; }

export default function Reputation({ score, size = 40 }: ReputationProps) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const col = score >= 90 ? "var(--green-600)" : score >= 75 ? "#d97706" : "var(--st-todo)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <span style={{
        position: "absolute", inset: 0, display: "grid", placeItems: "center",
        fontSize: size * 0.3, fontWeight: 700, fontVariantNumeric: "tabular-nums",
      }}>
        {score}
      </span>
    </div>
  );
}
