"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import Modal, { Field, Input, Textarea, Select } from "@/components/ui/Modal";
import { fmtNum } from "@/types";
import type { Badge, BadgeTier } from "@/types";
import { getBadges, createBadge, updateBadge, deleteBadge } from "@/lib/api";
import AccessDenied from "@/components/ui/AccessDenied";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const TIERS: { value: BadgeTier; label: string }[] = [
  { value: "bronze",   label: "Bronze"  },
  { value: "silver",   label: "Argent"  },
  { value: "gold",     label: "Or"      },
  { value: "platinum", label: "Platine" },
];
const ICONS = ["flag", "layers", "shield", "seal", "check", "euro", "users", "activity"];
const COLORS = ["#16a34a","#2563eb","#d97706","#db2777","#7c3aed","#ca8a04","#0891b2","#64748b"];
const EMPTY = { name: "", tier: "bronze" as BadgeTier, icon: "seal", color: "#16a34a", criteria: "", is_active: true };

export default function BadgesPage() {
  const canAccess = useRoleGuard(["admin"]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Badge | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (canAccess) load(); }, [canAccess]);
  if (!canAccess) return <AccessDenied requiredRoles={["admin"]} />;

  function load() {
    setLoading(true);
    getBadges()
      .then((data) => setBadges(Array.isArray(data) ? data : data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  function openCreate() { setForm(EMPTY); setSelected(null); setModal("create"); }
  function openEdit(b: Badge) {
    setSelected(b);
    setForm({ name: b.name, tier: b.tier, icon: b.icon, color: b.color, criteria: b.criteria, is_active: b.is_active });
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (modal === "create") {
        const created = await createBadge(form);
        setBadges((prev) => [...prev, created]);
      } else if (modal === "edit" && selected) {
        const updated = await updateBadge(selected.id, form);
        setBadges((prev) => prev.map((b) => b.id === updated.id ? updated : b));
      }
      setModal(null);
    } catch (e: any) {
      alert(e?.response?.data?.name?.[0] ?? "Erreur");
    } finally { setSaving(false); }
  }

  async function handleToggle(b: Badge) {
    try {
      const updated = await updateBadge(b.id, { is_active: !b.is_active });
      setBadges((prev) => prev.map((x) => x.id === updated.id ? updated : x));
    } catch { alert("Erreur lors de la mise à jour."); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteBadge(selected.id);
      setBadges((prev) => prev.filter((b) => b.id !== selected.id));
      setModal(null);
    } catch { alert("Impossible de supprimer ce badge."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="seal" size={13} /> Engagement & réputation</div>
          <h1 className="wd-page-title">Badges</h1>
          <p className="wd-page-sub">Distinctions attribuées selon l&apos;activité — leviers de confiance et de fidélisation.</p>
        </div>
        <Btn variant="primary" icon="plus" onClick={openCreate}>Créer un badge</Btn>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>
      ) : (
        <div className="wd-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))" }}>
          {badges.map((b) => (
            <Card key={b.id} style={{ display: "flex", gap: 15, alignItems: "flex-start", opacity: b.is_active ? 1 : .6 }}>
              <span style={{ width: 52, height: 52, borderRadius: 14, display: "grid", placeItems: "center", color: "#fff", background: b.color, flexShrink: 0, boxShadow: "var(--shadow-sm)" }}>
                <Icon name={b.icon} size={24} fill={b.icon === "seal" ? "rgba(255,255,255,.25)" : "none"} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", rowGap: 4 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700 }}>{b.name}</span>
                  <span className="wd-pill wd-pill-sm" style={{ "--pc": b.color } as React.CSSProperties}>{b.tier_display}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4, lineHeight: 1.4 }}>{b.criteria}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                    <b className="tnum" style={{ color: "var(--text)", fontSize: 14 }}>{fmtNum(b.awarded_count)}</b> attribués
                  </span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button className="wd-icon-btn" style={{ width: 28, height: 28 }} onClick={() => openEdit(b)} title="Modifier">
                      <Icon name="chevR" size={14} />
                    </button>
                    <label className="wd-switch">
                      <input type="checkbox" checked={b.is_active} onChange={() => handleToggle(b)} />
                      <span className="wd-switch-track"><span className="wd-switch-knob" /></span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {badges.length === 0 && (
            <div style={{ color: "var(--text-3)", fontSize: 14, gridColumn: "1/-1", padding: "20px 0" }}>
              Aucun badge configuré. Créez-en un pour commencer.
            </div>
          )}
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "create" ? "Nouveau badge" : `Modifier — ${selected?.name}`}
          icon="seal"
          onClose={() => setModal(null)}
          onConfirm={handleSave}
          confirmLabel={modal === "create" ? "Créer" : "Enregistrer"}
          confirmDisabled={saving || !form.name || !form.criteria}
        >
          <Field label="Nom" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex : Pionnier" autoFocus />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Niveau" required>
              <Select value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as BadgeTier }))}>
                {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Icône">
              <Select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}>
                {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Couleur">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: 8, background: c, border: form.color === c ? "2px solid var(--text)" : "2px solid transparent", cursor: "pointer" }}
                />
              ))}
            </div>
          </Field>
          <Field label="Critères d'obtention" required>
            <Textarea value={form.criteria} onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))} rows={3} placeholder="Ex : Premier contributeur d'une initiative" />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label className="wd-switch">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <span className="wd-switch-track"><span className="wd-switch-knob" /></span>
            </label>
            <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>Badge actif</span>
          </div>
        </Modal>
      )}

      {modal === "delete" && selected && (
        <Modal title="Supprimer le badge ?" subtitle={selected.name} icon="alert"
          onClose={() => setModal(null)} onConfirm={handleDelete}
          confirmLabel="Supprimer" confirmVariant="danger" confirmDisabled={saving}>
          <p style={{ fontSize: 13.5, color: "var(--text-2)", margin: 0 }}>
            Les {fmtNum(selected.awarded_count)} attributions existantes seront supprimées.
          </p>
        </Modal>
      )}
    </div>
  );
}
