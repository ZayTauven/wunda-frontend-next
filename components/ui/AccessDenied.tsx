import Icon from "./Icon";

interface Props {
  requiredRoles?: string[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur", controller: "Contrôleur",
  chef_locality: "Chef de localité", agent: "Agent de vérification",
};

export default function AccessDenied({ requiredRoles }: Props) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "60vh", gap: 16, color: "var(--text-3)",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "var(--r-lg)",
        background: "var(--surface-2)", display: "grid", placeItems: "center",
        border: "1px solid var(--wunda-border)",
      }}>
        <Icon name="lock" size={28} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Accès restreint
        </div>
        <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.55 }}>
          Cette section n'est pas accessible avec votre rôle actuel.
          {requiredRoles && requiredRoles.length > 0 && (
            <>
              <br />
              Requis : <b>{requiredRoles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}</b>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
