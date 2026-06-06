import { Suspense } from "react"
import { CandidateLoginPage } from "@/features/jobs/containers/job-pages"

export default function CandidateLoginRoute() {
  return (
    <Suspense fallback={null}>
      <CandidateLoginPage />
    </Suspense>
  )
}
