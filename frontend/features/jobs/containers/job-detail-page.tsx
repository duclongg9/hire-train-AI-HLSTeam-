"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, MapPin, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatApiError, getPublicJob } from "@/features/jobs/api/public-jobs-api"
import { CandidateSiteHeader } from "@/features/jobs/components/candidate-site-header"
import { JobMeta } from "@/features/jobs/components/job-meta"
import { jobFromPosition } from "@/features/jobs/mappers/job-from-position"
import { looksLikeUuid } from "@/features/jobs/utils/job-routing"
import { getJobBySlug, type Job } from "@/lib/recruitment/public-data"

export function JobDetailPage({ jobSlug }: { jobSlug?: string }) {
  const [job, setJob] = useState<Job>(() => getJobBySlug(jobSlug))

  useEffect(() => {
    if (!looksLikeUuid(jobSlug)) {
      setJob(getJobBySlug(jobSlug))
      return
    }

    let mounted = true
    getPublicJob(jobSlug)
      .then((position) => {
        if (!mounted) return
        setJob(jobFromPosition(position))
      })
      .catch((error) => {
        if (mounted) {
          console.error(formatApiError(error, "Could not load public job."))
        }
      })

    return () => {
      mounted = false
    }
  }, [jobSlug])

  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#c6203f]">
          <ArrowLeft className="h-4 w-4" />
          Tất cả việc làm
        </Link>

        <section className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card className="rounded-lg border-transparent p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Đang tuyển</Badge>
              <h1 className="mb-6 mt-4 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">{job.title}</h1>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <JobMeta icon={MapPin} label={job.location} />
                <JobMeta icon={Building2} label={job.department} />
                <JobMeta icon={BriefcaseBusiness} label={job.type} />
                <JobMeta icon={CalendarDays} label={job.deadline} />
              </div>
            </Card>

            {[
              ["Mô tả công việc", job.responsibilities],
              ["Yêu cầu công việc", job.requirements],
              ["Quyền lợi", job.benefits],
              ["Thông tin khác", job.otherInfo],
            ].map(([title, items]) => (
              <Card key={String(title)} className="rounded-lg border-transparent p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <h2 className="text-xl font-bold text-slate-950">{String(title)}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {(items as string[]).map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f37021]/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Card className="rounded-lg border-transparent p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <h2 className="text-lg font-bold text-slate-950">Sẵn sàng ứng tuyển?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hoàn tất hồ sơ, tải CV và nhận thông tin đăng nhập ứng viên qua email.
              </p>
              <Link href={`/jobs/${job.slug}/apply`}>
                <Button className="mt-5 flex w-full items-center justify-center gap-2 bg-[#f37021] text-white hover:bg-[#d95f18]">
                  <span>Ứng tuyển</span>
                  <Send className="h-4 w-4" />
                </Button>
              </Link>
              <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-950">Hướng dẫn ứng tuyển</p>
                <p className="mt-2">Điền thông tin, tải CV, sau đó kiểm tra email để nhận mật khẩu đăng nhập.</p>
              </div>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  )
}
