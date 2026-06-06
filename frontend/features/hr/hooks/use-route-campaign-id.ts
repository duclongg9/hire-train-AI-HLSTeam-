"use client"

import { useParams } from "next/navigation"

export function useRouteCampaignId() {
  const params = useParams<{ campaignId?: string }>()
  return params?.campaignId ?? ""
}
