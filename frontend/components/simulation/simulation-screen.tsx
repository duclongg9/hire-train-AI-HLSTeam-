"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Mic, MicOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { startAwsTranscribeStream, type AwsTranscribeStream } from "./aws-transcribe-stream"

interface SimulationScreenProps {
  interviewToken?: string
  onClose: () => void
}

interface TranscriptLine {
  text: string
  confidence?: number
}

const normalizeTranscript = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase())

const formatConfidence = (confidence?: number) => {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) return null
  return `${Math.round(confidence * 100)}%`
}

const candidateQuestion = "SHB chào bạn! Bạn có thể giới thiệu về bản thân mình được không?"

export function SimulationScreen({ interviewToken }: SimulationScreenProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [isListening, setIsListening] = useState(false)
  const [voiceVolume, setVoiceVolume] = useState(0)
  const [draftTranscript, setDraftTranscript] = useState("")
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([])
  const [recognitionStatus, setRecognitionStatus] = useState("Sẵn sàng")
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false)

  const transcribeStreamRef = useRef<AwsTranscribeStream | null>(null)
  const questionAudioRef = useRef<HTMLAudioElement | null>(null)
  const questionAudioUrlRef = useRef<string | null>(null)
  const streamErrorRef = useRef<string | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    return () => {
      // Mirror EdgeTts.cs Stop(): pause, release blob URL, nullify refs
      try {
        if (questionAudioRef.current) {
          questionAudioRef.current.pause()
          questionAudioRef.current.src = ""
          questionAudioRef.current = null
        }
        if (questionAudioUrlRef.current) {
          URL.revokeObjectURL(questionAudioUrlRef.current)
          questionAudioUrlRef.current = null
        }
      } catch { /* ignore */ }
      transcribeStreamRef.current?.stop()
    }
  }, [])

  const latestTranscript = transcriptLines[transcriptLines.length - 1]
  const confidenceLabel = formatConfidence(latestTranscript?.confidence)
  const transcriptPreview =
    [...transcriptLines.map((line) => line.text), draftTranscript].filter(Boolean).join(" ") ||
    "Chạm micro và bắt đầu nói"
  const mascotScale = 1 + voiceVolume * 0.36 + (isListening ? 0.03 : 0)
  const eyeMotion = isListening ? Math.max(2, voiceVolume * 7) : 1
  const sessionStatus = isSpeakingQuestion ? "Đang đọc câu hỏi" : isListening ? "Đang nghe" : recognitionStatus

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startListening = async () => {
    if (isListening) return

    if (!interviewToken) {
      setRecognitionStatus("Thiếu interview token để dùng AWS Transcribe")
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecognitionStatus("Trình duyệt chưa hỗ trợ microphone")
      return
    }

    setIsListening(true)
    setDraftTranscript("")
    setVoiceVolume(0)
    setRecognitionStatus("Đang kết nối AWS Transcribe")
    streamErrorRef.current = null

    try {
      transcribeStreamRef.current = await startAwsTranscribeStream({
        token: interviewToken,
        onClose: () => {
          transcribeStreamRef.current = null
          setIsListening(false)
          setVoiceVolume(0)
          setRecognitionStatus(streamErrorRef.current ?? "Sẵn sàng")
          streamErrorRef.current = null
        },
        onError: (message) => {
          streamErrorRef.current = message
          setRecognitionStatus(message)
          setIsListening(false)
          transcribeStreamRef.current?.stop()
        },
        onStatus: setRecognitionStatus,
        onTranscript: ({ confidence, isPartial, text }) => {
          const normalizedText = normalizeTranscript(text)
          if (!normalizedText) return

          if (isPartial) {
            setDraftTranscript(normalizedText)
            return
          }

          setTranscriptLines((prev) => [...prev, { text: normalizedText, confidence }])
          setDraftTranscript("")
        },
        onVolume: setVoiceVolume,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể bắt đầu AWS Transcribe"
      setRecognitionStatus(message)
      setIsListening(false)
      setVoiceVolume(0)
    }
  }

  /**
   * Stop and release the Edge TTS audio — mirrors EdgeTts.cs Stop().
   */
  const stopQuestionAudio = () => {
    try {
      if (questionAudioRef.current) {
        questionAudioRef.current.pause()
        questionAudioRef.current.src = ""
        questionAudioRef.current = null
      }
      if (questionAudioUrlRef.current) {
        URL.revokeObjectURL(questionAudioUrlRef.current)
        questionAudioUrlRef.current = null
      }
    } catch {
      // ignore cleanup errors
    }
  }

  const stopListening = () => {
    stopQuestionAudio()
    transcribeStreamRef.current?.stop()
    transcribeStreamRef.current = null
    setIsSpeakingQuestion(false)
    setIsListening(false)
    setVoiceVolume(0)
    setRecognitionStatus("Đang dừng AWS Transcribe")
  }

  /**
   * Synthesise candidateQuestion via Edge TTS (vi-VN-NamMinhNeural) then
   * start listening — mirrors EdgeTts.cs Speak() → SynthesizeAsync() flow.
   */
  const speakQuestionThenListen = async () => {
    stopQuestionAudio()
    setIsSpeakingQuestion(true)
    setRecognitionStatus("Đang tổng hợp giọng đọc")

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: candidateQuestion,
          voice: "vi-VN-NamMinhNeural",
          rate: "+0%",
          volume: "+0%",
        }),
      })

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      questionAudioUrlRef.current = url

      const audio = new Audio(url)
      questionAudioRef.current = audio

      setRecognitionStatus("Đang đọc câu hỏi")

      audio.onended = () => {
        stopQuestionAudio()
        setIsSpeakingQuestion(false)
        void startListening()
      }

      audio.onerror = () => {
        stopQuestionAudio()
        setIsSpeakingQuestion(false)
        void startListening()
      }

      void audio.play()
    } catch {
      // Fallback: skip TTS and start listening immediately
      stopQuestionAudio()
      setIsSpeakingQuestion(false)
      void startListening()
    }
  }

  const toggleListening = () => {
    if (isListening || isSpeakingQuestion) {
      stopListening()
    } else {
      void speakQuestionThenListen()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex min-h-svh flex-col overflow-hidden bg-[#f8f8f7] text-neutral-950"
    >
      <header className="flex shrink-0 flex-col items-center px-5 pt-9 text-center">
        <h1 className="text-4xl font-semibold leading-none tracking-normal text-black sm:text-5xl">AI Interview</h1>
        <div className="mt-5 flex max-w-[min(92vw,680px)] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-neutral-500">
          <span>Speech to text</span>
          <span className="h-1 w-1 rounded-full bg-neutral-300" />
          <span>{formatTime(timeLeft)}</span>
          <span className={cn("font-medium", isListening || isSpeakingQuestion ? "text-blue-600" : "text-neutral-400")}>
            {sessionStatus}
          </span>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 pb-32 pt-8">
        <section className="flex w-full max-w-3xl flex-col items-center">
          <div className="relative flex min-h-[430px] w-full flex-col items-center justify-center sm:min-h-[500px]">
            <motion.div
              className="relative z-10 mb-10 max-w-[min(82vw,420px)] rounded-full bg-white px-8 py-5 text-center text-2xl font-semibold text-neutral-900 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10 sm:text-3xl"
              animate={{ y: isListening || isSpeakingQuestion ? [-2, 3, -2] : [0, -2, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              {candidateQuestion}
              <span className="absolute bottom-0 left-1/2 size-8 -translate-x-1/2 translate-y-1/2 rotate-45 rounded-sm bg-white" />
            </motion.div>

            <motion.div
              animate={{ scale: mascotScale, y: isListening || isSpeakingQuestion ? [-4, 4, -4] : [-3, 3, -3] }}
              transition={{
                scale: { type: "spring", stiffness: 145, damping: 16, mass: 0.55 },
                y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
              }}
              className="relative size-[min(68vw,300px)] max-h-[300px] min-h-[220px] min-w-[220px]"
              aria-label="Speech volume mascot"
            >
              <motion.div
                className="absolute -bottom-24 left-1/2 h-9 w-[62%] -translate-x-1/2 rounded-full bg-neutral-400/18 blur-xl"
                animate={{
                  opacity: isListening || isSpeakingQuestion ? [0.26, 0.42, 0.26] : [0.18, 0.28, 0.18],
                  scaleX: isListening || isSpeakingQuestion ? [0.86, 1.1, 0.86] : [0.9, 1, 0.9],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-[-8%] rounded-full bg-[conic-gradient(from_30deg,rgba(255,192,214,0.35),rgba(162,231,255,0.34),rgba(255,245,172,0.28),rgba(203,184,255,0.32),rgba(255,192,214,0.35))] blur-2xl"
                animate={{ opacity: isListening || isSpeakingQuestion ? [0.42, 0.74, 0.42] : [0.28, 0.42, 0.28], rotate: [0, 18, 0] }}
                transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative size-full overflow-hidden rounded-full border border-white/75 bg-white/55 shadow-[inset_0_0_24px_rgba(255,255,255,0.96),inset_-20px_-18px_42px_rgba(174,207,255,0.28),inset_18px_20px_38px_rgba(255,196,215,0.22),0_30px_70px_rgba(148,163,184,0.22)] backdrop-blur">
                <motion.div
                  className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_27%,rgba(255,255,255,0.92),transparent_24%),radial-gradient(circle_at_72%_22%,rgba(255,245,179,0.64),transparent_21%),radial-gradient(circle_at_78%_68%,rgba(133,223,255,0.42),transparent_32%),radial-gradient(circle_at_24%_72%,rgba(255,176,213,0.38),transparent_28%),conic-gradient(from_30deg_at_50%_50%,rgba(255,203,223,0.52),rgba(177,237,255,0.52),rgba(255,247,188,0.48),rgba(205,190,255,0.5),rgba(255,203,223,0.52))]"
                  animate={{ rotate: isListening || isSpeakingQuestion ? [0, 8, -6, 0] : [0, 3, 0], scale: isListening || isSpeakingQuestion ? [1, 1.04, 1] : [1, 1.015, 1] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-[9%] rounded-full bg-[radial-gradient(circle_at_48%_48%,rgba(255,255,255,0.76),rgba(255,255,255,0.18)_48%,transparent_70%)] blur-sm"
                  animate={{ opacity: [0.72, 0.95, 0.72], scale: isListening || isSpeakingQuestion ? [0.96, 1.05, 0.96] : [1, 1.02, 1] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-[3%] rounded-full border border-white/55"
                  animate={{ opacity: [0.4, 0.72, 0.4] }}
                  transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute left-1/2 top-[39%] flex w-[34%] -translate-x-1/2 items-center justify-between"
                  animate={{ y: isListening || isSpeakingQuestion ? [-1, 2, -1] : [0, -1, 0] }}
                  transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
                >
                  {[0, 1].map((eye) => (
                    <motion.div
                      key={eye}
                      className="h-[clamp(48px,10vw,62px)] w-[clamp(22px,4.5vw,28px)] rounded-full bg-neutral-950 shadow-[inset_5px_0_10px_rgba(255,255,255,0.16)]"
                      animate={{
                        x: eye === 0 ? [-eyeMotion, eyeMotion * 0.5, -eyeMotion] : [-eyeMotion * 0.5, eyeMotion, -eyeMotion * 0.5],
                        scaleY: isListening || isSpeakingQuestion ? [1, 0.82, 1, 1] : [1, 0.9, 1],
                      }}
                      transition={{
                        duration: eye === 0 ? 2.25 : 2.55,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: eye * 0.12,
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Text to speech</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Speech to text</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">{formatTime(timeLeft)}</span>
          </div>

          <div className="mt-8 w-[min(92vw,680px)] text-center">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">Speech to text</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={transcriptPreview}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto mt-4 max-h-40 overflow-y-auto text-balance text-lg leading-relaxed text-neutral-700 sm:text-xl"
              >
                {transcriptPreview}
              </motion.p>
            </AnimatePresence>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-400">
              <span>{sessionStatus}</span>
              {confidenceLabel ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-neutral-300" />
                  <span>STT confidence {confidenceLabel}</span>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-white/0 px-4 pb-7 pt-16 sm:px-5">
        <div className="pointer-events-auto mx-auto flex w-full max-w-[380px] flex-col items-center justify-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleListening}
            className={cn(
              "size-14 rounded-full bg-white text-neutral-600 shadow-[0_18px_55px_rgba(15,23,42,0.12)] hover:bg-neutral-50 sm:size-16",
              (isListening || isSpeakingQuestion) && "text-blue-600 ring-4 ring-blue-100",
            )}
            aria-label={isListening || isSpeakingQuestion ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
          >
            {isListening || isSpeakingQuestion ? <MicOff className="size-7 sm:size-8" /> : <Mic className="size-7 sm:size-8" />}
          </Button>
          <p className="text-sm font-medium text-neutral-500">
            {isSpeakingQuestion ? "Đang đọc câu hỏi" : isListening ? "Đang ghi âm" : "Nhấn để bắt đầu ghi âm"}
          </p>
        </div>
      </footer>
    </motion.div>
  )
}
