import type { ReactNode } from "react"
import { PublicLayout } from "@/shared/layout/public-layout"

export default function CandidateRouteLayout({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}

