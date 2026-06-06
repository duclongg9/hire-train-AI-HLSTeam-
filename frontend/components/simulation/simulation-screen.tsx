"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  User,
  Camera,
  Lightbulb,
  X,
  Angry,
  Meh,
  Smile,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SimulationScreenProps {
  onClose: () => void
}

interface TranscriptMessage {
  speaker: "ai" | "user"
  text: string
}

const hints = [
  { text: "Hãy xin lỗi và đồng cảm với sự bất tiện của khách hàng", urgent: true },
  { text: "Kiểm tra lịch sử giao dịch thẻ tín dụng", urgent: false },
  { text: "Đề xuất miễn phí thường niên cho khách VIP", urgent: false },
  { text: "Hỏi thêm thông tin để hỗ trợ tốt hơn", urgent: false },
]

export function SimulationScreen({ onClose }: SimulationScreenProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
  const [isTalking, setIsTalking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [speakerMuted, setSpeakerMuted] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<"ai" | "user" | null>("ai")
  const [sentiment, setSentiment] = useState<"angry" | "neutral" | "happy">("angry")
  const [angryDuration, setAngryDuration] = useState(0)
  const [showUrgentPopup, setShowUrgentPopup] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([
    { speaker: "ai", text: "Tại sao phí thường niên thẻ của tôi lại cao như vậy? Tôi là khách VVIP mà!" }
  ])
  const [currentText, setCurrentText] = useState("")
  const [showHints, setShowHints] = useState(false)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const angryTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Track angry duration and show urgent popup after 15 seconds
  useEffect(() => {
    if (sentiment === "angry") {
      angryTimer.current = setInterval(() => {
        setAngryDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= 15 && !showUrgentPopup) {
            setShowUrgentPopup(true)
          }
          return newDuration
        })
      }, 1000)
    } else {
      setAngryDuration(0)
      setShowUrgentPopup(false)
      if (angryTimer.current) {
        clearInterval(angryTimer.current)
      }
    }
    return () => {
      if (angryTimer.current) {
        clearInterval(angryTimer.current)
      }
    }
  }, [sentiment, showUrgentPopup])

  // Simulate AI speaking with typing effect
  useEffect(() => {
    if (transcript.length > 0) {
      const lastMessage = transcript[transcript.length - 1]
      let index = 0
      setCurrentText("")
      
      const typeInterval = setInterval(() => {
        if (index < lastMessage.text.length) {
          setCurrentText(lastMessage.text.slice(0, index + 1))
          index++
        } else {
          clearInterval(typeInterval)
        }
      }, 50)

      return () => clearInterval(typeInterval)
    }
  }, [transcript])

  // Silence detection for hints
  useEffect(() => {
    if (!isTalking && currentSpeaker === "ai") {
      silenceTimer.current = setTimeout(() => {
        setShowHints(true)
      }, 5000)
    } else {
      setShowHints(false)
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current)
      }
    }
    return () => {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current)
      }
    }
  }, [isTalking, currentSpeaker])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isTimeLow = timeLeft < 120
  const isAngryAlert = sentiment === "angry" && angryDuration >= 15

  const handlePushToTalk = () => {
    setIsTalking(true)
    setCurrentSpeaker("user")
    
    // Simulate user response
    setTimeout(() => {
      setTranscript(prev => [...prev, { 
        speaker: "user", 
        text: "Vâng, em rất xin lỗi anh về sự bất tiện này. Em hiểu anh đang bức xúc. Để em kiểm tra tài khoản và tìm giải pháp tốt nhất cho anh nhé." 
      }])
    }, 500)
  }

  const handleReleaseTalk = () => {
    setIsTalking(false)
    
    // Simulate AI response and sentiment change
    setTimeout(() => {
      setCurrentSpeaker("ai")
      setSentiment("neutral")
      setTranscript(prev => [...prev, { 
        speaker: "ai", 
        text: "Được, vậy anh/chị có thể hỗ trợ giảm phí thường niên cho tôi không? Tôi giao dịch nhiều tại SHB rồi mà." 
      }])
    }, 1000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0F172A]"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6">
        {/* Customer Persona */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">Khách hàng VVIP - Anh Minh Tuấn</p>
            <p className="text-white/60 text-sm">Phàn nàn phí thường niên thẻ SHB Mastercard Platinum</p>
          </div>
          <div className="ml-4 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30">
            <span className="text-red-400 text-sm font-medium">Tình huống: Khó</span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "px-6 py-3 rounded-xl font-mono text-2xl font-bold transition-all relative",
            isTimeLow || isAngryAlert
              ? "bg-red-500/20 text-red-400" 
              : "bg-white/10 text-white",
            isAngryAlert && "ring-2 ring-red-500 ring-offset-2 ring-offset-[#0F172A]"
          )}>
            {(isTimeLow || isAngryAlert) && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
            {formatTime(timeLeft)}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Stage */}
      <div className="h-full flex items-center justify-center pt-24 pb-40">
        <div className="relative w-full max-w-4xl px-8">
          {/* Audio Visualizer */}
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: currentSpeaker 
                      ? [20, Math.random() * 100 + 20, 20]
                      : 20
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: currentSpeaker ? Infinity : 0,
                    delay: i * 0.02
                  }}
                  className={cn(
                    "w-1 rounded-full transition-colors",
                    currentSpeaker === "ai" 
                      ? "bg-gradient-to-t from-[#0033A0] to-[#0066FF] shadow-lg shadow-blue-500/50" 
                      : currentSpeaker === "user"
                        ? "bg-gradient-to-t from-[#F37021] to-[#FF9A5C] shadow-lg shadow-orange-500/50"
                        : "bg-white/20"
                  )}
                  style={{ minHeight: 20 }}
                />
              ))}
            </div>
          </div>

          {/* Sentiment Meter - Left Side */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-20">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-4 text-center">Cảm xúc</p>
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ scale: sentiment === "happy" ? 1.2 : 1, opacity: sentiment === "happy" ? 1 : 0.3 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    sentiment === "happy" ? "bg-emerald-500" : "bg-white/10"
                  )}
                >
                  <Smile className="w-5 h-5 text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: sentiment === "neutral" ? 1.2 : 1, opacity: sentiment === "neutral" ? 1 : 0.3 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    sentiment === "neutral" ? "bg-amber-500" : "bg-white/10"
                  )}
                >
                  <Meh className="w-5 h-5 text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: sentiment === "angry" ? 1.2 : 1, opacity: sentiment === "angry" ? 1 : 0.3 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    sentiment === "angry" ? "bg-red-500" : "bg-white/10"
                  )}
                >
                  <Angry className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Camera PiP - Top Right */}
          <div className="absolute right-0 top-0 translate-x-20">
            <div className="w-40 h-28 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <Camera className="w-8 h-8 text-white/30" />
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-emerald-500 rounded text-xs text-white font-medium">
                LIVE
              </div>
            </div>
          </div>

          {/* AI Hints - Bottom Right */}
          <AnimatePresence>
            {showHints && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-0 bottom-0 translate-x-20 translate-y-10"
              >
                <div className="w-64 bg-gradient-to-br from-[#F37021]/20 to-[#F37021]/5 backdrop-blur-xl rounded-xl p-4 border border-[#F37021]/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[#F37021]" />
                      <span className="text-[#F37021] text-sm font-semibold">Gợi ý AI</span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#0033A0] text-white text-[9px] font-medium rounded-full">
                      Chuẩn quy trình CSKH SHB
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {hints.map((hint, i) => (
                      <motion.li
                        key={hint.text}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "text-sm flex items-start gap-2",
                          hint.urgent ? "text-[#F37021] font-medium" : "text-white/80"
                        )}
                      >
                        <span className="text-[#F37021]">•</span>
                        {hint.text}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Urgent Empathy Popup - Shows when angry > 15s */}
          <AnimatePresence>
            {showUrgentPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
              >
                <div className="w-96 bg-gradient-to-br from-red-600/30 to-orange-600/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-red-500/50 shadow-2xl shadow-red-500/20">
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-red-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-red-400 font-bold text-lg">Cảnh báo: Khách hàng tức giận!</p>
                      <span className="px-2 py-0.5 bg-[#0033A0] text-white text-[9px] font-medium rounded-full">
                        Chuẩn quy trình CSKH SHB
                      </span>
                    </div>
                  </div>
                  <p className="text-white text-base leading-relaxed mb-4">
                    <strong className="text-[#F37021]">Gợi ý:</strong> Hãy xin lỗi và đồng cảm với sự bất tiện của khách hàng <strong>trước khi</strong> giải thích chính sách phí.
                  </p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-white/80 text-sm italic">
                      &ldquo;Em rất xin lỗi anh/chị vì sự bất tiện này. Em hiểu anh/chị đang rất bức xúc...&rdquo;
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowUrgentPopup(false)}
                    className="w-full mt-4 bg-[#F37021] hover:bg-[#E06010] text-white font-semibold"
                  >
                    Đã hiểu, tiếp tục
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Live Transcript */}
      <div className="absolute bottom-36 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              currentSpeaker === "ai" ? "bg-blue-400" : "bg-orange-400"
            )} />
            <span className="text-white/60 text-xs uppercase tracking-wide">
              {currentSpeaker === "ai" ? "Khách hàng" : "Nhân viên"}
            </span>
          </div>
          <motion.p 
            className="text-white text-lg leading-relaxed"
            key={transcript.length}
          >
            {currentText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-5 bg-white ml-1 align-middle"
            />
          </motion.p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
        {/* Mute Speaker */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSpeakerMuted(!speakerMuted)}
          className={cn(
            "w-14 h-14 rounded-full border-2 transition-all",
            speakerMuted 
              ? "bg-white/10 border-white/30 text-white/60" 
              : "bg-white/5 border-white/20 text-white hover:bg-white/10"
          )}
        >
          {speakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </Button>

        {/* Push to Talk */}
        <motion.button
          onMouseDown={handlePushToTalk}
          onMouseUp={handleReleaseTalk}
          onTouchStart={handlePushToTalk}
          onTouchEnd={handleReleaseTalk}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
            isTalking
              ? "bg-gradient-to-br from-[#F37021] to-[#FF9A5C] shadow-2xl shadow-orange-500/50 scale-110"
              : "bg-gradient-to-br from-[#F37021] to-[#FF9A5C] hover:shadow-xl hover:shadow-orange-500/30"
          )}
          disabled={isMuted}
        >
          <Mic className="w-10 h-10 text-white" />
          {isTalking && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-orange-300"
              animate={{ scale: [1, 1.3], opacity: [1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.button>

        {/* End Call */}
        <Button
          onClick={onClose}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-0"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      {/* Push to Talk Label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <p className="text-white/40 text-sm">Nhấn giữ để nói</p>
      </div>
    </motion.div>
  )
}
