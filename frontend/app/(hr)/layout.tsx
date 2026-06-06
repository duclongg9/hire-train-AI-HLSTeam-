import type { ReactNode } from "react"
import { AuthenticatedAppShell } from "@/shared/layout/authenticated-app-shell"

export default function HrRouteLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedAppShell role="HR Manager">{children}</AuthenticatedAppShell>
}

