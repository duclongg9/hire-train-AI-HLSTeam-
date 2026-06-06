"use client"

import { motion } from "framer-motion"
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend
} from "recharts"

// Aggregated skills data for top 3 candidates vs JD baseline
const aggregatedSkillsData = [
  { subject: "CSKH", top3Avg: 83, jdBaseline: 85, fullMark: 100 },
  { subject: "Tín dụng", top3Avg: 79, jdBaseline: 80, fullMark: 100 },
  { subject: "Tư vấn", top3Avg: 83, jdBaseline: 85, fullMark: 100 },
  { subject: "Sản phẩm SHB", top3Avg: 72, jdBaseline: 80, fullMark: 100 },
  { subject: "Tiếng Anh", top3Avg: 81, jdBaseline: 75, fullMark: 100 },
]

export function SkillsComparisonChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">So sánh kỹ năng Top 3 ứng viên vs JD</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Biểu đồ radar so sánh năng lực trung bình của 3 ứng viên hàng đầu với yêu cầu JD
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0033A0]" />
            <span className="text-sm text-muted-foreground">Top 3 Ứng viên</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F37021]" />
            <span className="text-sm text-muted-foreground">Yêu cầu JD</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={aggregatedSkillsData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickCount={5}
            />
            <Radar
              name="JD Baseline"
              dataKey="jdBaseline"
              stroke="#F37021"
              fill="#F37021"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Radar
              name="Top 3 Average"
              dataKey="top3Avg"
              stroke="#0033A0"
              fill="#0033A0"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-muted/50 rounded-xl">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">AI Insight:</span>{" "}
          Top 3 ứng viên vượt trội về <span className="text-emerald-600 font-medium">Tiếng Anh (+6%)</span>, 
          nhưng cần cải thiện <span className="text-amber-600 font-medium">Kiến thức Sản phẩm SHB (-8%)</span> để đạt chuẩn JD.
        </p>
      </div>
    </motion.div>
  )
}
