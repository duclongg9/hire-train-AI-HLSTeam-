import type { ReactNode } from "react"
import { PublicHeader } from "@/shared/layout/public-header"

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      {children}
    </div>
  )
}

