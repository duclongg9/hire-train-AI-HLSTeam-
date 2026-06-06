"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FormMessage, UploadPanel } from "@/shared/components/recruitment-common"
import { PageHeader } from "@/shared/layout/page-header"
import { createCampaign, formatApiError } from "@/features/hr/api/hr-api"
import { rememberActiveCampaign } from "@/features/hr/utils/campaign-storage"

export function CreateCampaignScreen() {
  const router = useRouter()
  const [form, setForm] = useState({ 
    name: "Q3 Frontend Hiring", 
    jobTitle: "Senior Frontend Engineer", 
    startDate: "2026-06-01", 
    endDate: "2026-07-15", 
    department: "", 
    description: "",
    headcount: "1",
    budget: "",
    owner: "",
    jdText: ""
  })
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const saveCampaign = async (status: "DRAFT" | "ACTIVE") => {
    setError("")
    setSuccess(false)
    if (!form.name || !form.jobTitle || !form.startDate || !form.endDate || !form.department) {
      setError("Missing required campaign fields.")
      return
    }

    setLoading(true)
    try {
      const created = await createCampaign({
        title: `${form.name} - ${form.jobTitle}`,
        jd_text: form.jdText || form.description || null,
        start_date: form.startDate ? new Date(`${form.startDate}T00:00:00`).toISOString() : null,
        deadline_at: form.endDate ? new Date(`${form.endDate}T23:59:59`).toISOString() : null,
        department_scope: form.department,
        status: status,
      })
      rememberActiveCampaign(created.id)
      setSuccess(true)
      window.setTimeout(() => router.push(`/hr/campaigns/${created.id}/rubric`), 450)
    } catch (error) {
      setError(formatApiError(error, "Campaign could not be created."))
    }
    setLoading(false)
  }

  return (
    <>
      <PageHeader title='Create Campaign' subtitle='Create campaign metadata and setup JD for analysis.' />
      <div className="mx-auto max-w-4xl space-y-6">
        {error ? <FormMessage type="warning">{error}</FormMessage> : null}
        {success ? <FormMessage type="success">Campaign created. Continuing to Rubric config...</FormMessage> : null}

        <Card className="rounded-lg p-5 shadow-sm">
          <div className="mb-4 border-b pb-4">
            <h2 className="text-lg font-semibold text-foreground">Campaign Details</h2>
            <p className="text-sm text-muted-foreground">General information about the hiring campaign.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input id="campaign-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input id="job-title" value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={form.department} onValueChange={(value) => setForm({ ...form, department: value })}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Khối CNTT">Khối CNTT</SelectItem>
                  <SelectItem value="Khối Khách hàng Cá nhân">Khối Khách hàng Cá nhân</SelectItem>
                  <SelectItem value="Khối Vận hành">Khối Vận hành</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Recruiter/Owner</Label>
              <Select value={form.owner} onValueChange={(value) => setForm({ ...form, owner: value })}>
                <SelectTrigger id="owner">
                  <SelectValue placeholder="Select recruiter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jane Doe">Jane Doe</SelectItem>
                  <SelectItem value="John Smith">John Smith</SelectItem>
                  <SelectItem value="Alice Johnson">Alice Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headcount">Headcount (Số lượng cần tuyển)</Label>
              <Input id="headcount" type="number" min="1" value={form.headcount} onChange={(event) => setForm({ ...form, headcount: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Mức lương dự kiến)</Label>
              <Input id="budget" placeholder="e.g. 10.000.000 - 20.000.000 VND" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Internal Description (optional)</Label>
              <Textarea id="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} />
            </div>
          </div>
        </Card>

        <Card className="rounded-lg p-5 shadow-sm">
          <div className="mb-4 border-b pb-4">
            <h2 className="text-lg font-semibold text-foreground">Job Description (JD) Ingestion</h2>
            <p className="text-sm text-muted-foreground">Upload a JD file or paste the content directly.</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
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
            <div className="space-y-3">
              <Label>Option 2: Paste JD Text</Label>
              <Textarea 
                placeholder="Paste the full job description here..." 
                value={form.jdText} 
                onChange={(event) => setForm({ ...form, jdText: event.target.value })} 
                className="h-[140px] resize-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/hr">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button variant="outline" className="border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100" disabled={loading} onClick={() => saveCampaign("DRAFT")}>
            Lưu Nháp (Draft)
          </Button>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={loading} onClick={() => saveCampaign("ACTIVE")}>
            {loading ? "Creating..." : "Tạo & Kích Hoạt (Active)"}
          </Button>
        </div>
      </div>
    </>
  )
}
