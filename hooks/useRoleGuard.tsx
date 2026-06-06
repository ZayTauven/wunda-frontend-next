"use client";

import { useAuth } from "@/contexts/AuthContext";

/**
 * Retourne true si l'utilisateur courant a l'un des rôles autorisés.
 * Usage : const can = useRoleGuard(["admin", "controller"]);
 */
export function useRoleGuard(allowedRoles: string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
