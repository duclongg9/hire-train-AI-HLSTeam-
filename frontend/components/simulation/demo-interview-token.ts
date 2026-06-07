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
      title: "Demo AWS Transcribe Interview",
      jd_text:
        "Demo interview campaign for testing voice transcription. The candidate should communicate clearly, answer customer support scenarios, and explain practical problem solving steps.",
    }),
    method: "POST",
  })

  const position = await requestJson<{ id: string }>(`/campaigns/${campaign.id}/positions`, {
    body: JSON.stringify({
      budget: "Demo",
      headcount: 1,
      jd_text:
        "We are hiring a support specialist who can communicate clearly, handle customer concerns, and explain resolutions in a structured voice interview.",
      title: "Demo Voice Interview Position",
    }),
    method: "POST",
  })

  await requestJson(`/positions/${position.id}/rubric`, {
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

  await requestJson(`/positions/${position.id}/test-questions`, {
    body: JSON.stringify({
      questions: Array.from({ length: 10 }, (_, index) => ({
        correct_option_id: "A",
        difficulty: index % 3 === 0 ? "hard" : "medium",
        explanation: "A structured and empathetic response is the strongest answer.",
        options: [
          { id: "A", text: "Acknowledge the issue, verify details, and define the next step." },
          { id: "B", text: "Ask the customer to open a new request." },
          { id: "C", text: "Close the case if the cause is unclear." },
          { id: "D", text: "Promise a fix before checking the facts." },
        ],
        order_index: index + 1,
        question_text: `Demo support scenario ${index + 1}: what is the best first response?`,
        question_type: "multiple_choice",
        skill_tag: "communication",
        status: "APPROVED",
      })),
    }),
    method: "PUT",
  })

  await requestJson(`/positions/${position.id}/interview-rubric`, {
    body: JSON.stringify({
      groups: [
        {
          criteria: [
            {
              criterion: "Clarity",
              description: "Answers are easy to understand and structured.",
              id: "clarity",
              index: 1,
              tone: "professional",
              weight: 50,
            },
            {
              criterion: "Customer empathy",
              description: "Shows empathy while keeping the conversation productive.",
              id: "empathy",
              index: 2,
              tone: "supportive",
              weight: 50,
            },
          ],
          expanded: true,
          id: "demo-interview",
          name: "Demo interview rubric",
        },
      ],
    }),
    method: "PUT",
  })

  await requestJson(`/positions/${position.id}/publish`, { method: "POST" })
  await requestJson(`/campaigns/${campaign.id}/publish`, { method: "POST" })

  const candidate = await requestJson<{ id: string }>(`/public/jobs/${position.id}/apply`, {
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
