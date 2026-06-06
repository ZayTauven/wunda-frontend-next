"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import Stat from "@/components/ui/Stat";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import Segmented from "@/components/ui/Segmented";
import Avatar from "@/components/ui/Avatar";
import ActivityLog, { type LogEntry } from "@/components/ui/ActivityLog";
import IniCard from "@/components/views/overview/IniCard";
import { fmtEur, fmtNum } from "@/types";
import type { Initiative } from "@/types";
import { getAnalytics, getInitiatives } from "@/lib/api";

export default function OverviewPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalytics(), getInitiatives()])
      .then(([a, inis]) => {
        setAnalytics(a);
        const list = Array.isArray(inis) ? inis : inis.results ?? [];
        setInitiatives(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const kpis = analytics?.kpis ?? [];
  const inReview = initiatives.filter((i) => i.status === "UNDER_REVIEW");
  const active   = initiatives.filter((i) => i.status === "IN_PROGRESS" || i.status === "OPEN").slice(0, 3);

  if (loading) return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>;

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="grid" size={13} /> Tableau de bord · Administrateur</div>
          <h1 className="wd-page-title">Vue d&apos;ensemble du réseau</h1>
          <p className="wd-page-sub">L&apos;état de l&apos;action collective en temps réel — fonds, initiatives et chaîne de confiance.</p>
        </div>
        <Segmented
          options={[{ value: "30", label: "30 j" }, { value: "90", label: "Trimestre" }, { value: "all", label: "Tout" }]}
          value="90" onChange={() => {}}
        />
      </div>

      {/* KPIs */}
      {kpis.length > 0 && (
        <div className="wd-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
          {kpis.map((k: any, i: number) => (
            <Stat key={i} icon={k.icon?.toLowerCase() ?? "flag"} label={k.title} value={k.value} sub={k.change} />
          ))}
        </div>
      )}

      <div className="wd-grid" style={{ gridTemplateColumns: "1.5fr 1fr", marginBottom: 16 }}>
        {/* Review queue */}
        <Card pad={false}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="wd-stat-ic" style={{ color: "var(--st-doing)", background: "color-mix(in srgb,transparent 88%,var(--st-doing))" }}>
                <Icon name="shield" size={16} />
              </span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 680 }}>File de revue</div>
                <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>Initiatives soumises à valider avant publication</div>
              </div>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => router.push("/review")}>Tout voir</Btn>
          </div>
          <hr className="wd-hr" />
          {inReview.length === 0 && (
            <div style={{ padding: "20px 18px", color: "var(--text-3)", fontSize: 13.5 }}>Aucune initiative en attente.</div>
          )}
          {inReview.map((q) => (
            <div key={q.id} className="wd-rev-task" style={{ gridTemplateColumns: "auto 1fr auto auto", cursor: "pointer" }}
              onClick={() => router.push("/review")}>
              <Avatar initials={q.owner_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} color="#d97706" size={36} />
              <div style={{ minWidth: 0 }}>
                <div className="wd-rev-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.title}</div>
                <div className="wd-rev-note">{q.owner_name} · {q.locality_name}</div>
              </div>
              <span className="wd-rev-tag" style={{ background: "color-mix(in srgb,transparent 86%,var(--st-doing))", color: "var(--st-doing)" }}>
                À réviser
              </span>
              <span className="mono tnum" style={{ fontWeight: 700, fontSize: 14 }}>{fmtEur(q.goal_amount)}</span>
            </div>
          ))}
        </Card>

        {/* Recent activity placeholder */}
        <Card pad={false}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px 6px" }}>
            <span className="wd-stat-ic" style={{ color: "var(--green-600)", background: "var(--green-50)" }}><Icon name="activity" size={16} /></span>
            <div style={{ fontSize: 15, fontWeight: 680 }}>Activité récente</div>
          </div>
          <div style={{ padding: "4px 18px 14px" }}>
            <div style={{ fontSize: 13, color: "var(--text-3)", paddingTop: 8 }}>
              Connectez le journal d&apos;activité via l&apos;API pour voir les dernières actions.
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "26px 0 14px" }}>
        <div className="section-label">Initiatives actives</div>
        <Btn variant="ghost" size="sm" icon="flag" onClick={() => router.push("/initiatives")}>Toutes les initiatives</Btn>
      </div>
      <div className="wd-ini-grid">
        {active.map((i) => (
          <IniCard key={i.id} ini={i} onOpen={(ini) => router.push(`/initiatives/${ini.id}`)} />
        ))}
        {active.length === 0 && (
          <div style={{ color: "var(--text-3)", fontSize: 14, gridColumn: "1/-1" }}>
            Aucune initiative active pour l&apos;instant.
          </div>
        )}
      </div>
    </div>
  );
}
