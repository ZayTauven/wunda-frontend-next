"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import Segmented from "@/components/ui/Segmented";
import Avatar from "@/components/ui/Avatar";
import Reputation from "@/components/ui/Reputation";
import Modal, { Field, Input, Select } from "@/components/ui/Modal";
import type { User, UserRole, Locality } from "@/types";
import { getUsers, validateUser, blockUser, getLocalities, verifyKyc, rejectKyc } from "@/lib/api";
import api from "@/lib/api";
import AccessDenied from "@/components/ui/AccessDenied";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  controller: "Contrôleur",
  chef_locality: "Chef de localité",
  agent: "Agent de vérification",
  porteur: "Porteur d'initiative",
  member: "Membre",
};
const STATUS_META: Record<string, { label: string; c: string }> = {
  active: { label: "Actif", c: "var(--green-600)" },
  pending: { label: "En attente", c: "var(--st-doing)" },
  inactive: { label: "Inactif", c: "var(--st-todo)" },
  blocked: { label: "Bloqué", c: "var(--st-reject)" },
};
const KYC_META: Record<string, { label: string; c: string }> = {
  none: { label: "Non soumis", c: "var(--text-3)" },
  pending: { label: "À vérifier", c: "var(--st-doing)" },
  verified: { label: "Vérifié", c: "var(--green-600)" },
  rejected: { label: "Rejeté", c: "var(--st-reject)" },
};
const DOC_LABELS: Record<string, string> = {
  id_front: "Pièce — recto",
  id_back: "Pièce — verso",
  selfie: "Selfie",
};
const ROLES: { value: UserRole; label: string }[] = [
  { value: "member", label: "Membre" },
  { value: "porteur", label: "Porteur d'initiative" },
  { value: "agent", label: "Agent de vérif." },
  { value: "chef_locality", label: "Chef de localité" },
  { value: "controller", label: "Contrôleur" },
  { value: "admin", label: "Administrateur" },
];
const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "member" as UserRole,
  locality_id: "" as string | number,
  is_diaspora: true,
};

export default function UsersPage() {
  const canAccess = useRoleGuard(["admin"]);
  const [users, setUsers] = useState<User[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [kycUser, setKycUser] = useState<User | null>(null);
  const [kycReason, setKycReason] = useState("");

  useEffect(() => {
    if (!canAccess) return;
    Promise.all([
      getUsers().then((d) =>
        setUsers(Array.isArray(d) ? d : (d.results ?? [])),
      ),
      getLocalities().then((d) =>
        setLocalities(Array.isArray(d) ? d : (d.results ?? [])),
      ),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [canAccess]);

  if (!canAccess) return <AccessDenied requiredRoles={["admin"]} />;

  function openCreate() {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModal("create");
  }
  function openEdit(u: User) {
    setSelected(u);
    setForm({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      password: "",
      role: u.role,
      locality_id: u.locality?.id ?? "",
      is_diaspora: u.is_diaspora,
    });
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role,
        locality_id: form.locality_id || null,
        is_diaspora: form.is_diaspora,
      };
      if (form.password) payload.password = form.password;
      if (modal === "create") {
        payload.password = form.password;
        const created = await api
          .post("/auth/users/", payload)
          .then((r) => r.data);
        setUsers((prev) => [...prev, created]);
      } else if (modal === "edit" && selected) {
        const updated = await api
          .patch(`/auth/users/${selected.id}/`, payload)
          .then((r) => r.data);
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u)),
        );
      }
      setModal(null);
    } catch (e: any) {
      alert(
        e?.response?.data?.email?.[0] ??
          e?.response?.data?.detail ??
          JSON.stringify(e?.response?.data) ??
          "Erreur",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate(id: number) {
    await validateUser(id);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "active" } : u)),
    );
  }
  async function handleBlock(id: number) {
    await blockUser(id);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "blocked" } : u)),
    );
  }

  async function handleVerifyKyc(id: number) {
    const updated = await verifyKyc(id);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    setKycUser(updated);
  }
  async function handleRejectKyc(id: number) {
    const updated = await rejectKyc(id, kycReason);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    setKycUser(updated);
    setKycReason("");
  }

  const filtered =
    statusFilter === "all"
      ? users
      : users.filter((u) => u.status === statusFilter);
  const counts = {
    pending: users.filter((u) => u.status === "pending").length,
  };

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow">
            <Icon name="users" size={13} /> Identités vérifiées
          </div>
          <h1 className="wd-page-title">Utilisateurs & réputation</h1>
          <p className="wd-page-sub">
            {users.length} membre{users.length !== 1 ? "s" : ""} ·{" "}
            {counts.pending} en attente de validation
          </p>
        </div>
        <Btn variant="primary" icon="plus" onClick={openCreate}>
          Nouvel utilisateur
        </Btn>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Segmented
          options={[
            { value: "all", label: "Tous" },
            { value: "pending", label: "En attente", icon: "clock" },
            { value: "active", label: "Actifs", icon: "check" },
            { value: "blocked", label: "Bloqués", icon: "x" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {loading ? (
        <div
          style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}
        >
          Chargement…
        </div>
      ) : (
        <Card pad={false}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 120px 120px 120px 120px 100px",
              gap: 12,
              padding: "12px 18px",
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            <span>Membre</span>
            <span>Rôle</span>
            <span>Statut</span>
            <span>Localité</span>
            <span>Depuis</span>
            <span>Actions</span>
          </div>
          {filtered.length === 0 && (
            <div
              style={{
                padding: "20px 18px",
                color: "var(--text-3)",
                fontSize: 13.5,
              }}
            >
              Aucun utilisateur dans cette catégorie.
            </div>
          )}
          {filtered.map((u) => {
            const s = STATUS_META[u.status] ?? {
              label: u.status,
              c: "var(--text-3)",
            };
            const initials =
              `${u.first_name[0] ?? ""}${u.last_name[0] ?? ""}`.toUpperCase();
            return (
              <div
                key={u.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 120px 120px 120px 120px 100px",
                  gap: 12,
                  padding: "14px 18px",
                  borderTop: "1px solid var(--wunda-border)",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Avatar
                    initials={initials}
                    color={u.id % 2 === 0 ? "#2563eb" : "#16a34a"}
                    size={36}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 650 }}>
                      {u.first_name} {u.last_name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                      {u.email}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
                <span
                  className="wd-pill wd-pill-sm"
                  style={{ "--pc": s.c } as React.CSSProperties}
                >
                  <span className="wd-pill-dot" />
                  {s.label}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                  {u.locality_name ?? "—"}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                  {u.last_active_at?.slice(0, 10) ?? "—"}
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {(() => {
                    const km = KYC_META[u.kyc_status ?? "none"] ?? KYC_META.none;
                    return (
                      <button
                        onClick={() => { setKycReason(""); setKycUser(u); }}
                        title={`KYC : ${km.label}`}
                        className="wd-pill wd-pill-sm"
                        style={{ "--pc": km.c, cursor: "pointer", border: "none" } as React.CSSProperties}
                      >
                        <span className="wd-pill-dot" />
                        🪪
                      </button>
                    );
                  })()}
                  <button
                    className="wd-icon-btn"
                    style={{ width: 28, height: 28 }}
                    onClick={() => openEdit(u)}
                    title="Modifier"
                  >
                    <Icon name="chevR" size={13} />
                  </button>
                  {u.status === "pending" && (
                    <Btn
                      variant="validate"
                      size="sm"
                      onClick={() => handleValidate(u.id)}
                    >
                      Valider
                    </Btn>
                  )}
                  {u.status === "active" && (
                    <Btn
                      variant="soft"
                      size="sm"
                      onClick={() => handleBlock(u.id)}
                      style={{ fontSize: 11.5 }}
                    >
                      Bloquer
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ---- Modale création / édition ---- */}
      {(modal === "create" || modal === "edit") && (
        <Modal
          title={
            modal === "create"
              ? "Nouvel utilisateur"
              : `Modifier — ${selected?.first_name} ${selected?.last_name}`
          }
          icon="users"
          onClose={() => setModal(null)}
          onConfirm={handleSave}
          confirmLabel={modal === "create" ? "Créer le compte" : "Enregistrer"}
          confirmDisabled={
            saving || !form.email || (modal === "create" && !form.password)
          }
          width={540}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <Field label="Prénom" required>
              <Input
                value={form.first_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, first_name: e.target.value }))
                }
                placeholder="Ex : Nadjla"
                autoFocus
              />
            </Field>
            <Field label="Nom" required>
              <Input
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
                placeholder="Ex : Abdou"
              />
            </Field>
          </div>
          <Field label="Adresse email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="prenom@wunda.app"
            />
          </Field>
          <Field
            label={
              modal === "create"
                ? "Mot de passe"
                : "Nouveau mot de passe (laisser vide = inchangé)"
            }
            required={modal === "create"}
          >
            <Input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder="••••••••"
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <Field label="Rôle" required>
              <Select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                }
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Localité">
              <Select
                value={String(form.locality_id)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, locality_id: e.target.value }))
                }
              >
                <option value="">— Aucune —</option>
                {localities.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name} ({l.island_display})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label className="wd-switch">
              <input
                type="checkbox"
                checked={form.is_diaspora}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_diaspora: e.target.checked }))
                }
              />
              <span className="wd-switch-track">
                <span className="wd-switch-knob" />
              </span>
            </label>
            <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>
              Membre de la diaspora
            </span>
          </div>
        </Modal>
      )}

      {/* ---- Modale revue KYC ---- */}
      {kycUser && (
        <Modal
          title={`Vérification d'identité — ${kycUser.first_name} ${kycUser.last_name}`}
          icon="shield"
          onClose={() => setKycUser(null)}
          width={620}
        >
          {(() => {
            const km = KYC_META[kycUser.kyc_status ?? "none"] ?? KYC_META.none;
            const docs = kycUser.identity_documents ?? [];
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span
                    className="wd-pill wd-pill-sm"
                    style={{ "--pc": km.c } as React.CSSProperties}
                  >
                    <span className="wd-pill-dot" />
                    {km.label}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                    {ROLE_LABELS[kycUser.role] ?? kycUser.role}
                    {kycUser.role === "porteur" && " · KYC requis pour l'activation"}
                  </span>
                </div>

                {kycUser.kyc_status === "rejected" && kycUser.kyc_rejection_reason && (
                  <div style={{ fontSize: 13, color: "var(--st-reject)", marginBottom: 14 }}>
                    Motif du rejet : {kycUser.kyc_rejection_reason}
                  </div>
                )}

                {docs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
                    Aucun document soumis par cet utilisateur.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
                    {docs.map((d) => (
                      <a key={d.id} href={d.file} target="_blank" rel="noreferrer"
                         style={{ border: "1px solid var(--wunda-border)", borderRadius: 12, overflow: "hidden", textDecoration: "none" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.file} alt={DOC_LABELS[d.doc_type] ?? d.doc_type}
                             style={{ width: "100%", height: 120, objectFit: "cover", display: "block", background: "var(--surface-2)" }} />
                        <div style={{ padding: "8px 10px", fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>
                          {DOC_LABELS[d.doc_type] ?? d.doc_type}
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {kycUser.kyc_status !== "verified" && (
                  <div style={{ marginTop: 18 }}>
                    <Field label="Motif (en cas de rejet)">
                      <Input
                        value={kycReason}
                        onChange={(e) => setKycReason(e.target.value)}
                        placeholder="Ex : document illisible, ne correspond pas…"
                      />
                    </Field>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
                  {kycUser.kyc_status !== "verified" && (
                    <>
                      <Btn variant="soft" onClick={() => handleRejectKyc(kycUser.id)} disabled={docs.length === 0}>
                        Rejeter
                      </Btn>
                      <Btn variant="validate" onClick={() => handleVerifyKyc(kycUser.id)} disabled={docs.length === 0}>
                        Valider l'identité
                      </Btn>
                    </>
                  )}
                  {kycUser.kyc_status === "verified" && (
                    <Btn variant="soft" onClick={() => setKycUser(null)}>Fermer</Btn>
                  )}
                </div>
              </>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
