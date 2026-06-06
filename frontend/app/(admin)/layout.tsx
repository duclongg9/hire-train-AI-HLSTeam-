import type { ReactNode } from "react"
import { AuthenticatedAppShell } from "@/shared/layout/authenticated-app-shell"

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedAppShell role="Admin">{children}</AuthenticatedAppShell>
}

