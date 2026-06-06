"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusPill } from "@/shared/components/recruitment-common"
import { PageHeader } from "@/shared/layout/page-header"
import { getRememberedCampaignId } from "@/features/hr/utils/campaign-storage"
import { candidates, type Candidate } from "@/lib/recruitment/mock-data"
import { cn } from "@/lib/utils"

export function CompareScreen() {
  const params = useParams<{ campaignId?: string }>()
  const searchParams = useSearchParams()
  const campaignId = params?.campaignId || getRememberedCampaignId()
  const positionId = searchParams.get("positionId") || window.localStorage.getItem("activePositionId") || ""
  const [selectedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return candidates.slice(0, 3).map((candidate) => candidate.id)
    }
    const stored = window.localStorage.getItem("compareCandidates")
    if (stored) {
      return JSON.parse(stored) as string[]
    }
    return candidates.slice(0, 3).map((candidate) => candidate.id)
  })

  const selectedCandidates = candidates.filter((candidate) => selectedIds.includes(candidate.id)).slice(0, 5)
  const visibleCandidates = selectedCandidates.length >= 2 ? selectedCandidates : candidates.slice(0, 3)
  const bestScore = Math.max(...visibleCandidates.map((candidate) => candidate.totalScore))

  const metricRows = [
    { label: "Total Score", key: "totalScore" as const },
    { label: "CV Score", key: "cvScore" as const },
    { label: "Test Score", key: "testScore" as const },
    { label: "Interview Score", key: "interviewScore" as const },
    { label: "Years of Experience", key: "yearsExperience" as const },
  ]

  const numericMax = (key: (typeof metricRows)[number]["key"]) => Math.max(...visibleCandidates.map((candidate) => Number(candidate[key])))

  return (
    <>
      <PageHeader title='Candidate Compare' subtitle='Side-by-side comparison for 2-5 selected candidates.' />
      <div className="space-y-4">
        <Link href={campaignId && positionId ? `/hr/campaigns/${campaignId}/leaderboard?positionId=${positionId}` : "/hr"}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leaderboard
          </Button>
        </Link>
        <Card className="overflow-x-auto rounded-lg p-4 shadow-sm">
          <div className="min-w-[860px]">
            <div className="grid" style={{ gridTemplateColumns: `190px repeat(${visibleCandidates.length}, minmax(190px, 1fr))` }}>
              <div className="border-b p-3 text-sm font-semibold text-muted-foreground">Candidate</div>
              {visibleCandidates.map((candidate) => (
                <div key={candidate.id} className="border-b p-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{candidate.name}</p>
                    {candidate.totalScore === bestScore ? <StatusPill tone="green">Recommended</StatusPill> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{candidate.email}</p>
                </div>
              ))}
              {metricRows.map((row) => {
                const max = numericMax(row.key)
                return (
                  <div key={row.label} className="contents">
                    <div className="border-b bg-slate-50 p-3 text-sm font-medium text-muted-foreground">{row.label}</div>
                    {visibleCandidates.map((candidate) => (
                      <div key={`${candidate.id}-${row.key}`} className={cn("border-b p-3 text-sm font-semibold", Number(candidate[row.key]) === max ? "bg-emerald-50 text-emerald-700" : "text-foreground")}>
                        {candidate[row.key]}
                      </div>
                    ))}
                  </div>
                )
              })}
              {[
                ["Key Skills", (candidate: Candidate) => candidate.matchedSkills.join(", ")],
                ["Missing Skills", (candidate: Candidate) => candidate.missingSkills.join(", ") || "None"],
                ["Salary Expectation", (candidate: Candidate) => candidate.salaryExpectation || "Not provided"],
                ["AI Recommendation", (candidate: Candidate) => candidate.aiRecommendation],
              ].map(([label, render]) => (
                <div key={String(label)} className="contents">
                  <div className="border-b bg-slate-50 p-3 text-sm font-medium text-muted-foreground">{String(label)}</div>
                  {visibleCandidates.map((candidate) => (
                    <div key={`${candidate.id}-${String(label)}`} className="border-b p-3 text-sm text-foreground">
                      {(render as (candidate: Candidate) => string)(candidate)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
