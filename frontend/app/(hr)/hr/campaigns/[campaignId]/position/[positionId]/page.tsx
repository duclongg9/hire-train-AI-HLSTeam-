import { redirect } from "next/navigation"

export default function PositionBasePage({ params }: { params: { campaignId: string, positionId: string } }) {
  redirect(`/hr/campaigns/${params.campaignId}/position/${params.positionId}/pipeline`)
}
