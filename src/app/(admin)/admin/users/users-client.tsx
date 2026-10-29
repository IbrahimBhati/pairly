"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  adminSuspendUserAction,
  adminVerifyUserAction,
  adminChangeUserRoleAction,
} from "@/lib/actions/admin"
import { toast } from "sonner"
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  ExternalLink,
  Star,
  Flag,
  Award,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"

interface UsersClientProps {
  initialUsers: any[]
  total: number
  totalPages: number
  currentPage: number
  currentFilters: {
    query: string
    userType: string
    isVerified: string
    isSuspended: string
    role: string
  }
}

export function UsersClient({
  initialUsers,
  total,
  totalPages,
  currentPage,
  currentFilters,
}: UsersClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filters state
  const [query, setQuery] = useState(currentFilters.query)
  const [userType, setUserType] = useState(currentFilters.userType)
  const [isVerified, setIsVerified] = useState(currentFilters.isVerified)
  const [isSuspended, setIsSuspended] = useState(currentFilters.isSuspended)
  const [role, setRole] = useState(currentFilters.role)

  // Suspend Dialog State
  const [suspendDialogUser, setSuspendDialogUser] = useState<any | null>(null)
  const [suspendReason, setSuspendReason] = useState("")

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (userType !== "all") params.set("type", userType)
    if (isVerified !== "all") params.set("verified", isVerified)
    if (isSuspended !== "all") params.set("suspended", isSuspended)
    if (role !== "all") params.set("role", role)
    if (newPage > 1) params.set("page", String(newPage))

    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters(1)
  }

  const handleVerifyToggle = async (user: any) => {
    const nextState = !user.is_verified
    const res = await adminVerifyUserAction({ userId: user.id, verify: nextState })
    if (res.success) {
      toast.success(nextState ? `Verified ${user.full_name}` : `Unverified ${user.full_name}`)
      router.refresh()
    } else {
      toast.error(res.error || "Failed to update verification status.")
    }
  }

  const handleRoleToggle = async (user: any) => {
    const nextRole = user.role === "admin" ? "user" : "admin"
    if (
      !confirm(
        `Are you sure you want to ${
          nextRole === "admin" ? "PROMOTE this user to ADMIN" : "DEMOTE this user to USER"
        }?`
      )
    ) {
      return
    }

    const res = await adminChangeUserRoleAction({ userId: user.id, role: nextRole })
    if (res.success) {
      toast.success(`Updated role to ${nextRole}`)
      router.refresh()
    } else {
      toast.error(res.error || "Failed to update role.")
    }
  }

  const handleSuspendSubmit = async () => {
    if (!suspendDialogUser) return
    const isSuspending = !suspendDialogUser.is_suspended

    const res = await adminSuspendUserAction({
      userId: suspendDialogUser.id,
      suspend: isSuspending,
      reason: suspendReason.trim(),
    })

    if (res.success) {
      toast.success(
        isSuspending
          ? `Suspended account ${suspendDialogUser.full_name}`
          : `Reinstated account ${suspendDialogUser.full_name}`
      )
      setSuspendDialogUser(null)
      setSuspendReason("")
      router.refresh()
    } else {
      toast.error(res.error || "Action failed.")
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Search and Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, username, or city..."
              className="pl-10 rounded-xl"
            />
          </div>
          <Button type="submit" className="rounded-xl text-xs font-semibold gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Search</span>
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* User Type */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Member Type
            </label>
            <Select
              value={userType}
              onValueChange={(val) => {
                setUserType(val || "all")
                setTimeout(() => applyFilters(1), 0)
              }}
            >
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Verification */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Verification
            </label>
            <Select
              value={isVerified}
              onValueChange={(val) => {
                setIsVerified(val || "all")
                setTimeout(() => applyFilters(1), 0)
              }}
            >
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Verified Only</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Status
            </label>
            <Select
              value={isSuspended}
              onValueChange={(val) => {
                setIsSuspended(val || "all")
                setTimeout(() => applyFilters(1), 0)
              }}
            >
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="false">Active Only</SelectItem>
                <SelectItem value="true">Suspended Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Platform Role
            </label>
            <Select
              value={role}
              onValueChange={(val) => {
                setRole(val || "all")
                setTimeout(() => applyFilters(1), 0)
              }}
            >
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Users Data Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[280px]">Member</TableHead>
              <TableHead>Type &amp; Role</TableHead>
              <TableHead>Reputation &amp; Trust</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No members found matching your search or filters.
                </TableCell>
              </TableRow>
            ) : (
              initialUsers.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  {/* User Profile Cell */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={u.avatar_url || ""} />
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {u.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {u.full_name || "Unnamed"}
                          </span>
                          {u.is_verified && (
                            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{u.username || "no-handle"} {u.city ? `• ${u.city}` : ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Type & Role */}
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] capitalize font-medium">
                          {u.user_type}
                        </Badge>
                        {u.role === "admin" && (
                          <Badge className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                            Admin
                          </Badge>
                        )}
                      </div>
                      {u.is_suspended && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          <UserX className="h-3 w-3" />
                          Suspended
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Rating & Exchanges */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{u.avg_rating ? Number(u.avg_rating).toFixed(1) : "0.0"}</span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          ({u.review_count || 0})
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {u.completed_exchanges || 0} completed • {u.points || 0} pts
                      </p>
                    </div>
                  </TableCell>

                  {/* Reports */}
                  <TableCell>
                    {u.report_count > 0 ? (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <Flag className="h-3 w-3" />
                        <span>{u.report_count} flag(s)</span>
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Clean</span>
                    )}
                  </TableCell>

                  {/* Created At */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/u/${u.id}`} target="_blank">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View Profile"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 px-2.5 text-xs rounded-xl ${
                          u.is_verified
                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            : "hover:bg-primary/10"
                        }`}
                        onClick={() => handleVerifyToggle(u)}
                        title={u.is_verified ? "Revoke Verification" : "Verify Scholar"}
                      >
                        {u.is_verified ? "Unverify" : "Verify"}
                      </Button>

                      <Button
                        variant={u.is_suspended ? "default" : "destructive"}
                        size="sm"
                        className="h-8 px-2.5 text-xs rounded-xl"
                        onClick={() => {
                          setSuspendDialogUser(u)
                          setSuspendReason("")
                        }}
                      >
                        {u.is_suspended ? "Reinstate" : "Suspend"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs rounded-xl text-muted-foreground hover:text-amber-600"
                        onClick={() => handleRoleToggle(u)}
                        title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                      >
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <span>
            Showing {initialUsers.length} of {total} registered members
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => applyFilters(currentPage - 1)}
              className="h-8 rounded-xl text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <span className="font-medium text-foreground">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => applyFilters(currentPage + 1)}
              className="h-8 rounded-xl text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Suspend / Reinstate Confirmation Dialog */}
      <Dialog open={!!suspendDialogUser} onOpenChange={(open) => !open && setSuspendDialogUser(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg flex items-center gap-2">
              {suspendDialogUser?.is_suspended ? (
                <>
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  <span>Reinstate Account: {suspendDialogUser?.full_name}</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                  <span>Suspend Account: {suspendDialogUser?.full_name}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {suspendDialogUser?.is_suspended
                ? "Reinstating this account will restore full access to login, messaging, and listings."
                : "Suspending this user will immediately restrict access to active sessions, prevent logging in, and hide their public listings."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground">
              Administrative Reason &amp; Record
            </label>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="State reason for audit log and user notification..."
              className="rounded-xl text-xs resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSuspendDialogUser(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              variant={suspendDialogUser?.is_suspended ? "default" : "destructive"}
              onClick={handleSuspendSubmit}
              className="rounded-xl text-xs font-semibold"
            >
              {suspendDialogUser?.is_suspended ? "Confirm Reinstatement" : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
