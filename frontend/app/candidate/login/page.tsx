import { Suspense } from "react"
import { CandidateLoginPage } from "@/components/recruitment/candidate-public"

export default function CandidateLoginRoute() {
  return (
    <Suspense fallback={null}>
      <CandidateLoginPage />
    </Suspense>
  )
}
