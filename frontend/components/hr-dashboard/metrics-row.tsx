"use client"

import { motion } from "framer-motion"
import { Users, Target, TrendingUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: string; positive: boolean }
  highlight?: boolean
  delay?: number
}

function MetricCard({ title, value, subtitle, icon, trend, highlight, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "relative bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden",
        highlight && "border-[#F37021]/30 bg-gradient-to-br from-[#F37021]/5 to-transparent"
      )}
    >
      {highlight && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-[#F37021]/10 text-[#F37021] text-[10px] font-semibold rounded-full uppercase tracking-wide">
            CX Metric
          </span>
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          highlight 
            ? "bg-gradient-to-br from-[#F37021] to-[#FF9A5C]" 
            : "bg-gradient-to-br from-[#0033A0] to-[#0055DD]"
        )}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={cn(
              "text-3xl font-bold",
              highlight ? "text-[#F37021]" : "text-foreground"
            )}>
              {value}
            </p>
            {subtitle && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
          </div>
          {trend && (
            <p className={cn(
              "text-sm mt-2 font-medium",
              trend.positive ? "text-emerald-600" : "text-red-500"
            )}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function MetricsRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        title="Tổng ứng viên đã xử lý"
        value={247}
        subtitle="ứng viên"
        icon={<Users className="w-6 h-6" />}
        trend={{ value: "12% so với tháng trước", positive: true }}
        delay={0}
      />
      
      <MetricCard
        title="Điểm phù hợp trung bình"
        value="81.5"
        subtitle="điểm"
        icon={<Target className="w-6 h-6" />}
        trend={{ value: "5% so với tháng trước", positive: true }}
        delay={0.1}
      />
      
      <MetricCard
        title="Dự báo CSAT Impact"
        value="+18%"
        subtitle="cải thiện CX"
        icon={<Sparkles className="w-6 h-6" />}
        trend={{ value: "Dựa trên soft skills của top ứng viên", positive: true }}
        highlight={true}
        delay={0.2}
      />
    </div>
  )
}
