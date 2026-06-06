"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FormMessage, ScoreBar, StatusPill } from "@/shared/components/recruitment-common"
import { finalDecision, formatApiError, inviteCandidateToInterview, inviteCandidateToTest, scorePositionCandidates } from "@/features/hr/api/hr-api"
import type { Candidate } from "@/lib/recruitment/mock-data"

export function CandidateDrawer({
  candidate,
  onClose,
}: {
  candidate: Candidate | null
  onClose: () => void
}) {
  const searchParams = useSearchParams()
  const positionId = searchParams.get("positionId") || window.localStorage.getItem("activePositionId") || ""
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)

  const runAction = async (actionName: string, action: () => Promise<string>) => {
    setBusyAction(actionName)
    setActionMessage(null)
    try {
      const text = await action()
      setActionMessage({ type: "success", text })
    } catch (error) {
      setActionMessage({ type: "error", text: formatApiError(error, `${actionName} failed.`) })
    } finally {
      setBusyAction(null)
    }
  }

  const requirePositionId = () => {
    if (!positionId) throw new Error("Missing position_id. Open this candidate from a position leaderboard route.")
    return positionId
  }

  return (
    <Sheet open={Boolean(candidate)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {candidate ? (
          <>
            <SheetHeader>
              <SheetTitle>{candidate.name}</SheetTitle>
              <SheetDescription>{candidate.email}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4">
              {actionMessage ? <FormMessage type={actionMessage.type}>{actionMessage.text}</FormMessage> : null}
              <div className="rounded-lg border bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">CV preview</p>
                <div className="mt-3 flex h-36 items-center justify-center rounded-lg border border-dashed bg-white text-sm text-muted-foreground">
                  PDF preview placeholder
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI reasoning</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {candidate.reasoning.map((line) => (
                    <li key={line} className="rounded-lg bg-slate-50 p-3">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-foreground">Strengths</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {candidate.strengths.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Weaknesses</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {candidate.weaknesses.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Risk flags</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate.riskFlags.length === 0 ? <StatusPill tone="green">No flags</StatusPill> : candidate.riskFlags.map((flag) => <StatusPill key={flag} tone="orange">{flag}</StatusPill>)}
                </div>
              </div>
              <div className="space-y-3">
                <ScoreBar label="CV Score" value={candidate.cvScore} />
                <ScoreBar label="Test Score" value={candidate.testScore} />
                <ScoreBar label="Interview Score" value={candidate.interviewScore} />
              </div>
            </div>
            <SheetFooter>
              <Button
                variant="outline"
                disabled={Boolean(busyAction)}
                onClick={() =>
                  runAction("Score CV", async () => {
                    const activePositionId = requirePositionId()
                    await scorePositionCandidates(activePositionId, candidate.id)
                    return "CV scoring requested for this candidate."
                  })
                }
              >
                {busyAction === "Score CV" ? "Scoring..." : "Score CV"}
              </Button>
              <Button
                variant="outline"
                disabled={Boolean(busyAction)}
                onClick={() =>
                  runAction("Invite test", async () => {
                    const link = await inviteCandidateToTest(candidate.id)
                    return `Test invitation created: ${link.url}`
                  })
                }
              >
                {busyAction === "Invite test" ? "Inviting..." : "Invite Test"}
              </Button>
              <Button
                className="bg-[#0033A0] text-white hover:bg-[#00256f]"
                disabled={Boolean(busyAction)}
                onClick={() =>
                  runAction("Invite interview", async () => {
                    const link = await inviteCandidateToInterview(candidate.id)
                    return `Interview invitation created: ${link.url}`
                  })
                }
              >
                {busyAction === "Invite interview" ? "Inviting..." : "Invite Interview"}
              </Button>
              <Button
                variant="outline"
                className="text-emerald-700"
                disabled={Boolean(busyAction)}
                onClick={() => runAction("Final pass", async () => {
                  await finalDecision(candidate.id, "PASSED", "Marked from HR leaderboard.")
                  return "Candidate marked as PASSED."
                })}
              >
                Pass
              </Button>
              <Button
                variant="outline"
                className="text-red-700"
                disabled={Boolean(busyAction)}
                onClick={() => runAction("Final reject", async () => {
                  await finalDecision(candidate.id, "REJECTED", "Marked from HR leaderboard.")
                  return "Candidate marked as REJECTED."
                })}
              >
                Reject
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
