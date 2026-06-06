"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  ChevronLeft,
  Home,
  Award,
  FileText,
  Mic,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Brain,
  Clock,
  Target,
  Star
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"

const skillData = [
  { skill: "Giao tiếp", score: 88, fullMark: 100 },
  { skill: "Đồng cảm", score: 85, fullMark: 100 },
  { skill: "Kiến thức SP", score: 82, fullMark: 100 },
  { skill: "Giải quyết VĐ", score: 78, fullMark: 100 },
  { skill: "Nghiệp vụ", score: 80, fullMark: 100 },
]

const strengths = [
  "Kỹ năng giao tiếp rõ ràng, mạch lạc",
  "Thể hiện sự đồng cảm tốt với khách hàng",
  "Hiểu biết tốt về sản phẩm SHB",
  "Phản ứng nhanh trong các tình huống"
]

const improvements = [
  "Cần cải thiện kỹ năng xử lý khiếu nại phức tạp",
  "Nên học thêm về quy trình nghiệp vụ thẻ tín dụng",
  "Thời gian phản hồi có thể nhanh hơn"
]

export default function ResultsPage() {
  const testScore = 85
  const interviewScore = 82
  const overallScore = Math.round((testScore + interviewScore) / 2)
  const [status] = useState<"waiting" | "approved" | "rejected">("waiting")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/candidate" className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">Kết quả & Feedback</h1>
                  <p className="text-xs text-muted-foreground">Đánh giá từ AI</p>
                </div>
              </div>
            </div>
            <Link href="/candidate">
              <Button variant="ghost">
                <Home className="w-4 h-4 mr-2" />
                Về trang chính
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className={cn(
            "p-6 border-2",
            status === "approved" ? "bg-emerald-50 border-emerald-200" :
            status === "rejected" ? "bg-red-50 border-red-200" :
            "bg-amber-50 border-amber-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  status === "approved" ? "bg-emerald-500" :
                  status === "rejected" ? "bg-red-500" :
                  "bg-amber-500"
                )}>
                  {status === "approved" ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : status === "rejected" ? (
                    <TrendingDown className="w-6 h-6 text-white" />
                  ) : (
                    <Clock className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className={cn(
                    "text-xl font-bold",
                    status === "approved" ? "text-emerald-700" :
                    status === "rejected" ? "text-red-700" :
                    "text-amber-700"
                  )}>
                    {status === "approved" ? "Chúc mừng! Bạn đã trúng tuyển" :
                     status === "rejected" ? "Rất tiếc, bạn chưa đạt yêu cầu" :
                     "Đang chờ HR xem xét"}
                  </h2>
                  <p className="text-muted-foreground">
                    {status === "approved" ? "HR sẽ liên hệ với bạn trong vòng 2-3 ngày làm việc" :
                     status === "rejected" ? "Bạn có thể ứng tuyển lại sau 3 tháng" :
                     "HR đang xem xét hồ sơ của bạn. Kết quả sẽ được thông báo qua email."}
                  </p>
                </div>
              </div>
              {status === "waiting" && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Thời gian chờ dự kiến</p>
                  <p className="text-2xl font-bold text-amber-600">2-3 ngày</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-foreground mb-1">{testScore}</p>
            <p className="text-sm text-muted-foreground">Bài test kiến thức</p>
            <div className="mt-3 flex items-center justify-center gap-1 text-emerald-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Đạt yêu cầu (≥70)</span>
            </div>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F37021]/20 flex items-center justify-center mx-auto mb-3">
              <Mic className="w-6 h-6 text-[#F37021]" />
            </div>
            <p className="text-4xl font-bold text-foreground mb-1">{interviewScore}</p>
            <p className="text-sm text-muted-foreground">Phỏng vấn AI</p>
            <div className="mt-3 flex items-center justify-center gap-1 text-emerald-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Đạt yêu cầu (≥70)</span>
            </div>
          </Card>
          
          <Card className="p-6 text-center bg-gradient-to-br from-[#0033A0] to-[#0055DD] text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <p className="text-4xl font-bold mb-1">{overallScore}</p>
            <p className="text-sm text-white/80">Điểm tổng hợp</p>
            <div className="mt-3 flex items-center justify-center gap-1 text-emerald-300 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Top 15% ứng viên</span>
            </div>
          </Card>
        </motion.div>

        {/* Detailed Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          {/* Radar Chart */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#0033A0]" />
              Biểu đồ năng lực
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis 
                    dataKey="skill" 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Radar
                    name="Năng lực"
                    dataKey="score"
                    stroke="#0033A0"
                    fill="#0033A0"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Strengths & Improvements */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#F37021]" />
              Phân tích AI
            </h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-emerald-600 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Điểm mạnh
              </h4>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-amber-600 mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Cần cải thiện
              </h4>
              <ul className="space-y-2">
                {improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-600 text-xs">!</span>
                    </div>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-4"
        >
          <Link href="/candidate">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Về trang chính
            </Button>
          </Link>
          <Link href="/candidate/interview">
            <Button className="bg-[#F37021] hover:bg-[#E06010] text-white">
              Luyện tập thêm
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
