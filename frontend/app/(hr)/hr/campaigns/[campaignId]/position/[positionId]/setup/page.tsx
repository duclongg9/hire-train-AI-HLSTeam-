"use client"

import { useParams } from "next/navigation"
import { PositionWizard } from "@/features/hr/containers/position-wizard"
import { PositionWorkspaceProvider } from "@/features/hr/providers/position-workspace-provider"

export default function PositionSetupPage() {
  const params = useParams<{ campaignId?: string, positionId?: string }>()
  const campaignId = params?.campaignId ?? ""
  const positionId = params?.positionId ?? ""

  return (
    <PositionWorkspaceProvider campaignId={campaignId} positionId={positionId}>
      <PositionWizard campaignId={campaignId} positionId={positionId} />
    </PositionWorkspaceProvider>
  )
}
