"use client"

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  Bold,
  GripVertical,
  Italic,
  List,
  Plus,
  Redo,
  Sparkles,
  Trash2,
  Undo,
} from "lucide-react"

import { FormMessage } from "@/shared/components/recruitment-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cvRubricGroups, type RubricCriterion, type RubricGroup } from "@/lib/recruitment/rubric-data"
import { formatApiError, getRubric, publishPosition, saveRubric, type BackendRubricCriterion } from "@/features/hr/api/hr-api"
import { cn } from "@/lib/utils"

type DragState =
  | { type: "group"; groupId: string }
  | { type: "criterion"; groupId: string; criterionId: string }
  | null

const initialTotal = cvRubricGroups.reduce(
  (sum, group) => sum + group.criteria.reduce((groupSum, criterion) => groupSum + criterion.score, 0),
  0,
)

const categoryLabels: Record<BackendRubricCriterion["category"], string> = {
  hard_skill: "Hard skills",
  soft_skill: "Soft skills",
  experience: "Experience",
  certification: "Certification",
}

const categoryTone: Record<BackendRubricCriterion["category"], string> = {
  hard_skill: "bg-emerald-50 text-emerald-950 border-emerald-200",
  soft_skill: "bg-cyan-50 text-cyan-950 border-cyan-200",
  experience: "bg-rose-50 text-rose-950 border-rose-200",
  certification: "bg-violet-50 text-violet-950 border-violet-200",
}

function categoryForGroup(groupId: string): BackendRubricCriterion["category"] {
  if (groupId.includes("soft")) return "soft_skill"
  if (groupId.includes("experience")) return "experience"
  if (groupId.includes("certification")) return "certification"
  if (groupId === "group-b") return "experience"
  if (groupId === "group-c") return "soft_skill"
  return "hard_skill"
}

function groupsFromBackend(criteria: BackendRubricCriterion[]): RubricGroup[] {
  const categories: BackendRubricCriterion["category"][] = ["hard_skill", "soft_skill", "experience", "certification"]
  return categories
    .map((category) => {
      const items = criteria.filter((criterion) => criterion.category === category)
      return {
        id: `backend-${category}`,
        title: categoryLabels[category],
        colorClass: categoryTone[category],
        criteria: items.map((criterion, index) => ({
          id: criterion.id,
          code: `${category.split("_")[0].slice(0, 1).toUpperCase()}${index + 1}`,
          name: criterion.name,
          score: criterion.weight,
          scoreMode: "stepper" as const,
          aiEnabled: true,
          deletable: true,
          description: criterion.description ?? "",
        })),
      }
    })
    .filter((group) => group.criteria.length > 0)
}

function normalizeToBackendCriteria(groups: RubricGroup[]) {
  const rows = groups.flatMap((group) =>
    group.criteria
      .filter((criterion) => criterion.name.trim())
      .map((criterion) => ({
        category: categoryForGroup(group.id),
        name: criterion.name.trim(),
        rawWeight: Math.max(0, Number(criterion.score) || 0),
        description: criterion.description || null,
      })),
  )

  const rawTotal = rows.reduce((sum, row) => sum + row.rawWeight, 0)
  if (rawTotal <= 0) return []

  const normalized = rows.map((row) => ({
    category: row.category,
    name: row.name,
    weight: Math.max(0, Math.round((row.rawWeight / rawTotal) * 100)),
    description: row.description,
  }))

  const diff = 100 - normalized.reduce((sum, row) => sum + row.weight, 0)
  if (normalized.length > 0 && diff !== 0) {
    normalized[0] = { ...normalized[0], weight: Math.max(0, normalized[0].weight + diff) }
  }

  return normalized
}

function RubricToolbar({ onAddGroup }: { onAddGroup: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="font-semibold">
          Toolbar
        </Button>
        <Button variant="ghost" size="icon" aria-label="AI">
          <Sparkles className="h-4 w-4 text-[#f37021]" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Undo">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Redo">
          <Redo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onAddGroup}>
          <Plus className="mr-2 h-4 w-4" />
          Kiểu tán
        </Button>
      </div>
      <Button className="bg-[#102a62] text-white hover:bg-[#0b1d45]">
        <Sparkles className="mr-2 h-4 w-4" />
        Kiểm AI
      </Button>
    </div>
  )
}

function ScoreControl({
  criterion,
  onChange,
}: {
  criterion: RubricCriterion
  onChange: (score: number, scoreMode?: RubricCriterion["scoreMode"]) => void
}) {
  if (criterion.scoreMode === "range") {
    return (
      <select
        value={criterion.score}
        onChange={(event) => onChange(Number(event.target.value), "range")}
        className="h-8 w-24 rounded-md border border-slate-200 bg-white px-2 text-center text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#102a62]/20"
      >
        <option value={5}>1 to 5</option>
        <option value={10}>1 to 10</option>
        <option value={15}>1 to 15</option>
      </select>
    )
  }

  return (
    <div className="inline-flex h-8 items-center overflow-hidden rounded-md border bg-white text-sm">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
        onClick={() => onChange(Math.max(0, criterion.score - 1))}
      >
        -
      </button>
      <span className="min-w-8 border-x px-2 text-center font-semibold">{criterion.score}</span>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
        onClick={() => onChange(criterion.score + 1)}
      >
        +
      </button>
    </div>
  )
}

function AIDescriptionCell({
  criterion,
  onChange,
}: {
  criterion: RubricCriterion
  onChange: (description: string) => void
}) {
  if (criterion.activeEditor) {
    return (
      <div className="rounded-md border border-dashed border-[#102a62]/50 bg-white">
        <div className="flex items-center gap-1 border-b bg-slate-50 px-2 py-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <List className="h-3.5 w-3.5" />
          </Button>
          <Badge variant="outline" className="ml-auto text-[10px]">
            Editing
          </Badge>
        </div>
        <Textarea
          autoFocus
          value={criterion.description}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nhập định nghĩa / ví dụ / thang điểm AI chấm..."
          className="min-h-20 resize-none border-0 text-xs shadow-none focus-visible:ring-0"
        />
      </div>
    )
  }

  return (
    <Textarea
      value={criterion.description}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-16 resize-none border-0 bg-transparent p-0 text-xs leading-5 text-slate-600 shadow-none focus-visible:ring-0"
    />
  )
}

function CriteriaRow({
  criterion,
  groupId,
  onDragStart,
  onDropCriterion,
  onUpdate,
  onDelete,
}: {
  criterion: RubricCriterion
  groupId: string
  onDragStart: (state: DragState) => void
  onDropCriterion: (targetGroupId: string, targetCriterionId: string) => void
  onUpdate: (patch: Partial<RubricCriterion>) => void
  onDelete: () => void
}) {
  return (
    <div
      className="grid min-h-20 grid-cols-[minmax(260px,1.15fr)_130px_minmax(360px,1.7fr)] border-t bg-white text-sm"
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDropCriterion(groupId, criterion.id)}
    >
      <div className="flex items-center gap-2 border-r p-3">
        <button
          type="button"
          draggable
          aria-label={`Drag ${criterion.code}`}
          onDragStart={() => onDragStart({ type: "criterion", groupId, criterionId: criterion.id })}
          className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Input
          value={criterion.code}
          onChange={(event) => onUpdate({ code: event.target.value })}
          className="h-8 w-16 px-2 text-center text-xs font-bold"
        />
        <Input
          value={criterion.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
          className="h-8 min-w-0 flex-1 px-2 text-xs"
        />
      </div>
      <div className="flex items-center justify-center border-r p-3">
        <ScoreControl
          criterion={criterion}
          onChange={(score, scoreMode) => onUpdate({ score, ...(scoreMode ? { scoreMode } : {}) })}
        />
      </div>
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <AIDescriptionCell criterion={criterion} onChange={(description) => onUpdate({ description })} />
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onDelete}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          Xóa
        </Button>
      </div>
    </div>
  )
}

function CriteriaGroupSection({
  group,
  onDragStart,
  onDropGroup,
  onDropCriterion,
  onAddCriterion,
  onUpdateCriterion,
  onDeleteCriterion,
}: {
  group: RubricGroup
  onDragStart: (state: DragState) => void
  onDropGroup: (targetGroupId: string) => void
  onDropCriterion: (targetGroupId: string, targetCriterionId: string) => void
  onAddCriterion: () => void
  onUpdateCriterion: (criterionId: string, patch: Partial<RubricCriterion>) => void
  onDeleteCriterion: (criterionId: string) => void
}) {
  const total = group.criteria.reduce((sum, criterion) => sum + criterion.score, 0)

  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDropGroup(group.id)}
    >
      <div className={cn("grid grid-cols-[minmax(260px,1.15fr)_130px_minmax(360px,1.7fr)] border-t border-b text-sm", group.colorClass)}>
        <div className="col-span-3 flex flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              draggable
              aria-label={`Drag ${group.title}`}
              onDragStart={() => onDragStart({ type: "group", groupId: group.id })}
              className="cursor-grab rounded p-1 text-slate-500 hover:bg-white/60"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <h3 className="truncate font-bold">{group.title}</h3>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-semibold">Tổng: {total} điểm</span>
            <Button variant="outline" size="sm" className="bg-white/70" onClick={onAddCriterion}>
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm tiêu chí mới
            </Button>
          </div>
        </div>
      </div>
      {group.criteria.map((criterion) => (
        <CriteriaRow
          key={criterion.id}
          criterion={criterion}
          groupId={group.id}
          onDragStart={onDragStart}
          onDropCriterion={onDropCriterion}
          onUpdate={(patch) => onUpdateCriterion(criterion.id, patch)}
          onDelete={() => onDeleteCriterion(criterion.id)}
        />
      ))}
    </section>
  )
}

function CriteriaTable({
  groups,
  setGroups,
}: {
  groups: RubricGroup[]
  setGroups: Dispatch<SetStateAction<RubricGroup[]>>
}) {
  const [dragState, setDragState] = useState<DragState>(null)

  const updateCriterion = (groupId: string, criterionId: string, patch: Partial<RubricCriterion>) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              criteria: group.criteria.map((criterion) =>
                criterion.id === criterionId ? { ...criterion, ...patch } : criterion,
              ),
            }
          : group,
      ),
    )
  }

  const deleteCriterion = (groupId: string, criterionId: string) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, criteria: group.criteria.filter((criterion) => criterion.id !== criterionId) }
          : group,
      ),
    )
  }

  const addCriterion = (groupId: string) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group
        const nextIndex = group.criteria.length + 1
        const prefix = group.title.match(/Nhóm ([A-Z])/)?.[1] ?? "N"
        return {
          ...group,
          criteria: [
            ...group.criteria,
            {
              id: `${group.id}-${Date.now()}`,
              code: `${prefix}${nextIndex}`,
              name: "Tiêu chí mới",
              score: 1,
              scoreMode: "stepper",
              aiEnabled: true,
              deletable: true,
              description: "Định nghĩa / Ví dụ / Thang điểm AI chấm...",
            },
          ],
        }
      }),
    )
  }

  const dropGroup = (targetGroupId: string) => {
    if (!dragState || dragState.type !== "group" || dragState.groupId === targetGroupId) return
    setGroups((current) => {
      const sourceIndex = current.findIndex((group) => group.id === dragState.groupId)
      const targetIndex = current.findIndex((group) => group.id === targetGroupId)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const next = [...current]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setDragState(null)
  }

  const dropCriterion = (targetGroupId: string, targetCriterionId: string) => {
    if (!dragState || dragState.type !== "criterion") return
    setGroups((current) => {
      const sourceGroup = current.find((group) => group.id === dragState.groupId)
      const moved = sourceGroup?.criteria.find((criterion) => criterion.id === dragState.criterionId)
      if (!moved) return current

      return current.map((group) => {
        const withoutMoved = group.criteria.filter((criterion) => criterion.id !== moved.id)
        if (group.id !== targetGroupId) return { ...group, criteria: withoutMoved }

        const targetIndex = withoutMoved.findIndex((criterion) => criterion.id === targetCriterionId)
        const nextCriteria = [...withoutMoved]
        nextCriteria.splice(targetIndex < 0 ? nextCriteria.length : targetIndex, 0, moved)
        return { ...group, criteria: nextCriteria }
      })
    })
    setDragState(null)
  }

  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 shadow-sm">
      <div className="grid grid-cols-[minmax(260px,1.15fr)_130px_minmax(360px,1.7fr)] bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
        <div className="border-r p-3">Mã & Tên tiêu chí</div>
        <div className="border-r p-3 text-center">Điểm tối đa</div>
        <div className="p-3">Định nghĩa / Ví dụ / Thang điểm AI chấm</div>
      </div>
      <div className="min-w-[860px]">
        {groups.map((group) => (
          <CriteriaGroupSection
            key={group.id}
            group={group}
            onDragStart={setDragState}
            onDropGroup={dropGroup}
            onDropCriterion={dropCriterion}
            onAddCriterion={() => addCriterion(group.id)}
            onUpdateCriterion={(criterionId, patch) => updateCriterion(group.id, criterionId, patch)}
            onDeleteCriterion={(criterionId) => deleteCriterion(group.id, criterionId)}
          />
        ))}
      </div>
    </Card>
  )
}

export function CriteriaScoringScreen({ onStatusChange }: { onStatusChange?: (saved: boolean) => void }) {
  const params = useParams<{ campaignId?: string, positionId?: string }>()
  const searchParams = useSearchParams()
  const campaignId = params?.campaignId ?? ""
  const positionId = params?.positionId ?? searchParams.get("positionId") ?? ""
  
  const [groups, setGroups] = useState<RubricGroup[]>(cvRubricGroups)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)

  const totalScore = useMemo(
    () => groups.reduce((sum, group) => sum + group.criteria.reduce((groupSum, criterion) => groupSum + criterion.score, 0), 0),
    [groups],
  )
  const overallScore = Math.max(0, Math.min(100, 95 + totalScore - initialTotal))
  const backendCriteria = useMemo(() => normalizeToBackendCriteria(groups), [groups])

  useEffect(() => {
    if (!positionId) {
      setMessage({ type: "warning", text: "Open this page from a campaign's position to save rubric changes to backend." })
      return
    }

    let mounted = true
    setLoading(true)
    getRubric(positionId)
      .then((criteria) => {
        if (!mounted) return
        if (criteria.length > 0) {
          setGroups(groupsFromBackend(criteria))
          setMessage({ type: "success", text: `Loaded ${criteria.length} rubric criteria from backend.` })
        } else {
          setMessage({ type: "warning", text: "No backend rubric yet. Edit the draft below, then save it to this position." })
        }
        if (campaignId) window.localStorage.setItem("activeCampaignId", campaignId)
        window.localStorage.setItem("activePositionId", positionId)
      })
      .catch((error) => {
        if (mounted) setMessage({ type: "error", text: formatApiError(error, "Could not load campaign rubric.") })
        onStatusChange?.(false)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [campaignId, positionId])

  const addGroup = () => {
    setGroups((current) => [
      ...current,
      {
        id: `group-${Date.now()}`,
        title: "Nhóm D — Kiến thức nghiệp vụ",
        colorClass: "bg-violet-50 text-violet-950 border-violet-200",
        criteria: [],
      },
    ])
  }

  const saveToBackend = async () => {
    if (!positionId) {
      setMessage({ type: "error", text: "Missing positionId in the route." })
      return
    }
    if (backendCriteria.length === 0) {
      setMessage({ type: "error", text: "Add at least one rubric criterion before saving." })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const saved = await saveRubric(positionId, backendCriteria)
      setGroups(groupsFromBackend(saved))
      setMessage({ type: "success", text: `Saved ${saved.length} rubric criteria. Backend weights total 100%.` })
      onStatusChange?.(true)
    } catch (error) {
      setMessage({ type: "error", text: formatApiError(error, "Could not save rubric.") })
      onStatusChange?.(false)
    } finally {
      setSaving(false)
    }
  }

  const publishToBackend = async () => {
    if (!positionId) {
      setMessage({ type: "error", text: "Missing positionId in the route." })
      return
    }
    setPublishing(true)
    setMessage(null)
    try {
      const pos = await publishPosition(positionId)
      setMessage({ type: "success", text: `Position published.` })
    } catch (error) {
      setMessage({ type: "error", text: formatApiError(error, "Could not publish campaign.") })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">CV Rubric Criteria Scoring</h2>
        <p className="text-sm text-muted-foreground">Create, edit, organize, and AI-generate scoring criteria for CV evaluation.</p>
      </div>
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
      <RubricToolbar onAddGroup={addGroup} />
      <div className="overflow-x-auto pb-2">
        <CriteriaTable groups={groups} setGroups={setGroups} />
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={loading || saving || publishing} onClick={saveToBackend}>
            {saving ? "Saving..." : "Save Rubric"}
          </Button>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={loading || publishing} onClick={publishToBackend}>
            {publishing ? "Publishing..." : "Publish Position"}
          </Button>
        </div>
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm">
          Lưu ý: Tổng điểm hiện tại đang là {overallScore}/100đ
        </div>
      </div>
    </div>
  )
}
