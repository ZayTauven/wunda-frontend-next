import Icon from "./Icon";

export interface LogEntry {
  t: "validation" | "fund" | "proof" | "contribution" | "dispute" | "control";
  who: string;
  txt: string;
  when: string;
  hash: string;
}

const LOG_ICON: Record<string, { name: string; c: string }> = {
  validation:   { name: "check",    c: "var(--green-600)" },
  fund:         { name: "wallet",   c: "var(--st-done)"   },
  proof:        { name: "image",    c: "var(--st-doing)"  },
  contribution: { name: "euro",     c: "var(--green-600)" },
  dispute:      { name: "alert",    c: "var(--st-dispute)"},
  control:      { name: "shield",   c: "var(--st-done)"   },
};

export default function ActivityLog({ log }: { log: LogEntry[] }) {
  return (
    <div className="wd-log">
      {[...log].reverse().map((e, i) => {
        const ic = LOG_ICON[e.t] ?? { name: "activity", c: "var(--text-3)" };
        return (
          <div className="wd-log-item" key={i}>
            <span
              className="wd-log-ic"
              style={{ color: ic.c, background: `color-mix(in srgb, transparent 88%, ${ic.c})` }}
            >
              <Icon name={ic.name} size={15} />
            </span>
            <div className="wd-log-body">
              <div className="wd-log-txt">
                <b>{e.who}</b> {e.txt}
              </div>
              <div className="wd-log-meta">
                <span className="wd-log-when">{e.when}</span>
                <span className="wd-log-hash mono">
                  <Icon name="lock" size={10} />{e.hash}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
