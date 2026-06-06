export function rememberActiveCampaign(campaignId: string) {
  if (typeof window !== "undefined" && campaignId) {
    window.localStorage.setItem("activeCampaignId", campaignId)
  }
}

export function getRememberedCampaignId() {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem("activeCampaignId") ?? ""
}
