"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, StatusPill } from "@/shared/components/recruitment-common"
import { inviteCandidateToInterview, inviteCandidateToTest } from "@/features/hr/api/hr-api"
import { candidateStatusTone, cvSummary } from "@/features/hr/mappers/candidate-mappers"
import type { Candidate } from "@/lib/recruitment/mock-data"

export function CandidateRankingTable({
  candidates,
  onViewMore,
  onQuickAction,
  busyAction,
}: {
  candidates: Candidate[]
  onViewMore: (candidate: Candidate) => void
  onQuickAction?: (candidate: Candidate, actionName: string, actionFn: () => Promise<string>) => void
  busyAction?: string | null
}) {
  if (candidates.length === 0) {
    return <EmptyState title="No candidates" description="Candidates will appear here after CV submission or backend scoring." />
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Candidate</TableHead>
            <TableHead>CV Summary</TableHead>
            <TableHead className="w-24">CV Score</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-28 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates
            .slice()
            .sort((a, b) => b.cvScore - a.cvScore)
            .map((candidate, index) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-semibold text-muted-foreground">#{index + 1}</TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground">{candidate.email}</p>
                </TableCell>
                <TableCell className="max-w-xl">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{cvSummary(candidate)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {candidate.matchedSkills.slice(0, 3).map((skill) => (
                      <StatusPill key={skill} tone="slate">
                        {skill}
                      </StatusPill>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-md bg-[#0033A0]/10 px-2 py-1 text-sm font-semibold text-[#0033A0]">
                    {candidate.cvScore}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusPill tone={candidateStatusTone(candidate.status)}>{candidate.status}</StatusPill>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {candidate.status === "CV Screening" && onQuickAction && (
                      <Button 
                        size="sm" 
                        className="bg-[#0033A0] text-white hover:bg-[#00256f]"
                        disabled={Boolean(busyAction)}
                        onClick={(event) => {
                          event.stopPropagation()
                          onQuickAction(candidate, "Invite test", async () => {
                            const link = await inviteCandidateToTest(candidate.id)
                            return `Đã gửi bài Test: ${link.url}`
                          })
                        }}
                      >
                        Gửi bài Test
                      </Button>
                    )}
                    {candidate.status === "Rejected" && onQuickAction && (
                      <Button 
                        size="sm" 
                        className="bg-[#c6203f] text-white hover:bg-[#a91935]"
                        disabled={Boolean(busyAction)}
                        onClick={(event) => {
                          event.stopPropagation()
                          onQuickAction(candidate, "Invite test", async () => {
                            const link = await inviteCandidateToTest(candidate.id)
                            return `Đã cứu ứng viên và chuyển vào Vòng 2: ${link.url}`
                          })
                        }}
                      >
                        Cứu ứng viên (Vòng 2)
                      </Button>
                    )}
                    {(candidate.status === "Test Sent" || candidate.status === "Interview") && onQuickAction && (
                      <Button 
                        size="sm" 
                        className="bg-[#0033A0] text-white hover:bg-[#00256f]"
                        disabled={Boolean(busyAction)}
                        onClick={(event) => {
                          event.stopPropagation()
                          onQuickAction(candidate, "Invite interview", async () => {
                            const link = await inviteCandidateToInterview(candidate.id)
                            return `Đã tạo phòng phỏng vấn: ${link.url}`
                          })
                        }}
                      >
                        Tạo phòng phỏng vấn ảo
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onViewMore(candidate)}>
                      {candidate.status === "CV Screening" || candidate.status === "Test Sent" || candidate.status === "Interview" ? "..." : "View more"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
