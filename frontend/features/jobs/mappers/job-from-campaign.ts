import type { BackendCampaign } from "@/features/jobs/api/public-jobs-api"
import type { Job } from "@/lib/recruitment/public-data"

function formatDate(value: string | null) {
  if (!value) return "Rolling"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Rolling"
  return date.toLocaleDateString("vi-VN")
}

export function jobFromCampaign(campaign: BackendCampaign): Job {
  const jdLines = (campaign.jd_text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    id: campaign.id,
    slug: campaign.id,
    title: campaign.title,
    shortDescription: jdLines[0] ?? "Backend campaign is published and accepting candidate applications.",
    department: "Backend campaign",
    location: "To be confirmed",
    type: "Full-time",
    deadline: formatDate(campaign.deadline_at),
    quantity: 1,
    responsibilities: jdLines.slice(0, 4).length > 0 ? jdLines.slice(0, 4) : ["Review the job description configured by HR."],
    requirements: jdLines.slice(4, 8).length > 0 ? jdLines.slice(4, 8) : ["Submit a CV and valid email to continue the hiring flow."],
    benefits: ["AI-assisted screening", "Professional test invitation", "Structured interview process"],
    otherInfo: [`Campaign status: ${campaign.status}`, `Campaign ID: ${campaign.id}`],
  }
}
