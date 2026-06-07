import { JobDetailPage } from "@/features/jobs/containers/job-detail-page"

export default async function JobPage({ params }: { params: Promise<{ jobSlug: string }> }) {
  const { jobSlug } = await params
  return <JobDetailPage jobSlug={jobSlug} />
}
