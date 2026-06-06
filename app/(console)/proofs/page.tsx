"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import Segmented from "@/components/ui/Segmented";
import type { Proof } from "@/types";
import { getProofs, validateProof } from "@/lib/api";
import ModalOverlay from "@/components/ui/ModalOverlay";

const PROOF_TYPE: Record<string, { icon: string; label: string }> = {
  photo: { icon: "image", label: "Photo" },
  video: { icon: "video", label: "Vidéo" },
  doc:   { icon: "doc",   label: "Document" },
};
const PROOF_STATUS: Record<string, { label: string; c: string }> = {
  VALIDATED: { label: "Validée",     c: "var(--green-600)"  },
  DONE:      { label: "À valider",   c: "var(--st-doing)"   },
  PENDING:   { label: "En attente",  c: "var(--st-todo)"    },
  REJECTED:  { label: "Rejetée",     c: "var(--st-reject)"  },
  CONTESTED: { label: "Contestée",   c: "var(--st-dispute)" },
};

function ProofCard({ p, onOpen }: { p: Proof; onOpen: (p: Proof) => void }) {
  const t = PROOF_TYPE[(p as any).type ?? "photo"];
  const s = PROOF_STATUS[p.status] ?? { label: p.status, c: "var(--text-3)" };
  const tone = s.c;
  return (
    <div className="wd-proof" onClick={() => onOpen(p)}>
      <div className="wd-proof-thumb" style={{ "--cc": tone } as React.CSSProperties}>
        <div className="wd-cover-stripes" style={{ "--cc": tone, opacity: .5 } as React.CSSProperties} />
        <Icon name={t?.icon ?? "image"} size={30} style={{ color: tone, position: "relative", opacity: .7 }} />
        <span className="wd-proof-type"><Icon name={t?.icon ?? "image"} size={12} />{t?.label ?? "Fichier"}</span>
        {p.status === "VALIDATED" && (
          <span className="wd-proof-lock" title="Scellée — non supprimable"><Icon name="lock" size={12} style={{ color: "var(--green-600)" }} /></span>
        )}
      </div>
      <div className="wd-proof-body">
        <div className="wd-proof-label">{(p as any).description ?? `Preuve #${p.id}`}</div>
        <div className="wd-proof-meta">
          <span className="wd-pill wd-pill-sm" style={{ "--pc": s.c } as React.CSSProperties}>
            <span className="wd-pill-dot" />{s.label}
          </span>
        </div>
        <div className="wd-proof-meta" style={{ marginTop: 7 }}>
          <span className="mono">PR-{p.id}</span> · {p.uploaded_at?.slice(0, 10)}
        </div>
      </div>
    </div>
  );
}

function ProofModal({ proof, onClose, onValidate }: { proof: Proof | null; onClose: () => void; onValidate: (p: Proof) => void }) {
  if (!proof) return null;
  const t = PROOF_TYPE[(proof as any).type ?? "photo"];
  const s = PROOF_STATUS[proof.status] ?? { label: proof.status, c: "var(--text-3)" };
  const canAct = proof.status !== "VALIDATED";
  return (
    <ModalOverlay onClose={onClose}>
    <div className="wd-modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(8,14,11,.55)", backdropFilter: "blur(3px)", zIndex: 9999, display: "grid", placeItems: "center", padding: 24 }} onClick={onClose}>
      <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wd-modal-head">
          <span className="wd-stat-ic" style={{ color: s.c, background: `color-mix(in srgb, transparent 88%, ${s.c})` }}>
            <Icon name={t?.icon ?? "image"} size={17} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 680 }}>{(proof as any).description ?? `Preuve #${proof.id}`}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }} className="mono">PR-{proof.id} · {t?.label}</div>
          </div>
          <button className="wd-icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="wd-modal-body">
          <div className="wd-proof-preview" style={{ "--cc": s.c } as React.CSSProperties}>
            <div className="wd-cover-stripes" style={{ "--cc": s.c, opacity: .45 } as React.CSSProperties} />
            <Icon name={t?.icon ?? "image"} size={46} style={{ color: s.c, position: "relative", opacity: .6 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div className="wd-fund-stat"><div className="l">Statut</div><div style={{ marginTop: 4 }}><span className="wd-pill wd-pill-sm" style={{ "--pc": s.c } as React.CSSProperties}><span className="wd-pill-dot" />{s.label}</span></div></div>
            <div className="wd-fund-stat"><div className="l">Empreinte</div><div className="v mono" style={{ fontSize: 13 }}><Icon name="lock" size={11} /> 0x{String(proof.id).padStart(4, "0")}</div></div>
          </div>
          {proof.status === "VALIDATED" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--green-50)", color: "var(--green-700)", padding: "11px 14px", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 600 }}>
              <Icon name="seal" size={18} fill="var(--green-600)" stroke={0} /> Preuve scellée — entrée immuable du registre. RM-01
            </div>
          )}
        </div>
        <div className="wd-modal-foot">
          {canAct ? (
            <>
              <Btn variant="danger" icon="alert">Contester</Btn>
              <Btn variant="ghost" icon="x">Rejeter</Btn>
              <Btn variant="primary" icon="check" onClick={() => onValidate(proof)}>Valider la preuve</Btn>
            </>
          ) : (
            <Btn variant="ghost" onClick={onClose}>Fermer</Btn>
          )}
        </div>
      </div>
    </div>
    </ModalOverlay>
  );
}

export default function ProofsPage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Proof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProofs()
      .then((data) => setProofs(Array.isArray(data) ? data : data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? proofs : proofs.filter((p) => {
    if (filter === "pending") return ["DONE", "PENDING"].includes(p.status);
    if (filter === "validated") return p.status === "VALIDATED";
    if (filter === "disputed") return p.status === "CONTESTED";
    return true;
  });

  async function handleValidate(p: Proof) {
    try {
      await validateProof(p.id);
      setProofs((prev) => prev.map((x) => x.id === p.id ? { ...x, status: "VALIDATED" } : x));
      setSelected(null);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Erreur lors de la validation");
    }
  }

  return (
    <div className="fade-up">
      <div className="wd-page-head">
        <div>
          <div className="wd-eyebrow"><Icon name="image" size={13} /> Modération des preuves</div>
          <h1 className="wd-page-title">Preuves à vérifier</h1>
          <p className="wd-page-sub">Validez les pièces de terrain avant la libération des fonds.</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Segmented
          options={[
            { value: "all",       label: "Toutes"     },
            { value: "pending",   label: "À valider",  icon: "clock"  },
            { value: "validated", label: "Validées",   icon: "check"  },
            { value: "disputed",  label: "Contestées", icon: "alert"  },
          ]}
          value={filter} onChange={setFilter}
        />
        <div style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="lock" size={13} /> Une preuve validée est scellée — elle ne peut être supprimée, seulement contestée.
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)" }}>
            <Icon name="image" size={32} style={{ opacity: .4, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>Aucune preuve dans cette catégorie</div>
          </div>
        </Card>
      ) : (
        <div className="wd-proof-grid">
          {filtered.map((p) => <ProofCard key={p.id} p={p} onOpen={setSelected} />)}
        </div>
      )}

      {selected && <ProofModal proof={selected} onClose={() => setSelected(null)} onValidate={handleValidate} />}
    </div>
  );
}
