"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { UploadPanel } from "@/components/recruitment/common"
import { HrShell } from "@/components/recruitment/app-shell"
import { 
  getCampaign, 
  listPositions, 
  createPosition, 
  createPositionFromFile,
  BackendCampaign, 
  BackendPosition, 
  formatApiError 
} from "@/lib/recruitment/api"

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params?.campaignId as string || params?.id as string

  const [campaign, setCampaign] = useState<BackendCampaign | null>(null)
  const [positions, setPositions] = useState<BackendPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [isSlideOpen, setIsSlideOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [slideError, setSlideError] = useState("")

  const [form, setForm] = useState({
    title: "",
    headcount: "1",
    budget: "",
    jdText: ""
  })
  const [jdFile, setJdFile] = useState<File | null>(null)

  useEffect(() => {
    if (!campaignId) return
    let mounted = true
    Promise.all([
      getCampaign(campaignId),
      listPositions(campaignId).catch(() => []) // Mock backend might not have it yet
    ])
      .then(([campData, posData]) => {
        if (mounted) {
          setCampaign(campData)
          setPositions(posData || [])
          setLoading(false)
        }
      })
      .catch(err => {
        if (mounted) {
          setError("Failed to load campaign details.")
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [campaignId])

  const handleAddPosition = async () => {
    setSlideError("")
    if (!form.title || !form.headcount) {
      setSlideError("Vui lòng nhập Job Title và Headcount.")
      return
    }

    setIsSubmitting(true)
    try {
      let created: BackendPosition
      if (jdFile) {
        created = await createPositionFromFile(campaignId, {
          title: form.title,
          headcount: parseInt(form.headcount, 10),
          budget: form.budget || null
        }, jdFile)
      } else {
        created = await createPosition(campaignId, {
          title: form.title,
          headcount: parseInt(form.headcount, 10),
          budget: form.budget || null,
          jd_text: form.jdText || null
        })
      }
      setPositions([created, ...positions])
      setIsSlideOpen(false)
      setForm({ title: "", headcount: "1", budget: "", jdText: "" })
      setJdFile(null)
    } catch (err) {
      setSlideError(formatApiError(err, "Failed to create position."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <HrShell title={campaign?.title || "Campaign Details"} subtitle="Quản lý các vị trí tuyển dụng của chiến dịch">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/hr/campaigns")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" onClick={() => setIsSlideOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Position
          </Button>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <Card className="rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-lg text-foreground">Positions ({positions.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vị trí (Job Title)</TableHead>
                  <TableHead>Số lượng (Headcount)</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Số CV đã nộp</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : positions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">Chưa có vị trí nào. Hãy thêm mới.</TableCell>
                  </TableRow>
                ) : (
                  positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-medium text-foreground">{pos.title}</TableCell>
                      <TableCell>{pos.headcount}</TableCell>
                      <TableCell>{pos.budget || "N/A"}</TableCell>
                      <TableCell>{pos.candidate_count || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/hr/campaigns/${campaignId}/rubric?positionId=${pos.id}`)}
                        >
                          Cấu hình AI
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Sheet open={isSlideOpen} onOpenChange={setIsSlideOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Thêm Vị Trí Mới</SheetTitle>
            <SheetDescription>Nhập thông tin vị trí và Job Description (JD) để AI phân tích.</SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6">
            {slideError && <div className="text-sm font-medium text-red-500">{slideError}</div>}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pos-title">Job Title</Label>
                <Input id="pos-title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pos-headcount">Headcount</Label>
                  <Input id="pos-headcount" type="number" min="1" value={form.headcount} onChange={e => setForm({...form, headcount: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pos-budget">Budget</Label>
                  <Input id="pos-budget" placeholder="e.g. $1000 - $2000" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Job Description (JD) Ingestion</h4>
                <p className="text-xs text-muted-foreground mb-4">Upload a JD file or paste the content directly.</p>
              </div>

              <div className="space-y-3">
                <Label>Option 1: Upload File</Label>
                <UploadPanel
                  title="Upload JD file"
                  description="Supports PDF, DOC, or DOCX."
                  accept=".pdf,.doc,.docx"
                  fileName={jdFile?.name}
                  onChange={setJdFile}
                />
              </div>
              
              <div className="flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="mx-4 text-xs text-muted-foreground uppercase font-medium">Hoặc</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="space-y-3">
                <Label>Option 2: Paste JD Text</Label>
                <Textarea 
                  placeholder="Paste the full job description here..." 
                  value={form.jdText} 
                  onChange={e => setForm({...form, jdText: e.target.value})} 
                  className="h-[120px] resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsSlideOpen(false)}>Cancel</Button>
              <Button className="bg-[#F37021] text-white hover:bg-[#d95f18]" disabled={isSubmitting} onClick={handleAddPosition}>
                {isSubmitting ? "Processing..." : "Bắt đầu phân tích AI"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </HrShell>
  )
}
