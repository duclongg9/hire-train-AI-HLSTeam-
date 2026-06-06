"use client"

import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { AlertTriangle, Bold, GripVertical, Italic, List, Plus, Redo, Save, Sparkles, Trash2, Undo } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

import { saveInterviewRubric, getInterviewRubric, formatApiError } from "@/features/hr/api/hr-api"
import type { BackendInterviewRubricCriterion, BackendInterviewRubricGroup } from "@/shared/api/backend-types"
import { useParams, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

type DragState =
  | { type: "group"; groupId: string }
  | { type: "criterion"; groupId: string; criterionId: string }
  | null

const groupColorClasses = [
  "bg-emerald-50 text-emerald-950 border-emerald-200",
  "bg-cyan-50 text-cyan-950 border-cyan-200",
  "bg-rose-50 text-rose-950 border-rose-200",
  "bg-violet-50 text-violet-950 border-violet-200",
]

function InterviewToolbar({
  scale,
  onScaleChange,
  onAddGroup,
}: {
  scale: "5-level" | "3-level"
  onScaleChange: (scale: "5-level" | "3-level") => void
  onAddGroup: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="font-semibold">
          Toolbar
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
          Add group
        </Button>
        <select
          value={scale}
          onChange={(event) => onScaleChange(event.target.value as "5-level" | "3-level")}
          className="h-9 rounded-md border border-input bg-white px-3 text-sm font-medium shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#102a62]/25"
        >
          <option value="5-level">5-level scale</option>
          <option value="3-level">3-level scale</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button className="bg-[#102a62] text-white hover:bg-[#0b1d45]">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Auto-Generate
        </Button>
      </div>
    </div>
  )
}

function WeightControl({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="inline-flex h-8 items-center overflow-hidden rounded-md border bg-white text-sm">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
        onClick={() => onChange(Math.max(0, value - 5))}
      >
        -
      </button>
      <span className="min-w-12 border-x px-2 text-center font-semibold">{value}%</span>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
        onClick={() => onChange(Math.min(100, value + 5))}
      >
        +
      </button>
    </div>
  )
}

function DescriptionCell({
  row,
  onChange,
}: {
  row: BackendInterviewRubricCriterion
  onChange: (description: string) => void
}) {
  if (row.editing) {
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
          value={row.description}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Describe expected evidence and scoring behavior..."
          className="min-h-20 resize-none border-0 text-xs shadow-none focus-visible:ring-0"
        />
      </div>
    )
  }

  return (
    <Textarea
      value={row.description}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-16 resize-none border-0 bg-transparent p-0 text-xs leading-5 text-slate-600 shadow-none focus-visible:ring-0"
    />
  )
}

function BackendInterviewRubricCriterionRow({
  row,
  groupId,
  onDragStart,
  onDropCriterion,
  onUpdate,
  onDelete,
}: {
  row: BackendInterviewRubricCriterion
  groupId: string
  onDragStart: (state: DragState) => void
  onDropCriterion: (targetGroupId: string, targetCriterionId: string) => void
  onUpdate: (patch: Partial<BackendInterviewRubricCriterion>) => void
  onDelete: () => void
}) {
  return (
    <div
      className="grid min-h-20 grid-cols-[minmax(300px,1.15fr)_130px_minmax(380px,1.7fr)] border-t bg-white text-sm"
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDropCriterion(groupId, row.id)}
    >
      <div className="flex items-center gap-2 border-r p-3">
        <button
          type="button"
          draggable
          aria-label={`Drag ${row.criterion}`}
          onDragStart={() => onDragStart({ type: "criterion", groupId, criterionId: row.id })}
          className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex h-8 w-10 shrink-0 items-center justify-center rounded-md border bg-slate-50 text-xs font-bold text-slate-600">
          {row.index}
        </span>
        <Input
          value={row.criterion}
          onChange={(event) => onUpdate({ criterion: event.target.value })}
          className="h-8 min-w-0 flex-1 px-2 text-xs"
        />
      </div>
      <div className="flex items-center justify-center border-r p-3">
        <WeightControl value={row.weight} onChange={(weight) => onUpdate({ weight })} />
      </div>
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <DescriptionCell row={row} onChange={(description) => onUpdate({ description })} />
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onDelete}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}

function InterviewGroupSection({
  group,
  groupIndex,
  onDragStart,
  onDropGroup,
  onDropCriterion,
  onAddCriterion,
  onUpdateCriterion,
  onDeleteCriterion,
}: {
  group: BackendInterviewRubricGroup
  groupIndex: number
  onDragStart: (state: DragState) => void
  onDropGroup: (targetGroupId: string) => void
  onDropCriterion: (targetGroupId: string, targetCriterionId: string) => void
  onAddCriterion: () => void
  onUpdateCriterion: (criterionId: string, patch: Partial<BackendInterviewRubricCriterion>) => void
  onDeleteCriterion: (criterionId: string) => void
}) {
  const total = group.criteria.reduce((sum, row) => sum + row.weight, 0)
  const colorClass = groupColorClasses[groupIndex % groupColorClasses.length]

  return (
    <section onDragOver={(event) => event.preventDefault()} onDrop={() => onDropGroup(group.id)}>
      <div className={cn("grid grid-cols-[minmax(300px,1.15fr)_130px_minmax(380px,1.7fr)] border-t border-b text-sm", colorClass)}>
        <div className="col-span-3 flex flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              draggable
              aria-label={`Drag ${group.name}`}
              onDragStart={() => onDragStart({ type: "group", groupId: group.id })}
              className="cursor-grab rounded p-1 text-slate-500 hover:bg-white/60"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <h3 className="truncate font-bold">{group.name}</h3>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-semibold">Total: {total}%</span>
            <Button variant="outline" size="sm" className="bg-white/70" onClick={onAddCriterion}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add criterion
            </Button>
          </div>
        </div>
      </div>
      {group.criteria.map((row) => (
        <BackendInterviewRubricCriterionRow
          key={row.id}
          row={row}
          groupId={group.id}
          onDragStart={onDragStart}
          onDropCriterion={onDropCriterion}
          onUpdate={(patch) => onUpdateCriterion(row.id, patch)}
          onDelete={() => onDeleteCriterion(row.id)}
        />
      ))}
    </section>
  )
}

function renumber(criteria: BackendInterviewRubricCriterion[]) {
  return criteria.map((row, index) => ({ ...row, index: index + 1 }))
}

function InterviewRubricTable({
  groups,
  setGroups,
}: {
  groups: BackendInterviewRubricGroup[]
  setGroups: Dispatch<SetStateAction<BackendInterviewRubricGroup[]>>
}) {
  const [dragState, setDragState] = useState<DragState>(null)

  const updateCriterion = (groupId: string, criterionId: string, patch: Partial<BackendInterviewRubricCriterion>) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              criteria: group.criteria.map((row) => (row.id === criterionId ? { ...row, ...patch } : row)),
            }
          : group,
      ),
    )
  }

  const deleteCriterion = (groupId: string, criterionId: string) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, criteria: renumber(group.criteria.filter((row) => row.id !== criterionId)) }
          : group,
      ),
    )
  }

  const addCriterion = (groupId: string) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group
        const nextRow: BackendInterviewRubricCriterion = {
          id: `${group.id}-${Date.now()}`,
          index: group.criteria.length + 1,
          criterion: "New interview criterion",
          description: "Describe expected evidence, interview signal, and scoring behavior.",
          weight: 10,
          tone: "bg-white",
        }
        return { ...group, expanded: true, criteria: renumber([...group.criteria, nextRow]) }
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
      const moved = sourceGroup?.criteria.find((row) => row.id === dragState.criterionId)
      if (!moved) return current

      return current.map((group) => {
        const withoutMoved = group.criteria.filter((row) => row.id !== moved.id)
        if (group.id !== targetGroupId) return { ...group, criteria: renumber(withoutMoved) }

        const targetIndex = withoutMoved.findIndex((row) => row.id === targetCriterionId)
        const nextCriteria = [...withoutMoved]
        nextCriteria.splice(targetIndex < 0 ? nextCriteria.length : targetIndex, 0, moved)
        return { ...group, criteria: renumber(nextCriteria) }
      })
    })
    setDragState(null)
  }

  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 shadow-sm">
      <div className="grid grid-cols-[minmax(300px,1.15fr)_130px_minmax(380px,1.7fr)] bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
        <div className="border-r p-3">Criterion</div>
        <div className="border-r p-3 text-center">Weight</div>
        <div className="p-3">Interview evidence / scoring guide</div>
      </div>
      <div className="min-w-[900px]">
        {groups.map((group, index) => (
          <InterviewGroupSection
            key={group.id}
            group={group}
            groupIndex={index}
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

export function InterviewRubricEditorPage({ onStatusChange }: { onStatusChange?: (saved: boolean) => void }) {
  const params = useParams<{ campaignId?: string, positionId?: string }>()
  const searchParams = useSearchParams()
  const campaignId = params?.campaignId ?? ""
  const positionId = params?.positionId ?? searchParams.get("positionId") ?? ""

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [groups, setGroups] = useState<BackendInterviewRubricGroup[]>([])
  const [scale, setScale] = useState<"5-level" | "3-level">("5-level")

  const productWeight = useMemo(() => {
    const productGroup = groups.find((group) => group.id === "product")
    return productGroup?.criteria.reduce((sum, row) => sum + row.weight, 0) ?? 0
  }, [groups])

  const addGroup = () => {
    setGroups((current) => [
      ...current,
      {
        id: `group-${Date.now()}`,
        name: "New interview group",
        expanded: true,
        criteria: [],
      },
    ])
  }

  const handleSave = async () => {
    if (!positionId) return
    setSaving(true)
    setSaveMessage(null)
    try {
      await saveInterviewRubric(positionId, groups)
      setSaveMessage("Rubric saved successfully.")
      onStatusChange?.(true)
      setTimeout(() => setSaveMessage(null), 3000)
    } catch {
      setSaveMessage("Failed to save.")
      onStatusChange?.(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Interview Rubric Editor</h2>
        <p className="text-sm text-muted-foreground">Define and edit criteria for AI to evaluate candidate interviews.</p>
      </div>
      <InterviewToolbar scale={scale} onScaleChange={setScale} onAddGroup={addGroup} />
      <div className="overflow-x-auto pb-2">
        <InterviewRubricTable groups={groups} setGroups={setGroups} />
      </div>
      <div className="flex justify-between items-center mt-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm",
            productWeight === 100
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-amber-300 bg-amber-50 text-amber-800",
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          Product Knowledge total is {productWeight}/100%
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-sm text-green-600 font-medium">{saveMessage}</span>}
          <Button variant="outline" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Interview Rubric"}
          </Button>
          <Button 
            className="bg-[#0033A0] text-white hover:bg-[#00256f]" 
            onClick={async () => {
              if (!positionId) return
              try {
                const { publishPosition } = await import("@/features/hr/api/hr-api")
                await publishPosition(positionId)
                alert("Position published successfully!")
              } catch (err) {
                alert("Failed to publish position.")
              }
            }}
          >
            Publish Position
          </Button>
        </div>
      </div>
    </div>
  )
}
