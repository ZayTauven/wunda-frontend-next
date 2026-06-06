"use client";

import { useState } from "react";
import Modal, { Field, Input, Select } from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import { createContribution } from "@/lib/api";
import type { Initiative } from "@/types";
import { fmtEur } from "@/types";

const METHODS = [
  { value: "orange_money", label: "Orange Money"  },
  { value: "mvola",        label: "MVola (Comores)"},
  { value: "hamoniya",     label: "Hamoniya"       },
  { value: "paypal",       label: "PayPal"         },
  { value: "manual",       label: "Virement manuel"},
];

interface Props {
  initiative: Initiative;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ContributeModal({ initiative, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("orange_money");
  const [groupName, setGroupName] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      await createContribution({
        initiative: initiative.id,
        amount: Number(amount),
        payment_method: method,
        group_name: groupName || null,
        is_anonymous: isAnon,
      });
      setDone(true);
      onSuccess?.();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? e?.response?.data?.detail ?? "Erreur lors de la contribution");
    } finally { setSaving(false); }
  }

  if (done) {
    return (
      <Modal
        title="Contribution enregistrée"
        icon="check"
        onClose={onClose}
        width={440}
      >
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Icon name="check" size={28} stroke={2.5} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Merci pour votre contribution !</div>
          <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>
            <span className="mono tnum" style={{ fontWeight: 700 }}>{fmtEur(amount)}</span> ont été enregistrés pour <b>{initiative.title}</b>.<br />
            Un reçu sera émis dès confirmation du paiement.
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Contribuer à l'initiative"
      subtitle={initiative.title}
      icon="euro"
      onClose={onClose}
      onConfirm={handleSubmit}
      confirmLabel="Valider la contribution"
      confirmDisabled={saving || !amount || Number(amount) <= 0}
      width={480}
    >
      <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="lock" size={15} style={{ color: "var(--green-600)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.4 }}>
          Chaque contribution est tracée et liée à une tâche. Les fonds sont libérés par palier, uniquement après validation terrain.
        </span>
      </div>

      <Field label="Montant (€)" required>
        <Input
          type="number" min="1" step="10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex : 500"
          autoFocus
        />
      </Field>

      <Field label="Moyen de paiement" required>
        <Select value={method} onChange={(e) => setMethod(e.target.value)}>
          {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      </Field>

      <Field label="Contribuer au nom d'un groupe (facultatif)">
        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Ex : Association des Comoriens de Lyon"
        />
      </Field>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label className="wd-switch">
          <input type="checkbox" checked={isAnon} onChange={(e) => setIsAnon(e.target.checked)} />
          <span className="wd-switch-track"><span className="wd-switch-knob" /></span>
        </label>
        <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>
          Contribution anonyme — votre identité reste confidentielle publiquement (conservée pour audit interne). RM-08
        </span>
      </div>
    </Modal>
  );
}
