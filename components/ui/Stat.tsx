import Icon from "./Icon";
import Card from "./Card";

interface StatProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  accent?: string;
  trend?: number;
}

export default function Stat({ label, value, sub, icon, accent = "var(--green-600)", trend }: StatProps) {
  return (
    <Card className="wd-stat">
      <div className="wd-stat-top">
        <span
          className="wd-stat-ic"
          style={{ color: accent, background: `color-mix(in srgb, transparent 88%, ${accent})` }}
        >
          <Icon name={icon} size={17} />
        </span>
        {trend != null && (
          <span className="wd-stat-trend" style={{ color: trend >= 0 ? "var(--green-600)" : "var(--st-reject)" }}>
            <Icon name="trend" size={13} stroke={2.4} />
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="wd-stat-val tnum">{value}</div>
      <div className="wd-stat-label">{label}</div>
      {sub && <div className="wd-stat-sub">{sub}</div>}
    </Card>
  );
}
