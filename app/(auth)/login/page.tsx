"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/Icon";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      background: "var(--bg-wash)", fontFamily: "var(--font)",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--surface)", border: "1px solid var(--wunda-border)",
        borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)",
        padding: 36,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "var(--green-600)",
            color: "#fff", display: "grid", placeItems: "center",
          }}>
            <Icon name="logo" size={20} stroke={0} fill="currentColor" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: "-.02em" }}>Wunda</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginTop: -2 }}>Console</div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 750, letterSpacing: "-.025em", marginBottom: 6 }}>
          Connexion
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 28 }}>
          Accès réservé aux administrateurs et contrôleurs.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Adresse email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@wunda.app"
              required autoFocus
              style={{
                padding: "10px 12px", borderRadius: "var(--r-sm)",
                border: "1px solid var(--wunda-border)", background: "var(--surface-2)",
                fontSize: 14, color: "var(--text)", outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Mot de passe</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                padding: "10px 12px", borderRadius: "var(--r-sm)",
                border: "1px solid var(--wunda-border)", background: "var(--surface-2)",
                fontSize: 14, color: "var(--text)", outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "color-mix(in srgb, transparent 88%, var(--st-reject))",
              color: "var(--st-reject)", padding: "10px 12px",
              borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 600,
            }}>
              <Icon name="alert" size={15} /> {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "11px", borderRadius: "var(--r-sm)",
              background: "var(--green-600)", color: "#fff", fontWeight: 600,
              fontSize: 14, border: "none", cursor: "pointer",
              opacity: loading ? 0.7 : 1, marginTop: 4,
            }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 12.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.5 }}>
          Infrastructure de coordination économique observable —<br />traçabilité totale, gouvernance locale ancrée.
        </p>
      </div>
    </div>
  );
}
