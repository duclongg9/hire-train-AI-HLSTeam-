"use client"

import { createContext, use, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
import { clearMockSession, getActiveCampaignId, getMockRole, setActiveCampaignId, type MockRole } from "@/shared/auth/token-storage"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: LucideIcon }

interface AuthShellState {
  role: MockRole
  activeCampaignId: string
  activePositionId: string
  navItems: NavItem[]
}

interface AuthShellActions {
  signOut: () => void
}

interface AuthShellMeta {
  initials: string
}

interface AuthShellContextValue {
  state: AuthShellState
  actions: AuthShellActions
  meta: AuthShellMeta
}

const AuthShellContext = createContext<AuthShellContextValue | null>(null)

const adminNav: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/system-logs", label: "System Logs", icon: Shield },
]

const hrBaseNav: NavItem[] = [
  { href: "/hr", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hr/campaigns/new", label: "New Campaign", icon: FileText },
]

const hrCampaignNav = [
  { segment: "rubric", label: "CV Rubric", icon: ListChecks },
  { segment: "interview", label: "Interview Rubric", icon: ClipboardList },
  { segment: "test-review", label: "Test Review", icon: FileQuestion },
  { segment: "leaderboard", label: "Leaderboard", icon: BarChart3 },
]

function useAuthShell() {
  const context = use(AuthShellContext)
  if (!context) throw new Error("useAuthShell must be used inside AuthShellContext")
  return context
}

function isNavActive(pathname: string, href: string) {
  // Strip query parameters from href for comparison
  const basePath = href.split('?')[0]
  return pathname === basePath || (basePath !== "/hr" && pathname.startsWith(`${basePath}/`))
}

function AuthShellProvider({
  role,
  children,
}: {
  role: MockRole
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeCampaignId, setActiveCampaignIdState] = useState("")
  const [activePositionId, setActivePositionIdState] = useState("")

  useEffect(() => {
    const storedRole = getMockRole()
    if (storedRole !== role) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (role !== "HR Manager") return
    
    // Parse campaign
    const routeCampaignId = pathname.match(/\/hr\/campaigns\/([^/]+)/)?.[1]
    const nextCampaignId = routeCampaignId || getActiveCampaignId()
    setActiveCampaignIdState(nextCampaignId)
    if (routeCampaignId) setActiveCampaignId(routeCampaignId)

    // Parse position
    const params = new URLSearchParams(window.location.search)
    const queryPositionId = params.get("positionId") || pathname.match(/\/position\/([^/]+)/)?.[1]
    const storedPositionId = window.localStorage.getItem("activePositionId") || ""
    const nextPositionId = queryPositionId || storedPositionId
    setActivePositionIdState(nextPositionId)
    if (queryPositionId) window.localStorage.setItem("activePositionId", queryPositionId)

  }, [pathname, role, router])

  const navItems = useMemo(() => {
    if (role === "Admin") return adminNav
    const campaignItems = activeCampaignId
      ? hrCampaignNav.map((item) => ({
          href: `/hr/campaigns/${activeCampaignId}/${item.segment}${activePositionId ? `?positionId=${activePositionId}` : ""}`,
          label: item.label,
          icon: item.icon,
        }))
      : []
    return [...hrBaseNav, ...campaignItems]
  }, [activeCampaignId, activePositionId, role])

  const value = useMemo<AuthShellContextValue>(
    () => ({
      state: {
        role,
        activeCampaignId,
        activePositionId,
        navItems,
      },
      actions: {
        signOut: () => {
          clearMockSession()
          window.localStorage.removeItem("activePositionId")
          router.push("/login")
        },
      },
      meta: {
        initials: role === "Admin" ? "AD" : "HR",
      },
    }),
    [activeCampaignId, activePositionId, navItems, role, router],
  )

  return <AuthShellContext value={value}>{children}</AuthShellContext>
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Checking mock access...
      </div>
    </div>
  )
}

function AuthGate({ role, children }: { role: MockRole; children: ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (getMockRole() !== role) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setAllowed(true)
  }, [role, router])

  return allowed ? <>{children}</> : <AuthLoading />
}

function Sidebar() {
  const {
    state: { role, navItems },
    actions: { signOut },
    meta: { initials },
  } = useAuthShell()
  const pathname = usePathname()

  return (
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
  )
}

function Topbar() {
  const {
    state: { navItems },
    actions: { signOut },
  } = useAuthShell()
  const pathname = usePathname()
  const activeLabel = navItems.find((item) => isNavActive(pathname, item.href))?.label ?? "Workspace"

  return (
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
          </div>
          <Button variant="outline" className="hidden sm:inline-flex" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
        <MobileNav />
      </div>
    </header>
  )
}

function MobileNav() {
  const {
    state: { navItems },
  } = useAuthShell()
  const pathname = usePathname()

  return (
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
  )
}

export function AuthenticatedAppShell({
  role,
  children,
}: {
  role: MockRole
  children: ReactNode
}) {
  return (
    <AuthGate role={role}>
      <AuthShellProvider role={role}>
        <div className="min-h-screen bg-slate-50">
          <Sidebar />
          <div className="lg:pl-64">
            <Topbar />
            <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </AuthShellProvider>
    </AuthGate>
  )
}
