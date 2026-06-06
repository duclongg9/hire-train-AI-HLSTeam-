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
import { PublicHeader } from "@/components/recruitment/app-shell"
import { CvErrorModal, NetworkWarningModal, NoiseWarningModal, TestTimeUpModal, VoiceConsentModal } from "@/components/recruitment/modals"
import { EmptyState, FormMessage, StatusPill, UploadPanel } from "@/components/recruitment/common"
import { publicJob, testQuestions, type TestQuestion } from "@/lib/recruitment/mock-data"
import {
  formatApiError,
  openCandidateTest,
  startCandidateTest,
  submitCandidateTest,
  type BackendTestAttempt,
  type BackendTestQuestion,
} from "@/lib/recruitment/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
}

type CandidateTestQuestion = TestQuestion & { optionIds: string[] }

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

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
      <PublicHeader />
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
      <PublicHeader />
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
      <PublicHeader />
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
  const router = useRouter()
  const params = useParams<{ testToken?: string }>()
  const testToken = params?.testToken ?? ""
  const isBackendTest = Boolean(testToken && testToken !== "demo-token")
  const [current, setCurrent] = useState(0)
  const [questions, setQuestions] = useState<CandidateTestQuestion[]>(isBackendTest ? [] : demoTestQuestions)
  const [loadingTest, setLoadingTest] = useState(isBackendTest)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [durationSeconds, setDurationSeconds] = useState(15 * 60)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BackendTestAttempt | null>(null)
  const [timeUpOpen, setTimeUpOpen] = useState(false)
  const [securityWarnings, setSecurityWarnings] = useState(0)
  const answersRef = useRef<Record<string, string>>({})
  const timeLeftRef = useRef(timeLeft)
  const durationSecondsRef = useRef(durationSeconds)
  const submittedRef = useRef(false)
  const submittingRef = useRef(false)
  const securityWarningsRef = useRef(0)
  const lastSecurityWarningAtRef = useRef(0)
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)
  const currentQuestionIds = new Set(questions.map((item) => item.id))
  const backendQuestionIds = new Set(questions.map((item) => item.id).filter(isUuid))
  const question = questions[current] ?? questions[0]
  const answeredCount = Object.keys(answers).filter((questionId) => currentQuestionIds.has(questionId)).length
  const browserWarningCount = Math.min(securityWarnings, 3)

  const goToNextRound = () => {
    setTimeUpOpen(false)
    router.push("/candidate/interview/demo-token/waiting-room")
  }

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  useEffect(() => {
    durationSecondsRef.current = durationSeconds
  }, [durationSeconds])

  useEffect(() => {
    submittedRef.current = submitted
  }, [submitted])

  useEffect(() => {
    submittingRef.current = submitting
  }, [submitting])

  useEffect(() => {
    if (!isBackendTest) {
      setQuestions(demoTestQuestions)
      setLoadingTest(false)
      setMessage({ type: "warning", text: "Using local demo questions. Open this route with a backend test token for the live test flow." })
      return
    }

    let mounted = true
    setLoadingTest(true)
    openCandidateTest(testToken)
      .then(async (test) => {
        if (!mounted) return
        const mappedQuestions = test.questions.map(mapBackendQuestion).filter((item) => isUuid(item.id))
        setQuestions(mappedQuestions)
        setAnswers({})
        answersRef.current = {}
        setCurrent(0)
        setTimeLeft(test.duration_seconds)
        setDurationSeconds(test.duration_seconds)
        setLoadingTest(false)
        setMessage(mappedQuestions.length > 0 ? { type: "success", text: `Loaded ${mappedQuestions.length} backend test questions for ${test.candidate.full_name}.` } : { type: "error", text: "Backend returned no valid UUID questions for this test token." })
        try {
          await startCandidateTest(testToken)
        } catch {
          // Opening the test is enough for display; start errors are surfaced when submit fails.
        }
      })
      .catch((error) => {
        if (mounted) {
          setQuestions([])
          setLoadingTest(false)
          setMessage({ type: "error", text: formatApiError(error, "Could not open test token.") })
        }
      })

    return () => {
      mounted = false
    }
  }, [isBackendTest, testToken])

  useEffect(() => {
    if (submitted || submitting || loadingTest || questions.length === 0) return
    const interval = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(interval)
          timeLeftRef.current = 0
          void submit(true)
          return 0
        }
        const nextValue = value - 1
        timeLeftRef.current = nextValue
        return nextValue
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [loadingTest, questions.length, submitted, submitting])

  async function submit(autoSubmitted = false) {
    if (!question || submittingRef.current || submittedRef.current) return
    const validBackendQuestionIds = new Set(questions.map((item) => item.id).filter(isUuid))
    if (isBackendTest && (loadingTest || validBackendQuestionIds.size === 0)) {
      setMessage({ type: "error", text: "Backend test questions are still loading. Please wait before submitting." })
      return
    }
    const submitAnswers = Object.entries(answersRef.current)
      .filter(([question_id]) => !isBackendTest || validBackendQuestionIds.has(question_id))
      .map(([question_id, selected_option_id]) => ({ question_id, selected_option_id }))
    if (isBackendTest && submitAnswers.length === 0) {
      setMessage({ type: "error", text: "Please answer at least one backend test question before submitting." })
      return
    }
    submittingRef.current = true
    if (!testToken || testToken === "demo-token") {
      submittedRef.current = true
      setSubmitted(true)
      if (autoSubmitted) setTimeUpOpen(true)
      setMessage({ type: "success", text: "Demo test submitted locally. Backend submission requires a real test token." })
      submittingRef.current = false
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const savedAttempt = await submitCandidateTest(testToken, {
        answers: submitAnswers,
        auto_submitted: autoSubmitted,
        duration_seconds: durationSecondsRef.current - timeLeftRef.current,
      })
      setResult(savedAttempt)
      submittedRef.current = true
      setSubmitted(true)
      if (autoSubmitted) setTimeUpOpen(true)
      setMessage({ type: "success", text: "Test submitted to backend successfully and saved to the database." })
    } catch (error) {
      setMessage({ type: "error", text: formatApiError(error, "Could not submit test.") })
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (submitted || submitting || loadingTest || questions.length === 0) return

    const registerFocusExit = () => {
      if (submittedRef.current || submittingRef.current) return
      const now = Date.now()
      if (now - lastSecurityWarningAtRef.current < 1500) return
      lastSecurityWarningAtRef.current = now
      const nextWarningCount = Math.min(securityWarningsRef.current + 1, 3)
      securityWarningsRef.current = nextWarningCount
      setSecurityWarnings(nextWarningCount)
      if (nextWarningCount >= 3) {
        setMessage({ type: "warning", text: "Browser focus changed multiple times. The test is being auto-submitted for review integrity." })
        void submit(true)
        return
      }
      setMessage({ type: "warning", text: `Browser focus changed. Warning ${nextWarningCount}/3 before auto-submit.` })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") registerFocusExit()
    }

    window.addEventListener("blur", registerFocusExit)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      window.removeEventListener("blur", registerFocusExit)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [loadingTest, questions.length, submitted, submitting])

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Professional Test</h1>
            <p className="text-sm text-muted-foreground">{answeredCount}/{questions.length} answered - {browserWarningCount}/3 browser warnings</p>
          </div>
          <div className={cn("inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xl font-bold", timeLeft <= 120 ? "bg-red-100 text-red-700" : "bg-white text-foreground")}>
            <Clock className="h-5 w-5" />
            {formatSeconds(timeLeft)}
          </div>
        </div>

        {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
        {loadingTest ? <FormMessage type="warning">Loading backend Quicktest questions. Please wait before answering.</FormMessage> : null}
        {submitted ? <FormMessage type="success">Test submitted. Answers are locked.</FormMessage> : null}

        {submitted ? (
          <Card className="mt-4 rounded-lg border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Interstitial Stage</p>
                <h2 className="mt-1 text-xl font-bold text-foreground">Quicktest completed</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your round 2 score has been saved. Please prepare webcam and microphone before the interview room opens.</p>
              </div>
              <div className="rounded-lg bg-white px-5 py-4 text-center shadow-sm">
                <p className="text-xs font-medium uppercase text-muted-foreground">Round 2 score</p>
                <p className="mt-1 text-3xl font-bold text-emerald-700">{result?.percentage ?? 0}%</p>
                <Button className="mt-4 bg-[#0033A0] text-white hover:bg-[#00256f]" onClick={goToNextRound}>
                  Continue to Round 3
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {questions.length === 0 && !loadingTest ? (
          <Card className="mt-4 rounded-lg border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
            No valid backend questions are available for this test token. Please create a new Quicktest session.
          </Card>
        ) : null}

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

          {question ? (
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
                    disabled={submitted || loadingTest || questions.length === 0 || (isBackendTest && !isUuid(question.id))}
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
                  <Button variant="outline" onClick={() => setTimeLeft(1)} disabled={submitted || loadingTest || questions.length === 0}>
                    Simulate Time Up
                  </Button>
                  <Button variant="outline" onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1}>
                    Next
                  </Button>
                  <Button className="bg-[#F37021] text-white hover:bg-[#d95f18]" disabled={submitted || submitting || loadingTest || (isBackendTest && backendQuestionIds.size === 0)} onClick={() => submit(false)}>
                    {submitting ? "Submitting..." : "Submit Test"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="rounded-lg p-5 text-sm text-muted-foreground shadow-sm">
              Quicktest questions are loading.
            </Card>
          )}
        </div>
      </main>
      <TestTimeUpModal open={timeUpOpen} onClose={goToNextRound} />
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
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Card className="rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">Waiting Room & Technical Check</h1>
          <p className="mt-1 text-sm text-muted-foreground">Complete the checklist before joining the voice AI interview.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              ["Browser permission", ShieldCheck],
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

  useEffect(() => {
    if (state === "completed" || state === "failed") return
    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [state])

  useEffect(() => {
    if (state === "completed" || state === "failed") return
    const states: InterviewLiveState[] = ["listening", "ai-speaking", "candidate-speaking"]
    const interval = window.setInterval(() => {
      setState((current) => {
        if (current === "completed" || current === "failed") return current
        return states[(states.indexOf(current) + 1) % states.length] ?? "listening"
      })
    }, 4500)
    return () => window.clearInterval(interval)
  }, [state])

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
          <Card className="rounded-lg border-white/10 bg-white/5 p-4 text-white">
            <h2 className="font-semibold">Live transcript</h2>
            <div className="mt-3 space-y-2 text-sm text-white/70">
              <p><span className="text-blue-300">AI:</span> Walk me through a frontend decision where quality changed the outcome.</p>
              <p><span className="text-[#F37021]">Candidate:</span> I balanced performance, validation, and scanning speed for recruiters.</p>
              <p><span className="text-blue-300">AI:</span> What tradeoff did you reject?</p>
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
