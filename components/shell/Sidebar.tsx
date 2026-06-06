"use client";

import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";

export type ViewId =
  | "overview"
  | "initiatives"
  | "review"
  | "proofs"
  | "funds"
  | "activity"
  | "users"
  | "localites"
  | "categories"
  | "badges"
  | "baremes";

interface NavItem {
  id?: ViewId;
  sec?: string;
  label?: string;
  icon?: string;
  badgeCount?: number;
  badgeGreen?: boolean;
  roles?: string[]; // si absent → accessible à tous les rôles
}

// Matrice d'accès par rôle
// roles: undefined = tous | string[] = rôles autorisés
const NAV: NavItem[] = [
  { sec: "Pilotage" },
  { id: "overview",    label: "Vue d'ensemble", icon: "grid" },
  { id: "initiatives", label: "Initiatives",    icon: "flag" },
  { sec: "Contrôle" },
  { id: "review",  label: "File de revue",  icon: "shield", roles: ["admin", "controller"] },
  { id: "proofs",  label: "Preuves",        icon: "image",  roles: ["admin", "controller", "chef_locality", "agent"], badgeGreen: true },
  { id: "funds",   label: "Fonds & paliers",icon: "wallet", roles: ["admin", "controller", "chef_locality"] },
  { sec: "Réseau" },
  { id: "activity", label: "Journal",       icon: "activity", roles: ["admin", "controller", "chef_locality", "agent"] },
  { id: "users",    label: "Utilisateurs",  icon: "users",    roles: ["admin"] },
  { sec: "Gestion" },
  { id: "localites",   label: "Localités",       icon: "pin",    roles: ["admin", "chef_locality"] },
  { id: "categories",  label: "Catégories",       icon: "layers", roles: ["admin"] },
  { id: "badges",      label: "Badges",           icon: "seal",   roles: ["admin"] },
  { id: "baremes",     label: "Barèmes de prix",  icon: "euro",   roles: ["admin"] },
];

/** Retourne les vues accessibles pour un rôle donné */
export function getAllowedViews(role: string): ViewId[] {
  return NAV
    .filter((n) => n.id && (!n.roles || n.roles.includes(role)))
    .map((n) => n.id!);
}

/** Vue de redirection par défaut selon le rôle */
export function defaultView(role: string): ViewId {
  const allowed = getAllowedViews(role);
  return allowed[0] ?? "overview";
}

interface SidebarProps {
  view: ViewId;
  setView: (v: ViewId) => void;
}

export default function Sidebar({ view, setView }: SidebarProps) {
  const { user, logout } = useAuth();
  const role = user?.role ?? "member";
  const initials = user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "??" : "??";
  const roleLabel: Record<string, string> = {
    admin:         "Administrateur",
    controller:    "Contrôleur",
    chef_locality: "Chef de localité",
    agent:         "Agent de vérification",
    member:        "Membre",
  };

  // Filtre le NAV selon le rôle — supprime aussi les sections vides
  const filteredNav = NAV.reduce<NavItem[]>((acc, item, i, arr) => {
    if (!item.sec) {
      if (!item.roles || item.roles.includes(role)) acc.push(item);
    } else {
      // N'inclure la section que si au moins un élément suivant est accessible
      const hasVisible = arr.slice(i + 1).some(
        (n) => !n.sec && (!n.roles || n.roles.includes(role))
      );
      if (hasVisible) acc.push(item);
    }
    return acc;
  }, []);

  return (
    <aside className="wd-sidebar">
      <div className="wd-brand">
        <div className="wd-brand-logo">
          <Icon name="logo" size={17} stroke={0} fill="currentColor" />
        </div>
        <div>
          <div className="wd-brand-name">Wunda</div>
          <div className="wd-brand-tag">Console</div>
        </div>
      </div>

      <nav className="wd-nav">
        {filteredNav.map((n, i) =>
          n.sec ? (
            <div className="wd-nav-sec" key={"s" + i}>{n.sec}</div>
          ) : (
            <button
              key={n.id}
              className={`wd-nav-item${view === n.id ? " on" : ""}`}
              onClick={() => setView(n.id!)}
            >
              <span className="wd-nav-ic">
                <Icon name={n.icon!} size={18} />
              </span>
              {n.label}
              {n.badgeCount != null && n.badgeCount > 0 && (
                <span className={`wd-nav-badge${n.badgeGreen ? " green" : ""}`}>
                  {n.badgeCount}
                </span>
              )}
            </button>
          ),
        )}
      </nav>

      <div className="wd-side-foot">
        <div className="wd-role-card" onClick={logout} title="Se déconnecter">
          <Avatar initials={initials} color="#16a34a" size={34} />
          <div className="wd-role-meta">
            <div className="wd-role-name">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="wd-role-role">
              {roleLabel[user?.role ?? ""] ?? user?.role}
            </div>
          </div>
          <Icon
            name="chevR"
            size={15}
            style={{ marginLeft: "auto", color: "var(--text-3)" }}
          />
        </div>
      </div>
    </aside>
  );
}
