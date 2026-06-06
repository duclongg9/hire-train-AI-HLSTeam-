'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createDemoInterviewToken } from "@/components/simulation/demo-interview-token"
import { SimulationScreen } from "@/components/simulation/simulation-screen"

export default function InterviewRoomPage() {
  const router = useRouter()
  const params = useParams<{ interviewToken?: string | string[] }>()
  const interviewToken = Array.isArray(params.interviewToken) ? params.interviewToken[0] : params.interviewToken
  const [resolvedToken, setResolvedToken] = useState<string | undefined>(
    interviewToken && interviewToken !== "demo-token" ? interviewToken : undefined,
  )
  const [tokenError, setTokenError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!interviewToken) {
      setResolvedToken(undefined)
      setTokenError("Thiếu interview token.")
      return
    }

    if (interviewToken !== "demo-token") {
      setResolvedToken(interviewToken)
      setTokenError(null)
      return
    }

    setResolvedToken(undefined)
    setTokenError(null)

    createDemoInterviewToken()
      .then((token) => {
        if (!cancelled) setResolvedToken(token)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setTokenError(error instanceof Error ? error.message : "Không tạo được demo interview token.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [interviewToken])

  if (tokenError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Không mở được phòng phỏng vấn</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">{tokenError}</p>
        </div>
        <Button onClick={() => router.push("/candidate/interview/demo-token/waiting-room")}>Quay lại phòng chờ</Button>
      </div>
    )
  }

  if (!resolvedToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
        <div>
          <div className="mx-auto size-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          <p className="mt-4 text-sm font-medium text-slate-600">Đang tạo demo interview token...</p>
        </div>
      </div>
    )
  }

  return <SimulationScreen interviewToken={resolvedToken} onClose={() => router.push("/candidate/thank-you")} />
}
