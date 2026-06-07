"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
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

const ShbLogo = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="180" height="180" rx="30" fill="url(#bg-gradient)" stroke="#000" strokeWidth="8"/>
    <defs>
      <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{stopColor: "#f89728", stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: "#df6815", stopOpacity: 1}} />
      </linearGradient>
    </defs>
    <g stroke="#000" strokeWidth="1.5" fill="none" strokeLinejoin="round">
      <path d="M 60 100 Q 40 60 100 50 Q 160 60 140 100 Q 145 130 115 145 Q 100 165 95 140 Q 60 135 60 100 Z" />
      <path d="M 100 50 L 100 140" strokeDasharray="2,2"/>
      <circle cx="60" cy="100" r="2.5" fill="#000"/>
      <circle cx="100" cy="50" r="2.5" fill="#000"/>
      <circle cx="140" cy="100" r="2.5" fill="#000"/>
      <circle cx="115" cy="145" r="2.5" fill="#000"/>
      <circle cx="95" cy="140" r="2.5" fill="#000"/>
      <circle cx="80" cy="75" r="2.5" fill="#000"/>
      <circle cx="120" cy="75" r="2.5" fill="#000"/>
      <line x1="60" y1="100" x2="80" y2="75" />
      <line x1="80" y1="75" x2="100" y2="50" />
      <line x1="100" y1="50" x2="120" y2="75" />
      <line x1="120" y1="75" x2="140" y2="100" />
      <line x1="140" y1="100" x2="115" y2="145" />
      <line x1="80" y1="75" x2="95" y2="140" />
      <line x1="120" y1="75" x2="95" y2="140" />
    </g>
    <g fontFamily="Arial, sans-serif" fontWeight="bold" fill="#000">
      <text x="65" y="110" fontSize="28">S</text>
      <text x="90" y="110" fontSize="28">H</text>
      <text x="115" y="110" fontSize="28">B</text>
      <rect x="91" y="65" width="16" height="12" fill="none" stroke="#000" strokeWidth="1"/>
      <text x="93" y="75" fontSize="8">AI</text>
      <circle cx="140" cy="100" r="9" fill="none" stroke="#000" strokeWidth="1.5"/>
      <text x="134" y="103" fontSize="8">HR</text>
    </g>
    <text x="100" y="165" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#000" textAnchor="middle">Ngân Hàng SHB AI HR</text>
  </svg>
)

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
  const [showErrorModal, setShowErrorModal] = useState(false)

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showErrorModal) return
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        if (phase === "recording") {
          finishRecordingRef.current()
        } else if (phase === "ready" || phase === "speaking") {
          // We can't easily call beginRecording here because it's defined later, 
          // but we can trigger it via a hidden button or by dispatching an event, or better:
          // Just expose beginRecording in a ref later or move beginRecording definition up.
          // For now, let's just trigger click on the mic button if we set a specific ID on it.
          document.getElementById('mic-toggle-btn')?.click()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, showErrorModal])

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
      setShowErrorModal(true)
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }
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
    <main className="min-h-svh overflow-hidden bg-[#F8F9FA] text-[#003B5C]">
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[#003B5C]">Không thể truy cập Microphone</h3>
              <p className="mb-6 text-sm text-slate-500">
                Hệ thống không thể mở microphone của bạn. Vui lòng cấp quyền truy cập microphone trong cài đặt trình duyệt để tiếp tục phần phỏng vấn.
              </p>
              <div className="flex w-full gap-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowErrorModal(false)
                    startFallbackTranscript()
                  }}
                >
                  Dùng mock data
                </Button>
                <Button
                  className="w-full bg-[#F37021] text-white hover:bg-[#df6815]"
                  onClick={() => {
                    setShowErrorModal(false)
                    beginRecording()
                  }}
                >
                  Thử lại
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <header className="flex min-h-20 flex-col gap-3 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between md:px-8 relative z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-lg bg-slate-100 p-1">
            <ShbLogo />
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-[#003B5C]">Tuyển dụng SHB</p>
            <p className="text-xs font-medium text-slate-500">Phòng phỏng vấn AI</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Network ổn định
          </span>
          <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm", isRecording ? "border-[#F37021]/30 bg-[#F37021]/10 text-[#F37021]" : "border-blue-200 bg-blue-50 text-blue-700")}>
            <span className="relative flex h-2 w-2">
              <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", isRecording ? "bg-[#F37021]" : "bg-blue-400")}></span>
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", isRecording ? "bg-[#F37021]" : "bg-blue-500")}></span>
            </span>
            Mic {isRecording ? "đang thu" : "sẵn sàng"}
          </span>
        </div>
      </header>
      <div className="h-1 w-full bg-slate-100">
        <div className="h-full bg-[#F37021] transition-all duration-500" style={{ width: `${progressValue}%` }} />
      </div>

      <section className="flex flex-col lg:grid lg:min-h-[calc(100svh-5.25rem)] lg:grid-cols-[40%_60%]">
        <section className="sticky top-0 z-10 flex flex-col justify-between border-b border-slate-200 bg-white px-5 py-6 shadow-sm lg:relative lg:border-b-0 lg:border-r lg:px-8 lg:shadow-none">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">AI Interviewer</p>
              <h1 className="mt-2 text-2xl font-bold text-[#003B5C] md:text-3xl">Phỏng vấn âm thanh</h1>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold",
                phase === "speaking" && "bg-blue-50 text-blue-700",
                phase === "recording" && "bg-[#F37021]/10 text-[#F37021]",
                phase === "processing" && "bg-amber-50 text-amber-700",
                phase === "review" && "bg-slate-100 text-slate-700",
                phase === "ready" && "bg-slate-100 text-slate-700",
              )}
            >
              {phase === "processing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
              {phaseLabel(phase)}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-6 lg:py-10">
            <motion.div
              className="relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-full shadow-[0_12px_40px_rgba(243,112,33,0.15)]"
              animate={{
                scale: phase === "speaking" ? [1, 1.05, 1] : [1, 1.02, 1],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShbLogo />
            </motion.div>

            <div className="mt-8 w-full max-w-2xl rounded-xl border-t-4 border-t-[#F37021] border-x border-b border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <Volume2 className="h-4 w-4" />
                  Câu hỏi AI
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {currentQuestion.competency}
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 text-xl font-bold leading-8 text-[#003B5C] md:text-2xl"
                >
                  {currentQuestion.prompt}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Thời lượng trả lời</p>
              <p className="mt-1 font-bold text-[#003B5C]">{formatTime(targetSeconds)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Trạng thái bảo mật</p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-bold text-[#003B5C]">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Token {interviewToken ? "đã sẵn sàng" : "demo"}
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col bg-[#F8F9FA] px-5 py-6 lg:px-8">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Candidate workspace</p>
                <h2 className="mt-2 text-2xl font-bold text-[#003B5C]">Ghi âm và transcript</h2>
              </div>
              <div className="rounded-xl bg-white px-5 py-3 text-right shadow-sm border border-slate-100">
                <p className="text-xs font-semibold uppercase text-slate-400">Timer</p>
                <p className={cn("mt-1 font-mono text-xl font-bold", remainingSeconds <= 30 ? "text-[#F37021]" : "text-[#003B5C]")}>
                  {formatTime(elapsedSeconds)} / {formatTime(targetSeconds)}
                </p>
              </div>
            </div>

            <Progress value={(elapsedSeconds / targetSeconds) * 100} className="h-2.5 bg-slate-200 [&>div]:bg-[#F37021]" />

            <AudioVisualizer active={isRecording} volume={voiceVolume} />

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Live transcript</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{recognitionStatus}</p>
                </div>
                <span className={cn("h-3 w-3 rounded-full shadow-sm", isRecording ? "bg-[#F37021] animate-pulse" : "bg-slate-300")} />
              </div>

              {phase === "review" ? (
                <Textarea
                  value={reviewTranscript}
                  onChange={(event) => setReviewTranscript(event.target.value)}
                  className="mt-4 min-h-40 resize-none border-slate-200 text-base leading-7 focus-visible:ring-[#F37021]"
                />
              ) : phase === "processing" ? (
                <div className="mt-4 min-h-40 space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-5 shadow-inner">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200"></div>
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200"></div>
                  <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200"></div>
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200"></div>
                </div>
              ) : (
                <div className="mt-4 min-h-40 rounded-xl border border-slate-100 bg-slate-50 p-5 text-base leading-7 text-slate-700 shadow-inner">
                  {liveTranscript ? (
                    <span className="animate-in fade-in">{liveTranscript}</span>
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
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    {isRecording && (
                      <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-[#F37021] opacity-20"></span>
                    )}
                    <button
                      id="mic-toggle-btn"
                      type="button"
                      onClick={isRecording ? finishRecording : beginRecording}
                      disabled={phase === "processing" || phase === "review"}
                      className={cn(
                        "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-all hover:scale-105 active:scale-95",
                        isRecording ? "bg-red-600 hover:bg-red-700" : "bg-[#F37021] hover:bg-[#df6815]",
                        (phase === "processing" || phase === "review") && "cursor-not-allowed bg-slate-300 hover:scale-100",
                      )}
                      aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                    >
                      {isRecording ? <Square className="h-7 w-7 fill-current" /> : <Mic className="h-7 w-7" />}
                    </button>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#003B5C]">
                      {isRecording ? "Đang ghi âm..." : phase === "review" ? "Kiểm tra transcript" : "Sẵn sàng trả lời"}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {isRecording ? "Sóng âm đang phản hồi theo microphone." : "Bấm phím Space hoặc Enter để bắt đầu."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" className="border-slate-200 font-semibold" onClick={replayQuestion} disabled={phase === "recording" || phase === "processing"}>
                    <Play className="mr-2 h-4 w-4" />
                    Nghe lại
                  </Button>
                  {phase === "recording" ? (
                    <Button className="bg-[#003B5C] font-semibold text-white shadow-sm hover:bg-blue-900" onClick={finishRecording}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Hoàn thành
                    </Button>
                  ) : null}
                  {phase === "review" ? (
                    <>
                      <Button variant="ghost" className="font-semibold" onClick={retryAnswer}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Ghi âm lại
                      </Button>
                      <Button className="bg-[#003B5C] font-semibold text-white shadow-sm hover:bg-blue-900" onClick={confirmAnswer}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {isLastQuestion ? "Xác nhận và kết thúc" : "Xác nhận câu này"}
                      </Button>
                    </>
                  ) : null}
                  {phase === "ready" || phase === "speaking" ? (
                    <Button className="bg-[#003B5C] font-semibold text-white shadow-sm hover:bg-blue-900" onClick={beginRecording}>
                      <Mic className="mr-2 h-4 w-4" />
                      Bắt đầu trả lời
                    </Button>
                  ) : null}
                  {phase === "processing" ? (
                    <Button disabled variant="outline" className="font-semibold">
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
