"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import Modal, { Field, Input, Textarea, Select } from "@/components/ui/Modal";
import type { Locality, Island, LocalityType } from "@/types";
import { ISLAND_LABELS, ISLAND_COLORS } from "@/types";
import { getLocalities, createLocality, updateLocality, deleteLocality, getLocalityAgents, addLocalityAgent, removeLocalityAgent, getDirectory } from "@/lib/api";

const ISLANDS: Island[] = ["grande_comore", "anjouan", "moheli"];
const TYPES: { value: LocalityType; label: string }[] = [
  { value: "ile",     label: "Île"       },
  { value: "region",  label: "Région"    },
  { value: "ville",   label: "Ville"     },
  { value: "village", label: "Village"   },
];

const STATUS_META = {
  true:  { label: "Active",   c: "var(--green-600)" },
  false: { label: "Inactive", c: "var(--st-todo)"   },
};

const EMPTY_FORM = { name: "", island: "grande_comore" as Island, type: "village" as LocalityType, description: "", is_active: true };

export default function LocalitesPage() {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Locality | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Agents panel
  const [agentLocality, setAgentLocality] = useState<Locality | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [addingAgent, setAddingAgent] = useState(false);
  const [newAgentId, setNewAgentId] = useState("");

  async function openAgents(l: Locality) {
    setAgentLocality(l);
    const [ags, mbs] = await Promise.all([
      getLocalityAgents({ locality: l.id }),
      getDirectory({ locality_id: l.id }).catch(() => []),
    ]);
    setAgents(Array.isArray(ags) ? ags : ags.results ?? []);
    setMembers(Array.isArray(mbs) ? mbs : mbs.results ?? []);
  }

  async function handleAddAgent() {
    if (!agentLocality || !newAgentId) return;
    setAddingAgent(true);
    try {
      const created = await addLocalityAgent({ locality: agentLocality.id, user: Number(newAgentId) });
      setAgents((prev) => [...prev, created]);
      setNewAgentId("");
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Erreur lors de l'ajout");
    } finally { setAddingAgent(false); }
  }

  async function handleRemoveAgent(agentId: number) {
    await removeLocalityAgent(agentId);
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  }

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getLocalities()
      .then((data) => setLocalities(Array.isArray(data) ? data : data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModal("create");
  }

  function openEdit(l: Locality) {
    setSelected(l);
    setForm({ name: l.name, island: l.island, type: l.type, description: l.description ?? "", is_active: l.is_active });
    setModal("edit");
  }

  function openDelete(l: Locality) {
    setSelected(l);
    setModal("delete");
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (modal === "create") {
        const created = await createLocality(form);
        setLocalities((prev) => [...prev, created]);
      } else if (modal === "edit" && selected) {
        const updated = await updateLocality(selected.id, form);
        setLocalities((prev) => prev.map((l) => l.id === updated.id ? updated : l));
      }
      setModal(null);
    } catch (e: any) {
      alert(e?.response?.data?.name?.[0] ?? e?.response?.data?.detail ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteLocality(selected.id);
      setLocalities((prev) => prev.filter((l) => l.id !== selected.id));
      setModal(null);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Impossible de supprimer cette localité (initiatives en cours ?)");
    } finally {
      setSaving(false);
    }
  }

  const byIsland = ISLANDS.map((isl) => ({
    isl,
    label: ISLAND_LABELS[isl],
    color: ISLAND_COLORS[isl],
    items: localities.filter((l) => l.island === isl),
  }));

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="pin" size={13} /> Référentiel géographique</div>
          <h1 className="wd-page-title">Localités</h1>
          <p className="wd-page-sub">
            {localities.length} localité{localities.length !== 1 ? "s" : ""} · {localities.filter((l) => l.is_active).length} actives
          </p>
        </div>
        <Btn variant="primary" icon="plus" onClick={openCreate}>Ajouter une localité</Btn>
      </div>

      {/* KPI par île */}
      <div className="wd-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 22 }}>
        {byIsland.map(({ isl, label, color, items }) => (
          <Card key={isl} className="wd-stat">
            <div className="wd-stat-top">
              <span className="wd-stat-ic" style={{ color, background: `color-mix(in srgb, transparent 88%, ${color})` }}>
                <Icon name="pin" size={17} />
              </span>
            </div>
            <div className="wd-stat-val tnum">{items.length}</div>
            <div className="wd-stat-label">{label}</div>
            <div className="wd-stat-sub">
              {items.filter((l) => l.is_active).length} active{items.filter((l) => l.is_active).length !== 1 ? "s" : ""}
              {" · "}{items.reduce((s, l) => s + (l.initiative_count ?? 0), 0)} initiatives
            </div>
          </Card>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>
      ) : (
        byIsland.map(({ isl, label, color, items }) => (
          <div key={isl} style={{ marginBottom: 22 }}>
            <div className="section-label" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
              {label}
              <span style={{ fontWeight: 400, color: "var(--text-3)", textTransform: "none", letterSpacing: 0 }}>({items.length})</span>
            </div>
            <Card pad={false}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 80px 80px 100px 100px", gap: 16, padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em" }}>
                <span>Localité</span><span>Chef actuel</span><span>Type</span><span>Membres</span><span>Initiatives</span><span>Statut</span>
              </div>
              {items.length === 0 && (
                <div style={{ padding: "16px 18px", color: "var(--text-3)", fontSize: 13.5 }}>Aucune localité pour cette île.</div>
              )}
              {items.map((l) => {
                const s = STATUS_META[String(l.is_active) as "true" | "false"];
                return (
                  <div
                    key={l.id}
                    style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 80px 80px 100px 100px", gap: 16, padding: "13px 18px", borderTop: "1px solid var(--wunda-border)", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", color, background: `color-mix(in srgb, transparent 88%, ${color})`, flexShrink: 0 }}>
                        <Icon name="pin" size={15} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 650 }}>{l.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>{l.type_display}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 13.5, color: l.chef_name ? "var(--text-2)" : "var(--text-3)" }}>
                      {l.chef_name ?? "—"}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-2)", textTransform: "capitalize" }}>{l.type_display}</span>
                    <span className="tnum" style={{ fontWeight: 600, textAlign: "center" }}>{l.member_count ?? "—"}</span>
                    <span className="tnum" style={{ fontWeight: 600, textAlign: "center" }}>{l.initiative_count ?? "—"}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="wd-pill wd-pill-sm" style={{ "--pc": s.c } as React.CSSProperties}>
                        <span className="wd-pill-dot" />{s.label}
                      </span>
                      <button className="wd-icon-btn" style={{ width: 28, height: 28 }} onClick={() => openAgents(l)} title="Gérer les agents">
                        <Icon name="users" size={14} />
                      </button>
                      <button className="wd-icon-btn" style={{ width: 28, height: 28 }} onClick={() => openEdit(l)} title="Modifier">
                        <Icon name="chevR" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}

      {/* ---- Modale création / édition ---- */}
      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "create" ? "Nouvelle localité" : `Modifier — ${selected?.name}`}
          subtitle="Rattacher la localité à son île et son type géographique"
          icon="pin"
          onClose={() => setModal(null)}
          onConfirm={handleSave}
          confirmLabel={modal === "create" ? "Créer" : "Enregistrer"}
          confirmDisabled={saving || !form.name}
        >
          <Field label="Nom de la localité" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex : Mitsoudjé"
              autoFocus
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Île" required>
              <Select value={form.island} onChange={(e) => setForm((f) => ({ ...f, island: e.target.value as Island }))}>
                {ISLANDS.map((isl) => (
                  <option key={isl} value={isl}>{ISLAND_LABELS[isl]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Type" required>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LocalityType }))}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Informations complémentaires sur la localité…"
              rows={3}
            />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label className="wd-switch">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <span className="wd-switch-track"><span className="wd-switch-knob" /></span>
            </label>
            <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>Localité active (visible pour les initiatives)</span>
          </div>
        </Modal>
      )}

      {/* ---- Modale suppression ---- */}
      {modal === "delete" && selected && (
        <Modal
          title="Supprimer la localité ?"
          subtitle={selected.name}
          icon="alert"
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
          confirmLabel="Supprimer"
          confirmVariant="danger"
          confirmDisabled={saving}
        >
          <p style={{ fontSize: 13.5, color: "var(--text-2)", margin: 0 }}>
            Cette action est irréversible. Les initiatives rattachées à <b>{selected.name}</b> seront conservées mais orphelines.
          </p>
        </Modal>
      )}

      {/* ---- Modale Agents ---- */}
      {agentLocality && (
        <Modal
          title={`Agents de vérification — ${agentLocality.name}`}
          subtitle="Les agents vérifient l'exécution terrain avant validation par le Chef. RM-07"
          icon="shield"
          onClose={() => setAgentLocality(null)}
          width={500}
        >
          {/* Liste agents actifs */}
          <div style={{ marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Agents actifs</div>
            {agents.length === 0 && (
              <div style={{ fontSize: 13.5, color: "var(--text-3)" }}>Aucun agent assigné à cette localité.</div>
            )}
            {agents.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--wunda-border)" }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 550 }}>{a.user_name ?? `Utilisateur #${a.user}`}</span>
                <span className="wd-pill wd-pill-sm" style={{ "--pc": a.is_active ? "var(--green-600)" : "var(--st-todo)" } as React.CSSProperties}>
                  <span className="wd-pill-dot" />{a.is_active ? "Actif" : "Inactif"}
                </span>
                <button className="wd-icon-btn" style={{ width: 28, height: 28, color: "var(--st-reject)" }}
                  onClick={() => handleRemoveAgent(a.id)} title="Retirer">
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Ajouter un agent */}
          <div className="section-label" style={{ marginBottom: 8 }}>Ajouter un agent</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Select
              value={newAgentId}
              onChange={(e) => setNewAgentId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">— Sélectionner un membre —</option>
              {members
                .filter((m) => !agents.some((a) => a.user === m.id))
                .map((m) => (
                  <option key={m.id} value={String(m.id)}>{m.first_name} {m.last_name}</option>
                ))}
            </Select>
            <Btn variant="primary" size="sm" icon="plus" onClick={handleAddAgent} disabled={addingAgent || !newAgentId}>
              Ajouter
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
