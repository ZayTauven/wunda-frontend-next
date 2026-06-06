"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import Avatar from "@/components/ui/Avatar";
import Cover from "@/components/ui/Cover";
import { IniStatusPill } from "@/components/ui/StatusPill";
import Progress from "@/components/ui/Progress";
import { fmtEur } from "@/types";
import type { Initiative } from "@/types";
import { getInitiatives, approveInitiative, rejectInitiative, publishInitiative } from "@/lib/api";
import AccessDenied from "@/components/ui/AccessDenied";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const FLOW = [
  { label: "Soumise",            who: "Porteur",          icon: "send"   },
  { label: "Analyse",            who: "Contrôleur",       icon: "search" },
  { label: "Validée / Rectifiée",who: "Contrôleur",       icon: "shield" },
  { label: "Publiée",            who: "Visible diaspora", icon: "users"  },
];

function FlowStrip({ active }: { active: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 22, flexWrap: "wrap" }}>
      {FLOW.map((s, i) => (
        <span key={i} style={{ display: "contents" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center",
              background: i <= active ? "var(--green-600)" : "var(--surface-2)",
              color: i <= active ? "#fff" : "var(--text-3)",
              border: i === active ? "2px solid var(--green-700)" : "1px solid var(--wunda-border)",
              boxShadow: i === active ? "0 0 0 4px var(--green-50)" : "none",
            }}>
              <Icon name={s.icon} size={17} />
            </div>
            <div style={{ marginRight: 6, whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 13.5, fontWeight: 650 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>{s.who}</div>
            </div>
          </div>
          {i < FLOW.length - 1 && (
            <div style={{ flex: 1, height: 2, minWidth: 28, background: i < active ? "var(--green-600)" : "var(--wunda-border-2)", margin: "0 4px" }} />
          )}
        </span>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const canAccess = useRoleGuard(["admin", "controller"]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [selected, setSelected] = useState<Initiative | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  if (!canAccess) return <AccessDenied requiredRoles={["admin", "controller"]} />;

  useEffect(() => {
    getInitiatives({ status: "UNDER_REVIEW" })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results ?? [];
        setInitiatives(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function act(action: "approve" | "reject" | "publish") {
    if (!selected) return;
    setActing(true);
    try {
      let updated: Initiative;
      if (action === "approve") updated = await approveInitiative(selected.id);
      else if (action === "reject") updated = await rejectInitiative(selected.id);
      else updated = await publishInitiative(selected.id);
      setInitiatives((prev) => prev.filter((i) => i.id !== updated.id));
      setSelected(null);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Action refusée");
    } finally {
      setActing(false);
    }
  }

  if (loading) return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>;

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="shield" size={13} /> Contrôle</div>
          <h1 className="wd-page-title">Analyse des initiatives</h1>
          <p className="wd-page-sub">Validez ou rectifiez les estimations du porteur avant publication aux contributeurs.</p>
        </div>
      </div>

      {initiatives.length === 0 && !selected && (
        <Card>
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)" }}>
            <Icon name="check" size={32} style={{ opacity: .4, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>File de revue vide</div>
            <div style={{ fontSize: 13.5, marginTop: 4 }}>Toutes les initiatives ont été traitées.</div>
          </div>
        </Card>
      )}

      {/* Queue list */}
      {initiatives.length > 0 && (
        <Card pad={false} style={{ marginBottom: 16 }}>
          {initiatives.map((q) => (
            <div key={q.id}
              className="wd-rev-task"
              style={{ gridTemplateColumns: "auto 1fr auto auto", cursor: "pointer", background: selected?.id === q.id ? "var(--green-50)" : "transparent" }}
              onClick={() => setSelected(q)}
            >
              <Avatar initials={q.owner_name.split(" ").map((w) => w[0]).join("").slice(0, 2)} color="#d97706" size={36} />
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
      )}

      {/* Selected initiative panel */}
      {selected && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <FlowStrip active={1} />
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 16, borderTop: "1px solid var(--wunda-border)" }}>
              <Cover kind={(selected as any).cover ?? "school"} h={64} label="Initiative" />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>INI-{selected.id}</span>
                  <IniStatusPill status={selected.status} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{selected.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
                  {selected.owner_name} · {selected.locality_name}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Budget soumis</div>
                <div className="mono tnum" style={{ fontSize: 22, fontWeight: 750 }}>{fmtEur(selected.goal_amount)}</div>
              </div>
            </div>
          </Card>

          {/* Milestones & tasks */}
          <Card pad={false} style={{ marginBottom: 16 }}>
            <div style={{ padding: "16px 18px", fontSize: 15, fontWeight: 680 }}>
              Estimations par palier
              <span style={{ color: "var(--text-3)", fontWeight: 500 }}> · {selected.milestones_count} palier{selected.milestones_count !== 1 ? "s" : ""}</span>
            </div>
            <hr className="wd-hr" />
            {selected.milestones.map((m) => (
              <div key={m.id} style={{ padding: "14px 18px", borderTop: "1px solid var(--wunda-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 650 }}>{m.title}</span>
                  <span className="mono tnum" style={{ fontWeight: 700, color: "var(--green-700)" }}>{fmtEur(m.budget)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {m.tasks.map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--text-2)", paddingLeft: 12 }}>
                      <span>{t.title}</span>
                      <span className="mono tnum" style={{ fontWeight: 600 }}>{fmtEur(t.budget)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          {/* Actions footer */}
          <Card style={{ position: "sticky", bottom: 0, display: "flex", alignItems: "center", gap: 24, boxShadow: "var(--shadow-md)" }}>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Budget total</div>
              <span className="mono tnum" style={{ fontSize: 26, fontWeight: 760 }}>{fmtEur(selected.goal_amount)}</span>
            </div>
            <div style={{ flex: 1 }}>
              <Progress value={100} height={8} />
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>{selected.milestones_count} paliers à analyser</div>
            </div>
            <Btn variant="danger" icon="x" onClick={() => act("reject")} disabled={acting}>Rejeter</Btn>
            <Btn variant="ghost" icon="send" disabled={acting}>Renvoyer au porteur</Btn>
            {selected.status === "APPROVED" ? (
              <Btn variant="primary" icon="users" onClick={() => act("publish")} disabled={acting}>Publier aux contributeurs</Btn>
            ) : (
              <Btn variant="primary" icon="shield" onClick={() => act("approve")} disabled={acting}>Approuver</Btn>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
