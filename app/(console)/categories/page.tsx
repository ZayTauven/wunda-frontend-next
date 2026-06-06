"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import Modal, { Field, Input, Textarea, Select } from "@/components/ui/Modal";
import { fmtNum } from "@/types";
import type { Category } from "@/types";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api";
import AccessDenied from "@/components/ui/AccessDenied";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const CAT_TINT: Record<string, string> = {
  school: "#16a34a", water: "#0891b2", market: "#d97706",
  health: "#db2777", solar: "#ca8a04", road: "#7c3aed", other: "#64748b",
};
const CAT_ICON: Record<string, string> = {
  school: "flag", water: "wallet", market: "grid",
  health: "shield", solar: "sun", road: "send", other: "layers",
};
const KEY_OPTIONS = [
  { value: "school", label: "Éducation" },
  { value: "water",  label: "Eau & Forage" },
  { value: "market", label: "Commerce" },
  { value: "health", label: "Santé" },
  { value: "solar",  label: "Énergie" },
  { value: "road",   label: "Infrastructures" },
  { value: "other",  label: "Autre" },
];

const EMPTY = { key: "other", label: "", description: "", is_active: true };

export default function CategoriesPage() {
  const canAccess = useRoleGuard(["admin"]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (canAccess) load(); }, [canAccess]);

  if (!canAccess) return <AccessDenied requiredRoles={["admin"]} />;

  function load() {
    setLoading(true);
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  function openCreate() { setForm(EMPTY); setSelected(null); setModal("create"); }
  function openEdit(c: Category) {
    setSelected(c);
    setForm({ key: c.key, label: c.label, description: c.description ?? "", is_active: c.is_active });
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (modal === "create") {
        const created = await createCategory(form);
        setCategories((prev) => [...prev, created]);
      } else if (modal === "edit" && selected) {
        const updated = await updateCategory(selected.id, form);
        setCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      }
      setModal(null);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? JSON.stringify(e?.response?.data) ?? "Erreur");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteCategory(selected.id);
      setCategories((prev) => prev.filter((c) => c.id !== selected.id));
      setModal(null);
    } catch { alert("Impossible de supprimer — des barèmes y sont rattachés."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="layers" size={13} /> Taxonomie</div>
          <h1 className="wd-page-title">Catégories d&apos;initiative</h1>
          <p className="wd-page-sub">Les domaines d&apos;action — chacun relié à son propre barème de prix.</p>
        </div>
        <Btn variant="primary" icon="plus" onClick={openCreate}>Nouvelle catégorie</Btn>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>
      ) : (
        <div className="wd-ini-grid">
          {categories.map((c) => {
            const tint = CAT_TINT[c.key] ?? "#64748b";
            const icon = CAT_ICON[c.key] ?? "layers";
            return (
              <Card key={c.id} style={{ display: "flex", flexDirection: "column", gap: 14, opacity: c.is_active ? 1 : .6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", color: tint, background: `color-mix(in srgb, transparent 86%, ${tint})` }}>
                    <Icon name={icon} size={21} />
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="wd-icon-btn" style={{ width: 30, height: 30 }} onClick={() => openEdit(c)} title="Modifier">
                      <Icon name="chevR" size={14} />
                    </button>
                    <button className="wd-icon-btn" style={{ width: 30, height: 30, color: "var(--st-reject)" }} onClick={() => { setSelected(c); setModal("delete"); }} title="Supprimer">
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-.01em" }}>{c.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>
                    {c.bareme_count} barème{c.bareme_count !== 1 ? "s" : ""} de prix liés
                  </div>
                  {c.description && <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 5 }}>{c.description}</div>}
                </div>
                {!c.is_active && (
                  <span className="wd-pill wd-pill-sm" style={{ "--pc": "var(--st-todo)", alignSelf: "flex-start" } as React.CSSProperties}>
                    <span className="wd-pill-dot" />Inactif
                  </span>
                )}
              </Card>
            );
          })}
          {categories.length === 0 && (
            <div style={{ color: "var(--text-3)", fontSize: 14, gridColumn: "1/-1", padding: "20px 0" }}>
              Aucune catégorie. Créez-en une pour commencer.
            </div>
          )}
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "create" ? "Nouvelle catégorie" : `Modifier — ${selected?.label}`}
          icon="layers"
          onClose={() => setModal(null)}
          onConfirm={handleSave}
          confirmLabel={modal === "create" ? "Créer" : "Enregistrer"}
          confirmDisabled={saving || !form.label}
        >
          <Field label="Domaine" required>
            <Select value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}>
              {KEY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <Field label="Libellé affiché" required>
            <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Ex : Éducation" autoFocus />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label className="wd-switch">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <span className="wd-switch-track"><span className="wd-switch-knob" /></span>
            </label>
            <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>Catégorie active</span>
          </div>
        </Modal>
      )}

      {modal === "delete" && selected && (
        <Modal title="Supprimer la catégorie ?" subtitle={selected.label} icon="alert"
          onClose={() => setModal(null)} onConfirm={handleDelete}
          confirmLabel="Supprimer" confirmVariant="danger" confirmDisabled={saving}>
          <p style={{ fontSize: 13.5, color: "var(--text-2)", margin: 0 }}>
            Les barèmes rattachés à <b>{selected.label}</b> perdront leur catégorie.
          </p>
        </Modal>
      )}
    </div>
  );
}
