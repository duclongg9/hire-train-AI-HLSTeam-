"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, FileText, Sparkles, Plus, Trash2, Edit3, Check, Loader2, Target, Users, BookOpen
} from "lucide-react"
import { toast } from "sonner"

import { useWorkspace } from "@/features/hr/providers/position-workspace-provider"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export function PositionWizard({ campaignId, positionId }: { campaignId: string, positionId: string }) {
  const router = useRouter()
  const { 
    jdState, jdAnalysis, poolEstimate, 
    simulateJDExtraction, removeHardSkill, updateHardSkill 
  } = useWorkspace()

  const [activeTab, setActiveTab] = useState("jd")
  const [isPublishing, setIsPublishing] = useState(false)

  // Drag and drop state for left pane
  const [dragActive, setDragActive] = useState(false)
  const [pdfName, setPdfName] = useState<string | null>(null)

  const handleFileUpload = (file: File) => {
    setPdfName(file.name)
    simulateJDExtraction(file)
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success("Kích hoạt vị trí thành công!")
    router.push(`/hr/campaigns/${campaignId}`)
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full flex bg-slate-50 overflow-hidden">
      
      {/* LEFT PANE: PDF VIEWER (35%) */}
      <div className="w-[35%] h-full border-r border-slate-200 bg-white flex flex-col relative z-10">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/hr/campaigns/${campaignId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>
          <span className="text-sm font-semibold text-slate-500">Bản gốc JD</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {jdState === "empty" ? (
            <div 
              className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-colors ${
                dragActive ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:bg-slate-50"
              }`}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0])
              }}
            >
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Tải lên JD (PDF/Word)</h3>
              <p className="text-sm text-slate-500 mt-2 mb-6">Kéo thả file vào đây để AI bắt đầu phân tích</p>
              <Button onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf,.doc,.docx'
                input.onchange = (e: any) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
                }
                input.click()
              }}>
                Chọn File
              </Button>
              <div className="mt-8">
                <Button variant="outline" className="text-xs">Import từ Template Ngân hàng</Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-slate-100 p-4 rounded-xl flex items-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-rose-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{pdfName || "JD_Chuyen_vien_QHKH.pdf"}</h4>
                  <p className="text-xs text-slate-500">1.2 MB • Đã tải lên</p>
                </div>
              </div>
              <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                {/* Mock PDF Viewer */}
                <p className="text-slate-400 font-medium text-sm">[PDF Viewer Placeholder]</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: AI WORKSPACE (65%) */}
      <div className="w-[65%] h-full flex flex-col bg-slate-50/50">
        
        {/* Sticky Summary Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Tổng điểm Rubric</p>
                <p className="text-sm font-bold text-slate-900">100 / 100</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Market Difficulty</p>
                <p className="text-sm font-bold text-slate-900">
                  {jdAnalysis?.market_insights?.market_difficulty_score || "--"}% <span className="text-orange-600 font-medium">(Khó)</span>
                </p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Candidate Pool</p>
                <p className="text-sm font-bold text-slate-900">
                  {poolEstimate ? `${poolEstimate} CV phù hợp` : "Đang tính toán..."}
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={handlePublish}
            disabled={isPublishing || jdState !== "analyzed"}
            className="bg-slate-900 text-white"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Lưu & Kích hoạt
          </Button>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {jdState === "empty" && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Sparkles className="w-12 h-12 mb-4 opacity-50" />
              <p>Tải lên JD ở cột bên trái để AI bắt đầu làm việc</p>
            </div>
          )}

          {jdState === "analyzing" && (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-900">AI đang phân tích JD...</h3>
              <p className="text-slate-500 text-sm mt-2">Đang bóc tách kỹ năng và đối chiếu dữ liệu thị trường</p>
            </div>
          )}

          {jdState === "analyzed" && jdAnalysis && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-xl">
                <TabsTrigger value="jd" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">1. Yêu cầu Công việc</TabsTrigger>
                <TabsTrigger value="cv" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">2. CV Rubric</TabsTrigger>
                <TabsTrigger value="interview" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">3. Interview Rubric</TabsTrigger>
              </TabsList>

              <TabsContent value="jd" className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" /> Thông tin chung
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Chức danh</p>
                      <p className="font-semibold text-slate-900">{jdAnalysis.role_info.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Phòng ban</p>
                      <p className="font-semibold text-slate-900">{jdAnalysis.role_info.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Kinh nghiệm</p>
                      <p className="font-semibold text-slate-900">{jdAnalysis.role_info.experience_years.min} - {jdAnalysis.role_info.experience_years.max} năm</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-500" /> Kỹ năng chuyên môn (Hard Skills)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {jdAnalysis.hard_skills.map(skill => (
                      <HoverCard key={skill.id}>
                        <HoverCardTrigger asChild>
                          <div className="group flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors">
                            {skill.skill_name}
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeHardSkill(skill.id) }}
                              className="opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-4" align="start">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-slate-900">{skill.skill_name}</h4>
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-600">Level: {skill.required_level}/5</span>
                            </div>
                            <p className="text-xs text-slate-500"><span className="font-semibold text-slate-700">Domain:</span> {skill.domain}</p>
                            <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              {skill.context}
                            </p>
                            <div className="flex justify-end mt-2">
                              <Button variant="outline" size="sm" className="text-xs h-7">Chỉnh sửa</Button>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                    <Button variant="outline" size="sm" className="border-dashed h-8"><Plus className="w-4 h-4 mr-1" /> Thêm kỹ năng</Button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" /> Kỹ năng mềm (Soft Skills)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {jdAnalysis.soft_skills.map(skill => (
                      <HoverCard key={skill.id}>
                        <HoverCardTrigger asChild>
                          <div className="group flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors">
                            {skill.skill_name}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-4" align="start">
                          <h4 className="font-bold text-slate-900 mb-2">{skill.skill_name}</h4>
                          <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {skill.banking_context}
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cv" className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Ma trận chấm điểm CV (Đồng bộ với Tab 1)</h3>
                    <Button variant="outline" size="sm"><Sparkles className="w-4 h-4 mr-2 text-orange-500" /> Tối ưu lại</Button>
                  </div>
                  
                  {/* Dynamic generation based on hard skills to show sync */}
                  <div className="space-y-4">
                    {jdAnalysis.hard_skills.map((skill, i) => (
                      <div key={skill.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-bold text-slate-400 border border-slate-200 shrink-0">
                          H{i+1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">{skill.skill_name}</h4>
                          <p className="text-sm text-slate-500">{skill.context}</p>
                        </div>
                        <div className="w-24">
                          <div className="text-sm font-semibold text-center mb-1 text-slate-600">Trọng số</div>
                          <input type="number" defaultValue={skill.required_level * 10} className="w-full border border-slate-200 rounded-lg text-center py-1.5 font-bold outline-none focus:border-orange-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="interview" className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-12">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Interview Rubric & Quick Test</h3>
                  <p className="text-slate-500 mb-6">Phần này đã được xây dựng ở component trước. Ở chế độ Web App, nó sẽ nhận dữ liệu trực tiếp từ Context API.</p>
                  <Button variant="outline">Xem chi tiết Interview Rubric</Button>
                </div>
              </TabsContent>

            </Tabs>
          )}
        </div>

      </div>
    </div>
  )
}
