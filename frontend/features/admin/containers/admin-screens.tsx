"use client"

import { useEffect, useMemo, useState } from "react"
import { Edit3, Plus, Power, Search, ShieldAlert } from "lucide-react"
import { PageHeader } from "@/shared/layout/page-header"
import { EmptyState, FormMessage, StatusPill, StatCard } from "@/shared/components/recruitment-common"
import { adminUsers, systemLogs, type AccountStatus, type AdminUser, type SystemLog, type UserRole } from "@/lib/recruitment/mock-data"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createAdminUser, listAdminUsers, listAuditLogs, type BackendAuditLog, type BackendUser } from "@/features/admin/api/admin-api"

function statusTone(status: AccountStatus) {
  if (status === "Active") return "green"
  if (status === "Disabled") return "red"
  return "orange"
}

function severityTone(severity: SystemLog["severity"]) {
  if (severity === "Critical") return "red"
  if (severity === "Warning") return "orange"
  return "blue"
}

function mapBackendUser(user: BackendUser): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "ADMIN" ? "Admin" : "HR Manager",
    status: user.is_active ? "Active" : "Disabled",
    lastLogin: "Backend managed",
  }
}

function mapBackendLog(log: BackendAuditLog): SystemLog {
  const critical = log.action.includes("FAILED")
  return {
    id: log.id,
    time: new Date(log.created_at).toLocaleString(),
    user: log.actor_email ?? "System",
    action: log.action,
    device: log.entity_type ? `${log.entity_type}${log.entity_id ? ` ${log.entity_id}` : ""}` : "Backend",
    severity: critical ? "Critical" : "Info",
  }
}

export function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>(adminUsers)
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All")
  const [statusFilter, setStatusFilter] = useState<"All" | AccountStatus>("All")
  const [search, setSearch] = useState("")
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState({ name: "", email: "", role: "HR Manager" as UserRole })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let mounted = true
    listAdminUsers()
      .then((backendUsers) => {
        if (mounted) setUsers(backendUsers.map(mapBackendUser))
      })
      .catch(() => {
        if (mounted) setMessage("Backend is not available, using local demo accounts.")
      })
    return () => {
      mounted = false
    }
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = roleFilter === "All" || user.role === roleFilter
      const matchesStatus = statusFilter === "All" || user.status === statusFilter
      const matchesSearch = `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase())
      return matchesRole && matchesStatus && matchesSearch
    })
  }, [roleFilter, search, statusFilter, users])

  const openCreate = () => {
    setDialogMode("create")
    setEditingUser(null)
    setForm({ name: "", email: "", role: "HR Manager" })
    setMessage("")
  }

  const openEdit = (user: AdminUser) => {
    setDialogMode("edit")
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, role: user.role })
    setMessage("")
  }

  const saveUser = async () => {
    if (!form.name || !form.email) {
      setMessage("Name and email are required.")
      return
    }
    setLoading(true)
    try {
      if (dialogMode === "create") {
        const created = await createAdminUser({ name: form.name, email: form.email, role: "HR_MANAGER" })
        setUsers((current) => [mapBackendUser(created), ...current.filter((user) => user.email !== created.email)])
      } else if (editingUser) {
        setUsers((current) =>
          current.map((user) =>
            user.id === editingUser.id ? { ...user, name: form.name, email: form.email, role: "HR Manager" } : user,
          ),
        )
      }
      setMessage("HR account saved successfully.")
    } catch (error) {
      if (dialogMode === "create") {
        setUsers((current) => [
          {
            id: `u-${Date.now()}`,
            name: form.name,
            email: form.email,
            role: form.role,
            status: "Active",
            lastLogin: "Never",
          },
          ...current,
        ])
      } else if (editingUser) {
        setUsers((current) =>
          current.map((user) =>
            user.id === editingUser.id ? { ...user, name: form.name, email: form.email, role: form.role } : user,
          ),
        )
      }
      setMessage(error instanceof Error ? `${error.message} Local demo state was updated.` : "Local demo state was updated.")
    }
    setLoading(false)
    setDialogMode(null)
  }

  const toggleStatus = (userId: string) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === "Disabled" ? "Active" : "Disabled" }
          : user,
      ),
    )
  }

  return (
    <>
      <PageHeader title="HR Account Provisioning" subtitle="Create and control HR manager accounts from the admin console." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="HR accounts" value={users.filter((user) => user.role === "HR Manager").length} icon={<Plus className="h-5 w-5" />} />
          <StatCard label="Active HR" value={users.filter((user) => user.role === "HR Manager" && user.status === "Active").length} icon={<Power className="h-5 w-5" />} tone="green" />
          <StatCard label="Security alerts" value={systemLogs.filter((log) => log.severity !== "Info").length} icon={<ShieldAlert className="h-5 w-5" />} tone="orange" />
        </div>

        {message ? <FormMessage type="success">{message}</FormMessage> : null}

        <Card className="rounded-lg p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">HR accounts</h2>
              <p className="text-sm text-muted-foreground">Provision HR manager login access and disable accounts when needed.</p>
            </div>
            <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create HR Account
            </Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_170px_170px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "All" | UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="HR Manager">HR Manager</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | AccountStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4">
            {filteredUsers.length === 0 ? (
              <EmptyState title="No users found" description="Adjust filters or create a new HR account." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <StatusPill tone={statusTone(user.status)}>{user.status}</StatusPill>
                      </TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toggleStatus(user.id)}>
                            {user.status === "Disabled" ? "Enable" : "Disable"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && setDialogMode(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogMode === "create" ? "Create HR Account" : "Edit Account"}</DialogTitle>
              <DialogDescription>Creates an HR_MANAGER user through the backend when it is available.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Name</Label>
                <Input id="user-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </div>
              <div className="rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground">
                Role is fixed to HR Manager for account provisioning.
              </div>
              {message && dialogMode ? <FormMessage type="error">{message}</FormMessage> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogMode(null)}>
                Cancel
              </Button>
              <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={loading} onClick={saveUser}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

export function AdminLogsScreen() {
  const [severityFilter, setSeverityFilter] = useState<"All" | SystemLog["severity"]>("All")
  const [search, setSearch] = useState("")
  const [logRows, setLogRows] = useState<SystemLog[]>(systemLogs)

  useEffect(() => {
    let mounted = true
    listAuditLogs()
      .then((logs) => {
        if (mounted) setLogRows(logs.map(mapBackendLog))
      })
      .catch(() => {
        if (mounted) setLogRows(systemLogs)
      })
    return () => {
      mounted = false
    }
  }, [])

  const logs = useMemo(() => {
    return logRows.filter((log) => {
      const matchesSeverity = severityFilter === "All" || log.severity === severityFilter
      const matchesSearch = `${log.user} ${log.action} ${log.device}`.toLowerCase().includes(search.toLowerCase())
      return matchesSeverity && matchesSearch
    })
  }, [logRows, search, severityFilter])

  return (
    <>
      <PageHeader title="System Logs" subtitle="Review account, publishing, and security events." />
      <Card className="rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Audit log</h2>
            <p className="text-sm text-muted-foreground">Critical rows highlight suspicious verification behavior.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[240px_170px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search logs" className="pl-9" />
            </div>
            <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as "All" | SystemLog["severity"])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All severity</SelectItem>
                <SelectItem value="Info">Info</SelectItem>
                <SelectItem value="Warning">Warning</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          {logs.length === 0 ? (
            <EmptyState title="No logs yet" description="Security and account events will appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>IP / Device</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className={log.severity === "Critical" ? "bg-red-50/70 hover:bg-red-50" : undefined}>
                    <TableCell>{log.time}</TableCell>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell className={log.severity === "Critical" ? "font-medium text-red-700" : undefined}>{log.action}</TableCell>
                    <TableCell>{log.device}</TableCell>
                    <TableCell>
                      <StatusPill tone={severityTone(log.severity)}>{log.severity}</StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </>
  )
}
