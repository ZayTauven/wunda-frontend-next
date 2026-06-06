const ICONS: Record<string, string> = {
  grid:    "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  flag:    "M4 21V4M4 4h12l-2 4 2 4H4",
  shield:  "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  layers:  "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  wallet:  "M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7l2-3h12l2 3M17 13h.01",
  image:   "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M16 9.5a1 1 0 1 0 0-.01",
  activity:"M3 12h4l3 8 4-16 3 8h4",
  users:   "M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-2a4 4 0 0 0-3-3.8M16 3.1A4 4 0 0 1 16 11",
  search:  "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  bell:    "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  sun:     "M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  moon:    "M21 12.8A8 8 0 1 1 11.2 3 6 6 0 0 0 21 12.8z",
  check:   "M4 12l5 5L20 6",
  x:       "M6 6l12 12M18 6L6 18",
  plus:    "M12 5v14M5 12h14",
  chevR:   "M9 6l6 6-6 6",
  chevD:   "M6 9l6 6 6-6",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  clock:   "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  lock:    "M5 11h14v9H5zM8 11V7a4 4 0 0 1 8 0v4",
  unlock:  "M5 11h14v9H5zM8 11V7a4 4 0 0 1 7.5-2",
  doc:     "M6 2h8l4 4v16H6zM14 2v4h4",
  video:   "M3 6h13v12H3zM16 10l5-3v10l-5-3",
  alert:   "M12 3l9 16H3zM12 10v4M12 17h.01",
  seal:    "M12 2l2.4 1.8 3-.2 1 2.8 2.4 1.7-1 2.8 1 2.8-2.4 1.7-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3.2 14l1-2.8-1-2.8 2.4-1.7 1-2.8 3 .2z",
  pin:     "M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  filter:  "M3 5h18l-7 8v6l-4-2v-4z",
  dots:    "M5 12h.01M12 12h.01M19 12h.01",
  link:    "M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1",
  trend:   "M3 17l6-6 4 4 8-8M21 7v5h-5",
  euro:    "M17 8a6 6 0 1 0 0 8M4 10h9M4 14h7",
  send:    "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  logo:    "M3 3h8v8H3zM13 3h8v5h-8zM13 11h8v10h-8zM3 13h8v8H3z",
  plus_circle: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 8v8M8 12h8",
};

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 18, stroke = 2, fill = "none", className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill} stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0, ...style }}
    >
      <path d={ICONS[name] || ""} />
    </svg>
  );
}
