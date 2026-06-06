import type { BackendPosition } from "@/shared/api/backend-types"
import type { Job } from "@/lib/recruitment/public-data"

export function jobFromPosition(position: BackendPosition): Job {
  const jdLines = (position.jd_text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    id: position.id,
    slug: position.id,
    title: position.title,
    shortDescription: jdLines[0] ?? "Backend position is published and accepting candidate applications.",
    department: "Backend position",
    location: "To be confirmed",
    type: "Full-time",
    deadline: "Rolling",
    quantity: position.headcount,
    responsibilities: jdLines.slice(0, 4).length > 0 ? jdLines.slice(0, 4) : ["Review the job description configured by HR."],
    requirements: jdLines.slice(4, 8).length > 0 ? jdLines.slice(4, 8) : ["Submit a CV and valid email to continue the hiring flow."],
    benefits: ["AI-assisted screening", "Professional test invitation", "Structured interview process"],
    otherInfo: [`Position status: ${position.status}`, `Position ID: ${position.id}`],
  }
}
