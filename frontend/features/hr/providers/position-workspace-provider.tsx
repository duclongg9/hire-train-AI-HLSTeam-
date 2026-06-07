"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { toast } from "sonner"

// --- AI Extract Data Types ---
export interface HardSkill {
  id: string
  skill_name: string
  domain: string
  required_level: number
  context: string
}

export interface SoftSkill {
  id: string
  skill_name: string
  banking_context: string
}

export interface JDAnalysisResult {
  role_info: {
    title: string
    department: string
    experience_years: { min: number; max: number }
  }
  hard_skills: HardSkill[]
  soft_skills: SoftSkill[]
  market_insights: {
    market_difficulty_score: number
    difficulty_reasoning: string
  }
}

// --- Context Definition ---
interface WorkspaceContextType {
  campaignId: string
  positionId: string
  jdState: "empty" | "analyzing" | "analyzed"
  setJdState: (state: "empty" | "analyzing" | "analyzed") => void
  jdAnalysis: JDAnalysisResult | null
  setJdAnalysis: (data: JDAnalysisResult | null) => void
  poolEstimate: number | null
  setPoolEstimate: (count: number | null) => void
  removeHardSkill: (skillId: string) => void
  updateHardSkill: (skillId: string, updates: Partial<HardSkill>) => void
  // Mock API methods
  simulateJDExtraction: (file: File) => Promise<void>
  refreshPoolEstimate: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

// --- Mock Data ---
const mockExtraction: JDAnalysisResult = {
  role_info: {
    title: "Chuyên viên Quan hệ Khách hàng Cá nhân",
    department: "Khối Bán lẻ (Retail Banking)",
    experience_years: { min: 2, max: 5 }
  },
  hard_skills: [
    { id: "h1", skill_name: "Tín dụng", domain: "Retail", required_level: 3, context: "Phân tích rủi ro và thẩm định hồ sơ vay mua nhà/ô tô." },
    { id: "h2", skill_name: "Huy động vốn", domain: "Retail", required_level: 4, context: "Thu hút CASA và huy động tiền gửi tiết kiệm dài hạn." },
    { id: "h3", skill_name: "Bancassurance", domain: "Cross-sell", required_level: 2, context: "Tư vấn chéo các sản phẩm bảo hiểm nhân thọ." },
  ],
  soft_skills: [
    { id: "s1", skill_name: "Giao tiếp", banking_context: "Thương lượng lãi suất linh hoạt với khách hàng VIP." },
    { id: "s2", skill_name: "Xử lý từ chối", banking_context: "Thuyết phục khách hàng sử dụng dịch vụ ngân hàng số thay vì tiền mặt." },
  ],
  market_insights: {
    market_difficulty_score: 75,
    difficulty_reasoning: "Cạnh tranh gay gắt từ các ngân hàng đối thủ trong mảng thẻ tín dụng và vay tiêu dùng."
  }
}

export function PositionWorkspaceProvider({ 
  children, 
  campaignId, 
  positionId 
}: { 
  children: ReactNode, 
  campaignId: string, 
  positionId: string 
}) {
  const [jdState, setJdState] = useState<"empty" | "analyzing" | "analyzed">("empty")
  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysisResult | null>(null)
  const [poolEstimate, setPoolEstimate] = useState<number | null>(null)

  const simulateJDExtraction = async (file: File) => {
    setJdState("analyzing")
    await new Promise(r => setTimeout(r, 2500))
    setJdAnalysis(mockExtraction)
    setJdState("analyzed")
    refreshPoolEstimate()
  }

  const refreshPoolEstimate = async () => {
    // Fake API: GET /api/campaigns/{id}/pool-estimate
    setPoolEstimate(null)
    await new Promise(r => setTimeout(r, 1000))
    // Return a random number between 100 and 200 based on the skills count
    setPoolEstimate(Math.floor(Math.random() * 50) + 100)
  }

  const removeHardSkill = (skillId: string) => {
    if (!jdAnalysis) return
    setJdAnalysis({
      ...jdAnalysis,
      hard_skills: jdAnalysis.hard_skills.filter(s => s.id !== skillId)
    })
    // Background sync simulation
    toast.info("Đã xóa kỹ năng. Đang cập nhật lại Rubric và Pool size...", { duration: 2000 })
    refreshPoolEstimate()
  }

  const updateHardSkill = (skillId: string, updates: Partial<HardSkill>) => {
    if (!jdAnalysis) return
    setJdAnalysis({
      ...jdAnalysis,
      hard_skills: jdAnalysis.hard_skills.map(s => s.id === skillId ? { ...s, ...updates } : s)
    })
    toast.info("Đã cập nhật kỹ năng.", { duration: 2000 })
  }

  return (
    <WorkspaceContext.Provider value={{
      campaignId, positionId,
      jdState, setJdState,
      jdAnalysis, setJdAnalysis,
      poolEstimate, setPoolEstimate,
      removeHardSkill, updateHardSkill,
      simulateJDExtraction, refreshPoolEstimate
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error("useWorkspace must be used within PositionWorkspaceProvider")
  return context
}
