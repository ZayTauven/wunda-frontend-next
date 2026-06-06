"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Btn from "@/components/ui/Btn";
import Progress from "@/components/ui/Progress";
import Segmented from "@/components/ui/Segmented";
import Avatar from "@/components/ui/Avatar";
import Reputation from "@/components/ui/Reputation";
import { IniStatusPill, TaskStatusPill } from "@/components/ui/StatusPill";
import ActivityLog, { type LogEntry } from "@/components/ui/ActivityLog";
import Icon2 from "@/components/ui/Icon";
import type { Initiative, Task, TaskStatus, Proof, ActivityLogEntry, Milestone } from "@/types";
import ModalOverlay from "@/components/ui/ModalOverlay";
import Modal, { Field, Input, Textarea, Select } from "@/components/ui/Modal";
import { fmtEur, TASK_STATUS_META } from "@/types";
import {
  getInitiative, transitionTask, getProofs, validateProof, getActivityLogs,
  createMilestone, updateMilestone, deleteMilestone,
  createTask, updateTask, deleteTask,
  uploadProof,
  updateInitiative, submitForReview,
} from "@/lib/api";

const PROOF_TYPE: Record<string, { icon: string; label: string }> = {
  photo:    { icon: "image",  label: "Photo"    },
  video:    { icon: "video",  label: "Vidéo"    },
  document: { icon: "doc",    label: "Document" },
};
const PROOF_STATUS: Record<string, { label: string; c: string }> = {
  VALIDATED: { label: "Validée",    c: "var(--green-600)"  },
  PENDING:   { label: "En attente", c: "var(--st-todo)"    },
  REJECTED:  { label: "Rejetée",    c: "var(--st-reject)"  },
  CONTESTED: { label: "Contestée",  c: "var(--st-dispute)" },
};
const LOG_ICON: Record<string, { name: string; c: string }> = {
  PROOF_UPLOADED:   { name: "image",    c: "var(--st-doing)"  },
  PROOF_VALIDATED:  { name: "check",    c: "var(--green-600)" },
  PROOF_REJECTED:   { name: "x",        c: "var(--st-reject)" },
  PROOF_CONTESTED:  { name: "alert",    c: "var(--st-dispute)"},
  FUNDS_RELEASED:   { name: "unlock",   c: "var(--st-done)"   },
  CONTRIBUTION_MADE:{ name: "euro",     c: "var(--green-600)" },
  STATUS_TODO_TO_IN_PROGRESS: { name: "activity", c: "var(--st-doing)" },
  STATUS_IN_PROGRESS_TO_DONE: { name: "clock",    c: "var(--st-done)"  },
  STATUS_DONE_TO_VALIDATED:   { name: "shield",   c: "var(--green-600)"},
};
function logIcon(action: string) {
  return LOG_ICON[action] ?? { name: "activity", c: "var(--text-3)" };
}

const CHAIN: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "VALIDATED"];

function canMove(task: Task & { proofCount?: number }, toStatus: TaskStatus, role: string) {
  const from = CHAIN.indexOf(task.status);
  const to = CHAIN.indexOf(toStatus);
  if (to === from) return { ok: true };
  if (Math.abs(to - from) !== 1) return { ok: false, msg: "Impossible de sauter une étape" };
  if (toStatus === "VALIDATED" && !["controller", "admin"].includes(role))
    return { ok: false, msg: "Validation réservée au contrôleur" };
  return { ok: true };
}

function KanbanBoard({ tasks, onTransition, role, onEditTask, onDeleteTask, onUploadProof }: {
  tasks: (Task & { _milestoneTitle?: string })[];
  onTransition: (taskId: number, status: TaskStatus) => void;
  role: string;
  onEditTask?: (t: Task & { _milestoneTitle?: string }) => void;
  onDeleteTask?: (t: Task) => void;
  onUploadProof?: (taskId: number) => void;
}) {
  const [drag, setDrag] = useState<Task | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ col: string; ok: boolean; msg?: string } | null>(null);

  const cols = CHAIN.map((s) => ({
    key: s, meta: TASK_STATUS_META[s],
    items: tasks.filter((t) => t.status === s),
  }));

  function onDrop(e: React.DragEvent, toStatus: TaskStatus) {
    e.preventDefault();
    setOver(null);
    if (!drag) return;
    const res = canMove(drag, toStatus, role);
    setFlash({ col: toStatus, ok: res.ok, msg: (res as any).msg });
    setTimeout(() => setFlash(null), 1400);
    if (!res.ok) { setDrag(null); return; }
    onTransition(drag.id, toStatus);
    setDrag(null);
  }

  return (
    <div className="wd-kanban">
      {cols.map((c) => {
        const isOver = over === c.key;
        const fl = flash?.col === c.key ? flash : null;
        return (
          <div key={c.key}
            className={`wd-kcol${isOver ? " over" : ""}${fl ? (fl.ok ? " ok" : " bad") : ""}`}
            style={{ "--sc": c.meta.color } as React.CSSProperties}
            onDragOver={(e) => { e.preventDefault(); setOver(c.key); }}
            onDragLeave={() => setOver((o) => (o === c.key ? null : o))}
            onDrop={(e) => onDrop(e, c.key as TaskStatus)}
          >
            <div className="wd-kcol-head">
              <span className="wd-kcol-dot" />
              <span className="wd-kcol-name">{c.meta.label}</span>
              <span className="wd-kcol-count">{c.items.length}</span>
              {c.key === "VALIDATED" && <Icon2 name="lock" size={13} style={{ marginLeft: "auto", color: "var(--text-3)" }} />}
            </div>
            <div className="wd-kcol-body">
              {c.items.map((t) => (
                <div
                  key={t.id}
                  className={`wd-kcard${drag?.id === t.id ? " dragging" : ""}`}
                  style={{ "--sc": c.meta.color } as React.CSSProperties}
                  draggable
                  onDragStart={(e) => { setDrag(t); e.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => setDrag(null)}
                >
                  <div className="wd-kcard-top">
                    <span className="wd-kcard-id mono">T{t.id}</span>
                    {t._milestoneTitle && <span className="wd-kcard-ms">{t._milestoneTitle}</span>}
                  </div>
                  <div className="wd-kcard-title">{t.title}</div>
                  <div className="wd-kcard-budget mono tnum">{fmtEur(t.budget)}</div>
                  <div className="wd-kcard-foot">
                    <div className="wd-kcard-meta">
                      {t.deadline && <span className="wd-kchip"><Icon2 name="clock" size={12} />{t.deadline}</span>}
                    </div>
                    {t.status !== "VALIDATED" && (
                      <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                        {onUploadProof && (
                          <button style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-3)", padding: 2, borderRadius: 4, lineHeight: 0 }}
                            onClick={(e) => { e.stopPropagation(); onUploadProof(t.id); }} title="Ajouter une preuve">
                            <Icon2 name="image" size={13} />
                          </button>
                        )}
                        {onEditTask && (
                          <button style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-3)", padding: 2, borderRadius: 4, lineHeight: 0 }}
                            onClick={(e) => { e.stopPropagation(); onEditTask(t); }} title="Modifier">
                            <Icon2 name="chevR" size={13} />
                          </button>
                        )}
                        {onDeleteTask && (
                          <button style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--st-reject)", padding: 2, borderRadius: 4, lineHeight: 0 }}
                            onClick={(e) => { e.stopPropagation(); onDeleteTask(t); }} title="Supprimer">
                            <Icon2 name="x" size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {t.status === "VALIDATED" && (
                    <span className="wd-kcard-seal" title="Validé — preuve scellée">
                      <Icon2 name="seal" size={15} fill="var(--green-600)" stroke={0} />
                    </span>
                  )}
                </div>
              ))}
              {c.items.length === 0 && <div className="wd-kcol-empty">Aucune tâche</div>}
            </div>
            {fl && !fl.ok && (
              <div className="wd-kcol-toast"><Icon2 name="alert" size={13} />{fl.msg}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function InitiativeDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [ini, setIni] = useState<Initiative | null>(null);
  const [tab, setTab] = useState("kanban");
  const [tasks, setTasks] = useState<(Task & { _milestoneTitle?: string })[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [proofFilter, setProofFilter] = useState("all");
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  const [loading, setLoading] = useState(true);
  const [proofsLoaded, setProofsLoaded] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);

  useEffect(() => {
    getInitiative(Number(id))
      .then((data) => {
        setIni(data);
        const flat: (Task & { _milestoneTitle: string })[] = [];
        data.milestones?.forEach((m: any) =>
          m.tasks?.forEach((t: any) => flat.push({ ...t, _milestoneTitle: m.title }))
        );
        setTasks(flat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === "proofs" && !proofsLoaded) {
      getProofs({ initiative: id })
        .then((data) => setProofs(Array.isArray(data) ? data : data.results ?? []))
        .catch(console.error)
        .finally(() => setProofsLoaded(true));
    }
    if (tab === "journal" && !logsLoaded) {
      getActivityLogs({ entity_type: "initiative", entity_id: id })
        .then((data) => setLogs(Array.isArray(data) ? data : data.results ?? []))
        .catch(console.error)
        .finally(() => setLogsLoaded(true));
    }
  }, [tab, id, proofsLoaded, logsLoaded]);

  async function handleValidateProof(p: Proof) {
    try {
      await validateProof(p.id);
      setProofs((prev) => prev.map((x) => x.id === p.id ? { ...x, status: "VALIDATED" } : x));
      setSelectedProof(null);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Erreur validation preuve");
    }
  }

  // ---- Milestone CRUD ----
  type MsModal = { mode: "create" | "edit" | "delete"; milestone?: Milestone };
  const [msModal, setMsModal] = useState<MsModal | null>(null);
  const [msForm, setMsForm] = useState({ title: "", description: "", budget: "", order: 0 });
  const [msSaving, setMsSaving] = useState(false);

  function openMsCreate() {
    setMsForm({ title: "", description: "", budget: "", order: (ini?.milestones.length ?? 0) + 1 });
    setMsModal({ mode: "create" });
  }
  function openMsEdit(m: Milestone) {
    setMsForm({ title: m.title, description: m.description ?? "", budget: String(m.budget), order: m.order });
    setMsModal({ mode: "edit", milestone: m });
  }

  async function handleMsSave() {
    if (!ini) return;
    setMsSaving(true);
    try {
      const payload = { ...msForm, budget: Number(msForm.budget), initiative: ini.id };
      if (msModal?.mode === "create") {
        const created = await createMilestone(payload);
        setIni((prev) => prev ? { ...prev, milestones: [...prev.milestones, { ...created, tasks: [] }] } : prev);
      } else if (msModal?.mode === "edit" && msModal.milestone) {
        const updated = await updateMilestone(msModal.milestone.id, payload);
        setIni((prev) => prev ? {
          ...prev,
          milestones: prev.milestones.map((m) => m.id === updated.id ? { ...updated, tasks: m.tasks } : m),
        } : prev);
      }
      setMsModal(null);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? JSON.stringify(e?.response?.data) ?? "Erreur");
    } finally { setMsSaving(false); }
  }

  async function handleMsDelete(m: Milestone) {
    if (!confirm(`Supprimer le palier "${m.title}" et toutes ses tâches ?`)) return;
    try {
      await deleteMilestone(m.id);
      setIni((prev) => prev ? { ...prev, milestones: prev.milestones.filter((x) => x.id !== m.id) } : prev);
    } catch { alert("Impossible de supprimer ce palier."); }
  }

  // ---- Task CRUD ----
  type TaskModal = { mode: "create" | "edit" | "delete"; task?: Task & { _milestoneTitle?: string }; milestoneId?: number };
  const [taskModal, setTaskModal] = useState<TaskModal | null>(null);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", budget: "", deadline: "" });
  const [taskSaving, setTaskSaving] = useState(false);

  function openTaskCreate(milestoneId: number) {
    setTaskForm({ title: "", description: "", budget: "", deadline: "" });
    setTaskModal({ mode: "create", milestoneId });
  }
  function openTaskEdit(t: Task & { _milestoneTitle?: string }) {
    setTaskForm({ title: t.title, description: t.description ?? "", budget: String(t.budget), deadline: t.deadline ?? "" });
    setTaskModal({ mode: "edit", task: t });
  }

  async function handleTaskSave() {
    setTaskSaving(true);
    try {
      if (taskModal?.mode === "create" && taskModal.milestoneId) {
        const ms = ini?.milestones.find((m) => m.id === taskModal.milestoneId);
        const payload = { ...taskForm, budget: Number(taskForm.budget), milestone: taskModal.milestoneId, deadline: taskForm.deadline || null };
        const created = await createTask(payload);
        const newTask = { ...created, _milestoneTitle: ms?.title };
        setTasks((prev) => [...prev, newTask]);
        setIni((prev) => prev ? {
          ...prev,
          milestones: prev.milestones.map((m) =>
            m.id === taskModal.milestoneId ? { ...m, tasks: [...m.tasks, created] } : m
          ),
        } : prev);
      } else if (taskModal?.mode === "edit" && taskModal.task) {
        const payload = { ...taskForm, budget: Number(taskForm.budget), deadline: taskForm.deadline || null };
        const updated = await updateTask(taskModal.task.id, payload);
        setTasks((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
      }
      setTaskModal(null);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? JSON.stringify(e?.response?.data) ?? "Erreur");
    } finally { setTaskSaving(false); }
  }

  async function handleTaskDelete(t: Task) {
    if (!confirm(`Supprimer la tâche "${t.title}" ?`)) return;
    try {
      await deleteTask(t.id);
      setTasks((prev) => prev.filter((x) => x.id !== t.id));
    } catch { alert("Impossible de supprimer cette tâche."); }
  }

  // ---- Proof upload ----
  const [proofUploadTask, setProofUploadTask] = useState<number | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofCaption, setProofCaption] = useState("");
  const [proofMediaType, setProofMediaType] = useState("photo");
  const [proofSaving, setProofSaving] = useState(false);

  async function handleProofUpload() {
    if (!proofUploadTask || !proofFile) return;
    setProofSaving(true);
    try {
      const fd = new FormData();
      fd.append("task", String(proofUploadTask));
      fd.append("file", proofFile);
      fd.append("caption", proofCaption);
      fd.append("media_type", proofMediaType);
      const created = await uploadProof(fd);
      setProofs((prev) => [...prev, created]);
      setProofUploadTask(null);
      setProofFile(null);
      setProofCaption("");
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Erreur lors de l'upload");
    } finally { setProofSaving(false); }
  }

  async function handleTransition(taskId: number, status: TaskStatus) {
    try {
      await transitionTask(taskId, status);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Transition refusée");
    }
  }

  if (loading) return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Chargement…</div>;
  if (!ini) return <div style={{ color: "var(--st-reject)", padding: 40 }}>Initiative introuvable.</div>;

  const goal = Number(ini.goal_amount);
  const raised = ini.total_collected;
  const pct = goal > 0 ? Math.round((raised / goal) * 100) : 0;
  const reputation = (ini as any).reputation ?? 0;

  const tabs = [
    { id: "kanban",  label: "Kanban",          icon: "layers",   count: tasks.length },
    { id: "budget",  label: "Budget par étape", icon: "euro"     },
    { id: "proofs",  label: "Preuves",          icon: "image",    count: proofsLoaded ? proofs.length : undefined },
    { id: "journal", label: "Journal",          icon: "activity"  },
  ];

  return (
    <div className="fade-up">
      <button className="wd-eyebrow" style={{ border: "none", cursor: "pointer", marginBottom: 12 }}
        onClick={() => router.push("/initiatives")}>
        <Icon name="chevR" size={13} style={{ transform: "rotate(180deg)" }} /> Initiatives
      </button>

      <div className="wd-ini-hero">
        <div className="wd-ini-main">
          <div className="wd-ini-titlerow">
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <IniStatusPill status={ini.status} />
                <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>INI-{ini.id}</span>
              </div>
              <h1 className="wd-ini-title">{ini.title}</h1>
              <div className="wd-ini-place"><Icon name="pin" size={15} />{ini.locality_name}</div>
            </div>
            {reputation > 0 && <Reputation score={reputation} size={52} />}
          </div>
          <p className="wd-ini-summary">{ini.description}</p>
          <div className="wd-ini-people">
            <div className="wd-person">
              <Avatar initials={ini.owner_name.split(" ").map((w) => w[0]).join("").slice(0, 2)} color="#d97706" size={36} />
              <div className="wd-person-meta">
                <div className="wd-person-role">Porteur</div>
                <div className="wd-person-name">{ini.owner_name}</div>
              </div>
            </div>
            {ini.controller_name && (
              <div className="wd-person">
                <Avatar initials={ini.controller_name.split(" ").map((w) => w[0]).join("").slice(0, 2)} color="#2563eb" size={36} />
                <div className="wd-person-meta">
                  <div className="wd-person-role">Contrôleur</div>
                  <div className="wd-person-name">{ini.controller_name}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fund panel */}
        <Card className="wd-fund-panel">
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Financement</div>
            <span className="wd-fund-big mono tnum">{fmtEur(raised)}</span>
            <div className="wd-fund-of">collectés sur {fmtEur(goal)} · <b style={{ color: "var(--green-700)" }}>{pct}%</b></div>
          </div>
          <Progress value={pct} height={10} />
          <div className="wd-fund-stats">
            <div className="wd-fund-stat"><div className="v tnum">{ini.milestones_validated_count}</div><div className="l">Paliers libérés</div></div>
            <div className="wd-fund-stat"><div className="v tnum">{ini.milestones_count}</div><div className="l">Total paliers</div></div>
            <div className="wd-fund-stat"><div className="v tnum">{ini.contributor_count}</div><div className="l">Contributeurs</div></div>
            <div className="wd-fund-stat"><div className="v tnum">{ini.deadline ?? "—"}</div><div className="l">Échéance</div></div>
          </div>
          {ini.status === "APPROVED" && (
            <Btn variant="primary" icon="users" style={{ width: "100%" }}>Publier aux contributeurs</Btn>
          )}
        </Card>
      </div>

      <div className="wd-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`wd-tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={16} />{t.label}
            {t.count != null && <span className="wd-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "kanban" && (
        <div className="fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="alert" size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>
              Glissez une carte — la chaîne <span className="mono">TODO → … → VALIDATED</span> est stricte.
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {ini.milestones.map((m) => (
                <Btn key={m.id} variant="ghost" size="sm" icon="plus"
                  onClick={() => openTaskCreate(m.id)}>
                  Tâche dans « {m.title.length > 20 ? m.title.slice(0, 20) + "…" : m.title} »
                </Btn>
              ))}
            </div>
          </div>
          <KanbanBoard
            tasks={tasks}
            onTransition={handleTransition}
            role="admin"
            onEditTask={openTaskEdit}
            onDeleteTask={handleTaskDelete}
            onUploadProof={(taskId) => setProofUploadTask(taskId)}
          />
        </div>
      )}

      {tab === "budget" && (
        <div className="fade-up wd-grid" style={{ gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="primary" size="sm" icon="plus" onClick={openMsCreate}>Nouveau palier</Btn>
          </div>
          {ini.milestones.map((m) => {
            const grand = ini.milestones.reduce((s, x) => s + Number(x.budget), 0);
            const validatedAmt = m.tasks.filter((t) => t.status === "VALIDATED").reduce((s, t) => s + Number(t.budget), 0);
            return (
              <Card key={m.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 680 }}>{m.title}</span>
                      <button className="wd-icon-btn" style={{ width: 24, height: 24 }} onClick={() => openMsEdit(m)} title="Modifier"><Icon name="chevR" size={13} /></button>
                      <button className="wd-icon-btn" style={{ width: 24, height: 24, color: "var(--st-reject)" }} onClick={() => handleMsDelete(m)} title="Supprimer"><Icon name="x" size={13} /></button>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
                      {m.tasks.length} tâches · {grand > 0 ? Math.round(validatedAmt / Number(m.budget) * 100) : 0}% validé
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono tnum" style={{ fontSize: 17, fontWeight: 700 }}>{fmtEur(m.budget)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                      {grand > 0 ? Math.round(Number(m.budget) / grand * 100) : 0}% du total
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {m.tasks.map((t) => (
                    <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                        <TaskStatusPill status={t.status} size="sm" />
                        <span style={{ fontSize: 13.5, fontWeight: 550, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                      </div>
                      <span className="mono tnum" style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>{fmtEur(t.budget)}</span>
                      <div style={{ width: 90 }}>
                        <Progress value={t.status === "VALIDATED" ? 100 : t.status === "DONE" ? 75 : t.status === "IN_PROGRESS" ? 40 : 0} height={6} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "proofs" && (
        <div className="fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Segmented
              options={[
                { value: "all",       label: "Toutes"     },
                { value: "PENDING",   label: "À valider",  icon: "clock"  },
                { value: "VALIDATED", label: "Validées",   icon: "check"  },
                { value: "CONTESTED", label: "Contestées", icon: "alert"  },
              ]}
              value={proofFilter} onChange={setProofFilter}
            />
            <div style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="lock" size={13} /> Preuve validée = scellée — RM-01
            </div>
          </div>

          {!proofsLoaded ? (
            <div style={{ color: "var(--text-3)", padding: 24, textAlign: "center" }}>Chargement des preuves…</div>
          ) : proofs.length === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)" }}>
                <Icon name="image" size={32} style={{ opacity: .4, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600 }}>Aucune preuve pour cette initiative</div>
                <div style={{ fontSize: 13.5, marginTop: 4 }}>Les preuves apparaîtront ici une fois que le Porteur les aura ajoutées à ses tâches.</div>
              </div>
            </Card>
          ) : (
            <div className="wd-proof-grid">
              {(proofFilter === "all" ? proofs : proofs.filter((p) => p.status === proofFilter)).map((p) => {
                const t = PROOF_TYPE[p.media_type] ?? { icon: "image", label: "Fichier" };
                const s = PROOF_STATUS[p.status] ?? { label: p.status, c: "var(--text-3)" };
                return (
                  <div key={p.id} className="wd-proof" onClick={() => setSelectedProof(p)}>
                    <div className="wd-proof-thumb" style={{ "--cc": s.c } as React.CSSProperties}>
                      <div className="wd-cover-stripes" style={{ "--cc": s.c, opacity: .5 } as React.CSSProperties} />
                      <Icon name={t.icon} size={30} style={{ color: s.c, position: "relative", opacity: .7 }} />
                      <span className="wd-proof-type"><Icon name={t.icon} size={12} />{t.label}</span>
                      {p.status === "VALIDATED" && (
                        <span className="wd-proof-lock" title="Scellée — RM-01"><Icon name="lock" size={12} style={{ color: "var(--green-600)" }} /></span>
                      )}
                    </div>
                    <div className="wd-proof-body">
                      <div className="wd-proof-label">{p.caption || `Preuve #${p.id}`}</div>
                      <div className="wd-proof-meta">
                        <span className="wd-pill wd-pill-sm" style={{ "--pc": s.c } as React.CSSProperties}>
                          <span className="wd-pill-dot" />{s.label}
                        </span>
                      </div>
                      <div className="wd-proof-meta" style={{ marginTop: 7 }}>
                        <span className="mono">PR-{p.id}</span> · {p.uploaded_by_name} · {p.uploaded_at.slice(0, 10)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Proof modal — portal pour échapper au backdrop-filter du layout */}
          {selectedProof && (() => {
            const p = selectedProof;
            const t = PROOF_TYPE[p.media_type] ?? { icon: "image", label: "Fichier" };
            const s = PROOF_STATUS[p.status] ?? { label: p.status, c: "var(--text-3)" };
            return (
              <ModalOverlay onClose={() => setSelectedProof(null)}>
              <div className="wd-modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(8,14,11,.55)", backdropFilter: "blur(3px)", zIndex: 9999, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedProof(null)}>
                <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="wd-modal-head">
                    <span className="wd-stat-ic" style={{ color: s.c, background: `color-mix(in srgb, transparent 88%, ${s.c})` }}>
                      <Icon name={t.icon} size={17} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 680 }}>{p.caption || `Preuve #${p.id}`}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }} className="mono">PR-{p.id} · {t.label} · {p.task_title}</div>
                    </div>
                    <button className="wd-icon-btn" onClick={() => setSelectedProof(null)}><Icon name="x" size={18} /></button>
                  </div>
                  <div className="wd-modal-body">
                    <div className="wd-proof-preview" style={{ "--cc": s.c } as React.CSSProperties}>
                      <div className="wd-cover-stripes" style={{ "--cc": s.c, opacity: .45 } as React.CSSProperties} />
                      {p.file ? (
                        p.media_type === "photo"
                          ? <img src={p.file} alt={p.caption} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover", position: "relative", borderRadius: "var(--r-md)" }} />
                          : <Icon name={t.icon} size={46} style={{ color: s.c, position: "relative", opacity: .6 }} />
                      ) : <Icon name={t.icon} size={46} style={{ color: s.c, position: "relative", opacity: .6 }} />}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <div className="wd-fund-stat"><div className="l">Ajoutée par</div><div className="v" style={{ fontSize: 14 }}>{p.uploaded_by_name}</div></div>
                      <div className="wd-fund-stat"><div className="l">Le</div><div className="v" style={{ fontSize: 14 }}>{p.uploaded_at.slice(0, 10)}</div></div>
                      <div className="wd-fund-stat"><div className="l">Tâche</div><div className="v" style={{ fontSize: 13 }}>{p.task_title}</div></div>
                      <div className="wd-fund-stat"><div className="l">Empreinte</div><div className="v mono" style={{ fontSize: 13 }}><Icon name="lock" size={11} /> 0x{String(p.id).padStart(4, "0")}</div></div>
                    </div>
                    {p.status === "VALIDATED" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--green-50)", color: "var(--green-700)", padding: "11px 14px", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 600 }}>
                        <Icon name="seal" size={18} fill="var(--green-600)" stroke={0} /> Preuve scellée — entrée immuable du registre. RM-01
                      </div>
                    )}
                  </div>
                  <div className="wd-modal-foot">
                    {p.status !== "VALIDATED" ? (
                      <>
                        <Btn variant="danger" icon="alert">Contester</Btn>
                        <Btn variant="ghost" onClick={() => setSelectedProof(null)}>Fermer</Btn>
                        <Btn variant="primary" icon="check" onClick={() => handleValidateProof(p)}>Valider la preuve</Btn>
                      </>
                    ) : (
                      <Btn variant="ghost" onClick={() => setSelectedProof(null)}>Fermer</Btn>
                    )}
                  </div>
                </div>
              </div>
              </ModalOverlay>
            );
          })()}
        </div>
      )}

      {tab === "journal" && (
        <div className="fade-up">
          {!logsLoaded ? (
            <div style={{ color: "var(--text-3)", padding: 24, textAlign: "center" }}>Chargement du journal…</div>
          ) : (
            <Card>
              <div className="section-label" style={{ marginBottom: 8 }}>Journal immuable</div>
              <div className="wd-log">
                {logs.length === 0 && (
                  <div style={{ color: "var(--text-3)", fontSize: 13.5, padding: "8px 0" }}>Aucune entrée dans le journal de cette initiative.</div>
                )}
                {logs.map((e, i) => {
                  const ic = logIcon(e.action);
                  return (
                    <div className="wd-log-item" key={i}>
                      <span className="wd-log-ic" style={{ color: ic.c, background: `color-mix(in srgb, transparent 88%, ${ic.c})` }}>
                        <Icon name={ic.name} size={15} />
                      </span>
                      <div className="wd-log-body">
                        <div className="wd-log-txt">
                          <b>{e.actor_name ?? "Système"}</b> — {e.action.replace(/_/g, " ").toLowerCase()}
                          {e.metadata?.amount ? <> · <span className="mono tnum">{Number(e.metadata.amount).toLocaleString("fr-FR")} €</span></> : null}
                        </div>
                        <div className="wd-log-meta">
                          <span className="wd-log-when">{new Date(e.created_at).toLocaleString("fr-FR")}</span>
                          <span className="wd-log-hash mono"><Icon name="lock" size={10} />0x{String(e.id).padStart(4, "0")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ---- Bouton soumettre en révision (DRAFT) ---- */}
      {ini.status === "DRAFT" && (
        <div style={{ position: "sticky", bottom: 20, display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <Btn variant="primary" icon="send"
            onClick={async () => {
              try { const u = await submitForReview(ini.id); setIni(u); }
              catch (e: any) { alert(e?.response?.data?.error ?? "Erreur"); }
            }}>
            Soumettre pour révision
          </Btn>
        </div>
      )}

      {/* ===== Modales Milestone ===== */}
      {(msModal?.mode === "create" || msModal?.mode === "edit") && (
        <Modal
          title={msModal.mode === "create" ? "Nouveau palier" : `Modifier — ${msModal.milestone?.title}`}
          icon="layers"
          onClose={() => setMsModal(null)}
          onConfirm={handleMsSave}
          confirmLabel={msModal.mode === "create" ? "Créer" : "Enregistrer"}
          confirmDisabled={msSaving || !msForm.title || !msForm.budget}
        >
          <Field label="Titre du palier" required>
            <Input value={msForm.title} onChange={(e) => setMsForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex : Gros œuvre & toiture" autoFocus />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Budget estimé (€)" required>
              <Input type="number" min="0" step="100" value={msForm.budget} onChange={(e) => setMsForm((f) => ({ ...f, budget: e.target.value }))} placeholder="Ex : 21000" />
            </Field>
            <Field label="Ordre">
              <Input type="number" min="1" value={msForm.order} onChange={(e) => setMsForm((f) => ({ ...f, order: Number(e.target.value) }))} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={msForm.description} onChange={(e) => setMsForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </Field>
        </Modal>
      )}

      {/* ===== Modales Tâche ===== */}
      {(taskModal?.mode === "create" || taskModal?.mode === "edit") && (
        <Modal
          title={taskModal.mode === "create" ? "Nouvelle tâche" : `Modifier — ${taskModal.task?.title}`}
          icon="check"
          onClose={() => setTaskModal(null)}
          onConfirm={handleTaskSave}
          confirmLabel={taskModal.mode === "create" ? "Créer" : "Enregistrer"}
          confirmDisabled={taskSaving || !taskForm.title || !taskForm.budget}
        >
          <Field label="Titre de la tâche" required>
            <Input value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex : Démolition de la toiture endommagée" autoFocus />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Budget (€)" required>
              <Input type="number" min="0" step="50" value={taskForm.budget} onChange={(e) => setTaskForm((f) => ({ ...f, budget: e.target.value }))} placeholder="Ex : 3200" />
            </Field>
            <Field label="Échéance">
              <Input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm((f) => ({ ...f, deadline: e.target.value }))} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </Field>
        </Modal>
      )}

      {/* ===== Upload preuve ===== */}
      {proofUploadTask !== null && (
        <Modal
          title="Ajouter une preuve"
          subtitle={`Tâche #${proofUploadTask}`}
          icon="image"
          onClose={() => { setProofUploadTask(null); setProofFile(null); setProofCaption(""); }}
          onConfirm={handleProofUpload}
          confirmLabel="Uploader"
          confirmDisabled={proofSaving || !proofFile}
        >
          <Field label="Type de média">
            <Select value={proofMediaType} onChange={(e) => setProofMediaType(e.target.value)}>
              <option value="photo">Photo</option>
              <option value="video">Vidéo</option>
              <option value="document">Document</option>
            </Select>
          </Field>
          <Field label="Fichier" required>
            <input
              type="file"
              accept={proofMediaType === "photo" ? "image/*" : proofMediaType === "video" ? "video/*" : "*"}
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              style={{ fontSize: 13.5, color: "var(--text)" }}
            />
          </Field>
          <Field label="Légende / description">
            <Input value={proofCaption} onChange={(e) => setProofCaption(e.target.value)} placeholder="Ex : Toiture déposée — pan est" />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--green-50)", color: "var(--green-700)", padding: "10px 13px", borderRadius: "var(--r-sm)", fontSize: 13 }}>
            <Icon name="lock" size={14} /> Une fois validée, la preuve est scellée — RM-01
          </div>
        </Modal>
      )}
    </div>
  );
}
