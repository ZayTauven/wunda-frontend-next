const TINTS: Record<string, string> = {
  school: "#16a34a", water: "#0891b2", market: "#d97706",
  health: "#db2777", solar: "#ca8a04", road: "#7c3aed",
};
const CAPTIONS: Record<string, string> = {
  school: "École", water: "Forage", market: "Marché",
  health: "Santé", solar: "Solaire", road: "Piste",
};

interface CoverProps { kind: string; h?: number; label?: string; }

export default function Cover({ kind, h = 120, label }: CoverProps) {
  const c = TINTS[kind] ?? "#16a34a";
  return (
    <div className="wd-cover" style={{ height: h, "--cc": c } as React.CSSProperties}>
      <div className="wd-cover-stripes" />
      <span className="wd-cover-cap mono">{label ?? CAPTIONS[kind] ?? "Initiative"}</span>
    </div>
  );
}
