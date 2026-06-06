"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import type { ActivityLogEntry } from "@/types";
import { getActivityLogs } from "@/lib/api";

const ACTION_ICON: Record<string, { name: string; c: string }> = {
  VALIDATE:     { name: "check",    c: "var(--green-600)" },
  FUND:         { name: "wallet",   c: "var(--st-done)"   },
  PROOF:        { name: "image",    c: "var(--st-doing)"  },
  CONTRIBUTION: { name: "euro",     c: "var(--green-600)" },
  DISPUTE:      { name: "alert",    c: "var(--st-dispute)"},
  CONTROL:      { name: "shield",   c: "var(--st-done)"   },
};

function iconFor(action: string) {
  const key = Object.keys(ACTION_ICON).find((k) => action.toUpperCase().includes(k));
  return key ? ACTION_ICON[key] : { name: "activity", c: "var(--text-3)" };
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityLogs()
      .then((data) => setLogs(Array.isArray(data) ? data : data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="activity" size={13} /> Registre du réseau</div>
          <h1 className="wd-page-title">Journal immuable</h1>
          <p className="wd-page-sub">Chaque action — contribution, preuve, validation, libération — est horodatée et scellée.</p>
        </div>
        <Btn variant="ghost" icon="filter">Filtrer</Btn>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>
      ) : (
        <Card>
          <div className="wd-log">
            {logs.length === 0 && (
              <div style={{ color: "var(--text-3)", fontSize: 13.5, padding: "8px 0" }}>Aucune entrée dans le journal.</div>
            )}
            {[...logs].reverse().map((e, i) => {
              const ic = iconFor(e.action);
              return (
                <div className="wd-log-item" key={i}>
                  <span className="wd-log-ic" style={{ color: ic.c, background: `color-mix(in srgb, transparent 88%, ${ic.c})` }}>
                    <Icon name={ic.name} size={15} />
                  </span>
                  <div className="wd-log-body">
                    <div className="wd-log-txt">
                      <b>{e.actor_name ?? "Système"}</b> — {e.action} sur {e.entity_type} #{e.entity_id}
                    </div>
                    <div className="wd-log-meta">
                      <span className="wd-log-when">{new Date(e.created_at).toLocaleString("fr-FR")}</span>
                      <span className="wd-log-hash mono"><Icon name="lock" size={10} />0x{String(e.id).padStart(4, "0")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
