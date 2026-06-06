"use client";

import { useState, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import Sidebar, { type ViewId, getAllowedViews, defaultView } from "@/components/shell/Sidebar";
import Topbar from "@/components/shell/Topbar";
import { useRouter, usePathname } from "next/navigation";

const PATH_TO_VIEW: Record<string, ViewId> = {
  "/overview": "overview", "/initiatives": "initiatives", "/review": "review",
  "/proofs": "proofs", "/funds": "funds", "/activity": "activity",
  "/users": "users", "/localites": "localites", "/categories": "categories",
  "/badges": "badges", "/baremes": "baremes",
};

function ConsoleShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const current = (Object.entries(PATH_TO_VIEW).find(([p]) => pathname.startsWith(p))?.[1] ?? "overview") as ViewId;

  // Récupère le rôle depuis le token stocké
  const storedUser = typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem("wunda_user") ?? "null"); } catch { return null; } })()
    : null;
  const role: string = storedUser?.role ?? "member";

  useEffect(() => {
    const saved = localStorage.getItem("wunda_theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("wunda_theme", theme);
  }, [theme]);

  // Guard : redirige si la vue actuelle n'est pas autorisée pour ce rôle
  useEffect(() => {
    const allowed = getAllowedViews(role);
    if (current && !allowed.includes(current)) {
      router.replace(`/${defaultView(role)}`);
    }
  }, [current, role, router]);

  function setView(v: ViewId) { router.push(`/${v}`); }
  function toggleTheme() { setTheme((t) => (t === "dark" ? "light" : "dark")); }

  return (
    <div className="wd-shell">
      <Sidebar view={current} setView={setView} />
      <div className="wd-main">
        <Topbar theme={theme} onToggleTheme={toggleTheme} />
        <div className="wd-content">
          <div className="wd-content-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConsoleShell>{children}</ConsoleShell>
    </AuthProvider>
  );
}
