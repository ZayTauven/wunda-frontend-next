"use client";

import Icon from "@/components/ui/Icon";
import Btn from "@/components/ui/Btn";

interface TopbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Topbar({ theme, onToggleTheme }: TopbarProps) {
  return (
    <header className="wd-topbar">
      <div className="wd-search">
        <Icon name="search" size={16} />
        <input placeholder="Rechercher une initiative, une tâche, un porteur…" />
        <kbd>⌘K</kbd>
      </div>
      <div style={{ flex: 1 }} />
      <button className="wd-icon-btn" onClick={onToggleTheme} title="Basculer le thème">
        <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
      </button>
      <button className="wd-icon-btn" title="Notifications">
        <Icon name="bell" size={18} />
        <span className="wd-dot-badge" />
      </button>
      <Btn variant="primary" icon="plus">Nouvelle action</Btn>
    </header>
  );
}
