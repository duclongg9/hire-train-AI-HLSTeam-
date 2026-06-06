import { API_BASE_URL } from "@/shared/api/client"

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  })

  if (!response.ok) {
    const fallback = `Backend request failed with ${response.status}.`
    try {
      const body = (await response.json()) as { detail?: unknown }
      throw new Error(typeof body.detail === "string" ? body.detail : fallback)
    } catch (error) {
      if (error instanceof Error && error.message !== "Unexpected end of JSON input") throw error
      throw new Error(fallback)
    }
  }

  return response.json() as Promise<T>
}

export async function createDemoInterviewToken() {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  const campaign = await requestJson<{ id: string }>("/campaigns", {
    body: JSON.stringify({
      created_by: suffix,
      description: "Local demo interview for AWS Transcribe testing.",
      jd_text: "AWS Transcribe, customer support, communication.",
      status: "DRAFT",
      title: "Demo AWS Transcribe Interview",
    }),
    method: "POST",
  })

  await requestJson(`/campaigns/${campaign.id}/rubric`, {
    body: JSON.stringify({
      criteria: [
        {
          category: "hard_skill",
          description: "Can answer clearly in a voice interview.",
          name: "Communication",
          weight: 100,
        },
      ],
    }),
    method: "PUT",
  })

  await requestJson(`/campaigns/${campaign.id}/publish`, { method: "POST" })

  const candidate = await requestJson<{ id: string }>(`/public/jobs/${campaign.id}/apply`, {
    body: JSON.stringify({
      cv_file_name: "demo.txt",
      cv_text: "Demo candidate for local AWS Transcribe testing.",
      email: `demo-${suffix.slice(0, 8)}@example.com`,
      full_name: "Demo Candidate",
      phone: "0900000000",
    }),
    method: "POST",
  })

  const invitation = await requestJson<{ token: string }>(`/candidates/${candidate.id}/invite-interview`, {
    method: "POST",
  })

  return invitation.token
}
