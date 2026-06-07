"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { FormMessage, StatusPill } from "@/shared/components/recruitment-common"
import { PageHeader } from "@/shared/layout/page-header"
import { useRouteCampaignId } from "@/features/hr/hooks/use-route-campaign-id"
import { getRememberedCampaignId } from "@/features/hr/utils/campaign-storage"
import { extractedSkills, type RubricSkill } from "@/lib/recruitment/mock-data"
import { cn } from "@/lib/utils"

export function RubricScreen() {
  const router = useRouter()
  const campaignId = useRouteCampaignId() || getRememberedCampaignId()
  const [skills, setSkills] = useState<RubricSkill[]>(extractedSkills)
  const [saving, setSaving] = useState(false)
  const total = skills.reduce((sum, skill) => sum + skill.weight, 0)

  const updateWeight = (skillId: string, weight: number) => {
    setSkills((current) => current.map((skill) => (skill.id === skillId ? { ...skill, weight } : skill)))
  }

  const save = () => {
    if (total !== 100) return
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      router.push(`/hr/campaigns/${campaignId}/test-review`)
    }, 600)
  }

  return (
    <>
      <PageHeader title='Rubric Configuration' subtitle='Review AI extracted skills and tune scoring weights before test generation.' />
      <div className="space-y-6">
        <Card className="rounded-lg p-6 shadow-sm flex gap-6 items-start bg-slate-50 border-slate-200">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">JD Analysis Overview</h3>
            <p className="text-sm text-slate-600 mb-4">
              AI has analyzed the Job Description and extracted key skills. Review the rubric below.
            </p>
          </div>
          <div className="w-[300px] shrink-0 bg-white p-2 rounded-md shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-2 font-medium text-center">Tài liệu JD (Bản xem trước)</p>
            <div className="w-full h-[200px] bg-slate-100 flex items-center justify-center rounded overflow-hidden">
              <img src="/Logo-SHB-EN.png" alt="JD Preview" className="max-w-full max-h-full object-contain opacity-50" />
            </div>
          </div>
        </Card>
        <Card className="rounded-lg p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Extracted JD skills</h2>
              <p className="text-sm text-muted-foreground">Each skill is editable through a weight slider.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total weight</p>
              <p className={cn("text-2xl font-bold", total === 100 ? "text-emerald-700" : "text-orange-700")}>{total}%</p>
            </div>
          </div>
          {total !== 100 ? (
            <div className="mt-4">
              <FormMessage type="warning">Total weight must equal 100% before saving.</FormMessage>
            </div>
          ) : null}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{skill.name}</h3>
                      <StatusPill tone="blue">{skill.category}</StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{skill.evidence}</p>
                  </div>
                  <span className="text-lg font-bold text-[#0033A0]">{skill.weight}%</span>
                </div>
                <Slider className="mt-4" min={0} max={60} step={5} value={[skill.weight]} onValueChange={(value) => updateWeight(skill.id, value[0] ?? 0)} />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setSkills(extractedSkills.map((skill, index) => ({ ...skill, weight: [30, 20, 15, 15, 20][index] ?? skill.weight })))}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate Rubric
          </Button>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={total !== 100 || saving} onClick={save}>
            {saving ? "Saving..." : "Save Rubric"}
          </Button>
        </div>
      </div>
    </>
  )
}
