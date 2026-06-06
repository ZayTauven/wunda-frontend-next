import { TASK_STATUS_META, INITIATIVE_STATUS_META } from "@/types";
import type { TaskStatus, InitiativeStatus } from "@/types";

interface TaskPillProps { status: TaskStatus; size?: "sm" | "md"; }
export function TaskStatusPill({ status, size = "md" }: TaskPillProps) {
  const m = TASK_STATUS_META[status] ?? { label: status, color: "var(--text-3)" };
  return (
    <span
      className={"wd-pill " + (size === "sm" ? "wd-pill-sm" : "")}
      style={{ "--pc": m.color } as React.CSSProperties}
    >
      <span className="wd-pill-dot" />
      {m.label}
    </span>
  );
}

interface IniPillProps { status: InitiativeStatus; }
export function IniStatusPill({ status }: IniPillProps) {
  const m = INITIATIVE_STATUS_META[status] ?? { label: status, color: "var(--text-3)" };
  return (
    <span className="wd-pill" style={{ "--pc": m.color } as React.CSSProperties}>
      <span className="wd-pill-dot" />
      {m.label}
    </span>
  );
}
