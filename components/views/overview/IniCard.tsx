"use client";

import { useState } from "react";
import type { Initiative } from "@/types";
import { fmtEur } from "@/types";
import Cover from "@/components/ui/Cover";
import Progress from "@/components/ui/Progress";
import { IniStatusPill } from "@/components/ui/StatusPill";
import Reputation from "@/components/ui/Reputation";
import Icon from "@/components/ui/Icon";
import ContributeModal from "./ContributeModal";

const CONTRIBUABLE: Initiative["status"][] = ["OPEN", "FUNDED", "IN_PROGRESS"];

interface IniCardProps {
  ini: Initiative;
  onOpen: (ini: Initiative) => void;
}

export default function IniCard({ ini, onOpen }: IniCardProps) {
  const goal = Number(ini.goal_amount);
  const raised = ini.total_collected;
  const pct = goal > 0 ? Math.round((raised / goal) * 100) : 0;
  const [showContribute, setShowContribute] = useState(false);

  const coverKind = (ini as any).cover ?? "school";
  const reputation = (ini as any).reputation ?? 0;
  const canContribute = CONTRIBUABLE.includes(ini.status);

  return (
    <>
      <div className="wd-card wd-ini-card" onClick={() => onOpen(ini)}>
        <Cover kind={coverKind} h={92} />
        <div className="wd-ini-card-body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <IniStatusPill status={ini.status} />
            {reputation > 0 && <Reputation score={reputation} size={34} />}
          </div>
          <div className="wd-ini-card-title">{ini.title}</div>
          <div className="wd-ini-card-place">
            <Icon name="pin" size={13} />{ini.locality_name}
          </div>
          <div style={{ margin: "14px 0 10px" }}>
            <Progress value={pct} height={7} />
          </div>
          <div className="wd-ini-card-foot">
            <div className="wd-ini-card-raised mono tnum">
              {ini.status === "UNDER_REVIEW" ? (
                <span style={{ color: "var(--text-3)" }}>En attente de contrôle</span>
              ) : (
                <>{fmtEur(raised)} <span>/ {fmtEur(goal)}</span></>
              )}
            </div>
            {canContribute ? (
              <button
                className="wd-btn wd-btn-primary wd-btn-sm"
                style={{ fontSize: 12 }}
                onClick={(e) => { e.stopPropagation(); setShowContribute(true); }}
              >
                <Icon name="euro" size={13} /> Contribuer
              </button>
            ) : (
              <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                {ini.milestones_count} palier{ini.milestones_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {showContribute && (
        <ContributeModal
          initiative={ini}
          onClose={() => setShowContribute(false)}
        />
      )}
    </>
  );
}
