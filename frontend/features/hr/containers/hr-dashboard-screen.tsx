"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BarChart3, ClipboardCheck, FileText, Plus, Users } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FormMessage, StatCard, StatusPill } from "@/shared/components/recruitment-common"
import { PageHeader } from "@/shared/layout/page-header"
import { formatApiError, healthCheck, listCampaigns, listLeaderboard, type BackendCampaign } from "@/features/hr/api/hr-api"
import { CandidateDrawer } from "@/features/hr/components/candidate-drawer"
import { CandidateRankingTable } from "@/features/hr/components/candidate-ranking-table"
import { mapBackendLeaderboardRow } from "@/features/hr/mappers/candidate-mappers"
import { rememberActiveCampaign } from "@/features/hr/utils/campaign-storage"
import { candidates, campaigns, pipelineStages, sourceData, type Candidate } from "@/lib/recruitment/mock-data"

export function HrDashboardScreen() {
  const [dashboardCandidates, setDashboardCandidates] = useState<Candidate[]>(candidates)
  const [activeCampaignCount, setActiveCampaignCount] = useState(campaigns.length)
  const [activeCampaign, setActiveCampaign] = useState<BackendCampaign | null>(null)
  const [healthMessage, setHealthMessage] = useState("")
  const [drawerCandidate, setDrawerCandidate] = useState<Candidate | null>(null)

  useEffect(() => {
    let mounted = true
    healthCheck()
      .then((health) => {
        if (mounted) setHealthMessage(`Backend health: ${health.status} (${health.storage_provider}, AI: ${health.ai_provider}).`)
      })
      .catch((error) => {
        if (mounted) setHealthMessage(formatApiError(error, "Backend health check failed."))
      })
    listCampaigns()
      .then(async (backendCampaigns) => {
        if (!mounted || backendCampaigns.length === 0) {
          return
        }
        setActiveCampaignCount(backendCampaigns.filter((campaign) => campaign.status === "ACTIVE").length || backendCampaigns.length)
        const activeCampaign = backendCampaigns.find((campaign) => campaign.status === "ACTIVE") ?? backendCampaigns[0]
        setActiveCampaign(activeCampaign)
        rememberActiveCampaign(activeCampaign.id)
        const rows = await listLeaderboard(activeCampaign.id)
        if (mounted) {
          setDashboardCandidates(rows.map(mapBackendLeaderboardRow))
        }
      })
      .catch((error) => {
        // Ignoring error for now, demo data is loaded
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <>
      <PageHeader title='HR Recruitment Dashboard' subtitle='Single workspace for candidate ranking and hiring pipeline.' />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Candidates" value={dashboardCandidates.length} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Active Campaigns" value={activeCampaignCount} icon={<FileText className="h-5 w-5" />} tone="orange" />
          <StatCard label="CV Scored" value={dashboardCandidates.filter((candidate) => candidate.cvScore > 0).length} icon={<ClipboardCheck className="h-5 w-5" />} tone="green" />
          <StatCard label="In Interview" value={dashboardCandidates.filter((candidate) => candidate.status === "Interview").length} icon={<BarChart3 className="h-5 w-5" />} tone="slate" />
        </div>

        {healthMessage ? <FormMessage type={healthMessage.startsWith("Backend health: ok") ? "success" : "warning"}>{healthMessage}</FormMessage> : null}

        <div className="grid gap-6">
          <Card className="rounded-lg p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Candidate ranking</h2>
                <p className="text-sm text-muted-foreground">CV summary is shown in-table. Open details for the full CV review.</p>
              </div>
              <Link href="/hr/campaigns/new">
                <Button className="bg-[#F37021] text-white hover:bg-[#d95f18]">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </Link>
            </div>
            <CandidateRankingTable candidates={dashboardCandidates} onViewMore={setDrawerCandidate} />
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="rounded-lg p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">Recruitment pipeline</h2>
                <p className="text-sm text-muted-foreground">Candidate movement across the backend recruitment stages.</p>
              </div>
            </div>
            <div className="grid gap-3 overflow-x-auto lg:grid-cols-6">
              {pipelineStages.map((stage) => {
                const stageCandidates = dashboardCandidates.filter((candidate) => candidate.status === stage)
                return (
                  <div key={stage} className="min-w-60 rounded-lg border bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{stage}</p>
                      <span className="rounded-md bg-white px-2 py-1 text-xs text-muted-foreground">{stageCandidates.length}</span>
                    </div>
                    <div className="space-y-3">
                      {stageCandidates.length === 0 ? (
                        <div className="rounded-lg border border-dashed bg-white p-3 text-xs text-muted-foreground">No candidate</div>
                      ) : (
                        stageCandidates.map((candidate) => (
                          <div key={candidate.id} className="rounded-lg border bg-white p-3 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                                <p className="text-xs text-muted-foreground">{candidate.position}</p>
                              </div>
                              <span className="rounded-md bg-[#0033A0]/10 px-2 py-1 text-xs font-semibold text-[#0033A0]">
                                {candidate.totalScore}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {candidate.matchedSkills.slice(0, 2).map((skill) => (
                                <StatusPill key={skill} tone="slate">
                                  {skill}
                                </StatusPill>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold text-foreground">CV source mix</h2>
            <p className="text-sm text-muted-foreground">Sourcing distribution for the active campaign.</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={4}>
                    {sourceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {sourceData.map((source) => (
                <div key={source.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: source.fill }} />
                    {source.name}
                  </span>
                  <span className="font-semibold text-foreground">{source.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <CandidateDrawer candidate={drawerCandidate} onClose={() => setDrawerCandidate(null)} />
    </>
  )
}
