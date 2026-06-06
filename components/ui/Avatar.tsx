interface AvatarProps {
  initials: string;
  color?: string;
  size?: number;
  ring?: boolean;
  title?: string;
}

export default function Avatar({ initials, color = "#16a34a", size = 32, ring = false, title }: AvatarProps) {
  return (
    <div
      className="wd-avatar"
      title={title}
      style={{
        width: size, height: size, fontSize: size * 0.38,
        background: color,
        boxShadow: ring ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${color}` : "none",
      }}
    >
      {initials}
    </div>
  );
}

export function userInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function userColor(id: number) {
  const COLORS = ["#16a34a", "#2563eb", "#d97706", "#db2777", "#7c3aed", "#0891b2"];
  return COLORS[id % COLORS.length];
}
