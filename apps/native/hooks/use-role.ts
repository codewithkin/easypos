import { useAuthStore } from "@/store/auth";

export function useRole() {
  const role = useAuthStore((s) => s.user?.role);

  return {
    role,
    isAdmin: role === "ADMIN",
    isManager: role === "MANAGER",
    isStaff: role === "STAFF",
    /** Admin or Manager — can manage the store */
    canManage: role === "ADMIN" || role === "MANAGER",
    /** Admin only — cross-branch, org-wide actions */
    isAdminOnly: role === "ADMIN",
  };
}
