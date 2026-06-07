"use client"

import { useEffect, useRef, useState } from "react"
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
  const [questions, setQuestions] = useState<CandidateTestQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [durationSeconds, setDurationSeconds] = useState(15 * 60)
  const [loadingTest, setLoadingTest] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timeUpOpen, setTimeUpOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)
  const answersRef = useRef(answers)
  const questionsRef = useRef(questions)
  const timeLeftRef = useRef(timeLeft)
  const durationSecondsRef = useRef(durationSeconds)
  const submitRef = useRef<(autoSubmitted?: boolean) => Promise<void>>(async () => undefined)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    questionsRef.current = questions
  }, [questions])

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  useEffect(() => {
    durationSecondsRef.current = durationSeconds
  }, [durationSeconds])

  useEffect(() => {
    if (!testToken || testToken === "demo-token") {
      setQuestions(demoTestQuestions)
      setLoadingTest(false)
      return
    }

    let mounted = true
    setLoadingTest(true)
    setMessage(null)
    setAnswers({})
    setCurrent(0)
    openCandidateTest(testToken)
      .then(async (test) => {
        if (!mounted) return
        const mappedQuestions = test.questions.map(mapBackendQuestion)
        setQuestions(mappedQuestions)
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
          setQuestions([])
          setMessage({ type: "error", text: formatApiError(error, "Could not open test token.") })
        }
      })
      .finally(() => {
        if (mounted) setLoadingTest(false)
      })

    return () => {
      mounted = false
    }
  }, [testToken])

  const question = questions[current] ?? questions[0]
  const answeredCount = Object.keys(answers).length

  const submit = async (autoSubmitted = false) => {
    if (questionsRef.current.length === 0) return
    if (!testToken || testToken === "demo-token") {
      setSubmitted(true)
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      await submitCandidateTest(testToken, {
        answers: Object.entries(answersRef.current).map(([question_id, selected_option_id]) => ({ question_id, selected_option_id })),
        auto_submitted: autoSubmitted,
        duration_seconds: autoSubmitted ? durationSecondsRef.current : durationSecondsRef.current - timeLeftRef.current,
      })
      setSubmitted(true)
      setMessage({ type: "success", text: "Test submitted to backend successfully." })
    } catch (error) {
      setMessage({ type: "error", text: formatApiError(error, "Could not submit test.") })
    } finally {
      setSubmitting(false)
    }
  }
  submitRef.current = submit

  useEffect(() => {
    if (submitted || loadingTest || questions.length === 0) return
    const interval = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(interval)
          setTimeUpOpen(true)
          void submitRef.current(true)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [submitted, loadingTest, questions.length])

  if (loadingTest) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Card className="rounded-lg p-8 text-center shadow-sm">
            <Clock className="mx-auto h-8 w-8 animate-pulse text-[#0033A0]" />
            <h1 className="mt-4 text-2xl font-bold text-foreground">Loading test</h1>
            <p className="mt-2 text-sm text-muted-foreground">Fetching your candidate test from the backend.</p>
          </Card>
        </main>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
          <EmptyState title="No test questions" description="This test token is valid only when the backend returns published questions." />
        </main>
      </div>
    )
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
  const [micStatus, setMicStatus] = useState<"idle" | "checking" | "success" | "failed">("idle")
  const [consentOpen, setConsentOpen] = useState(false)
  const [consentGranted, setConsentGranted] = useState(false)

  useEffect(() => {
    const granted = window.sessionStorage.getItem("voiceConsentGranted") === "true"
    setConsentGranted(granted)
    setConsentOpen(!granted)
  }, [])

  const runMicTest = () => {
    if (!consentGranted) {
      setConsentOpen(true)
      return
    }
    setMicStatus("checking")
    window.setTimeout(() => {
      setMicStatus("success")
    }, 5000)
  }

  const acceptConsent = () => {
    window.sessionStorage.setItem("voiceConsentGranted", "true")
    setConsentGranted(true)
    setConsentOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Card className="rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">Waiting Room & Technical Check</h1>
          <p className="mt-1 text-sm text-muted-foreground">Complete the checklist before joining the voice AI interview.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              ["Browser permission", ShieldCheck],
              ["Camera access", Camera],
              ["Microphone access", Mic],
              ["Quiet environment", Headphones],
              ["Stable internet", Wifi],
            ].map(([label, Icon]) => {
              const TypedIcon = Icon as typeof ShieldCheck
              return (
                <div key={String(label)} className="flex items-center gap-3 rounded-lg border bg-slate-50 p-4">
                  <TypedIcon className="h-5 w-5 text-[#0033A0]" />
                  <span className="text-sm font-medium text-foreground">{String(label)}</span>
                  <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />
                </div>
              )
            })}
          </div>

          <div className="mt-6 rounded-lg border p-4">
            <div className="mb-4 rounded-lg border bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-foreground">Voice recording consent</p>
                  <p className="text-sm text-muted-foreground">Microphone checks and interview recording stay locked until consent is granted.</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={consentGranted ? "green" : "orange"}>{consentGranted ? "Consented" : "Required"}</StatusPill>
                  <Button variant="outline" onClick={() => setConsentOpen(true)}>
                    Review
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-foreground">Mic test</p>
                <p className="text-sm text-muted-foreground">Mock check runs for 5 seconds.</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill tone={micStatus === "success" ? "green" : micStatus === "failed" ? "red" : micStatus === "checking" ? "orange" : "slate"}>
                  {micStatus === "idle" ? "Not started" : micStatus}
                </StatusPill>
                <Button variant="outline" onClick={runMicTest} disabled={micStatus === "checking" || !consentGranted}>
                  {micStatus === "checking" ? "Checking..." : "Run Mic Test"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={!consentGranted || micStatus !== "success"} onClick={() => router.push(`/candidate/interview/${interviewToken}/room`)}>
              Start Interview
            </Button>
          </div>
        </Card>
      </main>
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {showReminder && (
        <div className="animate-pulse bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white">
          Interview time reminder: 2 minutes remaining.
          <button type="button" className="ml-4 underline" onClick={() => setReminderDismissed(true)}>
            Dismiss
          </button>
        </div>
      )}

      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
        <div>
          <p className="text-sm text-white/50">AI Voice Interview</p>
          <h1 className="text-xl font-bold">Senior Frontend Engineer</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-mono text-lg font-bold">
          <Timer className="h-5 w-5" />
          {formatSeconds(timeLeft)}
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        {/* LEFT PANEL: AI Visualization & Transcript */}
        <section className="flex flex-col border-r border-white/10 p-6 relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setNetworkOpen(true)}>
              <Wifi className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setNoiseOpen(true)}>
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setTimeLeft(120)}>
              <AlertTriangle className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-10 min-h-[300px]">
            <div className={cn("relative flex h-48 w-48 items-center justify-center rounded-full border border-white/10 transition-colors duration-500", state === "ai-speaking" ? "bg-blue-500/20" : state === "candidate-speaking" ? "bg-[#F37021]/20" : "bg-white/5")}>
              {state === "ai-speaking" && (
                <>
                  <div className="absolute inset-4 animate-ping rounded-full border border-blue-400/30" />
                  <div className="absolute inset-10 animate-pulse rounded-full border border-blue-400/50" />
                </>
              )}
              {state === "candidate-speaking" && (
                <div className="absolute inset-4 animate-pulse rounded-full border border-[#F37021]/30" />
              )}
              <div className="flex items-end gap-1">
                {Array.from({ length: 16 }).map((_, index) => (
                  <span
                    key={index}
                    className={cn("w-1.5 rounded-full transition-all duration-300", state === "ai-speaking" ? "bg-blue-400" : state === "candidate-speaking" ? "bg-[#F37021]" : "bg-white/30")}
                    style={{ height: state !== "idle" ? `${20 + Math.random() * 40}px` : '20px' }}
                  />
                ))}
              </div>
            </div>
            <p className="mt-6 text-xl font-semibold">
              {state === "idle" ? "Đang chờ..." : state === "ai-speaking" ? "AI đang nói..." : "Bạn đang trả lời..."}
            </p>
          </div>

          <div className="h-64 mt-4 bg-white/5 rounded-xl border border-white/10 p-4 overflow-y-auto flex flex-col gap-3">
            {transcript.length === 0 && <p className="text-white/40 text-sm text-center mt-auto mb-auto">Cuộc trò chuyện sẽ hiển thị tại đây</p>}
            {transcript.map((t, i) => (
              <div key={i} className={cn("max-w-[85%] p-3 rounded-lg text-sm", t.speaker === "AI" ? "bg-blue-500/20 text-blue-50 mr-auto rounded-tl-none" : "bg-[#F37021]/20 text-orange-50 ml-auto rounded-tr-none")}>
                <span className="font-semibold block mb-1 opacity-70 text-xs">{t.speaker}</span>
                {t.text}
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT PANEL: Candidate Controls */}
        <section className="p-6 flex flex-col justify-center items-center bg-slate-900/50">
          <div className="max-w-md w-full flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6 border-4 border-slate-700">
              <Mic className={cn("w-10 h-10", isRecording ? "text-[#F37021] animate-pulse" : "text-slate-400")} />
            </div>
            
            <h2 className="text-2xl font-semibold mb-2">Đến lượt bạn trả lời</h2>
            <p className="text-slate-400 mb-8 max-w-sm">
              {isRecording 
                ? "Hệ thống đang ghi âm câu trả lời của bạn. Vui lòng nói rõ ràng."
                : "Nghe câu hỏi từ AI và nhấn bắt đầu ghi âm khi bạn đã sẵn sàng."}
            </p>

            <div className="flex flex-col gap-4 w-full">
              {!isRecording ? (
                <Button 
                  size="lg" 
                  className="w-full bg-[#0033A0] hover:bg-[#00256f] text-white py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(0,51,160,0.4)] transition-all hover:shadow-[0_0_30px_rgba(0,51,160,0.6)]"
                  onClick={startRecording}
                  disabled={state === "ai-speaking" || currentQuestionIndex >= MOCK_QUESTIONS.length}
                >
                  <Mic className="mr-2 h-5 w-5" /> Bắt đầu ghi âm
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full bg-[#F37021] hover:bg-[#d95f18] text-white py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(243,112,33,0.4)] animate-pulse"
                  onClick={stopRecordingAndSubmit}
                >
                  <Send className="mr-2 h-5 w-5" /> Hoàn thành câu trả lời
                </Button>
              )}
              
              <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={() => setState("completed")}>
                Kết thúc phỏng vấn sớm
              </Button>
            </div>
          </div>
        </section>
      </main>

      <NetworkWarningModal open={networkOpen} onRetry={() => setNetworkOpen(false)} onFail={() => setState("failed")} />
      <NoiseWarningModal open={noiseOpen} onClose={() => setNoiseOpen(false)} />
    </div>
  )
}
