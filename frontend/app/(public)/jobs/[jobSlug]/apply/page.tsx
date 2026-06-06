import { JobApplyPage } from "@/features/jobs/containers/job-apply-page"

export default async function ApplyPage({ params }: { params: Promise<{ jobSlug: string }> }) {
  const { jobSlug } = await params
  return <JobApplyPage jobSlug={jobSlug} />
}
