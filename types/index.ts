export type UserRole = "admin" | "controller" | "chef_locality" | "agent" | "member";
export type UserStatus = "pending" | "active" | "inactive" | "blocked";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  locality?: LocalityBrief | null;
  locality_name?: string | null;
  is_diaspora: boolean;
  avatar_url?: string | null;
  last_active_at?: string | null;
}

export interface LocalityBrief {
  id: number;
  name: string;
  type: string;
}

export type Island = "grande_comore" | "anjouan" | "moheli";
export type LocalityType = "ile" | "region" | "ville" | "village";

export const ISLAND_LABELS: Record<Island, string> = {
  grande_comore: "Grande Comore",
  anjouan: "Anjouan",
  moheli: "Mohéli",
};
export const ISLAND_COLORS: Record<Island, string> = {
  grande_comore: "#16a34a",
  anjouan: "#2563eb",
  moheli: "#d97706",
};

export interface Locality {
  id: number;
  name: string;
  island: Island;
  island_display: string;
  type: LocalityType;
  type_display: string;
  description?: string;
  chef?: number | null;
  chef_name?: string | null;
  is_active: boolean;
  member_count: number;
  initiative_count: number;
  agents: unknown[];
  created_at: string;
}

export interface Category {
  id: number;
  key: string;
  label: string;
  description?: string;
  is_active: boolean;
  bareme_count: number;
  initiative_count: number;
  created_at: string;
}

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface Badge {
  id: number;
  name: string;
  tier: BadgeTier;
  tier_display: string;
  icon: string;
  color: string;
  criteria: string;
  is_active: boolean;
  awarded_count: number;
  created_at: string;
}

export interface Bareme {
  id: number;
  ref: string;
  label: string;
  category?: number | null;
  category_label?: string | null;
  unit: string;
  price: string;
  region: string;
  is_active: boolean;
  updated_at: string;
}

export type InitiativeStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "OPEN"
  | "FUNDED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type InitiativeScope = "GLOBAL" | "LOCAL_DIASPORA";

export interface Initiative {
  id: number;
  locality: number;
  locality_name: string;
  owner: number;
  owner_name: string;
  controller?: number | null;
  controller_name?: string | null;
  title: string;
  description: string;
  goal_amount: string;
  scope: InitiativeScope;
  status: InitiativeStatus;
  deadline?: string | null;
  total_collected: number;
  contributor_count: number;
  milestones: Milestone[];
  recent_contributions: Contribution[];
  total_estimated_budget?: number | null;
  milestones_estimated_count: number;
  milestones_count: number;
  milestones_validated_count: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: number;
  initiative: number;
  title: string;
  description?: string;
  order: number;
  budget: string;
  estimated_budget?: string | null;
  estimation_notes?: string;
  estimated_by?: number | null;
  estimated_by_name?: string | null;
  estimated_at?: string | null;
  tasks: Task[];
  tasks_count: number;
  validated_tasks_count: number;
  created_at: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "VALIDATED" | "CONTESTED";

export interface Task {
  id: number;
  milestone: number;
  title: string;
  description?: string;
  budget: string;
  deadline?: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  // enriched client-side
  _milestoneTitle?: string;
  _proofCount?: number;
}

export type ProofStatus = "PENDING" | "VALIDATED" | "REJECTED" | "CONTESTED";

export interface Proof {
  id: number;
  task: number;
  task_title: string;
  initiative_id: number;
  uploaded_by: number;
  uploaded_by_name: string;
  media_type: "photo" | "video" | "document";
  file: string;
  caption: string;
  status: ProofStatus;
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  uploaded_at: string;
}

export interface Contribution {
  id: number;
  initiative: number;
  initiative_title: string;
  contributor: number;
  contributor_name: string;
  contributor_locality_name?: string | null;
  group_name?: string | null;
  amount: string;
  payment_method: "orange_money" | "mvola" | "hamoniya" | "paypal" | "manual";
  payment_status: "pending" | "confirmed" | "failed";
  is_anonymous: boolean;
  validated_at?: string | null;
  external_ref?: string | null;
  created_at: string;
}

export interface ActivityLogEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  actor?: number | null;
  actor_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  is_diaspora: boolean;
}

export interface StatusMeta {
  label: string;
  color: string;
}

export const TASK_STATUS_META: Record<TaskStatus, StatusMeta> = {
  TODO:        { label: "À faire",    color: "var(--st-todo)"    },
  IN_PROGRESS: { label: "En cours",   color: "var(--st-doing)"   },
  DONE:        { label: "Terminée",   color: "var(--st-done)"    },
  VALIDATED:   { label: "Validée",    color: "var(--st-valid)"   },
  CONTESTED:   { label: "Contestée",  color: "var(--st-dispute)" },
};

export const INITIATIVE_STATUS_META: Record<InitiativeStatus, StatusMeta> = {
  DRAFT:        { label: "Brouillon",    color: "var(--st-todo)"    },
  UNDER_REVIEW: { label: "En révision",  color: "var(--st-doing)"   },
  APPROVED:     { label: "Approuvée",    color: "var(--st-done)"    },
  REJECTED:     { label: "Rejetée",      color: "var(--st-reject)"  },
  OPEN:         { label: "Ouverte",      color: "#0891b2"           },
  FUNDED:       { label: "Financée",     color: "var(--st-done)"    },
  IN_PROGRESS:  { label: "En cours",     color: "var(--st-doing)"   },
  COMPLETED:    { label: "Complétée",    color: "var(--st-valid)"   },
  CANCELLED:    { label: "Annulée",      color: "var(--st-reject)"  },
};

export const fmtEur = (n: number | string) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n));

export const fmtNum = (n: number | string) =>
  new Intl.NumberFormat("fr-FR").format(Number(n));
