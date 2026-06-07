"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mic,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  Signal,
  Sparkles,
  Square,
  Volume2,
  Wifi,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface SimulationScreenProps {
  interviewToken?: string
  onClose: () => void
}

interface InterviewQuestion {
  id: string
  competency: string
  prompt: string
  targetSeconds: number
  sampleTranscript: string
}

interface AnswerRecord {
  questionId: string
  prompt: string
  transcript: string
  durationSeconds: number
  confidence: number
}

type InterviewPhase = "speaking" | "ready" | "recording" | "processing" | "review" | "complete"

interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  0?: SpeechRecognitionAlternativeLike
  isFinal?: boolean
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

interface BrowserSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  abort: () => void
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

const interviewQuestions: InterviewQuestion[] = [
  {
    id: "intro",
    competency: "Mở đầu",
    prompt: "SHB chào bạn. Bạn có thể giới thiệu ngắn gọn về bản thân và lý do bạn quan tâm tới vị trí này không?",
    targetSeconds: 120,
    sampleTranscript:
      "Dạ vâng, em chào anh chị. Em có kinh nghiệm làm việc với khách hàng cá nhân, tư vấn sản phẩm tài chính và chăm sóc khách hàng sau bán. Em quan tâm vị trí này vì muốn phát triển sâu hơn trong mảng quan hệ khách hàng và đóng góp vào mục tiêu tăng trưởng bền vững của đội ngũ.",
  },
  {
    id: "sales",
    competency: "Tư vấn và bán hàng",
    prompt:
      "Hãy kể một tình huống bạn thuyết phục thành công một khách hàng đang phân vân giữa nhiều lựa chọn tài chính.",
    targetSeconds: 150,
    sampleTranscript:
      "Trong một tình huống trước đây, khách hàng khá thận trọng vì chưa hiểu rõ lợi ích và rủi ro. Em bắt đầu bằng việc hỏi nhu cầu thực tế, khả năng tài chính và mức độ chấp nhận rủi ro, sau đó so sánh từng phương án bằng ngôn ngữ dễ hiểu. Cuối cùng khách hàng chọn giải pháp phù hợp hơn thay vì sản phẩm có hoa hồng cao hơn.",
  },
  {
    id: "risk",
    competency: "Tuân thủ và quản trị rủi ro",
    prompt:
      "Nếu khách hàng muốn bỏ qua một bước xác minh hồ sơ để xử lý nhanh hơn, bạn sẽ phản hồi thế nào?",
    targetSeconds: 120,
    sampleTranscript:
      "Em sẽ giải thích rõ rằng quy trình xác minh là để bảo vệ quyền lợi của khách hàng và ngân hàng. Em vẫn hỗ trợ khách hàng chuẩn bị giấy tờ nhanh nhất có thể, nhưng không bỏ qua bước bắt buộc. Nếu khách hàng gấp, em sẽ chủ động đề xuất kênh xử lý hoặc thời gian cam kết phù hợp.",
  },
  {
    id: "pressure",
    competency: "Xử lý áp lực",
    prompt:
      "Khi vừa phải đạt KPI, vừa phải duy trì chất lượng tư vấn, bạn ưu tiên và quản lý công việc như thế nào?",
    targetSeconds: 150,
    sampleTranscript:
      "Em chia danh sách khách hàng theo mức độ ưu tiên và khả năng chuyển đổi, đồng thời đặt lịch chăm sóc rõ ràng. Với KPI, em theo dõi tiến độ hằng ngày để không bị dồn cuối kỳ. Tuy nhiên em không đánh đổi chất lượng tư vấn, vì niềm tin của khách hàng mới tạo ra doanh thu lâu dài.",
  },
  {
    id: "closing",
    competency: "Tổng kết",
    prompt:
      "Cuối cùng, bạn muốn AI ghi nhận điểm mạnh nào của bạn cho vòng đánh giá HR?",
    targetSeconds: 90,
    sampleTranscript:
      "Em muốn nhấn mạnh khả năng lắng nghe, tư vấn dựa trên nhu cầu thật và làm việc có trách nhiệm với quy trình. Em tin rằng những điểm này giúp em xây dựng quan hệ khách hàng lâu dài và phù hợp với môi trường ngân hàng.",
  },
]

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const normalizeTranscript = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase())

const splitTranscript = (value: string) => value.match(/[^,.!?]+[,.!?]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [value]

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
  return Recognition ? new Recognition() : null
}

function phaseLabel(phase: InterviewPhase) {
  if (phase === "speaking") return "AI đang hỏi"
  if (phase === "recording") return "Ứng viên đang trả lời"
  if (phase === "processing") return "AI đang xử lý"
  if (phase === "review") return "Chờ xác nhận transcript"
  if (phase === "complete") return "Hoàn tất phỏng vấn"
  return "Sẵn sàng ghi âm"
}

function AudioVisualizer({ active, volume }: { active: boolean; volume: number }) {
  const bars = useMemo(() => Array.from({ length: 42 }, (_, index) => index), [])

  return (
    <div className="flex h-24 w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white px-5 shadow-sm">
      {bars.map((bar) => {
        const wave = Math.sin(bar * 0.64) * 0.5 + 0.5
        const base = active ? 16 + wave * 34 + volume * 74 : 10 + wave * 12
        const height = Math.max(8, Math.min(88, base))

        return (
          <motion.span
            key={bar}
            className={cn(
              "w-1.5 rounded-full",
              active ? "bg-emerald-500" : "bg-slate-300",
            )}
            animate={{
              height,
              opacity: active ? 0.55 + wave * 0.4 : 0.35,
            }}
            transition={{
              duration: 0.18,
              ease: "easeOut",
            }}
          />
        )
      })}
    </div>
  )
}

export function SimulationScreen({ interviewToken, onClose }: SimulationScreenProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [phase, setPhase] = useState<InterviewPhase>("speaking")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [voiceVolume, setVoiceVolume] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [reviewTranscript, setReviewTranscript] = useState("")
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [recognitionStatus, setRecognitionStatus] = useState("Đang chuẩn bị phiên phỏng vấn")

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const fallbackTranscriptRef = useRef<number | null>(null)
  const elapsedTimerRef = useRef<number | null>(null)
  const liveTranscriptRef = useRef("")
  const finishRecordingRef = useRef<() => void>(() => undefined)

  const currentQuestion = interviewQuestions[questionIndex]
  const progressValue = Math.round(((questionIndex + (phase === "complete" ? 1 : 0)) / interviewQuestions.length) * 100)
  const targetSeconds = currentQuestion?.targetSeconds ?? 120
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds)
  const isRecording = phase === "recording"
  const isLastQuestion = questionIndex === interviewQuestions.length - 1

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript
  }, [liveTranscript])

  useEffect(() => {
    return () => {
      stopAllInput()
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (phase !== "speaking" || !currentQuestion) return

    const speakTimer = window.setTimeout(() => {
      speakQuestion(currentQuestion.prompt)
    }, 250)

    return () => window.clearTimeout(speakTimer)
  }, [currentQuestion, phase])

  useEffect(() => {
    if (phase !== "recording") {
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }
      return
    }

    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedSeconds((value) => {
        if (value + 1 >= targetSeconds) {
          window.clearInterval(elapsedTimerRef.current ?? undefined)
          elapsedTimerRef.current = null
          window.setTimeout(() => finishRecordingRef.current(), 0)
          return targetSeconds
        }
        return value + 1
      })
    }, 1000)

    return () => {
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }
    }
  }, [phase, targetSeconds])

  function speakQuestion(text: string) {
    setRecognitionStatus("AI đang phát câu hỏi")

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setTimeout(() => {
        setPhase("ready")
        setRecognitionStatus("Sẵn sàng ghi âm")
      }, 1200)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "vi-VN"
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onend = () => {
      setPhase("ready")
      setRecognitionStatus("Sẵn sàng ghi âm")
    }
    utterance.onerror = () => {
      setPhase("ready")
      setRecognitionStatus("Sẵn sàng ghi âm")
    }
    window.speechSynthesis.speak(utterance)
  }

  function stopAllInput() {
    if (fallbackTranscriptRef.current) {
      window.clearInterval(fallbackTranscriptRef.current)
      fallbackTranscriptRef.current = null
    }
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.stop()
      } catch {
        recognitionRef.current.abort()
      }
      recognitionRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null
    setVoiceVolume(0)
  }

  const startVolumeMeter = (stream: MediaStream) => {
    const AudioContextConstructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextConstructor) return

    const audioContext = new AudioContextConstructor()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    const samples = new Uint8Array(analyser.fftSize)

    analyser.fftSize = 512
    source.connect(analyser)
    audioContextRef.current = audioContext

    const tick = () => {
      analyser.getByteTimeDomainData(samples)
      let sum = 0
      for (const sample of samples) {
        const normalized = (sample - 128) / 128
        sum += normalized * normalized
      }
      const rms = Math.sqrt(sum / samples.length)
      setVoiceVolume((current) => current * 0.65 + Math.min(1, rms * 4.8) * 0.35)
      animationFrameRef.current = window.requestAnimationFrame(tick)
    }

    tick()
  }

  const startRecognition = () => {
    const recognition = getSpeechRecognition()
    if (!recognition) {
      setRecognitionStatus("Đang nhận diện bằng transcript mock")
      startFallbackTranscript()
      return
    }

    recognition.lang = "vi-VN"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let transcript = ""
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript ?? ""
      }
      const normalized = normalizeTranscript(transcript)
      if (normalized) {
        setLiveTranscript(normalized)
        setRecognitionStatus("Đang nhận diện giọng nói")
      }
    }
    recognition.onerror = () => {
      setRecognitionStatus("Đang nhận diện bằng transcript mock")
      startFallbackTranscript()
    }
    recognition.onend = () => {
      if (phase === "recording" && !liveTranscriptRef.current.trim()) startFallbackTranscript()
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      window.setTimeout(() => {
        if (!liveTranscriptRef.current.trim()) startFallbackTranscript()
      }, 1800)
    } catch {
      setRecognitionStatus("Đang nhận diện bằng transcript mock")
      startFallbackTranscript()
    }
  }

  const startFallbackTranscript = () => {
    if (!currentQuestion || fallbackTranscriptRef.current) return
    const chunks = splitTranscript(currentQuestion.sampleTranscript)
    let index = 0

    fallbackTranscriptRef.current = window.setInterval(() => {
      setLiveTranscript((current) => normalizeTranscript(`${current} ${chunks[index] ?? ""}`))
      index += 1
      if (index >= chunks.length && fallbackTranscriptRef.current) {
        window.clearInterval(fallbackTranscriptRef.current)
        fallbackTranscriptRef.current = null
      }
    }, 900)
  }

  const beginRecording = async () => {
    if (!currentQuestion) return
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    stopAllInput()
    setPhase("recording")
    setElapsedSeconds(0)
    setLiveTranscript("")
    setReviewTranscript("")
    setVoiceVolume(0.08)
    setRecognitionStatus("Đang mở microphone")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      startVolumeMeter(stream)

      if (typeof MediaRecorder !== "undefined") {
        recorderRef.current = new MediaRecorder(stream)
        recorderRef.current.start()
      }

      startRecognition()
    } catch {
      setRecognitionStatus("Không mở được microphone, dùng transcript mock")
      setVoiceVolume(0.18)
      startFallbackTranscript()
    }
  }

  function finishRecording() {
    if (phase !== "recording") return
    stopAllInput()
    setPhase("processing")
    setRecognitionStatus("AI đang chuẩn hóa transcript")

    window.setTimeout(() => {
      const transcript = normalizeTranscript(liveTranscriptRef.current || currentQuestion.sampleTranscript)
      setReviewTranscript(transcript)
      setPhase("review")
      setRecognitionStatus("Vui lòng kiểm tra transcript")
    }, 850)
  }

  finishRecordingRef.current = finishRecording

  const retryAnswer = () => {
    stopAllInput()
    setElapsedSeconds(0)
    setLiveTranscript("")
    setReviewTranscript("")
    setPhase("ready")
    setRecognitionStatus("Sẵn sàng ghi âm lại")
  }

  const confirmAnswer = () => {
    if (!currentQuestion) return
    const transcript = normalizeTranscript(reviewTranscript || liveTranscript || currentQuestion.sampleTranscript)
    const nextAnswer: AnswerRecord = {
      questionId: currentQuestion.id,
      prompt: currentQuestion.prompt,
      transcript,
      durationSeconds: Math.max(1, elapsedSeconds),
      confidence: liveTranscript ? 0.92 : 0.84,
    }

    setAnswers((current) => {
      const withoutCurrent = current.filter((answer) => answer.questionId !== currentQuestion.id)
      return [...withoutCurrent, nextAnswer]
    })

    if (isLastQuestion) {
      setPhase("complete")
      setRecognitionStatus("Phiên phỏng vấn đã hoàn tất")
      return
    }

    setQuestionIndex((current) => current + 1)
    setElapsedSeconds(0)
    setLiveTranscript("")
    setReviewTranscript("")
    setPhase("speaking")
  }

  const replayQuestion = () => {
    if (!currentQuestion) return
    setPhase("speaking")
  }

  if (phase === "complete") {
    return (
      <main className="min-h-svh bg-[#f6f8fb] px-5 py-8 text-slate-950">
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-5xl flex-col justify-center">
          <div className="rounded-lg border border-emerald-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-semibold text-slate-950">Hoàn tất phỏng vấn AI</h1>
                <p className="mt-1 text-sm text-slate-500">Transcript mock đã được tạo cho toàn bộ câu hỏi.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {answers.map((answer, index) => (
                <div key={answer.questionId} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Câu {index + 1}</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{answer.prompt}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{answer.transcript}</p>
                </div>
              ))}
            </div>
            <Button className="mt-6 bg-slate-950 text-white hover:bg-slate-800" onClick={onClose}>
              Kết thúc
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh overflow-hidden bg-[#f6f8fb] text-slate-950">
      <header className="flex min-h-20 flex-col gap-3 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold leading-tight">HireTrain AI</p>
            <p className="text-xs text-slate-500">Audio interview room</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            Câu {questionIndex + 1}/{interviewQuestions.length}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
            {progressValue}% hoàn tất
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
            <Wifi className="h-3.5 w-3.5" />
            Network ổn định
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700">
            <Signal className="h-3.5 w-3.5" />
            Mic {isRecording ? "đang thu" : "sẵn sàng"}
          </span>
        </div>
      </header>

      <section className="grid min-h-[calc(100svh-5rem)] lg:grid-cols-2">
        <section className="flex min-h-[48svh] flex-col justify-between border-b border-slate-200 bg-white px-5 py-6 lg:min-h-0 lg:border-b-0 lg:border-r lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">AI Interviewer</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950 md:text-3xl">Phỏng vấn âm thanh</h1>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold",
                phase === "speaking" && "bg-blue-50 text-blue-700",
                phase === "recording" && "bg-emerald-50 text-emerald-700",
                phase === "processing" && "bg-amber-50 text-amber-700",
                phase === "review" && "bg-slate-100 text-slate-700",
                phase === "ready" && "bg-slate-100 text-slate-700",
              )}
            >
              {phase === "processing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
              {phaseLabel(phase)}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-10">
            <motion.div
              className="relative flex h-56 w-56 items-center justify-center rounded-full border border-white bg-[radial-gradient(circle_at_32%_26%,#ffffff_0,#ffffff_18%,#dbeafe_36%,#99f6e4_58%,#fde68a_78%,#fecdd3_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
              animate={{
                scale: phase === "speaking" ? [1, 1.04, 1] : [1, 1.015, 1],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-8 rounded-full bg-white/45 blur-md"
                animate={{ opacity: [0.42, 0.72, 0.42] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <Bot className="relative h-16 w-16 text-slate-950" />
            </motion.div>

            <div className="mt-8 max-w-2xl rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                <Volume2 className="h-4 w-4" />
                AI question
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 text-xl font-semibold leading-8 text-slate-950 md:text-2xl"
                >
                  {currentQuestion.prompt}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Năng lực</p>
              <p className="mt-1 font-medium text-slate-900">{currentQuestion.competency}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Thời lượng</p>
              <p className="mt-1 font-medium text-slate-900">{formatTime(targetSeconds)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Bảo mật</p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Token {interviewToken ? "đã sẵn sàng" : "demo"}
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[52svh] flex-col bg-[#f6f8fb] px-5 py-6 lg:min-h-0 lg:px-8">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Candidate workspace</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Ghi âm và transcript</h2>
              </div>
              <div className="rounded-lg bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-400">Timer</p>
                <p className={cn("mt-1 font-mono text-xl font-semibold", remainingSeconds <= 20 ? "text-red-600" : "text-slate-950")}>
                  {formatTime(elapsedSeconds)} / {formatTime(targetSeconds)}
                </p>
              </div>
            </div>

            <Progress value={(elapsedSeconds / targetSeconds) * 100} className="h-2 bg-slate-200 [&>div]:bg-emerald-500" />

            <AudioVisualizer active={isRecording} volume={voiceVolume} />

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Live transcript</p>
                  <p className="mt-1 text-sm text-slate-500">{recognitionStatus}</p>
                </div>
                <span className={cn("h-2.5 w-2.5 rounded-full", isRecording ? "bg-emerald-500" : "bg-slate-300")} />
              </div>

              {phase === "review" ? (
                <Textarea
                  value={reviewTranscript}
                  onChange={(event) => setReviewTranscript(event.target.value)}
                  className="mt-4 min-h-40 resize-none border-slate-200 text-base leading-7"
                />
              ) : (
                <div className="mt-4 min-h-40 rounded-lg border border-slate-100 bg-slate-50 p-4 text-base leading-7 text-slate-700">
                  {liveTranscript ? (
                    liveTranscript
                  ) : (
                    <span className="text-slate-400">
                      {phase === "recording" ? "Micro đang mở. Transcript sẽ xuất hiện tại đây..." : "Bấm bắt đầu trả lời để ghi âm câu này."}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={isRecording ? finishRecording : beginRecording}
                    disabled={phase === "processing" || phase === "review"}
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition",
                      isRecording ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700",
                      (phase === "processing" || phase === "review") && "cursor-not-allowed bg-slate-300",
                    )}
                    aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                  >
                    {isRecording ? <Square className="h-6 w-6 fill-current" /> : <Mic className="h-6 w-6" />}
                  </button>
                  <div>
                    <p className="font-semibold text-slate-950">
                      {isRecording ? "Đang ghi âm" : phase === "review" ? "Kiểm tra transcript" : "Sẵn sàng trả lời"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {isRecording ? "Sóng âm đang phản hồi theo microphone." : "AI sẽ lưu transcript sau khi bạn xác nhận."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={replayQuestion} disabled={phase === "recording" || phase === "processing"}>
                    <Play className="mr-2 h-4 w-4" />
                    Nghe lại
                  </Button>
                  {phase === "recording" ? (
                    <Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={finishRecording}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Hoàn thành câu trả lời
                    </Button>
                  ) : null}
                  {phase === "review" ? (
                    <>
                      <Button variant="outline" onClick={retryAnswer}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Ghi âm lại
                      </Button>
                      <Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={confirmAnswer}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {isLastQuestion ? "Xác nhận và kết thúc" : "Xác nhận câu này"}
                      </Button>
                    </>
                  ) : null}
                  {phase === "ready" || phase === "speaking" ? (
                    <Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={beginRecording}>
                      <Mic className="mr-2 h-4 w-4" />
                      Bắt đầu trả lời
                    </Button>
                  ) : null}
                  {phase === "processing" ? (
                    <Button disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {interviewQuestions.map((question, index) => {
                const answered = answers.some((answer) => answer.questionId === question.id)
                const active = index === questionIndex

                return (
                  <div
                    key={question.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                      active ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-500",
                    )}
                  >
                    <span className="truncate pr-3">
                      {index + 1}. {question.competency}
                    </span>
                    {answered ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Clock className="h-4 w-4 shrink-0" />}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
