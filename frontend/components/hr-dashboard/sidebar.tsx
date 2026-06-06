"use client"

import {
  BarChart3,
  Bell,
  Brain,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  { id: "dashboard", label: "Tong quan", icon: LayoutDashboard },
  { id: "jd-analysis", label: "Phan tich JD & CV", icon: FileText },
  { id: "candidates", label: "Quan ly ung vien", icon: Users },
  { id: "notifications", label: "Thong bao", icon: Bell },
  { id: "analytics", label: "Bao cao", icon: BarChart3 },
  { id: "settings", label: "Cai dat", icon: Settings },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border p-6">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F37021] to-[#FF9A5C] shadow-lg shadow-orange-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">HireTrain AI</h1>
            <p className="text-xs text-sidebar-foreground/60">HR Manager Portal</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-orange-500/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive ? <ChevronRight className="h-4 w-4" /> : null}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0033A0] to-[#0055DD] text-sm font-semibold text-white">
            HR
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">HR Manager</p>
            <p className="truncate text-xs text-sidebar-foreground/60">SHB Bank</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
