import type { AuthTokens } from "@/types";

const ACCESS_KEY  = "wunda_access";
const REFRESH_KEY = "wunda_refresh";
const USER_KEY    = "wunda_user";

export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
  localStorage.setItem(USER_KEY, JSON.stringify({
    role: tokens.role,
    first_name: tokens.first_name,
    last_name: tokens.last_name,
    is_diaspora: tokens.is_diaspora,
  }));
  // Cookie lisible par le middleware Next.js (Edge)
  document.cookie = `wunda_access=${tokens.access}; path=/; SameSite=Strict`;
}

export function getAccessToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null;
}

export function getRefreshToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "wunda_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
