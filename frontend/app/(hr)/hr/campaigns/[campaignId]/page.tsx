"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Plus, FileText, CheckCircle2, Loader2, Sparkles, AlertCircle, UploadCloud,
} from "lucide-react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  getCampaign,
  listPositions,
  createPosition,
  createPositionFromFile,
  formatApiError,
  type BackendCampaign,
  type BackendPosition,
} from "@/features/hr/api/hr-api"

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = (params?.campaignId as string) ?? ""

  const [campaign, setCampaign] = useState<BackendCampaign | null>(null)
  const [positions, setPositions] = useState<BackendPosition[]>([])
  const [loadingPage, setLoadingPage] = useState(true)
  const [pageError, setPageError] = useState("")

  // Sheet state
  const [isSlideOpen, setIsSlideOpen] = useState(false)
  const [form, setForm] = useState({ title: "", headcount: "1" })
  const [fileUploaded, setFileUploaded] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const fetchAll = async () => {
    if (!campaignId) return
    setLoadingPage(true)
    setPageError("")
    try {
      const [camp, posArr] = await Promise.all([
        getCampaign(campaignId),
        listPositions(campaignId),
      ])
      setCampaign(camp)
      setPositions(posArr)
    } catch (err) {
      setPageError(formatApiError(err, "Không thể tải dữ liệu chiến dịch."))
    } finally {
      setLoadingPage(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) setFileUploaded(e.dataTransfer.files[0])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileUploaded(e.target.files[0])
  }

  const handleAddPosition = async () => {
    if (!form.title.trim()) {
      setSubmitError("Vui lòng nhập tên vị trí.")
      return
    }
    setIsSubmitting(true)
    setSubmitError("")
    try {
      let newPos: BackendPosition
      const shouldRefreshCampaign = Boolean(fileUploaded)
      if (fileUploaded) {
        newPos = await createPositionFromFile(
          campaignId,
          { title: form.title.trim(), headcount: parseInt(form.headcount) || 1 },
          fileUploaded
        )
      } else {
        newPos = await createPosition(campaignId, {
          title: form.title.trim(),
          headcount: parseInt(form.headcount) || 1,
        })
      }
      setIsSlideOpen(false)
      setForm({ title: "", headcount: "1" })
      setFileUploaded(null)
      if (shouldRefreshCampaign) {
        await fetchAll()
      } else {
        setPositions((prev) => [newPos, ...prev])
      }
    } catch (err) {
      setSubmitError(formatApiError(err, "Không thể tạo vị trí mới."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const openSheet = () => {
    setForm({ title: "", headcount: "1" })
    setFileUploaded(null)
    setSubmitError("")
    setIsSlideOpen(true)
  }

  // Status badge helpers
  const getStatusBadge = (pos: BackendPosition) => {
    if (pos.status === "PUBLISHED") {
      return { label: "Đã phát hành", color: "text-emerald-600 bg-emerald-50", icon: "check" }
    }
    if (pos.status === "CLOSED") {
      return { label: "Đã đóng", color: "text-slate-500 bg-slate-100", icon: "file" }
    }
    // DRAFT
    if (!pos.is_jd_complete) {
      return { label: "Chưa có JD", color: "text-slate-500 bg-slate-100", icon: "file" }
    }
    if (!pos.is_cv_rubric_complete) {
      return { label: "Chưa có Rubric", color: "text-amber-600 bg-amber-50", icon: "clock" }
    }
    return { label: "Nháp", color: "text-slate-500 bg-slate-100", icon: "file" }
  }

  const totalCandidates = positions.reduce((sum, pos) => sum + (pos.candidate_count ?? 0), 0)

  // Loading state
  if (loadingPage) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm font-medium">Đang tải chiến dịch...</span>
      </div>
    )
  }

  // Error state
  if (pageError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-500 font-medium">{pageError}</p>
        <button
          onClick={fetchAll}
          className="text-sm text-slate-600 underline hover:text-slate-900"
        >
          Thử lại
        </button>
      </div>
    )
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
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {campaign?.title ?? "Chiến dịch tuyển dụng"}
              </h1>
              {campaign?.department_scope && (
                <p className="text-sm text-slate-500 mt-0.5">{campaign.department_scope}</p>
              )}
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                campaign?.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-600"
                  : campaign?.status === "CLOSED"
                  ? "bg-slate-100 text-slate-500"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {campaign?.status === "ACTIVE"
                ? "Đang hoạt động"
                : campaign?.status === "CLOSED"
                ? "Đã đóng"
                : "Nháp"}
            </span>
          </div>

          <button
            onClick={openSheet}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Vị Trí Mới</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 bg-white border border-slate-100 rounded-2xl p-5 flex gap-8">
        <div>
          <p className="text-sm font-medium text-slate-500">Tổng số vị trí</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{positions.length}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Tổng ứng viên</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCandidates}</p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4 rounded-tl-2xl">Vị trí</th>
                <th className="px-6 py-4">Chỉ tiêu</th>
                <th className="px-6 py-4">Ứng viên</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right rounded-tr-2xl">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {positions.map((pos) => {
                const badge = getStatusBadge(pos)
                return (
                  <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{pos.title}</td>
                    <td className="px-6 py-4">{pos.headcount} nhân sự</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{pos.candidate_count ?? 0}</span>
                      <span className="text-slate-400 text-xs ml-1">ứng viên</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold w-fit ${badge.color}`}>
                        {badge.icon === "check" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {badge.icon === "clock" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {badge.icon === "file" && <FileText className="w-3.5 h-3.5" />}
                        {badge.label}
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
            <div className="p-10 text-center text-slate-400">
              <Plus className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Chưa có vị trí nào. Bấm &quot;Thêm Vị Trí Mới&quot; để bắt đầu.</p>
            </div>
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
                Đặt tên vị trí và tải JD để AI tự động trích xuất tiêu chí đánh giá.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 px-8 py-6 space-y-6">
              {submitError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Tên vị trí <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="VD: Chuyên viên Phân tích Rủi ro"
                    className="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent rounded-lg px-4 py-2.5 text-slate-900 text-sm h-11"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5 w-32">
                  <label className="text-sm font-semibold text-slate-700">Chỉ tiêu</label>
                  <input
                    type="number"
                    min="1"
                    value={form.headcount}
                    onChange={(e) => setForm({ ...form, headcount: e.target.value })}
                    className="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent rounded-lg px-4 py-2.5 text-slate-900 text-sm h-11"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* JD Upload */}
              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                  <span>Tải lên JD (Tùy chọn — AI sẽ tự trích xuất Rubric)</span>
                  <span className="text-xs font-normal text-slate-400">PDF, DOCX</span>
                </label>

                <div
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    dragActive
                      ? "border-orange-500 bg-orange-50"
                      : fileUploaded
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                  } ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (isSubmitting) return
                    const input = document.createElement("input")
                    input.type = "file"
                    input.accept = ".pdf,.doc,.docx"
                    input.onchange = handleFileChange as unknown as (this: GlobalEventHandlers, ev: Event) => void
                    input.click()
                  }}
                >
                  <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center mb-4 ${fileUploaded ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-400"}`}>
                    {fileUploaded ? <FileText className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                  </div>
                  <h4 className={`text-sm font-semibold mb-1 ${fileUploaded ? "text-emerald-700" : "text-slate-900"}`}>
                    {fileUploaded ? fileUploaded.name : "Nhấn để tải lên hoặc kéo thả"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {fileUploaded
                      ? "File đã sẵn sàng"
                      : "AI sẽ đọc JD và tự tạo bộ tiêu chí đánh giá CV (Rubric)."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
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
                disabled={isSubmitting || !form.title.trim()}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm rounded-lg transition-all disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo vị trí"
                )}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
