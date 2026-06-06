import { getAuthToken } from "@/shared/auth/token-storage"

const DEFAULT_API_ORIGIN = ""

function normalizeApiOrigin(value?: string) {
  const raw = (value || DEFAULT_API_ORIGIN).replace(/\/$/, "")
  return raw.endsWith("/api") ? raw.slice(0, -4) : raw
}

export const API_ORIGIN = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL)
export const API_BASE_URL = `${API_ORIGIN}/api`

export interface ApiFieldError {
  field: string
  message: string
}

export class ApiError extends Error {
  status: number
  detail: unknown
  fieldErrors: ApiFieldError[]

  constructor(status: number, message: string, detail: unknown, fieldErrors: ApiFieldError[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
    this.fieldErrors = fieldErrors
  }
}

function isFormDataBody(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData
}

function fieldNameFromLoc(loc: unknown) {
  if (!Array.isArray(loc)) return "request"
  return loc.filter((part) => part !== "body").join(".") || "request"
}

function parseErrorDetail(detail: unknown, fallback: string) {
  if (typeof detail === "string") {
    return { message: detail, fieldErrors: [] as ApiFieldError[] }
  }

  if (Array.isArray(detail)) {
    const fieldErrors = detail.map((item) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
      return {
        field: fieldNameFromLoc(record.loc),
        message: typeof record.msg === "string" ? record.msg : "Invalid value.",
      }
    })
    return {
      message: fieldErrors.map((item) => `${item.field}: ${item.message}`).join("; ") || fallback,
      fieldErrors,
    }
  }

  if (detail && typeof detail === "object") {
    return { message: JSON.stringify(detail), fieldErrors: [] as ApiFieldError[] }
  }

  return { message: fallback, fieldErrors: [] as ApiFieldError[] }
}

export function formatApiError(error: unknown, fallback = "Backend request failed.") {
  if (error instanceof ApiError) {
    if (error.fieldErrors.length > 0) {
      return error.fieldErrors.map((item) => `${item.field}: ${item.message}`).join("; ")
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const body = init.body as BodyInit | null | undefined

  if (!isFormDataBody(body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const token = getAuthToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const fallback = `Backend request failed with ${response.status}.`
    let detail: unknown = undefined
    try {
      const body = (await response.json()) as { detail?: unknown }
      detail = body.detail
    } catch {
      detail = undefined
    }
    const parsed = parseErrorDetail(detail, fallback)
    throw new ApiError(response.status, parsed.message, detail, parsed.fieldErrors)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function healthCheck() {
  return fetch(`${API_ORIGIN}/health`).then(async (response) => {
    if (!response.ok) {
      throw new ApiError(response.status, `Backend health check failed with ${response.status}.`, undefined)
    }
    return response.json() as Promise<{
      status: string
      app_env: string
      storage_provider: string
      database_connected: boolean
      ai_provider: string
      interview_provider: string
      email_provider: string
    }>
  })
}

