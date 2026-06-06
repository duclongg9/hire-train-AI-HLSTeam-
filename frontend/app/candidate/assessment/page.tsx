"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, FileQuestion, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createCandidateQuicktestSession, formatApiError } from "@/lib/recruitment/api"

function isUuid(value: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

export default function AssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const openQuicktest = async () => {
    setLoading(true)
    setError("")
    try {
      const email = typeof window !== "undefined" ? window.localStorage.getItem("candidateEmail") : null
      const activeCampaignId = typeof window !== "undefined" ? window.localStorage.getItem("activeCampaignId") : null
      const campaignId = isUuid(activeCampaignId) ? activeCampaignId : null
      const session = await createCandidateQuicktestSession(email, campaignId)
      router.replace(`/candidate/test/${session.token}`)
    } catch (err) {
      setError(formatApiError(err, "Could not create Quicktest session."))
      setLoading(false)
    }
  }

  useEffect(() => {
    void openQuicktest()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full rounded-lg p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-[#0033A0] text-white">
              {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <FileQuestion className="h-7 w-7" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#0033A0]">Round 2 - Quicktest</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">Preparing your banking skills test</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The system is creating your Quicktest session from the questions published by HR. The test records your answers, scores the attempt, and saves the result for HR review.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-white p-3 text-sm">
                  <FileQuestion className="mb-2 h-5 w-5 text-[#0033A0]" />
                  Published question bank
                </div>
                <div className="rounded-lg border bg-white p-3 text-sm">
                  <ShieldCheck className="mb-2 h-5 w-5 text-emerald-700" />
                  Browser warnings
                </div>
                <div className="rounded-lg border bg-white p-3 text-sm">
                  <ArrowRight className="mb-2 h-5 w-5 text-[#F37021]" />
                  Saved DB result
                </div>
              </div>

              {error ? (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={loading} onClick={openQuicktest}>
                  {loading ? "Creating Quicktest session..." : "Retry Quicktest"}
                </Button>
                <p className="text-xs text-muted-foreground">You will be redirected automatically when the token is ready.</p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
