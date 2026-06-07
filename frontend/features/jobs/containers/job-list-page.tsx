"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Banknote, Building2, CalendarDays, ChevronRight, MapPin, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatApiError, listPublicPositions } from "@/features/jobs/api/public-jobs-api"
import { CandidateHero } from "@/features/jobs/components/candidate-hero"
import { CandidateSiteHeader } from "@/features/jobs/components/candidate-site-header"
import { JobMeta } from "@/features/jobs/components/job-meta"
import { jobFromPosition } from "@/features/jobs/mappers/job-from-position"
import { shbJobs, type Job } from "@/lib/recruitment/public-data"

export function JobListPage() {
  const [query, setQuery] = useState("")
  const [jobs, setJobs] = useState<Job[]>(shbJobs)
  const [loading, setLoading] = useState(false)
  const [department, setDepartment] = useState("Tất cả")
  const [location, setLocation] = useState("Tất cả")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    listPublicPositions()
      .then((positions) => {
        if (!mounted) return
        const activeJobs = positions.filter((position) => position.status === "PUBLISHED").map(jobFromPosition)
        if (activeJobs.length > 0) {
          setJobs(activeJobs)
        }
      })
      .catch((error) => {
        if (mounted) {
          console.error(formatApiError(error), "Showing local demo jobs.")
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const departments = useMemo(() => ["Tất cả", ...Array.from(new Set(jobs.map((job) => job.department)))], [jobs])
  const locations = useMemo(() => ["Tất cả", ...Array.from(new Set(jobs.map((job) => job.location)))], [jobs])

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return jobs.filter((job) => {
      const matchesText =
        !normalizedQuery ||
        job.title.toLowerCase().includes(normalizedQuery) ||
        job.shortDescription.toLowerCase().includes(normalizedQuery)
      const matchesDepartment = department === "Tất cả" || job.department === department
      const matchesLocation = location === "Tất cả" || job.location === location
      return matchesText && matchesDepartment && matchesLocation
    })
  }, [department, jobs, location, query])

  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSiteHeader />
      <CandidateHero />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section id="open-jobs" className="-mt-16 rounded-lg border bg-white p-4 shadow-lg md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kiếm theo chức danh, kỹ năng..."
                className="pl-9"
              />
            </div>
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#c6203f]/30"
            >
              {departments.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#c6203f]/30"
            >
              {locations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <Button className="bg-[#c6203f] text-white hover:bg-[#a91935]">
              <Search className="mr-2 h-4 w-4" />
              Tìm kiếm
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Việc làm tiêu biểu</h2>
                <p className="mt-1 text-sm text-slate-500">{loading ? "Đang tải..." : `${filteredJobs.length} vị trí đang mở`}</p>
              </div>
              <Badge variant="outline" className="hidden border-[#f37021]/30 text-[#c6203f] sm:inline-flex">
                SHB Career
              </Badge>
            </div>

            {filteredJobs.map((job) => (
              <Card key={job.id} className="rounded-lg border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <Link href={`/jobs/${job.slug}`} className="text-xl font-bold text-slate-950 hover:text-[#c6203f]">
                      {job.title}
                    </Link>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{job.shortDescription}</p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                      <JobMeta icon={Building2} label={job.department} />
                      <JobMeta icon={MapPin} label={job.location} />
                      <JobMeta icon={CalendarDays} label={`Ngày hết hạn: ${job.deadline}`} />
                    </div>
                  </div>
                  <Link href={`/jobs/${job.slug}`} className="shrink-0">
                    <Button variant="outline" className="border-[#c6203f] text-[#c6203f] hover:bg-[#c6203f] hover:text-white">
                      Xem thêm
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <aside id="talent-network" className="space-y-4">
            <Card className="rounded-lg border-[#f37021]/25 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f37021]/10 text-[#f37021]">
                <Banknote className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-950">Gia nhập cùng SHB</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                SHB chú trọng phát triển con người, lộ trình nghề nghiệp rõ ràng và môi trường làm việc chuyên nghiệp.
              </p>
            </Card>
            <Card className="rounded-lg p-5">
              <h3 className="font-bold text-slate-950">Quy trình ứng tuyển</h3>
              <ol className="mt-4 space-y-3 text-sm text-slate-600">
                {["Nộp hồ sơ trực tuyến", "Nhận mật khẩu đăng nhập qua email", "Làm bài đánh giá năng lực", "Tham gia phỏng vấn AI"].map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#102a62] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  )
}
