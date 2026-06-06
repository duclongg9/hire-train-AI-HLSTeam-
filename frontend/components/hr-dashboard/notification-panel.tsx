"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Send, 
  CheckCircle, 
  Clock, 
  XCircle,
  Mail,
  MessageSquare,
  Filter,
  Search,
  Users,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  name: string
  email: string
  position: string
  status: "pending" | "approved" | "rejected"
  testScore: number
  interviewScore: number
  notificationSent: boolean
}

const candidates: Candidate[] = [
  { id: "1", name: "Nguyễn Văn An", email: "an.nguyen@email.com", position: "Chuyên viên CSKH", status: "approved", testScore: 92, interviewScore: 88, notificationSent: false },
  { id: "2", name: "Trần Thị Bình", email: "binh.tran@email.com", position: "Chuyên viên CSKH", status: "approved", testScore: 85, interviewScore: 82, notificationSent: true },
  { id: "3", name: "Lê Hoàng Cường", email: "cuong.le@email.com", position: "Chuyên viên CSKH", status: "rejected", testScore: 78, interviewScore: 65, notificationSent: false },
  { id: "4", name: "Phạm Minh Đức", email: "duc.pham@email.com", position: "Chuyên viên CSKH", status: "pending", testScore: 71, interviewScore: 0, notificationSent: false },
  { id: "5", name: "Hoàng Thị Em", email: "em.hoang@email.com", position: "Chuyên viên CSKH", status: "approved", testScore: 88, interviewScore: 90, notificationSent: false },
]

const notificationTemplates = [
  { id: "approved", title: "Thông báo trúng tuyển", type: "success" },
  { id: "rejected", title: "Thông báo không đạt", type: "error" },
  { id: "interview", title: "Mời phỏng vấn vòng tiếp theo", type: "info" },
  { id: "reminder", title: "Nhắc nhở hoàn thành test", type: "warning" },
]

export function NotificationPanel() {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [sentNotifications, setSentNotifications] = useState<Record<string, boolean>>({})

  const filteredCandidates = candidates.filter(c => {
    if (filter === "all") return true
    return c.status === filter
  })

  const toggleCandidate = (id: string) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const selectAllFiltered = () => {
    const filteredIds = filteredCandidates.map(c => c.id)
    if (selectedCandidates.length === filteredIds.length) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(filteredIds)
    }
  }

  const handleSendNotifications = () => {
    const newSent = { ...sentNotifications }
    selectedCandidates.forEach(id => {
      newSent[id] = true
    })
    setSentNotifications(newSent)
    setSelectedCandidates([])
    setSelectedTemplate(null)
  }

  const getStatusBadge = (status: Candidate["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            Đã duyệt
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            <XCircle className="w-3 h-3" />
            Từ chối
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
            <Clock className="w-3 h-3" />
            Chờ duyệt
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{candidates.length}</p>
              <p className="text-xs text-muted-foreground">Tổng ứng viên</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{candidates.filter(c => c.status === "approved").length}</p>
              <p className="text-xs text-muted-foreground">Đã duyệt</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{candidates.filter(c => !c.notificationSent && !sentNotifications[c.id]).length}</p>
              <p className="text-xs text-muted-foreground">Chưa gửi TB</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F37021]/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#F37021]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{Object.keys(sentNotifications).length + candidates.filter(c => c.notificationSent).length}</p>
              <p className="text-xs text-muted-foreground">Đã gửi TB</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Candidate List */}
        <Card className="col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Danh sách ứng viên</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="pl-9 pr-4 py-2 bg-muted rounded-lg text-sm w-48 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {(["all", "approved", "pending", "rejected"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      filter === f ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f === "all" ? "Tất cả" : f === "approved" ? "Đã duyệt" : f === "pending" ? "Chờ duyệt" : "Từ chối"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {/* Select All */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                onChange={selectAllFiltered}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-muted-foreground">
                Chọn tất cả ({filteredCandidates.length} ứng viên)
              </span>
              {selectedCandidates.length > 0 && (
                <span className="ml-auto text-sm text-[#F37021] font-medium">
                  Đã chọn {selectedCandidates.length}
                </span>
              )}
            </div>

            {/* Candidate Rows */}
            {filteredCandidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer",
                  selectedCandidates.includes(candidate.id) 
                    ? "border-[#F37021] bg-[#F37021]/5" 
                    : "border-border hover:border-muted-foreground/30"
                )}
                onClick={() => toggleCandidate(candidate.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(candidate.id)}
                  onChange={() => toggleCandidate(candidate.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0033A0] to-[#0055DD] flex items-center justify-center text-white font-semibold text-sm">
                  {candidate.name.split(" ").slice(-1)[0][0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground">{candidate.email}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{candidate.testScore}</p>
                  <p className="text-[10px] text-muted-foreground">Test</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{candidate.interviewScore || "-"}</p>
                  <p className="text-[10px] text-muted-foreground">PV</p>
                </div>
                {getStatusBadge(candidate.status)}
                {(candidate.notificationSent || sentNotifications[candidate.id]) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    <Mail className="w-3 h-3" />
                    Đã gửi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                    <Clock className="w-3 h-3" />
                    Chưa gửi
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Notification Templates */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Mẫu thông báo</h3>
          
          <div className="space-y-3 mb-6">
            {notificationTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all",
                  selectedTemplate === template.id 
                    ? "border-[#F37021] bg-[#F37021]/5" 
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    template.type === "success" ? "bg-emerald-100" :
                    template.type === "error" ? "bg-red-100" :
                    template.type === "warning" ? "bg-amber-100" : "bg-blue-100"
                  )}>
                    <MessageSquare className={cn(
                      "w-4 h-4",
                      template.type === "success" ? "text-emerald-600" :
                      template.type === "error" ? "text-red-600" :
                      template.type === "warning" ? "text-amber-600" : "text-blue-600"
                    )} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{template.title}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendNotifications}
            disabled={selectedCandidates.length === 0 || !selectedTemplate}
            className="w-full bg-[#F37021] hover:bg-[#E06010] text-white font-semibold py-6 disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            Gửi thông báo ({selectedCandidates.length})
          </Button>

          {selectedCandidates.length > 0 && selectedTemplate && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Sẽ gửi &quot;{notificationTemplates.find(t => t.id === selectedTemplate)?.title}&quot; cho {selectedCandidates.length} ứng viên
            </p>
          )}

          {/* AI Suggestion */}
          <div className="mt-6 p-4 bg-gradient-to-br from-[#0033A0]/5 to-[#0033A0]/10 rounded-lg border border-[#0033A0]/20">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-[#0033A0]" />
              <span className="text-xs font-semibold text-[#0033A0]">AI Suggestion</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Có 3 ứng viên đã duyệt nhưng chưa được gửi thông báo trúng tuyển. Bạn có muốn gửi ngay?
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs border-[#0033A0]/30 text-[#0033A0]"
              onClick={() => {
                const approvedUnsent = candidates
                  .filter(c => c.status === "approved" && !c.notificationSent && !sentNotifications[c.id])
                  .map(c => c.id)
                setSelectedCandidates(approvedUnsent)
                setSelectedTemplate("approved")
              }}
            >
              Chọn tự động
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
