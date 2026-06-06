import { readStorage, removeStorage, writeStorage } from "@/shared/storage/browser-storage"

export type MockRole = "Admin" | "HR Manager"

const TOKEN_KEY = "token"
const ROLE_KEY = "mockAuthRole"
const ACTIVE_CAMPAIGN_KEY = "activeCampaignId"

function local() {
  return typeof window === "undefined" ? undefined : window.localStorage
}

export function getAuthToken() {
  return readStorage(local(), TOKEN_KEY)
}

export function setAuthToken(token: string) {
  writeStorage(local(), TOKEN_KEY, token)
}

export function getMockRole() {
  return readStorage(local(), ROLE_KEY) as MockRole | null
}

export function setMockRole(role: MockRole) {
  writeStorage(local(), ROLE_KEY, role)
}

export function clearMockSession() {
  const storage = local()
  removeStorage(storage, TOKEN_KEY)
  removeStorage(storage, ROLE_KEY)
  removeStorage(storage, ACTIVE_CAMPAIGN_KEY)
}

export function getActiveCampaignId() {
  return readStorage(local(), ACTIVE_CAMPAIGN_KEY) ?? ""
}

export function setActiveCampaignId(campaignId: string) {
  writeStorage(local(), ACTIVE_CAMPAIGN_KEY, campaignId)
}

