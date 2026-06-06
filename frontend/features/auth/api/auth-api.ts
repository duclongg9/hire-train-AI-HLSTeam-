import { request } from "@/shared/api/client"
import type { BackendUser, BackendUserRole } from "@/shared/api/backend-types"

export function mockLogin(email: string, role: BackendUserRole) {
  return request<{ access_token: string; token_type: string; user: BackendUser }>("/auth/mock-login", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  })
}

export type { BackendUserRole }

