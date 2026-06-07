"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock,
  Camera,
  FileText,
  Headphones,
  Mail,
  Mic,
  Phone,
  Send,
  ShieldCheck,
  Timer,
  Volume2,
  Wifi,
} from "lucide-react"
import { CvErrorModal, NetworkWarningModal, NoiseWarningModal, TestTimeUpModal, VoiceConsentModal } from "@/shared/components/recruitment-modals"
import { EmptyState, FormMessage, StatusPill, UploadPanel } from "@/shared/components/recruitment-common"
import { publicJob, testQuestions, type TestQuestion } from "@/lib/recruitment/mock-data"
import {
  formatApiError,
  openCandidateTest,
  startCandidateTest,
  submitCandidateTest,
  type BackendTestQuestion,
} from "@/features/candidate/api/candidate-api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
}

type CandidateTestQuestion = TestQuestion & { optionIds: string[] }

const demoTestQuestions: CandidateTestQuestion[] = testQuestions.map((question) => ({
  ...question,
  optionIds: question.options,
}))

function backendOptionText(option: Record<string, unknown>, index: number) {
  return String(option.text ?? option.label ?? option.value ?? option.id ?? `Option ${index + 1}`)
}

function backendOptionId(option: Record<string, unknown>, index: number) {
  return String(option.id ?? option.value ?? option.label ?? `option-${index + 1}`)
}

function mapBackendQuestion(question: BackendTestQuestion): CandidateTestQuestion {
  const options = question.options.length > 0 ? question.options.map(backendOptionText) : ["Option A", "Option B", "Option C", "Option D"]
  const optionIds = question.options.length > 0 ? question.options.map(backendOptionId) : options
  const correctIndex = optionIds.findIndex((optionId) => optionId === question.correct_option_id)
  return {
    id: question.id,
    question: question.question_text,
    options,
    optionIds,
    correctAnswer: options[correctIndex >= 0 ? correctIndex : 0] ?? options[0] ?? "",
    difficulty: question.difficulty === "Easy" || question.difficulty === "Hard" ? question.difficulty : "Medium",
    relatedSkill: question.skill_tag ?? "Backend test",
  }
}

export function JobLandingScreen() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="rounded-lg bg-[#17233A] p-8 text-white">
              <StatusPill tone="orange">Open role</StatusPill>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">{publicJob.title}</h1>
              <p className="mt-3 max-w-2xl text-white/70">{publicJob.description}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {publicJob.company}
                </span>
                <span>{publicJob.location}</span>
                <span>Deadline: {publicJob.deadline}</span>
              </div>
            </div>

            <Card className="rounded-lg p-5 shadow-sm">
              <h2 className="font-semibold text-foreground">Requirements</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {publicJob.requirements.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="rounded-lg p-5 shadow-sm">
              <h2 className="font-semibold text-foreground">Benefits</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {publicJob.benefits.map((item) => (
                  <div key={item} className="rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="rounded-lg p-5 shadow-sm">
              <h2 className="font-semibold text-foreground">Company info</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                HireTrain AI builds AI-assisted recruitment and voice interview experiences for modern HR teams.
              </p>
              <Link href={`/jobs/${publicJob.slug}/apply`}>
                <Button className="mt-5 w-full bg-[#F37021] text-white hover:bg-[#d95f18]">
                  Apply Now
                </Button>
              </Link>
            </Card>
            <Card className="rounded-lg p-5 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Next steps</p>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>1. Submit CV</li>
                <li>2. Complete professional test</li>
                <li>3. Join AI voice interview</li>
              </ol>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  )
}

export function ApplyScreen() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [errorOpen, setErrorOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = () => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    const phoneValid = /^[0-9+\-\s()]{8,}$/.test(form.phone)
    const validFile = file && [".pdf", ".doc", ".docx"].some((extension) => file.name.toLowerCase().endsWith(extension))
    let nextError = ""

    if (!form.name || !form.email || !form.phone || !file) nextError = "Missing required fields."
    else if (!emailValid) nextError = "Invalid email format."
    else if (!phoneValid) nextError = "Invalid phone format."
    else if (form.email.toLowerCase() === "duplicate@example.com") nextError = "Duplicate email."
    else if (!validFile) nextError = "Invalid file format."
    else if (file.size > 10 * 1024 * 1024) nextError = "File size exceeds 10MB."

    setError(nextError)
    if (nextError) {
      setErrorOpen(true)
      return
    }

    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      router.push(`/jobs/${publicJob.slug}/thank-you`)
    }, 650)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href={`/jobs/${publicJob.slug}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to job
        </Link>
        <Card className="rounded-lg p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Apply for {publicJob.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Public candidate form. No login required.</p>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="duplicate@example.com demos duplicate" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </div>
            </div>
            <UploadPanel
              title="Upload CV"
              description="PDF, DOC, DOCX. Maximum 10MB."
              accept=".pdf,.doc,.docx"
              fileName={file?.name}
              onChange={setFile}
            />
            <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={loading} onClick={submit}>
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </Card>
      </main>
      <CvErrorModal open={errorOpen} error={error || "Please check your information."} onFix={() => setErrorOpen(false)} />
    </div>
  )
}

export function ThankYouScreen() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex max-w-3xl items-center px-4 py-16 sm:px-6">
        <Card className="w-full rounded-lg p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-foreground">Application submitted</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Thank you for applying. Check your email for the professional test link and interview instructions.
          </p>
          <div className="mx-auto mt-6 grid max-w-lg gap-3 text-left sm:grid-cols-3">
            {["CV screening", "Professional test", "AI interview"].map((step) => (
              <div key={step} className="rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground">
                {step}
              </div>
            ))}
          </div>
          <Link href={`/jobs/${publicJob.slug}`}>
            <Button className="mt-6 bg-[#0033A0] text-white hover:bg-[#00256f]">Back to Job Page</Button>
          </Link>
        </Card>
      </main>
    </div>
  )
}

export function CandidateTestScreen() {
  const params = useParams<{ testToken?: string }>()
  const testToken = params?.testToken ?? ""
  const [current, setCurrent] = useState(0)
  const [questions, setQuestions] = useState<CandidateTestQuestion[]>(demoTestQuestions)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [durationSeconds, setDurationSeconds] = useState(15 * 60)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timeUpOpen, setTimeUpOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)

  useEffect(() => {
    if (!testToken || testToken === "demo-token") {
      return
    }

    let mounted = true
    openCandidateTest(testToken)
      .then(async (test) => {
        if (!mounted) return
        const mappedQuestions = test.questions.map(mapBackendQuestion)
        setQuestions(mappedQuestions.length > 0 ? mappedQuestions : demoTestQuestions)
        setTimeLeft(test.duration_seconds)
        setDurationSeconds(test.duration_seconds)
        try {
          await startCandidateTest(testToken)
        } catch {
          // Opening the test is enough for display; start errors are surfaced when submit fails.
        }
      })
      .catch((error) => {
        if (mounted) {
          console.error(formatApiError(error, "Could not open test token."))
        }
      })

    return () => {
      mounted = false
    }
  }, [testToken])

  useEffect(() => {
    if (submitted) return
    const interval = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(interval)
          setSubmitted(true)
          setTimeUpOpen(true)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [submitted])

  const question = questions[current] ?? questions[0]
  const answeredCount = Object.keys(answers).length

  const submit = async (autoSubmitted = false) => {
    if (!question) return
    if (!testToken || testToken === "demo-token") {
      setSubmitted(true)
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      await submitCandidateTest(testToken, {
        answers: Object.entries(answers).map(([question_id, selected_option_id]) => ({ question_id, selected_option_id })),
        auto_submitted: autoSubmitted,
        duration_seconds: durationSeconds - timeLeft,
      })
      setSubmitted(true)
      setMessage({ type: "success", text: "Test submitted to backend successfully." })
    } catch (error) {
      setMessage({ type: "error", text: formatApiError(error, "Could not submit test.") })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Professional Test</h1>
            <p className="text-sm text-muted-foreground">{answeredCount}/{questions.length} answered</p>
          </div>
          <div className={cn("inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xl font-bold", timeLeft <= 120 ? "bg-red-100 text-red-700" : "bg-white text-foreground")}>
            <Clock className="h-5 w-5" />
            {formatSeconds(timeLeft)}
          </div>
        </div>

        {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
        {submitted ? <FormMessage type="success">Test submitted. Answers are locked.</FormMessage> : null}

        <div className="mt-4 grid gap-6 lg:grid-cols-[220px_1fr]">
          <Card className="rounded-lg p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Question navigation</p>
            <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
              {questions.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={cn(
                    "h-9 rounded-md border text-sm font-semibold",
                    current === index ? "border-[#0033A0] bg-[#0033A0] text-white" : answers[item.id] ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-muted-foreground",
                  )}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <Progress className="mt-4" value={(answeredCount / Math.max(questions.length, 1)) * 100} />
          </Card>

          <Card className="rounded-lg p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusPill tone="blue">{question.relatedSkill}</StatusPill>
              <StatusPill tone={question.difficulty === "Hard" ? "red" : question.difficulty === "Medium" ? "orange" : "green"}>{question.difficulty}</StatusPill>
            </div>
            <h2 className="text-xl font-semibold text-foreground">{question.question}</h2>
            <div className="mt-5 grid gap-3">
              {question.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [question.id]: question.optionIds[index] ?? option })}
                  className={cn(
                    "rounded-lg border p-4 text-left text-sm transition",
                    answers[question.id] === (question.optionIds[index] ?? option) ? "border-[#0033A0] bg-blue-50 text-[#0033A0]" : "bg-white hover:border-[#0033A0]",
                    submitted && "cursor-not-allowed opacity-75",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>
                Previous
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setTimeLeft(1)} disabled={submitted}>
                  Simulate Time Up
                </Button>
                <Button variant="outline" onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1}>
                  Next
                </Button>
                <Button className="bg-[#F37021] text-white hover:bg-[#d95f18]" disabled={submitted || submitting} onClick={() => submit(false)}>
                  {submitting ? "Submitting..." : "Submit Test"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <TestTimeUpModal open={timeUpOpen} onClose={() => setTimeUpOpen(false)} />
    </div>
  )
}

export function WaitingRoomScreen() {
  const router = useRouter()
  const params = useParams<{ interviewToken?: string }>()
  const interviewToken = params?.interviewToken ?? "demo-token"
  
  const [candidateEmail, setCandidateEmail] = useState("Ứng viên")
  const [consentOpen, setConsentOpen] = useState(false)
  const [consentGranted, setConsentGranted] = useState(false)
  
  // Checklist statuses
  const [networkStatus, setNetworkStatus] = useState<"idle" | "checking" | "success" | "failed">("idle")
  const [cameraStatus, setCameraStatus] = useState<"idle" | "checking" | "success" | "failed">("idle")
  const [micStatus, setMicStatus] = useState<"idle" | "checking" | "success" | "failed">("idle")
  
  // Audio Visualizer bars
  const [audioLevel, setAudioLevel] = useState<number[]>([10, 10, 10, 10, 10])

  useEffect(() => {
    const email = window.localStorage.getItem("candidateEmail")
    if (email) setCandidateEmail(email)

    const granted = window.sessionStorage.getItem("voiceConsentGranted") === "true"
    setConsentGranted(granted)
    if (!granted) setConsentOpen(true)
  }, [])

  // Auto-run checks when status becomes "checking"
  useEffect(() => {
    if (networkStatus === "checking") {
      const t1 = setTimeout(() => setNetworkStatus("success"), 1500)
      return () => clearTimeout(t1)
    }
  }, [networkStatus])

  useEffect(() => {
    if (cameraStatus === "checking") {
      const t2 = setTimeout(() => setCameraStatus("success"), 2500)
      return () => clearTimeout(t2)
    }
  }, [cameraStatus])

  // Trigger initial checks on mount
  useEffect(() => {
    setNetworkStatus("checking")
    setCameraStatus("checking")
  }, [])

  const runMicTest = () => {
    if (!consentGranted) {
      setConsentOpen(true)
      return
    }
    setMicStatus("checking")
    
    // Simulate audio visualizer
    let ticks = 0
    const interval = setInterval(() => {
      ticks++
      setAudioLevel(Array.from({length: 5}, () => Math.floor(Math.random() * 80) + 10))
      if (ticks > 25) {
        clearInterval(interval)
        setAudioLevel([10, 10, 10, 10, 10])
        setMicStatus("success")
      }
    }, 150)
  }

  const acceptConsent = () => {
    window.sessionStorage.setItem("voiceConsentGranted", "true")
    setConsentGranted(true)
    setConsentOpen(false)
  }

  const isAllPassed = consentGranted && networkStatus === "success" && cameraStatus === "success" && micStatus === "success"

  return (
    <div className="min-h-screen bg-slate-50 font-[var(--font-inter)]">
      {/* Header Branding */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img alt="SHB Logo" src="/Logo-SHB-EN.png" className="h-8 w-auto object-contain bg-transparent" />
            <div className="h-6 w-px bg-slate-200"></div>
            <h1 className="font-semibold text-slate-800 font-[var(--font-be-vietnam-pro)]">HireTrain AI Platform</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          
          {/* Left Column: Context & Identity */}
          <section className="space-y-6">
            <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
              <div className="bg-[#004C97] p-6 text-white">
                <p className="text-sm text-blue-100 mb-1">Chuẩn bị phỏng vấn</p>
                <h2 className="text-2xl font-bold font-[var(--font-be-vietnam-pro)]">Xin chào, {candidateEmail.split("@")[0]} 👋</h2>
              </div>
              <div className="p-6 space-y-5 bg-white">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Vị trí ứng tuyển</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#F37021]" /> Frontend Developer (Senior)
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Hình thức</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-[#F37021]" /> Phỏng vấn bằng giọng nói (Voice AI)
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Thời lượng dự kiến</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <Timer className="h-4 w-4 text-[#F37021]" /> 30 Phút
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    Vui lòng hoàn thành bài kiểm tra kỹ thuật bên cạnh trước khi có thể bắt đầu phiên phỏng vấn.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-[#F37021]/30 bg-[#F37021]/5 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-[#F37021] shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Bảo mật thông tin</p>
                  <p className="mt-1 text-xs text-slate-600">Hình ảnh và âm thanh của bạn được mã hóa 2 chiều và chỉ lưu trữ nhằm mục đích tuyển dụng.</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Right Column: Technical Prep */}
          <section className="space-y-6">
            <Card className="rounded-xl border-slate-200 p-6 shadow-sm bg-white">
              <h2 className="text-xl font-bold text-slate-900 mb-6 font-[var(--font-be-vietnam-pro)]">Kiểm tra Kỹ thuật & Thiết bị</h2>
              
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                {/* Camera Preview */}
                <div>
                  <p className="font-semibold text-slate-800 mb-3 text-sm">1. Camera Preview</p>
                  <div className="relative aspect-video rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner">
                    {cameraStatus === "success" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Mock user face outline */}
                        <div className="h-24 w-20 border-2 border-emerald-400 border-dashed rounded-[40%] opacity-50 relative">
                          <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-t-[40%] animate-pulse"></div>
                        </div>
                        <p className="text-emerald-400 text-xs mt-3 font-mono">Camera Active</p>
                      </div>
                    ) : cameraStatus === "checking" ? (
                      <div className="text-slate-400 flex flex-col items-center">
                        <Camera className="h-8 w-8 mb-2 animate-pulse" />
                        <span className="text-xs font-mono">Connecting...</span>
                      </div>
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center">
                        <Camera className="h-8 w-8 mb-2" />
                        <span className="text-xs font-mono">Camera Off</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mic Visualizer */}
                <div>
                  <p className="font-semibold text-slate-800 mb-3 text-sm">2. Microphone & Tiếng ồn</p>
                  <div className="relative aspect-video rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-200">
                    <div className="flex items-end gap-1.5 h-16 mb-4">
                      {audioLevel.map((height, i) => (
                        <div 
                          key={i} 
                          className={cn("w-3 rounded-t-sm transition-all duration-100 ease-in", micStatus === "checking" ? "bg-[#004C97]" : "bg-slate-300")}
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                    {micStatus === "success" ? (
                      <p className="text-emerald-600 text-xs font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Âm thanh rõ, không có ồn</p>
                    ) : micStatus === "checking" ? (
                      <p className="text-[#004C97] text-xs font-medium animate-pulse">Vui lòng nói "Alo, 1 2 3"...</p>
                    ) : (
                      <p className="text-slate-500 text-xs">Nhấn nút bên dưới để thử Mic</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-4 mb-8">
                {/* Network */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Wifi className={cn("h-5 w-5", networkStatus === "success" ? "text-emerald-600" : "text-slate-400")} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Kết nối mạng</p>
                      <p className="text-xs text-slate-500">Ping & băng thông</p>
                    </div>
                  </div>
                  <div>
                    {networkStatus === "success" ? (
                      <StatusPill tone="green">Ổn định</StatusPill>
                    ) : networkStatus === "checking" ? (
                      <StatusPill tone="orange">Đang kiểm tra...</StatusPill>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setNetworkStatus("checking")}>Thử lại</Button>
                    )}
                  </div>
                </div>

                {/* Camera */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Camera className={cn("h-5 w-5", cameraStatus === "success" ? "text-emerald-600" : "text-slate-400")} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Truy cập Camera</p>
                      <p className="text-xs text-slate-500">Ghi hình chống gian lận</p>
                    </div>
                  </div>
                  <div>
                    {cameraStatus === "success" ? (
                      <StatusPill tone="green">Đã kết nối</StatusPill>
                    ) : cameraStatus === "checking" ? (
                      <StatusPill tone="orange">Đang kết nối...</StatusPill>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setCameraStatus("checking")}>Thử lại</Button>
                    )}
                  </div>
                </div>

                {/* Microphone */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Mic className={cn("h-5 w-5", micStatus === "success" ? "text-emerald-600" : "text-slate-400")} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Microphone & Tiếng ồn</p>
                      <p className="text-xs text-slate-500">Đảm bảo AI nghe rõ giọng bạn</p>
                    </div>
                  </div>
                  <div>
                    {micStatus === "success" ? (
                      <StatusPill tone="green">Hoàn hảo</StatusPill>
                    ) : micStatus === "checking" ? (
                      <StatusPill tone="orange">Đang nghe...</StatusPill>
                    ) : (
                      <Button variant="outline" size="sm" className="bg-white border-[#004C97] text-[#004C97] hover:bg-blue-50" onClick={runMicTest}>Kiểm tra Mic</Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions & Error Handling */}
              <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                <a href="#" className="text-sm font-medium text-[#004C97] hover:underline flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Gặp sự cố? Xem hướng dẫn
                </a>
                <Button 
                  className="w-full md:w-auto bg-[#004C97] px-8 text-white hover:bg-[#003875] transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  disabled={!isAllPassed} 
                  onClick={() => router.push(`/candidate/interview/${interviewToken}/room`)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Bắt đầu Phỏng vấn
                </Button>
              </div>

            </Card>
          </section>
        </div>
      </main>
      <VoiceConsentModal open={consentOpen} onOpenChange={setConsentOpen} onConsent={acceptConsent} />
    </div>
  )
}

type InterviewRoomState = "listening" | "ai-speaking" | "candidate-speaking" | "completed" | "failed"
type InterviewLiveState = Exclude<InterviewRoomState, "completed" | "failed">

export function InterviewRoomScreen() {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [state, setState] = useState<InterviewRoomState>("listening")
  const [networkOpen, setNetworkOpen] = useState(false)
  const [noiseOpen, setNoiseOpen] = useState(false)
  const [reminderDismissed, setReminderDismissed] = useState(false)
  
  const [transcript, setTranscript] = useState([
    { speaker: "AI", text: "Walk me through a frontend decision where quality changed the outcome." },
    { speaker: "Candidate", text: "I balanced performance, validation, and scanning speed for recruiters." },
    { speaker: "AI", text: "What tradeoff did you reject?" },
  ])
  const [candidateDraft, setCandidateDraft] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (state === "completed" || state === "failed") return
    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [state])

  useEffect(() => {
    if (state === "completed" || state === "failed" || isEditing) return
    const states: InterviewLiveState[] = ["listening", "ai-speaking", "candidate-speaking"]
    const interval = window.setInterval(() => {
      setState((current) => {
        if (current === "completed" || current === "failed") return current
        return states[(states.indexOf(current) + 1) % states.length] ?? "listening"
      })
    }, 4500)
    return () => window.clearInterval(interval)
  }, [state, isEditing])

  const showReminder = timeLeft <= 120 && !reminderDismissed && state !== "completed" && state !== "failed"

  if (state === "completed" || state === "failed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <Card className="max-w-lg rounded-lg border-white/10 bg-white/5 p-8 text-center text-white">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
          <h1 className="mt-5 text-3xl font-bold">{state === "completed" ? "Interview completed" : "Interview failed"}</h1>
          <p className="mt-2 text-white/60">
            {state === "completed" ? "Your responses were saved in the mock session." : "The reconnect window ended before the call recovered."}
          </p>
          <Link href="/candidate/thank-you">
            <Button className="mt-6 bg-[#F37021] text-white hover:bg-[#d95f18]">Close</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {showReminder ? (
        <div className="animate-pulse bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white">
          Interview time reminder: 2 minutes remaining.
          <button type="button" className="ml-4 underline" onClick={() => setReminderDismissed(true)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/50">AI Voice Interview</p>
            <h1 className="text-2xl font-bold">Senior Frontend Engineer</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-mono text-xl font-bold">
            <Timer className="h-5 w-5" />
            {formatSeconds(timeLeft)}
          </div>
        </header>

        <section className="grid flex-1 place-items-center py-10">
          <div className="text-center">
            <div className={cn("relative mx-auto flex h-64 w-64 items-center justify-center rounded-full border border-white/10", state === "ai-speaking" ? "bg-blue-500/10" : state === "candidate-speaking" ? "bg-[#F37021]/10" : "bg-white/5")}>
              <div className="absolute inset-8 animate-ping rounded-full border border-white/20" />
              <div className="absolute inset-14 animate-pulse rounded-full border border-white/20" />
              <div className="flex items-end gap-1">
                {Array.from({ length: 24 }).map((_, index) => (
                  <span
                    key={index}
                    className={cn("w-1.5 rounded-full", state === "ai-speaking" ? "bg-blue-300" : state === "candidate-speaking" ? "bg-[#F37021]" : "bg-white/30")}
                    style={{ height: `${18 + ((index * 13) % 54)}px` }}
                  />
                ))}
              </div>
            </div>
            <p className="mt-8 text-2xl font-semibold">
              {state === "listening" ? "AI is listening" : state === "ai-speaking" ? "AI is speaking" : "Candidate speaking"}
            </p>
            <p className="mt-2 text-white/50">Live transcript is updating from mock voice events.</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Card className="rounded-lg border-white/10 bg-white/5 p-4 text-white flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">Live transcript</h2>
            </div>
            <div className="space-y-2 text-sm text-white/70 flex-1 overflow-y-auto">
              {transcript.map((t, i) => (
                <p key={i}><span className={t.speaker === "AI" ? "text-blue-300 font-medium" : "text-[#F37021] font-medium"}>{t.speaker}:</span> {t.text}</p>
              ))}
              
              
            </div>
          </Card>
          <Card className="rounded-lg border-white/10 bg-white/5 p-4 text-white">
            <div className="grid gap-2">
              <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setNetworkOpen(true)}>
                <Wifi className="mr-2 h-4 w-4" />
                Network
              </Button>
              <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setNoiseOpen(true)}>
                <Volume2 className="mr-2 h-4 w-4" />
                Noise
              </Button>
              <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setTimeLeft(120)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                2 min
              </Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => router.push("/candidate/thank-you")}>
                End Interview
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <NetworkWarningModal open={networkOpen} onRetry={() => setNetworkOpen(false)} onFail={() => setState("failed")} />
      <NoiseWarningModal open={noiseOpen} onClose={() => setNoiseOpen(false)} />
    </div>
  )
}
