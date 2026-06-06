import axios from "axios";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = axios
          .post(`${BASE}/auth/refresh/`, { refresh: getRefreshToken() })
          .then((r) => {
            saveTokens({ ...r.data, access: r.data.access });
            return r.data.access as string;
          })
          .catch(() => { clearTokens(); window.location.href = "/login"; return ""; })
          .finally(() => { refreshing = null; });
      }
      const newToken = await refreshing;
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post("/auth/login/", { email, password }).then((r) => r.data);

// ── Users ─────────────────────────────────────────────────────────────────────
export const getProfile     = ()                => api.get("/auth/profile/").then((r) => r.data);
export const getUsers       = (params?: object) => api.get("/auth/users/", { params }).then((r) => r.data);
export const validateUser   = (id: number)      => api.post(`/auth/users/${id}/validate/`).then((r) => r.data);
export const blockUser      = (id: number)      => api.post(`/auth/users/${id}/block/`).then((r) => r.data);
export const getAnalytics   = ()                => api.get("/auth/analytics/").then((r) => r.data);
export const getDirectory   = (params?: object) => api.get("/auth/directory/users/", { params }).then((r) => r.data);

// ── Localities ────────────────────────────────────────────────────────────────
export const getLocalities  = (params?: object)    => api.get("/localities/", { params }).then((r) => r.data);
export const getLocality    = (id: number)          => api.get(`/localities/${id}/`).then((r) => r.data);
export const createLocality = (data: object)        => api.post("/localities/", data).then((r) => r.data);
export const updateLocality = (id: number, data: object) => api.patch(`/localities/${id}/`, data).then((r) => r.data);
export const deleteLocality = (id: number)          => api.delete(`/localities/${id}/`).then((r) => r.data);

// ── Gestion (catégories, badges, barèmes) ─────────────────────────────────────
export const getCategories   = ()              => api.get("/gestion/categories/").then((r) => r.data);
export const createCategory  = (data: object)  => api.post("/gestion/categories/", data).then((r) => r.data);
export const updateCategory  = (id: number, data: object) => api.patch(`/gestion/categories/${id}/`, data).then((r) => r.data);
export const deleteCategory  = (id: number)    => api.delete(`/gestion/categories/${id}/`);

export const getBadges       = ()              => api.get("/gestion/badges/").then((r) => r.data);
export const createBadge     = (data: object)  => api.post("/gestion/badges/", data).then((r) => r.data);
export const updateBadge     = (id: number, data: object) => api.patch(`/gestion/badges/${id}/`, data).then((r) => r.data);
export const deleteBadge     = (id: number)    => api.delete(`/gestion/badges/${id}/`);

export const getBaremes      = (params?: object) => api.get("/gestion/baremes/", { params }).then((r) => r.data);
export const createBareme    = (data: object)   => api.post("/gestion/baremes/", data).then((r) => r.data);
export const updateBareme    = (id: number, data: object) => api.patch(`/gestion/baremes/${id}/`, data).then((r) => r.data);
export const deleteBareme    = (id: number)     => api.delete(`/gestion/baremes/${id}/`);

// ── Initiatives ───────────────────────────────────────────────────────────────
export const getInitiatives    = (params?: object)       => api.get("/initiatives/", { params }).then((r) => r.data);
export const getInitiative     = (id: number)            => api.get(`/initiatives/${id}/`).then((r) => r.data);
export const createInitiative  = (data: object)             => api.post("/initiatives/", data).then((r) => r.data);
export const updateInitiative  = (id: number, data: object) => api.patch(`/initiatives/${id}/`, data).then((r) => r.data);
export const deleteInitiative  = (id: number)               => api.delete(`/initiatives/${id}/`);
export const submitForReview   = (id: number)               => api.post(`/initiatives/${id}/submit_for_review/`).then((r) => r.data);

// ── Locality Agents ───────────────────────────────────────────────────────────
export const getLocalityAgents  = (params?: object)          => api.get("/localities/agents/", { params }).then((r) => r.data);
export const addLocalityAgent   = (data: object)             => api.post("/localities/agents/", data).then((r) => r.data);
export const removeLocalityAgent = (id: number)              => api.delete(`/localities/agents/${id}/`);
export const approveInitiative = (id: number)            => api.post(`/initiatives/${id}/approve/`).then((r) => r.data);
export const rejectInitiative  = (id: number)            => api.post(`/initiatives/${id}/reject/`).then((r) => r.data);
export const publishInitiative = (id: number)            => api.post(`/initiatives/${id}/publish/`).then((r) => r.data);

// ── Milestones ────────────────────────────────────────────────────────────────
export const getMilestones     = (params?: object)          => api.get("/initiatives/milestones/", { params }).then((r) => r.data);
export const createMilestone   = (data: object)             => api.post("/initiatives/milestones/", data).then((r) => r.data);
export const updateMilestone   = (id: number, data: object) => api.patch(`/initiatives/milestones/${id}/`, data).then((r) => r.data);
export const deleteMilestone   = (id: number)               => api.delete(`/initiatives/milestones/${id}/`);
export const estimateMilestone = (id: number, data: object) => api.patch(`/initiatives/milestones/${id}/estimate/`, data).then((r) => r.data);

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const getTasks       = (params?: object)             => api.get("/tasks/", { params }).then((r) => r.data);
export const getTask        = (id: number)                  => api.get(`/tasks/${id}/`).then((r) => r.data);
export const createTask     = (data: object)                => api.post("/tasks/", data).then((r) => r.data);
export const updateTask     = (id: number, data: object)    => api.patch(`/tasks/${id}/`, data).then((r) => r.data);
export const deleteTask     = (id: number)                  => api.delete(`/tasks/${id}/`);
export const transitionTask = (id: number, status: string) => api.post(`/tasks/${id}/transition/`, { status }).then((r) => r.data);

// ── Proofs ────────────────────────────────────────────────────────────────────
export const getProofs      = (params?: object) => api.get("/proofs/", { params }).then((r) => r.data);
export const getProof       = (id: number)      => api.get(`/proofs/${id}/`).then((r) => r.data);
export const uploadProof    = (data: FormData)  => api.post("/proofs/", data, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
export const validateProof  = (id: number)      => api.post(`/proofs/${id}/validate/`).then((r) => r.data);
export const rejectProof    = (id: number)      => api.post(`/proofs/${id}/reject/`).then((r) => r.data);
export const contestProof   = (id: number, reason: string) => api.post(`/proofs/${id}/contest/`, { reason }).then((r) => r.data);

// ── Contributions ─────────────────────────────────────────────────────────────
export const getContributions  = (params?: object) => api.get("/contributions/", { params }).then((r) => r.data);
export const createContribution = (data: object)   => api.post("/contributions/", data).then((r) => r.data);

// ── Fund releases ─────────────────────────────────────────────────────────────
export const getFundReleases = (params?: object) => api.get("/fund-releases/", { params }).then((r) => r.data);
export const releaseFunds    = (milestoneId: number) => api.post("/fund-releases/", { milestone: milestoneId }).then((r) => r.data);

// ── Activity logs ─────────────────────────────────────────────────────────────
export const getActivityLogs = (params?: object) => api.get("/activity-logs/", { params }).then((r) => r.data);

export default api;
