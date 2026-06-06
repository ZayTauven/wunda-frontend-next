interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  pad?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = "", style = {}, pad = true, onClick }: CardProps) {
  return (
    <div
      className={`wd-card ${pad ? "wd-card-pad" : ""} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
