"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileUp, LockKeyhole, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormMessage, UploadPanel } from "@/shared/components/recruitment-common"
import { formatApiError, getPublicJob, submitCandidateApplication } from "@/features/jobs/api/public-jobs-api"
import { CandidateSiteHeader } from "@/features/jobs/components/candidate-site-header"
import { jobFromPosition } from "@/features/jobs/mappers/job-from-position"
import { looksLikeUuid } from "@/features/jobs/utils/job-routing"
import { getJobBySlug, type CandidateApplication, type Job } from "@/lib/recruitment/public-data"

export function JobApplyPage({ jobSlug }: { jobSlug?: string }) {
  const router = useRouter()
  const initialJob = getJobBySlug(jobSlug)
  const [job, setJob] = useState<Job>(() => initialJob)
  const [form, setForm] = useState<CandidateApplication>({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: initialJob.title,
    workLocation: initialJob.location,
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success" | "warning"; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!looksLikeUuid(jobSlug)) {
      const demoJob = getJobBySlug(jobSlug)
      setJob(demoJob)
      setForm((current) => ({ ...current, jobTitle: demoJob.title, workLocation: demoJob.location }))
      return
    }

    let mounted = true
    getPublicJob(jobSlug)
      .then((position) => {
        if (!mounted) return
        const backendJob = jobFromPosition(position)
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
    if (!consent) {
      setMessage({ type: "error", text: "Bạn cần đồng ý với điều khoản thu thập dữ liệu để tiếp tục." })
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
              <div className="flex items-start gap-2 rounded-lg bg-[#0033A0]/5 p-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#0033A0] focus:ring-[#0033A0]"
                />
                <label htmlFor="consent" className="font-medium text-slate-700">
                  Tôi đồng ý cho HireTrain AI thu thập và xử lý dữ liệu sinh trắc học/hồ sơ cho mục đích tuyển dụng
                </label>
              </div>
              {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/candidate/login">
                  <Button variant="outline">
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    Đăng nhập
                  </Button>
                </Link>
                <Button className="bg-[#c6203f] text-white hover:bg-[#a91935]" disabled={submitting || !consent} onClick={submit}>
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
