"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Search, Filter, Download } from "lucide-react"

import { CandidateRankingTable, CandidateDrawer } from "@/features/hr/containers/hr-screens"
import { candidates, type Candidate } from "@/lib/recruitment/mock-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function PipelinePage() {
  const params = useParams<{ campaignId?: string, positionId?: string }>()
  const campaignId = params?.campaignId ?? ""

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const handleQuickAction = async (candidate: Candidate, actionName: string, actionFn: () => Promise<string>) => {
    setBusyAction(actionName)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const result = await actionFn()
      alert(result)
    } catch (error) {
      alert("Action failed")
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/hr/campaigns/${campaignId}`}>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pipeline Ứng viên</h1>
              <p className="text-sm text-slate-500 mt-1">Chuyên viên Quan hệ Khách hàng Cá nhân</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white">
              <Download className="w-4 h-4 mr-2" />
              Xuất dữ liệu
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl flex items-start gap-3">
          <Filter className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold mb-1">Dữ liệu Demo (Mock Data)</p>
            <p>Trong phiên bản hiện tại, hệ thống đang hiển thị 5 ứng viên mẫu tiêu biểu đã được AI phân tích để bạn trải nghiệm các chức năng Đánh giá, Gửi bài Test và Phỏng vấn. (Số lượng tổng trên Dashboard là số giả lập cho chiến dịch).</p>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <CandidateRankingTable 
            candidates={candidates}
            onViewMore={(cand) => setSelectedCandidate(cand)}
            onQuickAction={handleQuickAction}
            busyAction={busyAction}
          />
        </div>
      </div>

      {/* Detail Drawer */}
      <CandidateDrawer 
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  )
}
