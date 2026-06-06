"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Filter, Mail, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormMessage } from "@/shared/components/recruitment-common"
import { SecurityAuthModal } from "@/shared/components/recruitment-modals"
import { PageHeader } from "@/shared/layout/page-header"
import { formatApiError, listCampaigns, listLeaderboard } from "@/features/hr/api/hr-api"
import { CandidateDrawer } from "@/features/hr/components/candidate-drawer"
import { CandidateRankingTable } from "@/features/hr/components/candidate-ranking-table"
import { mapBackendLeaderboardRow } from "@/features/hr/mappers/candidate-mappers"
import { getRememberedCampaignId, rememberActiveCampaign } from "@/features/hr/utils/campaign-storage"
import { ArrowLeft } from "lucide-react"
import { candidates, pipelineStages, sourceData, type Candidate, type CandidateStatus } from "@/lib/recruitment/mock-data"

export function LeaderboardScreen() {
  const params = useParams<{ campaignId?: string }>()
  const searchParams = useSearchParams()
  const campaignId = params?.campaignId || getRememberedCampaignId()
  const positionId = searchParams.get("positionId") || window.localStorage.getItem("activePositionId") || ""
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | CandidateStatus>("All")
  const [skillFilter, setSkillFilter] = useState("All")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [minScore, setMinScore] = useState("0")
  const [leaderboardCandidates, setLeaderboardCandidates] = useState<Candidate[]>(candidates)
  const [drawerCandidate, setDrawerCandidate] = useState<Candidate | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const handleQuickAction = async (candidate: Candidate, actionName: string, actionFn: () => Promise<string>) => {
    setBusyAction(actionName)
    setMessage("")
    try {
      const text = await actionFn()
      setMessage(text)
    } catch (error) {
      setMessage(formatApiError(error, `${actionName} failed.`))
    } finally {
      setBusyAction(null)
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        let nextCampaignId = campaignId
        if (!nextCampaignId) {
          const backendCampaigns = await listCampaigns()
          const activeCampaign = backendCampaigns.find((campaign) => campaign.status === "ACTIVE") ?? backendCampaigns[0]
          nextCampaignId = activeCampaign?.id ?? ""
        }
        if (!nextCampaignId) {
          if (mounted) setMessage("No backend campaign found. Using local demo leaderboard.")
          return
        }
        if (!positionId) {
          if (mounted) setMessage("Please select a position from the campaign details to view the leaderboard.")
          return
        }
        rememberActiveCampaign(nextCampaignId)
        const rows = await listLeaderboard(positionId)
        if (mounted) setLeaderboardCandidates(rows.map(mapBackendLeaderboardRow))
      } catch (error) {
        if (mounted) setMessage(`${formatApiError(error)} Using local demo leaderboard until the backend is running.`)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [campaignId])

  const skills = Array.from(new Set(leaderboardCandidates.flatMap((candidate) => candidate.matchedSkills)))
  const filtered = leaderboardCandidates.filter((candidate) => {
    const matchesSearch = `${candidate.name} ${candidate.email}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "All" || candidate.status === statusFilter
    const matchesSkill = skillFilter === "All" || candidate.matchedSkills.includes(skillFilter)
    const matchesSource = sourceFilter === "All" || candidate.source === sourceFilter
    const matchesScore = candidate.totalScore >= Number(minScore || 0)
    return matchesSearch && matchesStatus && matchesSkill && matchesSource && matchesScore
  })

  return (
    <>
      <PageHeader title='Candidate Leaderboard' subtitle='Review CV ranking summaries and open full candidate details when needed.' />
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href={campaignId ? `/hr/campaigns/${campaignId}` : "/hr/campaigns"}>
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại Campaign
            </Button>
          </Link>
        </div>
        {message ? <FormMessage type="success">{message}</FormMessage> : null}
        <Card className="rounded-lg p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Filters</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setAuthOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Result Emails
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name/email" className="pl-9" />
            </div>
            <Input value={minScore} onChange={(event) => setMinScore(event.target.value)} type="number" min={0} max={100} placeholder="Score range min" />
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All skills</SelectItem>
                {skills.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | CandidateStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All status</SelectItem>
                {pipelineStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All sources</SelectItem>
                {sourceData.map((source) => (
                  <SelectItem key={source.name} value={source.name}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="rounded-lg p-4 shadow-sm">
          <CandidateRankingTable candidates={filtered} onViewMore={setDrawerCandidate} onQuickAction={handleQuickAction} busyAction={busyAction} />
        </Card>
      </div>

      <CandidateDrawer candidate={drawerCandidate} onClose={() => setDrawerCandidate(null)} />
      <SecurityAuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onVerified={() => setMessage("Bulk result emails verified. Selective sending is handled by the backend bulk-email endpoint.")}
        onLocked={() => setMessage("Mock security log recorded for 3 failed verification attempts.")}
      />
    </>
  )
}
