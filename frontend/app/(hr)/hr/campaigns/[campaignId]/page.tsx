"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, UploadCloud, FileText, CheckCircle2, Clock, Loader2, Sparkles, Building2, AlertCircle } from "lucide-react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

// --- Helper: Simulate API Delay ---
const simulateFakeAPI = (delay = 1500) => new Promise(resolve => setTimeout(resolve, delay))

const JOB_TAXONOMIES = [
  { id: "tax-1", title: "Chuyên viên Quan hệ Khách hàng Cá nhân", code: "RETAIL_SALE", template: "Sử dụng JD chuẩn của Khối Ngân hàng Bán lẻ." },
  { id: "tax-2", title: "Giao dịch viên", code: "TELLER", template: "Sử dụng mẫu đánh giá Năng lực Phục vụ Khách hàng." },
  { id: "tax-3", title: "Chuyên viên Thẩm định Tín dụng", code: "RISK_CREDIT", template: "Template chuẩn đánh giá Rủi ro và Quy trình." },
]

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params?.campaignId as string || params?.id as string

  const [isSlideOpen, setIsSlideOpen] = useState(false)
  
  // State quản lý danh sách vị trí
  const [positions, setPositions] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`campaign_v2_${campaignId}_positions`)
      if (saved) return JSON.parse(saved)
    }
    return [
      {
        id: "pos-1",
        title: "Chuyên viên Quan hệ Khách hàng Cá nhân",
        target: 15,
        cvCount: 350,
        cvCountDisplay: "350",
        passCv: 120,
        test: 45,
        offer: 2,
        progress: 100,
        aiStatus: "Đã hoàn tất",
        aiStatusColor: "text-emerald-600 bg-emerald-50",
        aiIcon: "check",
        scanProgress: 100
      },
      {
        id: "pos-2",
        title: "Giao dịch viên",
        target: 20,
        cvCount: 1200,
        cvCountDisplay: "1.2k",
        passCv: 0,
        test: 0,
        offer: 0,
        progress: 100,
        aiStatus: "Đang trích xuất",
        aiStatusColor: "text-amber-600 bg-amber-50",
        aiIcon: "clock",
        scanProgress: 45
      },
      {
        id: "pos-3",
        title: "Chuyên viên Thẩm định Tín dụng",
        target: 5,
        cvCount: 85,
        cvCountDisplay: "85",
        passCv: 10,
        test: 2,
        offer: 0,
        progress: 40,
        aiStatus: "Chờ xử lý",
        aiStatusColor: "text-slate-500 bg-slate-100",
        aiIcon: "file",
        scanProgress: 0
      }
    ]
  })

  // Lưu vào localStorage mỗi khi positions thay đổi
  useEffect(() => {
    localStorage.setItem(`campaign_v2_${campaignId}_positions`, JSON.stringify(positions))
  }, [positions, campaignId])

  // Giả lập tiến trình quét CV
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(p => {
        if (p.aiStatus === "Đang trích xuất" && p.scanProgress < 100) {
          const next = p.scanProgress + 5
          if (next >= 100) {
            return { ...p, scanProgress: 100, aiStatus: "Đã hoàn tất", aiStatusColor: "text-emerald-600 bg-emerald-50", aiIcon: "check" }
          }
          return { ...p, scanProgress: next }
        }
        return p
      }))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Form State
  const [form, setForm] = useState({ taxonomyId: "", title: "", headcount: "1" })
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileUploaded, setFileUploaded] = useState<File | null>(null)

  const handleTaxonomySelect = (val: string) => {
    const tax = JOB_TAXONOMIES.find(t => t.id === val)
    if (tax) {
      setForm({ ...form, taxonomyId: val, title: tax.title })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileUploaded(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileUploaded(e.target.files[0])
    }
  }

  const handleAddPosition = async () => {
    if (!form.title) return
    setIsSubmitting(true)
    
    // Giả lập API
    await simulateFakeAPI(1500)
    
    const newPosition = {
      id: `pos-${Date.now()}`,
      title: form.title,
      target: parseInt(form.headcount) || 1,
      cvCount: 0,
      cvCountDisplay: "0",
      progress: 0,
      aiStatus: "Chưa có JD",
      aiStatusColor: "text-slate-500 bg-slate-100",
      aiIcon: "file",
      scanProgress: 0
    }

    if (fileUploaded || form.taxonomyId) {
      newPosition.aiStatus = "Đang trích xuất"
      newPosition.aiStatusColor = "text-amber-600 bg-amber-50"
      newPosition.aiIcon = "clock"
    }

    setPositions([newPosition, ...positions])
    setIsSubmitting(false)
    setIsSlideOpen(false)
    setForm({ taxonomyId: "", title: "", headcount: "1" })
    setFileUploaded(null)
  }

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <button 
          onClick={() => router.push("/hr/campaigns")}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chiến dịch Tuyển dụng Q3/2026</h1>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full">
              Đang hoạt động
            </span>
          </div>
          
          <button 
            onClick={() => setIsSlideOpen(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Vị Trí Mới</span>
          </button>
        </div>
      </div>

      {/* Tóm tắt */}
      <div className="mb-6 bg-white border border-slate-100 rounded-2xl p-5 flex gap-8">
        <div>
          <p className="text-sm font-medium text-slate-500">Tổng số vị trí</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{positions.length}</p>
        </div>
      </div>

      {/* Positions List */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4 rounded-tl-2xl">Vị trí</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Phễu ứng viên</th>
                <th className="px-6 py-4">Trạng thái Dữ liệu</th>
                <th className="px-6 py-4 text-right rounded-tr-2xl">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {positions.map((pos: any) => {
                return (
                  <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{pos.title}</td>
                    <td className="px-6 py-4">{pos.target} nhân sự</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 w-full max-w-sm">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <span className="font-bold text-slate-700">Tổng: {pos.cvCountDisplay}</span>
                          <ArrowLeft className="w-3 h-3 rotate-180" />
                          <span>Pass CV: {pos.passCv ?? 0}</span>
                          <ArrowLeft className="w-3 h-3 rotate-180" />
                          <span>Test: {pos.test ?? 0}</span>
                          <ArrowLeft className="w-3 h-3 rotate-180" />
                          <span className={pos.offer < pos.target && pos.cvCount > 100 ? "text-red-600 font-bold flex items-center gap-1" : "font-bold text-slate-700"}>
                            Offer: {pos.offer ?? 0}/{pos.target}
                            {pos.offer < pos.target && pos.cvCount > 100 && (
                              <span title="Nút thắt cổ chai: Tỷ lệ chuyển đổi thấp"><AlertCircle className="w-3.5 h-3.5 inline" /></span>
                            )}
                          </span>
                        </div>
                        <div className="flex w-full h-1.5 rounded-full overflow-hidden mt-0.5 bg-slate-100">
                           <div className="bg-slate-300" style={{ width: `${pos.cvCount === 0 ? 0 : 100}%` }} />
                           <div className="bg-blue-400 -ml-1" style={{ width: `${pos.cvCount === 0 ? 0 : ((pos.passCv || 0) / pos.cvCount) * 100}%` }} />
                           <div className="bg-orange-400 -ml-1" style={{ width: `${pos.cvCount === 0 ? 0 : ((pos.test || 0) / pos.cvCount) * 100}%` }} />
                           <div className="bg-emerald-500 -ml-1" style={{ width: `${pos.cvCount === 0 ? 0 : ((pos.offer || 0) / pos.cvCount) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold w-fit ${pos.aiStatusColor}`}>
                          {pos.aiIcon === "check" && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {pos.aiIcon === "clock" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {pos.aiIcon === "file" && <FileText className="w-3.5 h-3.5" />}
                          {pos.aiStatus}
                        </div>
                        {pos.aiStatus === "Đang trích xuất" && (
                          <div className="w-full max-w-[140px] space-y-1 mt-1">
                            <Progress value={pos.scanProgress} className="h-1.5" />
                            <p className="text-[10px] text-slate-500 font-medium flex justify-between">
                              <span>Đang phân tích {pos.cvCountDisplay} CV</span>
                              <span>{Math.round((pos.scanProgress/100) * pos.cvCount)}/{pos.cvCountDisplay}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/hr/campaigns/${campaignId}/position/${pos.id}/setup`}>
                          <button className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Cấu hình Tiêu chí</span>
                          </button>
                        </Link>
                        <Link href={`/hr/campaigns/${campaignId}/position/${pos.id}/pipeline`}>
                          <button className="text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors">
                            Xem Pipeline
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {positions.length === 0 && (
            <div className="p-10 text-center text-slate-500">Chưa có vị trí nào.</div>
          )}
        </div>
      </div>

      {/* Slide-over: Add New Position */}
      <Sheet open={isSlideOpen} onOpenChange={setIsSlideOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto border-l-0 shadow-2xl p-0">
          <div className="flex flex-col h-full bg-white">
            <SheetHeader className="px-8 py-6 border-b border-slate-100">
              <SheetTitle className="text-xl font-bold text-slate-900">Thêm Vị Trí Mới</SheetTitle>
              <SheetDescription className="text-slate-500">
                Thiết lập vị trí và tải lên Job Description (JD) để AI tự động phân tích rubric đánh giá.
              </SheetDescription>
            </SheetHeader>
            
            <div className="flex-1 px-8 py-6 space-y-6">
              {/* Form Inputs */}
              <div className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Chọn từ Thư viện (Job Taxonomy) <span className="text-orange-500 font-normal ml-1">Đề xuất</span></label>
                  <Select onValueChange={handleTaxonomySelect} value={form.taxonomyId}>
                    <SelectTrigger className="w-full h-11 border-slate-200 rounded-lg">
                      <SelectValue placeholder="Chọn vị trí chuẩn từ hệ thống SHB" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TAXONOMIES.map((tax) => (
                        <SelectItem key={tax.id} value={tax.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{tax.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.taxonomyId && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 
                      {JOB_TAXONOMIES.find(t => t.id === form.taxonomyId)?.template}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-sm font-semibold text-slate-700">Tên vị trí (Tuỳ chỉnh)</label>
                    <input 
                      type="text" 
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      placeholder="VD: Chuyên viên Phân tích Rủi ro" 
                      className="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent rounded-lg px-4 py-2.5 text-slate-900 text-sm transition-all h-11"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1.5 w-32">
                    <label className="text-sm font-semibold text-slate-700">Chỉ tiêu (Target)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={form.headcount}
                      onChange={(e) => setForm({...form, headcount: e.target.value})}
                      className="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent rounded-lg px-4 py-2.5 text-slate-900 text-sm transition-all h-11"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* JD Upload Dropzone */}
              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                  <span>Hoặc Tải lên JD mới (Tùy chọn)</span>
                  <span className="text-xs font-normal text-slate-400">PDF, DOCX (Max 5MB)</span>
                </label>
                
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    dragActive ? "border-orange-500 bg-orange-50" : fileUploaded ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                  } ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (isSubmitting) return;
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.doc,.docx';
                    input.onchange = handleFileChange as any;
                    input.click();
                  }}
                >
                  <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center mb-4 ${fileUploaded ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-400"}`}>
                    {fileUploaded ? <FileText className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                  </div>
                  <h4 className={`text-sm font-semibold mb-1 ${fileUploaded ? "text-emerald-700" : "text-slate-900"}`}>
                    {fileUploaded ? fileUploaded.name : "Nhấn để tải lên hoặc kéo thả file vào đây"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {fileUploaded ? "File đã sẵn sàng để tải lên" : "Hệ thống sẽ tự động đọc hiểu JD và trích xuất thành bộ tiêu chí đánh giá (Rubric)."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 mt-auto">
              <button 
                onClick={() => setIsSlideOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleAddPosition}
                disabled={isSubmitting || !form.title}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm rounded-lg transition-all disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo vị trí...
                  </>
                ) : (
                  "Tạo vị trí & Trích xuất"
                )}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

