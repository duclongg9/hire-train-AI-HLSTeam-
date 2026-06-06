import { Suspense } from "react"
import { CandidateLoginPage } from "@/features/jobs/containers/candidate-login-page"

export default function CandidateLoginRoute() {
  return (
    <Suspense fallback={null}>
      <CandidateLoginPage />
    </Suspense>
  )
}
