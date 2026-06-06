"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Stat from "@/components/ui/Stat";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import { fmtEur } from "@/types";
import type { Initiative } from "@/types";
import { getInitiatives, getFundReleases, releaseFunds } from "@/lib/api";

export default function FundsPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInitiatives({ status: "IN_PROGRESS" })
      .then((data) => setInitiatives(Array.isArray(data) ? data : data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalGoal = initiatives.reduce((s, i) => s + Number(i.goal_amount), 0);
  const totalRaised = initiatives.reduce((s, i) => s + i.total_collected, 0);

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="wallet" size={13} /> Trésorerie tracée</div>
          <h1 className="wd-page-title">Fonds & paliers</h1>
          <p className="wd-page-sub">Chaque euro est lié à une tâche. Les paliers se libèrent à la validation — jamais avant.</p>
        </div>
      </div>

      <div className="wd-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
        <Stat icon="euro"   label="Total tracé"   value={fmtEur(totalGoal)}   accent="var(--green-600)" />
        <Stat icon="unlock" label="Collectés"      value={fmtEur(totalRaised)} accent="var(--st-done)" />
        <Stat icon="lock"   label="En cours"       value={String(initiatives.length)} accent="var(--st-doing)" />
        <Stat icon="alert"  label="Initiatives"    value={String(initiatives.length)} accent="var(--st-dispute)" sub="initiatives actives" />
      </div>

      <Card pad={false}>
        <div style={{ padding: "16px 18px 8px", fontSize: 15, fontWeight: 680 }}>Paliers en attente de libération</div>
        <hr className="wd-hr" />
        {loading && <div style={{ padding: "20px 18px", color: "var(--text-3)" }}>Chargement…</div>}
        {!loading && initiatives.length === 0 && (
          <div style={{ padding: "20px 18px", color: "var(--text-3)", fontSize: 13.5 }}>Aucun palier prêt à être libéré.</div>
        )}
        {initiatives.map((i) => (
          <div key={i.id} className="wd-rev-task" style={{ gridTemplateColumns: "1fr auto auto" }}>
            <div>
              <div className="wd-rev-name">{i.title}</div>
              <div className="wd-rev-note">{i.locality_name} · {i.milestones_count} palier{i.milestones_count !== 1 ? "s" : ""}</div>
            </div>
            <span className="wd-pill" style={{ "--pc": "var(--st-doing)" } as React.CSSProperties}>
              <span className="wd-pill-dot" />Palier prêt
            </span>
            <Btn variant="validate" size="sm" icon="unlock">Libérer</Btn>
          </div>
        ))}
      </Card>
    </div>
  );
}
