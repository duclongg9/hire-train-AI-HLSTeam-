"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileUp,
  LockKeyhole,
  Mail,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormMessage, UploadPanel } from "@/components/recruitment/common"
import { formatApiError, getPublicJob, listCampaigns, submitCandidateApplication, type BackendCampaign } from "@/lib/recruitment/api"
import {
  getJobBySlug,
  shbJobs,
  type CandidateApplication,
  type Job,
} from "@/lib/recruitment/public-data"
import { cn } from "@/lib/utils"

function looksLikeUuid(value?: string) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function formatDate(value: string | null) {
  if (!value) return "Rolling"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Rolling"
  return date.toLocaleDateString("vi-VN")
}

function jobFromCampaign(campaign: BackendCampaign): Job {
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

function CandidateSiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/jobs" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200">
            <img
              alt="SHB"
              className="h-7 w-7 object-contain"
              src="https://img.logokit.com/shb.com.vn"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-[#c6203f]">SHB Tuyển dụng</p>
            <p className="truncate text-xs font-medium text-slate-500">Nơi khởi nguồn khát vọng dẫn đầu</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/jobs" className="hover:text-[#c6203f]">
            Việc làm
          </Link>
          <a href="#talent-network" className="hover:text-[#c6203f]">
            Talent Network
          </a>
          <Link href="/candidate/login" className="hover:text-[#c6203f]">
            Đăng nhập
          </Link>
        </nav>
        <Link href="/candidate/login">
          <Button className="bg-[#f37021] text-white hover:bg-[#d95f18]">
            <UserRound className="mr-2 h-4 w-4" />
            Ứng viên
          </Button>
        </Link>
      </div>
    </header>
  )
}

function CandidateHero() {
  return (
    <section className="relative overflow-hidden bg-[#102a62] text-white">
      <img
        alt="SHB recruitment office"
        className="absolute inset-0 h-full w-full object-cover opacity-28"
        src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,42,98,0.95),rgba(16,42,98,0.74),rgba(198,32,63,0.52))]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:py-16">
        <div className="max-w-3xl">
          <Badge className="bg-white/15 text-white hover:bg-white/15">Cơ hội nghề nghiệp SHB</Badge>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Cùng SHB kiến tạo tương lai tài chính số
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/82">
            Khám phá các vị trí đang tuyển, nộp hồ sơ nhanh và tiếp tục quy trình đánh giá năng lực trực tuyến dành cho ứng viên.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#open-jobs">
              <Button className="bg-[#f37021] text-white hover:bg-[#d95f18]">Xem việc làm</Button>
            </a>
            <Link href="/candidate/login">
              <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                Đăng nhập ứng viên
              </Button>
            </Link>
          </div>
        </div>
        <Card className="rounded-lg border-white/20 bg-white/92 p-5 text-slate-900 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c6203f]">Talent Network là gì?</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Gia nhập mạng lưới nhân tài giúp bạn cập nhật việc làm mới, theo dõi hồ sơ và nhận thông báo từ đội ngũ tuyển dụng.
          </p>
          <div className="mt-5 grid gap-3 text-sm">
            {["Việc làm phù hợp theo năng lực", "Quy trình đánh giá minh bạch", "Thông báo kết quả qua email"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}

function JobMeta({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-[#c6203f]" />
      {label}
    </span>
  )
}

export function JobListPage() {
  const [query, setQuery] = useState("")
  const [jobs, setJobs] = useState<Job[]>(shbJobs)
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [department, setDepartment] = useState("Tất cả")
  const [location, setLocation] = useState("Tất cả")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    listCampaigns()
      .then((campaigns) => {
        if (!mounted) return
        const activeJobs = campaigns.filter((campaign) => campaign.status === "ACTIVE").map(jobFromCampaign)
        if (activeJobs.length > 0) {
          setJobs(activeJobs)
          setMessage({ type: "success", text: `Loaded ${activeJobs.length} published backend jobs.` })
        } else {
          setMessage({ type: "warning", text: "No published backend campaigns yet. Showing local demo jobs." })
        }
      })
      .catch((error) => {
        if (mounted) setMessage({ type: "warning", text: `${formatApiError(error)} Showing local demo jobs.` })
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
        {message ? (
          <div className="mb-4">
            <FormMessage type={message.type}>{message.text}</FormMessage>
          </div>
        ) : null}
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

export function JobDetailPage() {
  const params = useParams<{ jobSlug?: string }>()
  const jobSlug = params?.jobSlug
  const [job, setJob] = useState<Job>(() => getJobBySlug(jobSlug))
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)

  useEffect(() => {
    if (!looksLikeUuid(jobSlug)) {
      setJob(getJobBySlug(jobSlug))
      setMessage({ type: "warning", text: "This is a local demo job. Use a published backend campaign id in the URL for the live apply flow." })
      return
    }

    let mounted = true
    getPublicJob(jobSlug)
      .then((campaign) => {
        if (!mounted) return
        setJob(jobFromCampaign(campaign))
        setMessage({ type: "success", text: "Loaded public job from backend." })
      })
      .catch((error) => {
        if (mounted) setMessage({ type: "error", text: formatApiError(error, "Could not load public job.") })
      })

    return () => {
      mounted = false
    }
  }, [jobSlug])

  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {message ? <div className="mb-4"><FormMessage type={message.type}>{message.text}</FormMessage></div> : null}
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#c6203f]">
          <ArrowLeft className="h-4 w-4" />
          Tất cả việc làm
        </Link>

        <section className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card className="rounded-lg border-slate-200 p-6 shadow-sm">
              <Badge className="bg-[#c6203f] text-white hover:bg-[#c6203f]">Đang tuyển</Badge>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">{job.title}</h1>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <Card key={String(title)} className="rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">{String(title)}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {(items as string[]).map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="rounded-lg border-[#c6203f]/25 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Sẵn sàng ứng tuyển?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hoàn tất hồ sơ, tải CV và nhận thông tin đăng nhập ứng viên qua email.
              </p>
              <Link href={`/jobs/${job.slug}/apply`}>
                <Button className="mt-5 w-full bg-[#f37021] text-white hover:bg-[#d95f18]">
                  Ứng tuyển
                  <Send className="ml-2 h-4 w-4" />
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

export function JobApplyPage() {
  const router = useRouter()
  const params = useParams<{ jobSlug?: string }>()
  const jobSlug = params?.jobSlug
  const [job, setJob] = useState<Job>(() => getJobBySlug(jobSlug))
  const [form, setForm] = useState<CandidateApplication>({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: getJobBySlug(jobSlug).title,
    workLocation: getJobBySlug(jobSlug).location,
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: "error" | "success" | "warning"; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!looksLikeUuid(jobSlug)) {
      const demoJob = getJobBySlug(jobSlug)
      setJob(demoJob)
      setForm((current) => ({ ...current, jobTitle: demoJob.title, workLocation: demoJob.location }))
      setMessage({ type: "warning", text: "This is a local demo job. Apply with a published backend campaign id to submit to the API." })
      return
    }

    let mounted = true
    getPublicJob(jobSlug)
      .then((campaign) => {
        if (!mounted) return
        const backendJob = jobFromCampaign(campaign)
        setJob(backendJob)
        setForm((current) => ({ ...current, jobTitle: backendJob.title, workLocation: backendJob.location }))
        setMessage(null)
      })
      .catch((error) => {
        if (mounted) setMessage({ type: "error", text: formatApiError(error, "Could not load public job.") })
      })

    return () => {
      mounted = false
    }
  }, [jobSlug])

  const submit = async () => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !cvFile) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin bắt buộc và tải CV." })
      return
    }
    if (!emailValid) {
      setMessage({ type: "error", text: "Email chưa đúng định dạng." })
      return
    }
    if (![".pdf", ".doc", ".docx"].some((extension) => cvFile.name.toLowerCase().endsWith(extension))) {
      setMessage({ type: "error", text: "CV chỉ hỗ trợ PDF, DOC hoặc DOCX." })
      return
    }

    setSubmitting(true)
    setMessage(null)

    if (!looksLikeUuid(job.id)) {
      window.sessionStorage.setItem(
        "candidateApplyNotice",
        "Demo application captured locally. Publish a backend campaign to submit this form to the API.",
      )
      window.localStorage.setItem("candidateEmail", form.email)
      setSubmitting(false)
      router.push("/candidate/login?submitted=1")
      return
    }

    try {
      await submitCandidateApplication({
        campaignId: job.id,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        jobTitle: form.jobTitle,
        workLocation: form.workLocation,
        cvFileName: cvFile.name,
      })

      window.sessionStorage.setItem(
        "candidateApplyNotice",
        "Application submitted successfully. Check your email for the next recruitment step.",
      )
      window.localStorage.setItem("candidateEmail", form.email)
      router.push("/candidate/login?submitted=1")
    } catch (error) {
      setMessage({ type: "error", text: formatApiError(error, "Application failed.") })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href={`/jobs/${job.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#c6203f]">
          <ArrowLeft className="h-4 w-4" />
          Quay lại tin tuyển dụng
        </Link>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card className="rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-950">Ứng tuyển vị trí</h1>
            <p className="mt-1 text-sm text-slate-500">{job.title}</p>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Tên</Label>
                  <Input
                    id="first-name"
                    value={form.firstName}
                    onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                    placeholder="Ví dụ: An"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Họ đệm</Label>
                  <Input
                    id="last-name"
                    value={form.lastName}
                    onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="pl-9"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="job-title">Chức danh</Label>
                  <Input id="job-title" value={form.jobTitle} readOnly className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-location">Nơi làm việc</Label>
                  <Input id="work-location" value={form.workLocation} readOnly className="bg-slate-50" />
                </div>
              </div>
              <UploadPanel
                title="Tải CV của bạn"
                description="PDF, DOC, DOCX. Tối đa 10MB."
                accept=".pdf,.doc,.docx"
                fileName={cvFile?.name}
                onChange={setCvFile}
              />
              <Textarea placeholder="Ghi chú thêm cho nhà tuyển dụng nếu cần" className="min-h-24" />
              {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/candidate/login">
                  <Button variant="outline">
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    Đăng nhập
                  </Button>
                </Link>
                <Button className="bg-[#c6203f] text-white hover:bg-[#a91935]" disabled={submitting} onClick={submit}>
                  <FileUp className="mr-2 h-4 w-4" />
                  {submitting ? "Đang gửi..." : "Gửi hồ sơ"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="h-fit rounded-lg p-5 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-[#102a62]" />
            <h2 className="mt-3 font-bold text-slate-950">Bảo mật thông tin</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hồ sơ ứng viên chỉ dùng cho quy trình tuyển dụng. Mật khẩu đăng nhập sẽ được hệ thống gửi qua email sau khi nộp thành công.
            </p>
          </Card>
        </div>
      </main>
    </div>
  )
}

export function CandidateLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const notice =
    searchParams.get("submitted") === "1"
      ? "Hồ sơ đã được gửi thành công. Mật khẩu đăng nhập đã được gửi về email của bạn."
      : typeof window !== "undefined"
        ? window.sessionStorage.getItem("candidateApplyNotice")
        : null

  const login = () => {
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập email và mật khẩu.")
      return
    }
    window.localStorage.setItem("candidateEmail", email)
    window.sessionStorage.removeItem("candidateApplyNotice")
    router.push("/candidate/assessment")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSiteHeader />
      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px]">
        <section className="flex items-center">
          <div className="max-w-xl">
            <Badge className="bg-[#102a62] text-white hover:bg-[#102a62]">Cổng ứng viên</Badge>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
              Đăng nhập để tiếp tục bài đánh giá năng lực
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Sau khi đăng nhập thành công, ứng viên được chuyển thẳng đến bài assessment. Dashboard tiến độ cũ đã được bỏ qua để quy trình rõ ràng hơn.
            </p>
          </div>
        </section>
        <section className="flex items-center">
          <Card className="w-full rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Đăng nhập</h2>
            <p className="mt-1 text-sm text-slate-500">Dùng email và mật khẩu đã được gửi tới bạn.</p>
            <div className="mt-5 space-y-4">
              {notice ? <FormMessage type="success">{notice}</FormMessage> : null}
              <div className="space-y-2">
                <Label htmlFor="candidate-email">Email</Label>
                <Input id="candidate-email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate-password">Mật khẩu</Label>
                <Input
                  id="candidate-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") login()
                  }}
                />
              </div>
              {error ? <FormMessage type="error">{error}</FormMessage> : null}
              <Button className="w-full bg-[#c6203f] text-white hover:bg-[#a91935]" onClick={login}>
                Đăng nhập
              </Button>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button type="button" className="font-medium text-[#102a62] hover:underline">
                  Đổi mật khẩu
                </button>
                <button type="button" className="font-medium text-slate-500 hover:text-[#c6203f]">
                  Quên mật khẩu?
                </button>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  )
}

export function CandidateThankYouPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSiteHeader />
      <main className="mx-auto flex max-w-3xl items-center px-4 py-16 sm:px-6">
        <Card className="w-full rounded-lg border-emerald-200 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-slate-950">Cảm ơn bạn đã hoàn thành quy trình đánh giá.</h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            Bộ phận tuyển dụng sẽ liên hệ với bạn khi có kết quả phù hợp.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/jobs">
              <Button variant="outline">Xem việc làm khác</Button>
            </Link>
            <Link href="/candidate/login">
              <Button className="bg-[#102a62] text-white hover:bg-[#0b1d45]">Quay lại cổng ứng viên</Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  )
}
