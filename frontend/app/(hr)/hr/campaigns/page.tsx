"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from '@/shared/layout/page-header'
import { listCampaigns, createCampaign, closeCampaign, BackendCampaign, formatApiError } from "@/features/hr/api/hr-api"

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<BackendCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  
  const [form, setForm] = useState({
    name: "",
    department: "",
    startDate: "",
    endDate: ""
  })

  useEffect(() => {
    let mounted = true
    listCampaigns()
      .then(data => {
        if (mounted) {
          setCampaigns(data)
          setLoading(false)
        }
      })
      .catch(err => {
        if (mounted) {
          setError("Failed to load campaigns.")
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [])

  const handleCreate = async () => {
    setCreateError("")
    if (!form.name || !form.department || !form.startDate || !form.endDate) {
      setCreateError("Vui lòng điền đầy đủ các trường yêu cầu.")
      return
    }
    
    setIsCreating(true)
    try {
      const created = await createCampaign({
        title: form.name,
        department_scope: form.department,
        start_date: new Date(`${form.startDate}T00:00:00`).toISOString(),
        end_date: new Date(`${form.endDate}T23:59:59`).toISOString(),
        status: "DRAFT"
      })
      setCampaigns([created, ...campaigns])
      setIsCreateModalOpen(false)
      setForm({ name: "", department: "", startDate: "", endDate: "" })
    } catch (err) {
      setCreateError(formatApiError(err, "Failed to create campaign."))
    } finally {
      setIsCreating(false)
    }
  }

  const handleHideCampaign = async (id: string) => {
    try {
      await closeCampaign(id)
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: "CLOSED" } : c))
    } catch (err) {
      alert(formatApiError(err, "Failed to hide campaign."))
    }
  }

  return (
    <>
      <PageHeader title="Campaigns" subtitle="Manage recruitment campaigns" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Danh sách Campaign</h2>
            <p className="text-sm text-muted-foreground">Tạo mới hoặc quản lý các đợt tuyển dụng.</p>
          </div>
          <Button className="bg-[#F37021] text-white hover:bg-[#d95f18]" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
        
        {error ? <div className="text-red-500">{error}</div> : null}

        <Card className="rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Start / End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading campaigns...</TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">Chưa có campaign nào.</TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((camp) => (
                    <TableRow key={camp.id}>
                      <TableCell className="font-medium text-foreground">{camp.title}</TableCell>
                      <TableCell>{(camp as any).department_scope || "N/A"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{camp.start_date ? format(new Date(camp.start_date), "dd/MM/yyyy") : "N/A"}</div>
                          <div className="text-xs text-muted-foreground">{camp.end_date ? format(new Date(camp.end_date), "dd/MM/yyyy") : (camp.deadline_at ? format(new Date(camp.deadline_at), "dd/MM/yyyy") : "N/A")}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "rounded-md px-2 py-1 text-xs font-medium",
                          camp.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                          camp.status === "CLOSED" ? "bg-red-100 text-red-800" :
                          "bg-slate-100 text-slate-800"
                        )}>
                          {camp.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/hr/campaigns/${camp.id}`)}>
                          Xem chi tiết
                        </Button>
                        {camp.status !== "CLOSED" && (
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleHideCampaign(camp.id)}>
                            Ẩn
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-xl p-6 relative">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-foreground">Tạo Campaign Mới</h3>
              <p className="text-sm text-muted-foreground">Nhập các thông tin cơ bản cho chiến dịch tuyển dụng.</p>
            </div>
            
            {createError ? <div className="mb-4 text-sm font-medium text-red-500">{createError}</div> : null}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="camp-name">Campaign Name</Label>
                <Input id="camp-name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Q3 Hiring" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-dept">Department</Label>
                <Select value={form.department} onValueChange={v => setForm({...form, department: v})}>
                  <SelectTrigger id="camp-dept">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Khối CNTT">Khối CNTT</SelectItem>
                    <SelectItem value="Khối Khách hàng Cá nhân">Khối Khách hàng Cá nhân</SelectItem>
                    <SelectItem value="Khối Vận hành">Khối Vận hành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="camp-start">Start Date</Label>
                  <Input id="camp-start" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camp-end">End Date</Label>
                  <Input id="camp-end" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={isCreating} onClick={handleCreate}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
