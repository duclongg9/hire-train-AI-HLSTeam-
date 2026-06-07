"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/shared/layout/page-header"
import { getRememberedCampaignId } from "@/features/hr/utils/campaign-storage"
import { candidates, interviewTranscript, radarData } from "@/lib/recruitment/mock-data"

export function InterviewReportScreen() {
  const params = useParams<{ campaignId?: string }>()
  const searchParams = useSearchParams()
  const campaignId = params?.campaignId || getRememberedCampaignId()
  const positionId = searchParams.get("positionId") || window.localStorage.getItem("activePositionId") || ""
  const candidate = candidates[0]

  return (
    <>
      <PageHeader title='Virtual Interview Report' subtitle='Transcript, competency radar chart, summary, recommendation, and evidence.' />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{candidate.name}</h2>
            <p className="text-sm text-muted-foreground">{candidate.position}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export Report</Button>
            <Link href={campaignId && positionId ? `/hr/campaigns/${campaignId}/leaderboard?positionId=${positionId}` : "/hr"}>
              <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]">Back to Candidate</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <Card className="rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-foreground">Interview transcript</h3>
            <div className="mt-4 space-y-3">
              {interviewTranscript.map((line) => (
                <div key={`${line.speaker}-${line.time}`} className="rounded-lg border bg-white p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0033A0]">{line.speaker}</span>
                    <span className="text-xs text-muted-foreground">{line.time}</span>
                  </div>
                  <p className="text-sm text-foreground">{line.text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-foreground">Competency radar</h3>
            <div className="mt-3 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                  <Radar dataKey="score" stroke="#0033A0" fill="#0033A0" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-lg p-4 shadow-sm lg:col-span-2">
            <h3 className="font-semibold text-foreground">AI summary</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Candidate communicates clearly, grounds technical decisions in product constraints, and can explain dashboard
              performance work with measurable outcomes. The main follow-up area is deeper GraphQL ownership.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {candidate.reasoning.map((reason) => (
                <div key={reason} className="rounded-lg bg-slate-50 p-3 text-sm text-muted-foreground">
                  {reason}
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-lg border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <h3 className="font-semibold text-emerald-800">Recommendation</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-700">Pass</p>
            <ul className="mt-4 space-y-2 text-sm text-emerald-800">
              <li>- Strong technical evidence</li>
              <li>- Clear communication under follow-up questions</li>
              <li>- Matches top rubric priorities</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
