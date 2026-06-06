import type { ReactNode } from "react"
import { AlertTriangle, CheckCircle2, FileText, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  helper,
}: {
  label: string
  value: string | number
  icon: ReactNode
  tone?: "blue" | "orange" | "green" | "red" | "slate"
  helper?: string
}) {
  const tones = {
    blue: "bg-[#0033A0]/10 text-[#0033A0]",
    orange: "bg-[#F37021]/10 text-[#F37021]",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  }

  return (
    <Card className="rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        <div className={cn("rounded-lg p-2", tones[tone])}>{icon}</div>
      </div>
    </Card>
  )
}

export function StatusPill({
  children,
  tone = "slate",
}: {
  children: ReactNode
  tone?: "green" | "orange" | "red" | "blue" | "slate"
}) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  }

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
      <FileText className="mx-auto h-9 w-9 text-muted-foreground" />
      <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function LoadingState({ label = "Loading mock state..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border bg-card p-8 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

export function FormMessage({
  type,
  children,
}: {
  type: "success" | "error" | "warning"
  children: ReactNode
}) {
  const classes = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
    warning: "border-orange-200 bg-orange-50 text-orange-700",
  }

  const Icon = type === "success" ? CheckCircle2 : AlertTriangle

  return (
    <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", classes[type])}>
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <span>{children}</span>
    </div>
  )
}

export function UploadPanel({
  title,
  description,
  accept,
  fileName,
  onChange,
}: {
  title: string
  description: string
  accept: string
  fileName?: string
  onChange: (file: File | null) => void
}) {
  return (
    <label className="block cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-[#0033A0] hover:bg-blue-50/40">
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <div className="flex flex-col items-center text-center">
        <FileText className="h-9 w-9 text-[#0033A0]" />
        <p className="mt-3 font-semibold text-foreground">{fileName || title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </label>
  )
}

export function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}
