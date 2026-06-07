"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot, 
  InputOTPSeparator 
} from "@/components/ui/input-otp"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { 
  Brain, Clock, ChevronLeft, ChevronRight, CheckCircle, 
  AlertTriangle, Home, Sparkles, FileText, BookOpen, Timer, Award, Flag, UserRound, ShieldAlert, Lock, Mail, ServerCrash
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAssessmentStore } from "../store/use-assessment-store"
import { toast } from "sonner"

// Keep hardcoded questions for demo
const generatedQuestions = [
  {
    id: 1,
    category: "Kiến thức sản phẩm SHB",
    question: "Thẻ tín dụng SHB Mastercard Platinum có hạn mức tối đa là bao nhiêu?",
    options: ["300 triệu VND", "500 triệu VND", "1 tỷ VND", "2 tỷ VND"],
    correctAnswer: 2,
    difficulty: "medium"
  },
  {
    id: 2,
    category: "Kỹ năng CSKH",
    question: "Khi khách hàng phàn nàn về phí dịch vụ, bước đầu tiên bạn nên làm gì?",
    options: [
      "Giải thích chính sách phí ngay lập tức",
      "Lắng nghe và thể hiện sự đồng cảm",
      "Chuyển cuộc gọi cho quản lý",
      "Đề xuất giảm phí ngay"
    ],
    correctAnswer: 1,
    difficulty: "easy"
  },
  {
    id: 3,
    category: "Quy trình nghiệp vụ",
    question: "Thời gian xử lý khiếu nại giao dịch thẻ theo quy định SHB là bao lâu?",
    options: ["7 ngày làm việc", "15 ngày làm việc", "30 ngày làm việc", "45 ngày làm việc"],
    correctAnswer: 2,
    difficulty: "hard"
  },
  {
    id: 4,
    category: "Kiến thức sản phẩm SHB",
    question: "Lãi suất tiết kiệm online SHB hiện tại cao hơn gửi tại quầy bao nhiêu %?",
    options: ["0.1%", "0.2%", "0.3%", "0.5%"],
    correctAnswer: 1,
    difficulty: "medium"
  },
  {
    id: 5,
    category: "Kỹ năng CSKH",
    question: "Trong tình huống khách hàng VVIP đang rất tức giận, bạn KHÔNG nên làm gì?",
    options: [
      "Giữ bình tĩnh và lắng nghe",
      "Ngắt lời để giải thích nhanh",
      "Xin lỗi vì sự bất tiện",
      "Đề xuất chuyển lên cấp quản lý nếu cần"
    ],
    correctAnswer: 1,
    difficulty: "easy"
  },
  {
    id: 6,
    category: "Quy trình nghiệp vụ",
    question: "Để mở tài khoản thanh toán SHB, khách hàng cần tối thiểu bao nhiêu tuổi?",
    options: ["15 tuổi", "16 tuổi", "18 tuổi", "Không giới hạn"],
    correctAnswer: 0,
    difficulty: "medium"
  },
  {
    id: 7,
    category: "Kiến thức sản phẩm SHB",
    question: "SHB Mobile Banking hỗ trợ sinh trắc học nào?",
    options: ["Chỉ Face ID", "Chỉ Touch ID", "Cả Face ID và Touch ID", "Không hỗ trợ sinh trắc học"],
    correctAnswer: 2,
    difficulty: "easy"
  },
  {
    id: 8,
    category: "Kỹ năng CSKH",
    question: "Công thức HEARD trong xử lý khiếu nại bao gồm những yếu tố nào?",
    options: [
      "Hear, Empathize, Apologize, Resolve, Diagnose",
      "Help, Explain, Assist, Review, Deliver",
      "Handle, Evaluate, Act, Report, Document",
      "Hear, Execute, Ask, Respond, Direct"
    ],
    correctAnswer: 0,
    difficulty: "hard"
  },
  {
    id: 9,
    category: "Quy trình nghiệp vụ",
    question: "Hạn mức chuyển tiền nhanh 24/7 qua SHB là bao nhiêu?",
    options: ["200 triệu/giao dịch", "500 triệu/giao dịch", "1 tỷ/giao dịch", "Không giới hạn"],
    correctAnswer: 1,
    difficulty: "medium"
  },
  {
    id: 10,
    category: "Kiến thức sản phẩm SHB",
    question: "Chương trình khách hàng thân thiết SHB có mấy hạng thành viên?",
    options: ["3 hạng", "4 hạng", "5 hạng", "6 hạng"],
    correctAnswer: 1,
    difficulty: "easy"
  }
]

export default function AssessmentPage() {
  const router = useRouter()
  const store = useAssessmentStore()
  
  const [mounted, setMounted] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  
  // Auth states
  const [isDeviceAuthorized, setIsDeviceAuthorized] = useState(false)
  const [email, setEmail] = useState("")
  const [inputPasscode, setInputPasscode] = useState("")
  const [isLoadingPasscode, setIsLoadingPasscode] = useState(false)
  const [passcodeSent, setPasscodeSent] = useState(false)
  const [mockPasscodeValue, setMockPasscodeValue] = useState("") // For easy demoing

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Check if device is authorized (On-site logic mock)
    const isAuthorized = localStorage.getItem("SHB_DEVICE_AUTHORIZED")
    if (isAuthorized === "true") {
      setIsDeviceAuthorized(true)
    }
  }, [])

  // Anti-Cheat: Security Event Listeners
  useEffect(() => {
    if (store.stage !== "test") return

    // Prevent context menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      toast.warning("Hành động bị cấm: Không được click chuột phải trong lúc làm bài!")
    }

    // Prevent keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") || // DevTools
        (e.ctrlKey && e.key === "c") || // Copy
        (e.ctrlKey && e.key === "v") || // Paste
        (e.metaKey && e.key === "c") || // Mac Copy
        (e.metaKey && e.key === "v")    // Mac Paste
      ) {
        e.preventDefault()
        toast.error("Hành động bị cấm: Không được sử dụng phím tắt trong lúc làm bài!")
      }
    }

    // Tab Switch tracking
    const handleVisibilityChange = () => {
      if (document.hidden) {
        store.incrementViolation()
        const newViolations = store.violationCount + 1
        
        if (newViolations >= 3) {
          toast.error("BẠN ĐÃ VI PHẠM 3 LẦN. Hệ thống tự động thu bài!")
          store.setStage("completed")
        } else {
          toast.warning(`Cảnh báo vi phạm! Bạn đã thoát khỏi màn hình làm bài (${newViolations}/3 lần). Quá 3 lần sẽ tự động thu bài.`)
        }
      }
    }

    window.addEventListener("contextmenu", handleContextMenu)
    window.addEventListener("keydown", handleKeyDown)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu)
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [store])

  // Timer logic - reliable interval setup
  useEffect(() => {
    if (store.stage !== "test") return
    
    const interval = setInterval(() => {
      store.setTimeLeft((prev) => {
        if (prev <= 1) {
          store.setStage("completed")
          toast.info("Hết thời gian! Hệ thống đã tự động thu bài.")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [store.stage, store])

  // Completed redirect
  useEffect(() => {
    if (store.stage !== "completed") return
    const redirectTimer = window.setTimeout(() => {
      router.push("/candidate/interview/demo-token/waiting-room")
    }, 4000) // Give user 4 seconds to see their score
    return () => window.clearTimeout(redirectTimer)
  }, [router, store.stage])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const calculateScore = () => {
    let correct = 0
    Object.entries(store.answers).forEach(([qIndex, answer]) => {
      if (generatedQuestions[parseInt(qIndex)].correctAnswer === answer) {
        correct++
      }
    })
    // Penalty for violations
    let penalty = store.violationCount * 5 // -5% per violation
    if (penalty > 0) {
        toast.error(`Trừ ${penalty} điểm vì vi phạm quy chế thi.`)
    }
    
    const baseScore = Math.round((correct / generatedQuestions.length) * 100)
    return Math.max(0, baseScore - penalty)
  }

  // --- Auth Handlers ---
  const handleMockAuthorize = () => {
    localStorage.setItem("SHB_DEVICE_AUTHORIZED", "true")
    setIsDeviceAuthorized(true)
    toast.success("Thiết bị đã được xác thực thành công (Mock)!")
  }

  const handleSendPasscode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Vui lòng nhập Email!")
      return
    }
    
    setIsLoadingPasscode(true)
    try {
      const res = await fetch("/api/send-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      
      if (data.success) {
        setPasscodeSent(true)
        setMockPasscodeValue(data.passcode) // For demo ONLY
        toast.success("Mã Passcode đã được gửi tới Email của bạn!")
      } else {
        toast.error("Có lỗi xảy ra khi gửi Passcode.")
      }
    } catch (err) {
      toast.error("Hệ thống lỗi (Fetch error).")
    } finally {
      setIsLoadingPasscode(false)
    }
  }

  const handleVerifyPasscode = () => {
    if (inputPasscode === mockPasscodeValue && inputPasscode.length === 6) {
      toast.success("Xác thực Passcode thành công!")
      store.setPasscode(inputPasscode)
      store.setStage("intro")
    } else {
      toast.error("Mã Passcode không chính xác!")
    }
  }

  if (!mounted) return null

  // ==========================================
  // AUTH STAGE (SECURE ENTRY)
  // ==========================================
  if (store.stage === "auth") {
    if (!isDeviceAuthorized) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <Card className="max-w-md p-8 text-center shadow-lg border-t-4 border-t-red-500">
            <ServerCrash className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold text-slate-800 font-[var(--font-be-vietnam-pro)]">
              Thiết bị không được cấp quyền
            </h2>
            <p className="mb-8 text-slate-600">
              Bạn chỉ có thể thực hiện bài thi này trên các thiết bị máy trạm được chỉ định tại khu vực thi On-site của SHB.
            </p>
            <Button onClick={handleMockAuthorize} variant="outline" className="w-full text-[#004C97] border-[#004C97]">
              (Dev) Cấp quyền thiết bị này
            </Button>
          </Card>
        </div>
      )
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-[#f0f4f8] p-6">
        <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-t-[#004C97] bg-white">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#004C97]/10">
              <Lock className="h-8 w-8 text-[#004C97]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 font-[var(--font-be-vietnam-pro)]">
              Xác thực ứng viên
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Nhập email để nhận mã Passcode bí mật từ hệ thống.
            </p>
          </div>

          {!passcodeSent ? (
            <form onSubmit={handleSendPasscode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-slate-700">Email ứng tuyển</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="ungvien@gmail.com" 
                    className="pl-10 border-slate-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoadingPasscode} className="w-full bg-[#004C97] hover:bg-[#003875] text-white py-6 text-base font-semibold transition-colors">
                {isLoadingPasscode ? "Đang gửi..." : "Nhận Passcode"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm text-center w-full border border-emerald-200">
                Đã gửi passcode tới <strong>{email}</strong>
                <br />
                <span className="text-xs text-emerald-600">(Mock Demo: {mockPasscodeValue})</span>
              </div>
              
              <div className="w-full space-y-3">
                <Label className="text-center block font-semibold text-slate-700">Nhập mã 6 chữ số</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={inputPasscode} onChange={setInputPasscode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-lg font-bold border-slate-300" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-lg font-bold border-slate-300" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-lg font-bold border-slate-300" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="w-12 h-14 text-lg font-bold border-slate-300" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-lg font-bold border-slate-300" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-lg font-bold border-slate-300" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button 
                onClick={handleVerifyPasscode} 
                disabled={inputPasscode.length !== 6} 
                className="w-full bg-[#F37021] hover:bg-[#d95f18] text-white py-6 text-base font-bold shadow-md transition-colors"
              >
                Xác thực & Vào phòng thi
              </Button>
            </div>
          )}
        </Card>
      </div>
    )
  }

  // ==========================================
  // INTRO STAGE
  // ==========================================
  if (store.stage === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-[var(--font-inter)]">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img alt="SHB Logo" src="/Logo-SHB-EN.png" className="h-8 w-auto object-contain bg-transparent" />
                <div className="h-6 w-px bg-slate-200"></div>
                <h1 className="font-semibold text-slate-800 font-[var(--font-be-vietnam-pro)]">Hệ Thống Thi Trực Tuyến</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl"
          >
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold text-[#004C97] font-[var(--font-be-vietnam-pro)]">Nội Quy Phòng Thi</h2>
              <p className="text-slate-600">
                Ứng viên <strong>{email}</strong> vui lòng đọc kỹ nội quy trước khi làm bài.
              </p>
            </div>

            <Card className="mb-8 overflow-hidden shadow-md border-slate-200 bg-white">
              <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-red-600" />
                <h3 className="font-bold text-red-800">CẢNH BÁO GIAN LẬN (ANTI-CHEAT ACTIVE)</h3>
              </div>
              <div className="p-6 space-y-4 text-slate-700 leading-relaxed">
                <p>1. Bài thi sẽ tự động ghi nhận mọi hành vi chuyển tab/cửa sổ. <strong>Quá 3 lần</strong> hệ thống sẽ tự động thu bài và đánh rớt.</p>
                <p>2. Chức năng chuột phải, bôi đen, copy (Ctrl+C), dán (Ctrl+V) và F12 đã bị vô hiệu hóa.</p>
                <p>3. Trong quá trình thi, nghiêm cấm sử dụng điện thoại và tài liệu. Camera an ninh tại phòng thi đang hoạt động.</p>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <FileText className="mx-auto mb-2 h-6 w-6 text-[#004C97]" />
                    <p className="font-bold text-slate-800">{generatedQuestions.length} Câu hỏi</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <Timer className="mx-auto mb-2 h-6 w-6 text-[#F37021]" />
                    <p className="font-bold text-slate-800">20 Phút</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <Award className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                    <p className="font-bold text-slate-800">70% Đạt</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-center">
              <Button
                onClick={() => store.startAssessment()}
                className="bg-[#004C97] px-10 py-6 text-lg font-bold text-white hover:bg-[#003875] shadow-lg transition-all hover:scale-105"
              >
                <Brain className="mr-2 h-5 w-5" />
                Đồng ý nội quy & Bắt đầu làm bài
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // ==========================================
  // COMPLETED STAGE
  // ==========================================
  if (store.stage === "completed") {
    const score = calculateScore()
    const passed = score >= 70

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto w-full max-w-lg text-center"
        >
          <div className={cn(
            "mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-lg",
            passed ? "bg-emerald-500" : "bg-red-500"
          )}>
            {passed ? <CheckCircle className="h-12 w-12 text-white" /> : <AlertTriangle className="h-12 w-12 text-white" />}
          </div>
          <h2 className="mb-3 text-3xl font-bold text-slate-800 font-[var(--font-be-vietnam-pro)]">
            {passed ? "Chúc mừng bạn đã hoàn thành!" : "Bài test đã kết thúc"}
          </h2>
          <p className="mb-8 text-slate-600">
            {passed ? "Đang chuyển hướng đến phòng chờ phỏng vấn..." : "Bạn chưa đạt điểm yêu cầu. Đang chuyển hướng..."}
          </p>
          
          <Card className="mb-8 p-8 shadow-xl border-t-4 border-t-[#004C97]">
            <div className={cn("mb-2 text-7xl font-bold", passed ? "text-emerald-600" : "text-red-600")}>
              {score}<span className="text-3xl text-slate-400">/100</span>
            </div>
            
            {store.violationCount > 0 && (
               <div className="mt-4 text-sm text-red-600 bg-red-50 py-2 rounded-md border border-red-200">
                  Phát hiện {store.violationCount} lần vi phạm quy chế (Trừ {store.violationCount * 5} điểm).
               </div>
            )}
            
            <div className="mt-8 grid grid-cols-2 gap-4 border-t pt-6">
              <div>
                <p className="text-xl font-bold text-slate-800">{formatTime(20 * 60 - store.timeLeft)}</p>
                <p className="text-xs text-slate-500">Thời gian làm</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{Object.keys(store.answers).length}/{generatedQuestions.length}</p>
                <p className="text-xs text-slate-500">Số câu đã trả lời</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ==========================================
  // TEST STAGE (SPLIT SCREEN LAYOUT)
  // ==========================================
  const question = generatedQuestions[store.currentQuestion]
  const isTimeLow = store.timeLeft < 5 * 60 // under 5 minutes
  const totalQuestions = generatedQuestions.length
  const answeredCount = Object.keys(store.answers).length
  const isCurrentFlagged = store.flaggedQuestions[store.currentQuestion]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-[var(--font-inter)] select-none">
      {/* Top Bar */}
      <header className="relative flex h-16 shrink-0 items-center justify-between bg-white px-6 shadow-sm z-20 border-b border-transparent">
        <div className="flex items-center gap-6">
          <img alt="SHB" src="/Logo-SHB-EN.png" className="h-8 w-auto object-contain bg-transparent" />
          <div className="h-8 w-px bg-slate-200"></div>
          <h1 className="font-semibold text-slate-800 text-lg font-[var(--font-be-vietnam-pro)]">
            Quicktest - Chuyên viên CSKH
          </h1>
        </div>
        <div className="flex items-center gap-8">
          {/* Timer moved to Top Bar */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-xl font-bold transition-colors duration-500", 
            isTimeLow ? "bg-red-50 text-[#F37021] animate-pulse ring-1 ring-[#F37021]" : "bg-blue-50 text-[#004C97]"
          )}>
            <Clock className="h-5 w-5" />
            {formatTime(store.timeLeft)}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">Candidate</p>
              <p className="text-xs text-slate-500">{email || "candidate@shb.com"}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <UserRound className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </div>
        
        {/* Progress line seamlessly at the bottom of header */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100">
            <div 
              className="h-full bg-gradient-to-r from-[#004C97] to-[#F37021] transition-all duration-500 ease-out" 
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
        </div>
      </header>

      {/* Main Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area (75%) */}
        <main className="flex-1 overflow-y-auto px-10 py-10">
          <div className="mx-auto max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={store.currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Question Info */}
                <div className="mb-4">
                  <span className="rounded-md bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 tracking-wide uppercase">
                    {question.category}
                  </span>
                </div>

                {/* Question Text & Flag Button */}
                <div className="mb-10 flex items-start justify-between gap-8">
                  <h2 className="text-[24px] font-semibold leading-[1.5] text-slate-900 font-[var(--font-be-vietnam-pro)]">
                    <span className="mr-2 text-[#004C97]">Câu {store.currentQuestion + 1}:</span>
                    {question.question}
                  </h2>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "shrink-0 gap-2 transition-all rounded-full px-5 py-5 border-2", 
                      isCurrentFlagged 
                        ? "border-[#F37021] bg-orange-50 text-[#F37021] hover:bg-orange-100 hover:text-[#F37021]" 
                        : "border-slate-200 text-slate-500 hover:text-slate-700"
                    )}
                    onClick={() => store.toggleFlag(store.currentQuestion)}
                  >
                    <Flag className={cn("h-4 w-4", isCurrentFlagged ? "fill-[#F37021] text-[#F37021]" : "")} />
                    {isCurrentFlagged ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}
                  </Button>
                </div>

                {/* Options Cards */}
                <div className="space-y-4">
                  {question.options.map((opt, i) => {
                    const isSelected = store.answers[store.currentQuestion] === i
                    return (
                      <Card 
                        key={i} 
                        className={cn(
                          "cursor-pointer border-2 p-6 rounded-[16px] transition-all duration-200 relative overflow-hidden group", 
                          isSelected 
                            ? "border-[#004C97] bg-[#004C97]/5 shadow-sm" 
                            : "border-slate-200 hover:border-[#004C97]/40 hover:bg-slate-50"
                        )} 
                        onClick={() => store.answerQuestion(store.currentQuestion, i)}
                      >
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors z-10", 
                            isSelected ? "bg-[#004C97] text-white shadow-sm" : "bg-slate-200 text-slate-600 group-hover:bg-[#004C97]/20"
                          )}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className={cn(
                            "text-lg leading-relaxed z-10 font-medium transition-colors",
                            isSelected ? "text-[#004C97]" : "text-slate-700"
                          )}>
                            {opt}
                          </span>
                        </div>
                        
                        {/* Selected Checkmark overlay */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="absolute right-6 top-1/2 -translate-y-1/2 text-[#004C97]"
                            >
                              <CheckCircle className="h-6 w-6" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Nav */}
            <div className="mt-14 flex items-center justify-between border-t border-slate-200 pt-8">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={store.prevQuestion} 
                disabled={store.currentQuestion === 0}
                className="text-slate-600 border-slate-300 hover:bg-slate-100 px-6 py-6 rounded-xl"
              >
                <ChevronLeft className="mr-2 h-5 w-5" /> Câu trước
              </Button>
              <Button 
                size="lg" 
                className="bg-[#004C97] text-white hover:bg-[#003875] px-8 py-6 rounded-xl shadow-md transition-transform active:scale-95" 
                onClick={() => store.nextQuestion(totalQuestions)} 
                disabled={store.currentQuestion === totalQuestions - 1}
              >
                Câu tiếp theo <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </main>

        {/* Quiz Sidebar (25%) */}
        <aside className="flex w-[320px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-[-10px_0_20px_rgba(0,0,0,0.02)] z-10">
          
          {/* Status Tracker */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="mb-6 font-bold text-slate-800 uppercase tracking-wide text-sm font-[var(--font-be-vietnam-pro)]">
              Bảng điều khiển
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {generatedQuestions.map((_, i) => {
                const isAnswered = store.answers[i] !== undefined
                const isFlagged = store.flaggedQuestions[i]
                const isCurrent = store.currentQuestion === i
                
                return (
                  <button 
                    key={i} 
                    onClick={() => store.jumpToQuestion(i)} 
                    className={cn(
                      "relative flex h-12 items-center justify-center rounded-xl border-2 font-bold transition-all hover:border-[#004C97]", 
                      isCurrent ? "ring-2 ring-[#004C97] ring-offset-2 scale-105" : "",
                      isFlagged ? "border-[#F37021] bg-orange-50 text-[#F37021]" : 
                      isAnswered ? "border-[#004C97] bg-[#004C97] text-white shadow-sm" : 
                      "border-slate-200 bg-white text-slate-500"
                    )}
                  >
                    {i + 1}
                    {isFlagged && (
                      <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F37021] text-white ring-2 ring-white shadow-sm">
                        <Flag className="h-2.5 w-2.5 fill-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* Legend Mapping exactly as requested */}
            <div className="mt-10 space-y-4 text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-md bg-[#004C97] shadow-sm"></div> Đã chọn đáp án
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-md border-2 border-[#F37021] bg-orange-50 flex items-center justify-center">
                   <Flag className="h-3 w-3 text-[#F37021] fill-[#F37021]" />
                </div> 
                Đánh dấu xem lại
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-md border-2 border-slate-200 bg-white"></div> Chưa xem
              </div>
            </div>
          </div>

          {/* Sticky Submit Button */}
          <div className="border-t border-slate-200 p-6 bg-white shrink-0">
            <Button 
              size="lg" 
              className="w-full bg-[#F37021] text-lg font-bold text-white shadow-lg hover:bg-[#d95f18] py-7 rounded-xl transition-transform active:scale-95" 
              onClick={() => setShowConfirmSubmit(true)}
            >
              Nộp bài thi
            </Button>
          </div>
        </aside>
      </div>

      {/* Double Confirmation Modal */}
      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent className="rounded-2xl border-t-4 border-t-[#F37021] p-0 overflow-hidden">
          <div className="p-6">
            <AlertDialogHeader className="mb-4">
              <AlertDialogTitle className="text-2xl font-bold font-[var(--font-be-vietnam-pro)] text-slate-800">
                Xác nhận nộp bài
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-slate-600 pt-2">
                {answeredCount < totalQuestions 
                  ? <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 font-medium mb-4">
                      CẢNH BÁO: Bạn vẫn còn <strong>{totalQuestions - answeredCount} câu chưa trả lời.</strong>
                    </div> 
                  : <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 font-medium mb-4">
                      Tuyệt vời! Bạn đã hoàn thành tất cả câu hỏi.
                    </div>
                }
                Thời gian vẫn còn <strong>{formatTime(store.timeLeft)}</strong>. 
                Sau khi xác nhận nộp bài, bạn sẽ <strong>KHÔNG</strong> thể quay lại thay đổi đáp án.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
              <AlertDialogCancel className="rounded-xl border-slate-300 py-6 font-semibold">
                Quay lại làm tiếp
              </AlertDialogCancel>
              <AlertDialogAction 
                className="rounded-xl bg-[#F37021] py-6 font-bold text-white hover:bg-[#d95f18] shadow-md" 
                onClick={() => store.setStage("completed")}
              >
                Xác nhận nộp ngay
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
