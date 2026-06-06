"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import Btn from "@/components/ui/Btn";
import Segmented from "@/components/ui/Segmented";
import Modal, { Field, Input, Textarea, Select } from "@/components/ui/Modal";
import IniCard from "@/components/views/overview/IniCard";
import type { Initiative, Locality } from "@/types";
import { getInitiatives, createInitiative, getLocalities } from "@/lib/api";

const SCOPE_OPTIONS = [
  { value: "GLOBAL",        label: "Global — ouvert à toute la diaspora" },
  { value: "LOCAL_DIASPORA",label: "Local — diaspora de la localité uniquement" },
];
const EMPTY = { title: "", description: "", locality: "" as string | number, goal_amount: "", scope: "GLOBAL", deadline: "" };

export default function InitiativesPage() {
  const router = useRouter();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getInitiatives().then((d) => setInitiatives(Array.isArray(d) ? d : d.results ?? [])),
      getLocalities().then((d) => setLocalities(Array.isArray(d) ? d : d.results ?? [])),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        locality: Number(form.locality),
        goal_amount: Number(form.goal_amount),
        deadline: form.deadline || null,
      };
      const created = await createInitiative(payload);
      setInitiatives((prev) => [created, ...prev]);
      setShowCreate(false);
      router.push(`/initiatives/${created.id}`);
    } catch (e: any) {
      alert(e?.response?.data?.title?.[0] ?? e?.response?.data?.detail ?? JSON.stringify(e?.response?.data) ?? "Erreur");
    } finally { setSaving(false); }
  }

  const filtered = filter === "all" ? initiatives : initiatives.filter((i) => i.status === filter);
  const counts = {
    UNDER_REVIEW: initiatives.filter((i) => i.status === "UNDER_REVIEW").length,
    IN_PROGRESS:  initiatives.filter((i) => i.status === "IN_PROGRESS").length,
    COMPLETED:    initiatives.filter((i) => i.status === "COMPLETED").length,
  };

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="flag" size={13} /> Catalogue</div>
          <h1 className="wd-page-title">Initiatives</h1>
          <p className="wd-page-sub">
            {initiatives.length} initiative{initiatives.length !== 1 ? "s" : ""} · {counts.IN_PROGRESS} en cours · {counts.UNDER_REVIEW} en révision
          </p>
        </div>
        <Btn variant="primary" icon="plus" onClick={() => { setForm(EMPTY); setShowCreate(true); }}>
          Nouvelle initiative
        </Btn>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Segmented
          options={[
            { value: "all",          label: "Toutes"       },
            { value: "UNDER_REVIEW", label: "En révision", icon: "shield"   },
            { value: "IN_PROGRESS",  label: "En cours",    icon: "activity" },
            { value: "COMPLETED",    label: "Clôturées",   icon: "check"    },
          ]}
          value={filter} onChange={setFilter}
        />
      </div>

      {loading ? (
        <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>
      ) : (
        <div className="wd-ini-grid">
          {filtered.map((i) => (
            <IniCard key={i.id} ini={i} onOpen={(ini) => router.push(`/initiatives/${ini.id}`)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ color: "var(--text-3)", fontSize: 14, gridColumn: "1/-1", padding: "20px 0" }}>
              Aucune initiative dans cette catégorie.
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <Modal
          title="Nouvelle initiative"
          subtitle="Le porteur soumettra ensuite au Contrôleur avant publication"
          icon="flag"
          onClose={() => setShowCreate(false)}
          onConfirm={handleCreate}
          confirmLabel="Créer l'initiative"
          confirmDisabled={saving || !form.title || !form.locality || !form.goal_amount}
          width={580}
        >
          <Field label="Titre" required>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex : Réhabilitation de l'école primaire de Mitsoudjé"
              autoFocus
            />
          </Field>
          <Field label="Description" required>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez l'objectif, le contexte et les réalisations prévues…"
              rows={4}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Localité" required>
              <Select
                value={String(form.locality)}
                onChange={(e) => setForm((f) => ({ ...f, locality: e.target.value }))}
              >
                <option value="">— Sélectionner —</option>
                {localities.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name} · {l.island_display}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Objectif financier (€)" required>
              <Input
                type="number" min="0" step="100"
                value={form.goal_amount}
                onChange={(e) => setForm((f) => ({ ...f, goal_amount: e.target.value }))}
                placeholder="Ex : 48000"
              />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Portée">
              <Select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}>
                {SCOPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <Field label="Échéance">
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
