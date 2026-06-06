import { request } from "@/shared/api/client"
import type { BackendAuditLog, BackendUser, BackendUserRole } from "@/shared/api/backend-types"

export function listAdminUsers() {
  return request<BackendUser[]>("/admin/users")
}

export function createAdminUser(payload: { name: string; email: string; role?: BackendUserRole; is_active?: boolean }) {
  return request<BackendUser>("/admin/users", {
    method: "POST",
    body: JSON.stringify({
      role: "HR_MANAGER",
      is_active: true,
      ...payload,
    }),
  })
}

export function listAuditLogs() {
  return request<BackendAuditLog[]>("/admin/audit-logs")
}

export type { BackendAuditLog, BackendUser }

