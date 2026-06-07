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
    </div>
  )
}
