"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  BarChart3,
  Brain,
  ClipboardList,
  FileQuestion,
  FileText,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MockRole = "Admin" | "HR Manager"
type NavItem = { href: string; label: string; icon: LucideIcon }

const adminNav: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/system-logs", label: "System Logs", icon: Shield },
]

const hrBaseNav: NavItem[] = [
  { href: "/hr", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hr/campaigns", label: "Campaigns", icon: FileText },
]

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== "/hr" && pathname.startsWith(`${href}/`))
}

function RoleGuard({
  role,
  children,
}: {
  role: MockRole
  children: ReactNode
}) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const storedRole = window.localStorage.getItem("mockAuthRole")
    if (storedRole !== role) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setAllowed(true)
  }, [role, router])

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Checking mock access...
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function ShellFrame({
  role,
  title,
  subtitle,
  nav,
  children,
}: {
  role: MockRole
  title: string
  subtitle: string
  nav: NavItem[]
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initials = role === "Admin" ? "AD" : "HR"
  const [activeCampaignId, setActiveCampaignId] = useState("")
  const [activePositionId, setActivePositionId] = useState("")

  useEffect(() => {
    if (role !== "HR Manager") return
    const routeCampaignId = pathname.match(/\/hr\/campaigns\/([^/]+)/)?.[1]
    const storedCampaignId = window.localStorage.getItem("activeCampaignId")
    const nextCampaignId = routeCampaignId || storedCampaignId || ""
    setActiveCampaignId(nextCampaignId)
    if (routeCampaignId) window.localStorage.setItem("activeCampaignId", routeCampaignId)
    
    const queryPositionId = searchParams.get("positionId")
    const storedPositionId = window.localStorage.getItem("activePositionId")
    const nextPositionId = queryPositionId || storedPositionId || ""
    setActivePositionId(nextPositionId)
    if (queryPositionId) window.localStorage.setItem("activePositionId", queryPositionId)
  }, [pathname, searchParams, role])

  const navItems = useMemo(() => {
    if (role !== "HR Manager") return nav
    return hrBaseNav
  }, [nav, role])

  const activeLabel = useMemo(() => {
    return navItems.find((item) => isNavActive(pathname, item.href))?.label ?? title
  }, [navItems, pathname, title])

  const signOut = () => {
    window.localStorage.removeItem("mockAuthRole")
    window.localStorage.removeItem("activeCampaignId")
    router.push("/login")
  }

  return (
    <RoleGuard role={role}>
      <div className="min-h-screen bg-slate-50">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-[#17233A] text-white lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3 border-b border-white/10 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F37021]">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">HireTrain AI</p>
              <p className="text-xs text-white/60">{role} Portal</p>
            </div>
          </Link>
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isNavActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-[#F37021] text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/10 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-[#17233A]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{role}</p>
                <p className="truncate text-xs text-white/60">Mock session</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
                      <Home className="h-3.5 w-3.5" />
                      Home
                    </Link>
                    <span>/</span>
                    <span>{activeLabel}</span>
                  </div>
                  <h1 className="mt-1 truncate text-2xl font-bold text-foreground">{title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                </div>
                <Button variant="outline" className="hidden sm:inline-flex" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
              <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isNavActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
                        active ? "border-[#0033A0] bg-[#0033A0] text-white" : "bg-white text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  )
}

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <ShellFrame role="Admin" title={title} subtitle={subtitle} nav={adminNav}>
      {children}
    </ShellFrame>
  )
}

export function HrShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <ShellFrame role="HR Manager" title={title} subtitle={subtitle} nav={hrBaseNav}>
      {children}
    </ShellFrame>
  )
}

export function PublicHeader() {
  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/jobs" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200">
            <img alt="SHB" className="h-7 w-7 object-contain" src="https://img.logokit.com/shb.com.vn" />
          </div>
          <div>
            <p className="font-semibold text-[#c6203f]">SHB Tuyển dụng</p>
            <p className="text-xs text-muted-foreground">Candidate experience</p>
          </div>
        </Link>
        <Link href="/jobs">
          <Button variant="outline">Việc làm</Button>
        </Link>
      </div>
    </header>
  )
}
