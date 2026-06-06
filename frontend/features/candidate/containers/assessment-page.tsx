"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Brain, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Home,
  Sparkles,
  FileText,
  BookOpen,
  Timer,
  Award
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Question {
  id: number
  category: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: "easy" | "medium" | "hard"
}

const generatedQuestions: Question[] = [
  {
    id: 1,
    category: "Kiến thức sản phẩm SHB",
    question: "Thẻ tín dụng SHB Mastercard Platinum có hạn mức tối đa là bao nhiêu?",
    options: ["300 triệu VND", "500 triệu VND", "1 tỷ VND", "2 tỷ VND"],
    correctAnswer: 2,
    explanation: "Thẻ SHB Mastercard Platinum có hạn mức lên đến 1 tỷ VND, phù hợp cho khách hàng VIP.",
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
    explanation: "Lắng nghe và đồng cảm trước giúp khách hàng cảm thấy được tôn trọng, sau đó mới giải thích hoặc đề xuất giải pháp.",
    difficulty: "easy"
  },
  {
    id: 3,
    category: "Quy trình nghiệp vụ",
    question: "Thời gian xử lý khiếu nại giao dịch thẻ theo quy định SHB là bao lâu?",
    options: ["7 ngày làm việc", "15 ngày làm việc", "30 ngày làm việc", "45 ngày làm việc"],
    correctAnswer: 2,
    explanation: "Theo quy định của SHB và NHNN, thời gian xử lý khiếu nại giao dịch thẻ tối đa là 30 ngày làm việc.",
    difficulty: "hard"
  },
  {
    id: 4,
    category: "Kiến thức sản phẩm SHB",
    question: "Lãi suất tiết kiệm online SHB hiện tại cao hơn gửi tại quầy bao nhiêu %?",
    options: ["0.1%", "0.2%", "0.3%", "0.5%"],
    correctAnswer: 1,
    explanation: "SHB ưu đãi lãi suất tiết kiệm online cao hơn 0.2% so với gửi tại quầy để khuyến khích giao dịch số.",
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
    explanation: "Ngắt lời khách hàng khi họ đang tức giận sẽ làm tình huống tồi tệ hơn. Hãy để họ nói hết rồi mới phản hồi.",
    difficulty: "easy"
  },
  {
    id: 6,
    category: "Quy trình nghiệp vụ",
    question: "Để mở tài khoản thanh toán SHB, khách hàng cần tối thiểu bao nhiêu tuổi?",
    options: ["15 tuổi", "16 tuổi", "18 tuổi", "Không giới hạn"],
    correctAnswer: 0,
    explanation: "Theo quy định, người từ 15 tuổi trở lên có thể mở tài khoản thanh toán tại SHB với sự đồng ý của phụ huynh.",
    difficulty: "medium"
  },
  {
    id: 7,
    category: "Kiến thức sản phẩm SHB",
    question: "SHB Mobile Banking hỗ trợ sinh trắc học nào?",
    options: ["Chỉ Face ID", "Chỉ Touch ID", "Cả Face ID và Touch ID", "Không hỗ trợ sinh trắc học"],
    correctAnswer: 2,
    explanation: "SHB Mobile Banking hỗ trợ cả Face ID và Touch ID để tăng cường bảo mật và tiện lợi cho khách hàng.",
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
    explanation: "HEARD = Hear (Lắng nghe), Empathize (Đồng cảm), Apologize (Xin lỗi), Resolve (Giải quyết), Diagnose (Chẩn đoán).",
    difficulty: "hard"
  },
  {
    id: 9,
    category: "Quy trình nghiệp vụ",
    question: "Hạn mức chuyển tiền nhanh 24/7 qua SHB là bao nhiêu?",
    options: ["200 triệu/giao dịch", "500 triệu/giao dịch", "1 tỷ/giao dịch", "Không giới hạn"],
    correctAnswer: 1,
    explanation: "Hạn mức chuyển tiền nhanh 24/7 qua SHB tối đa 500 triệu đồng/giao dịch theo quy định NHNN.",
    difficulty: "medium"
  },
  {
    id: 10,
    category: "Kiến thức sản phẩm SHB",
    question: "Chương trình khách hàng thân thiết SHB có mấy hạng thành viên?",
    options: ["3 hạng", "4 hạng", "5 hạng", "6 hạng"],
    correctAnswer: 1,
    explanation: "SHB có 4 hạng thành viên: Member, Silver, Gold và Platinum với các quyền lợi tăng dần.",
    difficulty: "easy"
  }
]

export default function AssessmentPage() {
  const router = useRouter()
  const [stage, setStage] = useState<"intro" | "test" | "review" | "completed">("intro")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(20 * 60) // 20 minutes
  const [showExplanation, setShowExplanation] = useState(false)

  // Timer
  useEffect(() => {
    if (stage !== "test") return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setStage("completed")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [stage])

  useEffect(() => {
    if (stage !== "completed") return
    const redirectTimer = window.setTimeout(() => {
      router.push("/candidate/interview/demo-token/waiting-room")
    }, 900)
    return () => window.clearTimeout(redirectTimer)
  }, [router, stage])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: optionIndex }))
  }

  const nextQuestion = () => {
    if (currentQuestion < generatedQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setShowExplanation(false)
    } else {
      setStage("completed")
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
      setShowExplanation(false)
    }
  }

  const calculateScore = () => {
    let correct = 0
    Object.entries(answers).forEach(([qIndex, answer]) => {
      if (generatedQuestions[parseInt(qIndex)].correctAnswer === answer) {
        correct++
      }
    })
    return Math.round((correct / generatedQuestions.length) * 100)
  }

  const question = generatedQuestions[currentQuestion]
  const isAnswered = answers[currentQuestion] !== undefined
  const isCorrect = answers[currentQuestion] === question.correctAnswer
  const isTimeLow = timeLeft < 120

  // Intro Stage
  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0033A0] to-[#0055DD] flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-foreground">AI Assessment</h1>
                    <p className="text-xs text-muted-foreground">Bài test kiến thức</p>
                  </div>
                </div>
              </div>
              <Link href="/jobs">
                <Button variant="ghost">
                  <Home className="w-4 h-4 mr-2" />
                  Về trang chính
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0033A0] to-[#0055DD] flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">Bài test AI Generated</h2>
              <p className="text-muted-foreground">
                AI đã tạo bài test dựa trên vị trí <strong>Chuyên viên CSKH</strong> của bạn
              </p>
            </div>

            <Card className="p-8 mb-8">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{generatedQuestions.length}</p>
                  <p className="text-sm text-muted-foreground">Câu hỏi</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <Timer className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">20</p>
                  <p className="text-sm text-muted-foreground">Phút</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <Award className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">70%</p>
                  <p className="text-sm text-muted-foreground">Điểm đạt</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 mb-8 bg-gradient-to-br from-[#0033A0]/5 to-[#0033A0]/10 border-[#0033A0]/20">
              <div className="flex items-start gap-4">
                <BookOpen className="w-6 h-6 text-[#0033A0] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Nội dung bài test</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Kiến thức sản phẩm SHB (Thẻ, Tiết kiệm, Mobile Banking)</li>
                    <li>• Kỹ năng chăm sóc khách hàng (Xử lý khiếu nại, Giao tiếp)</li>
                    <li>• Quy trình nghiệp vụ ngân hàng</li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="flex justify-center">
              <Button
                onClick={() => setStage("test")}
                className="bg-[#0033A0] hover:bg-[#002080] text-white font-semibold px-8 py-6 text-lg"
              >
                <Brain className="w-5 h-5 mr-2" />
                Bắt đầu làm bài
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Completed Stage
  if (stage === "completed") {
    const score = calculateScore()
    const passed = score >= 70

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg"
        >
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
            passed 
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
              : "bg-gradient-to-br from-amber-400 to-amber-600"
          )}>
            {passed ? (
              <CheckCircle className="w-12 h-12 text-white" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-white" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            {passed ? "Chúc mừng bạn đã hoàn thành!" : "Bài test đã kết thúc"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {passed 
              ? "Bạn đã vượt qua bài test kiến thức. Hãy tiếp tục với phần phỏng vấn AI!"
              : "Bạn chưa đạt điểm yêu cầu. Hãy ôn tập và thử lại."
            }
          </p>
          
          <Card className="p-8 mb-8">
            <div className={cn(
              "text-6xl font-bold mb-2",
              passed ? "text-emerald-600" : "text-amber-600"
            )}>
              {score}/100
            </div>
            <p className={cn(
              "font-medium",
              passed ? "text-emerald-600" : "text-amber-600"
            )}>
              {passed ? "Đạt yêu cầu!" : "Chưa đạt"}
            </p>
            
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Object.values(answers).filter((a, i) => generatedQuestions[i].correctAnswer === a).length}
                </p>
                <p className="text-xs text-muted-foreground">Đúng</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Object.values(answers).filter((a, i) => generatedQuestions[i].correctAnswer !== a).length}
                </p>
                <p className="text-xs text-muted-foreground">Sai</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatTime(20 * 60 - timeLeft)}
                </p>
                <p className="text-xs text-muted-foreground">Thời gian</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 justify-center">
            <Link href="/jobs">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Về trang chính
              </Button>
            </Link>
            {passed ? (
              <Link href="/candidate/interview/demo-token/waiting-room">
                <Button className="bg-[#F37021] hover:bg-[#E06010] text-white">
                  Tiếp tục phỏng vấn
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={() => {
                  setStage("intro")
                  setCurrentQuestion(0)
                  setAnswers({})
                  setTimeLeft(20 * 60)
                }}
                className="bg-[#0033A0] hover:bg-[#002080] text-white"
              >
                Làm lại
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // Test Stage
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0033A0] to-[#0055DD] flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">Bài test kiến thức</h1>
                  <p className="text-xs text-muted-foreground">
                    Câu {currentQuestion + 1}/{generatedQuestions.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress */}
              <div className="flex items-center gap-2">
                {generatedQuestions.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentQuestion ? "w-4 bg-[#0033A0]" :
                      answers[i] !== undefined ? "bg-emerald-500" : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
              
              {/* Timer */}
              <div className={cn(
                "px-4 py-2 rounded-xl font-mono text-lg font-bold transition-all flex items-center gap-2",
                isTimeLow ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"
              )}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Category & Difficulty */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#0033A0]/10 text-[#0033A0] text-sm font-medium rounded-full">
                {question.category}
              </span>
              <span className={cn(
                "px-3 py-1 text-sm font-medium rounded-full",
                question.difficulty === "easy" ? "bg-emerald-100 text-emerald-700" :
                question.difficulty === "medium" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              )}>
                {question.difficulty === "easy" ? "Dễ" : question.difficulty === "medium" ? "Trung bình" : "Khó"}
              </span>
            </div>

            {/* Question */}
            <Card className="p-8 mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                {question.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleAnswer(i)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4",
                      answers[currentQuestion] === i
                        ? showExplanation
                          ? i === question.correctAnswer
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-red-500 bg-red-50"
                          : "border-[#0033A0] bg-[#0033A0]/5"
                        : showExplanation && i === question.correctAnswer
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm",
                      answers[currentQuestion] === i
                        ? showExplanation
                          ? i === question.correctAnswer
                            ? "bg-emerald-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-[#0033A0] text-white"
                        : showExplanation && i === question.correctAnswer
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-600"
                    )}>
                      {showExplanation ? (
                        i === question.correctAnswer ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : answers[currentQuestion] === i ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </div>
                    <span className="text-foreground">{option}</span>
                  </motion.button>
                ))}
              </div>
            </Card>

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className={cn(
                    "p-6 mb-6",
                    isCorrect 
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-amber-50 border-amber-200"
                  )}>
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={cn(
                          "font-semibold mb-1",
                          isCorrect ? "text-emerald-700" : "text-amber-700"
                        )}>
                          {isCorrect ? "Chính xác!" : "Chưa đúng"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Câu trước
              </Button>

              <div className="flex gap-3">
                {isAnswered && !showExplanation && (
                  <Button
                    variant="outline"
                    onClick={() => setShowExplanation(true)}
                  >
                    Xem giải thích
                  </Button>
                )}
                
                <Button
                  onClick={nextQuestion}
                  disabled={!isAnswered}
                  className="bg-[#0033A0] hover:bg-[#002080] text-white"
                >
                  {currentQuestion === generatedQuestions.length - 1 ? "Hoàn thành" : "Câu tiếp"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
