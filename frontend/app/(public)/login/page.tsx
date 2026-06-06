import { Suspense } from "react"
import { LoginScreen } from "@/features/auth/containers/login-screen"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  )
}
