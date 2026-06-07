import { redirect } from "next/navigation"

export default async function PositionBasePage({ params }: { params: Promise<{ campaignId: string, positionId: string }> }) {
  const { campaignId, positionId } = await params
  redirect(`/hr/campaigns/${campaignId}/position/${positionId}/pipeline`)
}
