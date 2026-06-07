"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Plus, ArrowRight, Loader2, AlertCircle, X } from "lucide-react"
import {
  listCampaigns,
  listPositions,
  createCampaign,
  formatApiError,
  type BackendCampaign,
  type BackendPosition,
} from "@/features/hr/api/hr-api"

interface CampaignWithPositions {
  campaign: BackendCampaign
  positions: BackendPosition[]
  totalCandidates: number
  hasNew: boolean
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "ACTIVE",
  DRAFT: "DRAFT",
  CLOSED: "CLOSED",
}

export default function CampaignsPage() {
  const router = useRouter()
  const [items, setItems] = useState<CampaignWithPositions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dialog tạo campaign mới
  const [showDialog, setShowDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [form, setForm] = useState({
    name: "",
    department: "",
    startDate: "",
    endDate: "",
  })

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const campaigns = await listCampaigns()
      const results = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            const positions = await listPositions(campaign.id)
            const totalCandidates = positions.reduce(
              (sum, pos) => sum + (pos.candidate_count ?? 0),
              0
            )
            return {
              campaign,
              positions,
              totalCandidates,
              hasNew: positions.some((pos) => (pos.candidate_count ?? 0) > 0),
            }
          } catch {
            return { campaign, positions: [], totalCandidates: 0, hasNew: false }
          }
        })
      )
      setItems(results)
    } catch (err) {
      setError(formatApiError(err, "Không thể tải danh sách chiến dịch."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateCampaign = async () => {
    if (!form.name.trim()) {
      setCreateError("Vui lòng nhập tên chiến dịch.")
      return
    }
    setCreating(true)
    setCreateError("")
    try {
      const created = await createCampaign({
        title: form.name.trim(),
        department_scope: form.department || null,
        start_date: form.startDate ? new Date(`${form.startDate}T00:00:00`).toISOString() : null,
        deadline_at: form.endDate ? new Date(`${form.endDate}T23:59:59`).toISOString() : null,
        status: "DRAFT",
      })
      setShowDialog(false)
      setForm({ name: "", department: "", startDate: "", endDate: "" })
      router.push(`/hr/campaigns/${created.id}`)
    } catch (err) {
      setCreateError(formatApiError(err, "Không thể tạo chiến dịch."))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý và theo dõi các chiến dịch tuyển dụng</p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#F37021] hover:bg-[#d9611c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm font-medium">Đang tải chiến dịch...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Chưa có chiến dịch nào. Bấm &quot;New Campaign&quot; để tạo.</p>
        </div>
      )}

      {/* Campaign grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(({ campaign, positions, totalCandidates, hasNew }) => (
            <div
              key={campaign.id}
              className="bg-white rounded-2xl border border-slate-100/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        campaign.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-600"
                          : campaign.status === "CLOSED"
                          ? "bg-slate-200 text-slate-500"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {STATUS_LABEL[campaign.status] ?? campaign.status}
                    </span>
                    {hasNew && (
                      <div className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        MỚI
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
                    {campaign.title}
                  </h3>
                  {campaign.department_scope && (
                    <div className="flex items-center gap-1.5 text-slate-400 mt-2 text-xs font-medium">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{campaign.department_scope}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Positions list */}
              <div className="bg-slate-50/60 rounded-xl p-3.5 mt-4 space-y-2.5 flex-1">
                {positions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Chưa có vị trí nào</p>
                ) : (
                  <>
                    {positions.slice(0, 3).map((pos) => (
                      <div key={pos.id} className="flex items-center justify-between group">
                        <span className="text-sm font-semibold text-slate-700 truncate pr-3 group-hover:text-slate-900 transition-colors">
                          {pos.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-md">
                            {pos.candidate_count ?? 0} CV
                          </span>
                        </div>
                      </div>
                    ))}
                    {positions.length > 3 && (
                      <div className="text-[11px] text-slate-400 font-medium italic pt-2 border-t border-slate-100/50 mt-2 text-center hover:text-slate-600 transition-colors cursor-pointer">
                        + {positions.length - 3} vị trí khác...
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 pt-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-500 font-medium">Tổng ứng viên</span>
                  <span className="text-base font-bold text-slate-900">{totalCandidates}</span>
                </div>
                <Link href={`/hr/campaigns/${campaign.id}`}>
                  <button className="w-full bg-slate-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 group">
                    <span>Vào Quản Lý</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog: Tạo Campaign mới */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Tạo Chiến Dịch Mới</h2>
              <button
                onClick={() => { setShowDialog(false); setCreateError("") }}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Tên chiến dịch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Tuyển dụng Khối CNTT - Q3/2026"
                  className="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent rounded-lg px-4 py-2.5 text-slate-900 text-sm h-11"
                  disabled={creating}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCampaign()}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Khối / Phòng ban</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="VD: Khối Ngân hàng Số"
                  className="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent rounded-lg px-4 py-2.5 text-slate-900 text-sm h-11"
                  disabled={creating}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent rounded-lg px-3 py-2.5 text-slate-900 text-sm h-11"
                    disabled={creating}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Deadline</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent rounded-lg px-3 py-2.5 text-slate-900 text-sm h-11"
                    disabled={creating}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowDialog(false); setCreateError("") }}
                disabled={creating}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={creating || !form.name.trim()}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm rounded-lg transition-all disabled:opacity-70"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo chiến dịch"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
