interface ProgressProps {
  value: number;
  height?: number;
  color?: string;
  track?: string;
  showSpent?: boolean;
  spent?: number;
}

export default function Progress({
  value, height = 8,
  color = "var(--green-600)",
  track = "var(--surface-3)",
  showSpent, spent = 0,
}: ProgressProps) {
  return (
    <div className="wd-progress" style={{ height, background: track }}>
      {showSpent && <div className="wd-progress-spent" style={{ width: `${spent}%` }} />}
      <div
        className="wd-progress-fill"
        style={{ width: `${Math.min(100, value)}%`, background: color, height }}
      />
    </div>
  );
}
