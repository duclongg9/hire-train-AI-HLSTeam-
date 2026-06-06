"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Brain, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormMessage } from "@/components/recruitment/common"
import { mockLogin, type BackendUserRole } from "@/lib/recruitment/api"

export function LoginScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("hr@hiretrain.ai")
  const [password, setPassword] = useState("demo123")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const next = searchParams.get("next")
  const helper = useMemo(() => {
    return "Admin: admin@hiretrain.ai / demo123. HR: hr@hiretrain.ai / demo123."
  }, [])

  const login = async () => {
    setError("")
    setLoading(true)
    if (password !== "demo123") {
      setLoading(false)
      setError("Invalid email or password.")
      return
    }

    const backendRole: BackendUserRole = email.toLowerCase().startsWith("admin") ? "ADMIN" : "HR_MANAGER"
    const role = backendRole === "ADMIN" ? "Admin" : "HR Manager"

    try {
      const session = await mockLogin(email, backendRole)
      window.localStorage.setItem("token", session.access_token)
      window.localStorage.setItem("mockAuthRole", session.user.role === "ADMIN" ? "Admin" : "HR Manager")
    } catch {
      window.localStorage.setItem("mockAuthRole", role)
    }

    setLoading(false)

    if (next) {
      router.push(next)
      return
    }
    router.push(role === "Admin" ? "/admin/users" : "/hr")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1fr_420px]">
        <section className="flex items-center px-6 py-10">
          <div className="max-w-xl">
            <Link href="/" className="mb-10 inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0033A0] text-white">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">HireTrain AI</p>
                <p className="text-sm text-muted-foreground">AI Recruitment System</p>
              </div>
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Recruitment operations console</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Login calls the backend mock-auth flow when available. Candidate pages remain public through invitation links.
              </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-semibold text-foreground">Admin flow</p>
                <p className="mt-1 text-sm text-muted-foreground">User access, security logs, account state changes.</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-semibold text-foreground">HR flow</p>
                <p className="mt-1 text-sm text-muted-foreground">Campaign setup, rubric, tests, leaderboard, reports.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center px-6 py-10">
          <Card className="w-full rounded-lg p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Login</h2>
              <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
            </div>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-9"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") login()
                    }}
                  />
                </div>
              </div>
              {error ? <FormMessage type="error">{error}</FormMessage> : null}
              <Button className="w-full bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={loading} onClick={login}>
                {loading ? "Checking..." : "Login"}
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
