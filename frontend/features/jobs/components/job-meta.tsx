import type { LucideIcon } from "lucide-react"

export function JobMeta({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-[#c6203f]" />
      {label}
    </span>
  )
}
