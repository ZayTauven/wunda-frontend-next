import Icon from "./Icon";

type Variant = "primary" | "ghost" | "soft" | "danger" | "validate";
type Size = "md" | "sm";

interface BtnProps {
  children?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  title?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export default function Btn({
  children, variant = "ghost", size = "md", icon,
  onClick, style, title, disabled, type = "button", className = "",
}: BtnProps) {
  return (
    <button
      type={type}
      className={`wd-btn wd-btn-${variant} wd-btn-${size} ${className}`}
      onClick={onClick} style={style} title={title} disabled={disabled}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} stroke={2.2} />}
      {children}
    </button>
  );
}
