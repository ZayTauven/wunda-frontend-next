"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import Segmented from "@/components/ui/Segmented";
import Modal, { Field, Input, Textarea, Select } from "@/components/ui/Modal";
import type { Bareme, Category } from "@/types";
import { fmtEur } from "@/types";
import { getBaremes, createBareme, updateBareme, deleteBareme, getCategories } from "@/lib/api";
import AccessDenied from "@/components/ui/AccessDenied";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const EMPTY = { ref: "", label: "", category: "" as string | number, unit: "", price: "", region: "Nationales", is_active: true };

export default function BaremesPage() {
  const canAccess = useRoleGuard(["admin"]);
  const [baremes, setBaremes] = useState<Bareme[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catFilter, setCatFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Bareme | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canAccess) return;
    Promise.all([
      getBaremes().then((d) => setBaremes(Array.isArray(d) ? d : d.results ?? [])),
      getCategories().then((d) => setCategories(Array.isArray(d) ? d : d.results ?? [])),
    ]).catch(console.error).finally(() => setLoading(false));
  }, [canAccess]);

  if (!canAccess) return <AccessDenied requiredRoles={["admin"]} />;

  function openCreate() {
    setForm(EMPTY);
    setSelected(null);
    setModal("create");
  }
  function openEdit(b: Bareme) {
    setSelected(b);
    setForm({ ref: b.ref, label: b.label, category: b.category ?? "", unit: b.unit, price: String(b.price), region: b.region, is_active: b.is_active });
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, category: form.category || null, price: Number(form.price) };
      if (modal === "create") {
        const created = await createBareme(payload);
        setBaremes((prev) => [...prev, created]);
      } else if (modal === "edit" && selected) {
        const updated = await updateBareme(selected.id, payload);
        setBaremes((prev) => prev.map((b) => b.id === updated.id ? updated : b));
      }
      setModal(null);
    } catch (e: any) {
      alert(e?.response?.data?.ref?.[0] ?? e?.response?.data?.detail ?? "Erreur");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteBareme(selected.id);
      setBaremes((prev) => prev.filter((b) => b.id !== selected.id));
      setModal(null);
    } catch { alert("Impossible de supprimer ce barème."); }
    finally { setSaving(false); }
  }

  const catOptions = [{ value: "all", label: "Tous" }, ...categories.map((c) => ({ value: String(c.id), label: c.label }))];
  const filtered = catFilter === "all" ? baremes : baremes.filter((b) => String(b.category) === catFilter);

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="euro" size={13} /> Référentiel de prix</div>
          <h1 className="wd-page-title">Barèmes de prix</h1>
          <p className="wd-page-sub">Prix locaux de référence — base des suggestions du Contrôleur lors de l&apos;analyse des estimations.</p>
        </div>
        <Btn variant="primary" icon="plus" onClick={openCreate}>Ajouter un barème</Btn>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Segmented options={catOptions} value={catFilter} onChange={setCatFilter} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-3)" }}>
          <Icon name="search" size={14} /> Utilisé par le contrôle pour détecter les écarts
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>
      ) : (
        <Card pad={false}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1.6fr 80px 120px 1fr 100px 50px", gap: 12, padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em" }}>
            <span>Réf.</span><span>Désignation</span><span>Unité</span><span>Prix réf.</span><span>Zone</span><span>Maj</span><span></span>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: "20px 18px", color: "var(--text-3)" }}>Aucun barème dans cette catégorie.</div>
          )}
          {filtered.map((b) => (
            <div key={b.id} style={{ display: "grid", gridTemplateColumns: "90px 1.6fr 80px 120px 1fr 100px 50px", gap: 12, padding: "13px 18px", borderTop: "1px solid var(--wunda-border)", alignItems: "center", opacity: b.is_active ? 1 : .55 }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{b.ref}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.label}</span>
                {b.category_label && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>{b.category_label}</span>
                )}
              </div>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>/ {b.unit}</span>
              <span className="mono tnum" style={{ fontSize: 14, fontWeight: 750, color: "var(--green-700)" }}>
                {Number(b.price) < 100
                  ? Number(b.price).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €"
                  : fmtEur(b.price)}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>{b.region}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{b.updated_at}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="wd-icon-btn" style={{ width: 26, height: 26 }} onClick={() => openEdit(b)} title="Modifier"><Icon name="chevR" size={13} /></button>
                <button className="wd-icon-btn" style={{ width: 26, height: 26, color: "var(--st-reject)" }} onClick={() => { setSelected(b); setModal("delete"); }} title="Supprimer"><Icon name="x" size={13} /></button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "create" ? "Nouveau barème" : `Modifier — ${selected?.ref}`}
          icon="euro"
          onClose={() => setModal(null)}
          onConfirm={handleSave}
          confirmLabel={modal === "create" ? "Créer" : "Enregistrer"}
          confirmDisabled={saving || !form.ref || !form.label || !form.price}
          width={560}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
            <Field label="Référence" required>
              <Input value={form.ref} onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))} placeholder="SCO-001" autoFocus />
            </Field>
            <Field label="Désignation" required>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Construction salle de classe" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Field label="Catégorie">
              <Select value={String(form.category)} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">— Aucune —</option>
                {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Unité" required>
              <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="m², unité, km" />
            </Field>
            <Field label="Prix (€)" required>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            </Field>
          </div>
          <Field label="Zone géographique">
            <Input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} placeholder="Ex : Grande Comore, Nationales" />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label className="wd-switch">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <span className="wd-switch-track"><span className="wd-switch-knob" /></span>
            </label>
            <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>Barème actif</span>
          </div>
        </Modal>
      )}

      {modal === "delete" && selected && (
        <Modal title="Supprimer le barème ?" subtitle={`${selected.ref} — ${selected.label}`} icon="alert"
          onClose={() => setModal(null)} onConfirm={handleDelete}
          confirmLabel="Supprimer" confirmVariant="danger" confirmDisabled={saving}>
          <p style={{ fontSize: 13.5, color: "var(--text-2)", margin: 0 }}>
            Ce barème sera retiré du référentiel de prix du Contrôleur.
          </p>
        </Modal>
      )}
    </div>
  );
}
