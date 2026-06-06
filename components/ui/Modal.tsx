"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import Btn from "./Btn";

interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger" | "validate";
  confirmDisabled?: boolean;
  children: React.ReactNode;
  width?: number;
}

export default function Modal({
  title, subtitle, icon, onClose, onConfirm,
  confirmLabel = "Enregistrer", confirmVariant = "primary",
  confirmDisabled, children, width = 520,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Verrouille le scroll du body pendant que la modale est ouverte
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Fermeture avec Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!mounted) return null;

  const content = (
    <div
      className="wd-modal-bg"
      onClick={onClose}
      style={{
        // S'assure que le portail couvre TOUT le viewport, indépendamment du layout
        position: "fixed", inset: 0,
        background: "rgba(8,14,11,.55)",
        backdropFilter: "blur(3px)",
        zIndex: 9999,
        display: "grid", placeItems: "center",
        padding: 24,
      }}
    >
      <div
        className="wd-modal"
        style={{ maxWidth: width, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wd-modal-head">
          {icon && (
            <span className="wd-stat-ic" style={{ color: "var(--green-600)", background: "var(--green-50)" }}>
              <Icon name={icon} size={17} />
            </span>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 680 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 1 }}>{subtitle}</div>}
          </div>
          <button className="wd-icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="wd-modal-body">{children}</div>
        <div className="wd-modal-foot">
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          {onConfirm && (
            <Btn variant={confirmVariant} onClick={onConfirm} disabled={confirmDisabled}>
              {confirmLabel}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );

  // Portal : injecte la modale directement dans document.body,
  // hors de tout contexte d'empilement (backdrop-filter, transform, etc.)
  return createPortal(content, document.body);
}

/* ---- Champs de formulaire réutilisables ---- */
export function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
        {label}{required && <span style={{ color: "var(--st-reject)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  padding: "9px 11px", borderRadius: "var(--r-sm)",
  border: "1px solid var(--wunda-border)", background: "var(--surface-2)",
  fontSize: 13.5, color: "var(--text)", outline: "none", width: "100%",
  fontFamily: "var(--font)",
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input style={INPUT_STYLE} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea style={{ ...INPUT_STYLE, resize: "vertical", minHeight: 72 }} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select style={{ ...INPUT_STYLE, cursor: "pointer" }} {...props}>
      {props.children}
    </select>
  );
}
