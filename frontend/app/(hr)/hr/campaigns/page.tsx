"use client"

import Link from "next/link"
import { Building2, Plus, ArrowRight, CircleDot } from "lucide-react"

// --- Mock Data ---
const mockCampaigns = [
  {
    id: "camp-001",
    name: "Tuyển dụng Nhân sự Số - Khối Ngân hàng Số",
    department: "Khối Ngân hàng Số",
    status: "ACTIVE",
    hasNew: true,
    totalCvs: 57,
    positions: [
      { id: "pos-1", title: "Customer Support Specialist", cvCount: 45, newCvCount: 5 },
      { id: "pos-2", title: "Tech Lead", cvCount: 12, newCvCount: 0 },
    ],
  },
  {
    id: "camp-002",
    name: "Chiến dịch Công nghệ Thông tin - Q3",
    department: "Khối CNTT",
    status: "ACTIVE",
    hasNew: true,
    totalCvs: 41,
    positions: [
      { id: "pos-3", title: "Senior Frontend Engineer", cvCount: 14, newCvCount: 0 },
      { id: "pos-4", title: "DevOps Engineer", cvCount: 8, newCvCount: 2 },
      { id: "pos-5", title: "Data Analyst", cvCount: 19, newCvCount: 0 },
      { id: "pos-7", title: "Backend Engineer", cvCount: 22, newCvCount: 1 },
      { id: "pos-8", title: "QA Tester", cvCount: 5, newCvCount: 0 },
      { id: "pos-9", title: "Product Manager", cvCount: 10, newCvCount: 0 },
    ],
  },
  {
    id: "camp-003",
    name: "Tuyển dụng Khối Quản trị Rủi ro",
    department: "Khối QTRR",
    status: "DRAFT",
    hasNew: false,
    totalCvs: 0,
    positions: [
      { id: "pos-6", title: "Chuyên viên Quản lý Rủi ro", cvCount: 0, newCvCount: 0 },
    ],
  },
]

export default function CampaignsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý và theo dõi các chiến dịch tuyển dụng</p>
        </div>
        <button className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#F37021] hover:bg-[#d9611c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCampaigns.map((camp) => (
          <div
            key={camp.id}
            className="bg-white rounded-2xl border border-slate-100/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      camp.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {camp.status}
                  </span>
                  {camp.hasNew && (
                    <div className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      MỚI
                    </div>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
                  {camp.name}
                </h3>
                <div className="flex items-center gap-1.5 text-slate-400 mt-2 text-xs font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{camp.department}</span>
                </div>
              </div>
            </div>

            {/* Body: JD List */}
            <div className="bg-slate-50/60 rounded-xl p-3.5 mt-4 space-y-2.5 flex-1">
              {camp.positions.slice(0, 3).map((pos) => (
                <div key={pos.id} className="flex items-center justify-between group">
                  <span className="text-sm font-semibold text-slate-700 truncate pr-3 group-hover:text-slate-900 transition-colors">
                    {pos.title}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pos.newCvCount > 0 && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">
                        +{pos.newCvCount}
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-md">
                      {pos.cvCount} CV
                    </span>
                  </div>
                </div>
              ))}
              {camp.positions.length > 3 && (
                <div className="text-[11px] text-slate-400 font-medium italic pt-2 border-t border-slate-100/50 mt-2 text-center hover:text-slate-600 transition-colors cursor-pointer">
                  + {camp.positions.length - 3} vị trí khác...
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500 font-medium">Tổng ứng viên</span>
                <span className="text-base font-bold text-slate-900">{camp.totalCvs}</span>
              </div>
              <Link href={`/hr/campaigns/${camp.id}`}>
                <button className="w-full bg-slate-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 group">
                  <span>Vào Quản Lý</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
