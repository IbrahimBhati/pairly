"use client"

import React, { useState, useTransition } from "react"
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
  Search,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Code,
} from "lucide-react"

interface AuditLogClientProps {
  initialLogs: any[]
  total: number
  totalPages: number
  currentPage: number
  currentFilters: {
    action: string
    targetType: string
  }
}

export function AuditLogClient({
  initialLogs,
  total,
  totalPages,
  currentPage,
  currentFilters,
}: AuditLogClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [action, setAction] = useState(currentFilters.action)
  const [targetType, setTargetType] = useState(currentFilters.targetType)

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams()
    if (action.trim() && action !== "all") params.set("action", action.trim())
    if (targetType && targetType !== "all") params.set("targetType", targetType)
    if (newPage > 1) params.set("page", String(newPage))

    startTransition(() => {
      router.push(`/admin/audit-log?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters(1)
  }

  const getActionBadge = (act: string) => {
    if (act.includes("suspend") || act.includes("remove") || act.includes("delete")) {
      return <Badge variant="destructive" className="text-[10px] font-mono">{act}</Badge>
    }
    if (act.includes("verify") || act.includes("approved") || act.includes("reinstate")) {
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-mono">{act}</Badge>
    }
    if (act.includes("promote") || act.includes("demote") || act.includes("create")) {
      return <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono">{act}</Badge>
    }
    return <Badge variant="outline" className="text-[10px] font-mono">{act}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Filter by action name (e.g. user.suspend, listing.remove, verification.approved)..."
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={targetType}
              onValueChange={(val) => {
                setTargetType(val || "all")
                setTimeout(() => applyFilters(1), 0)
              }}
            >
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="All targets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Target Types</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="listing">Listing</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="verification">Verification</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="skill">Skill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="rounded-xl text-xs font-semibold gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[180px]">Action</TableHead>
              <TableHead className="w-[140px]">Target Type &amp; ID</TableHead>
              <TableHead>Administrator</TableHead>
              <TableHead>Metadata</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                  No administrative audit records found.
                </TableCell>
              </TableRow>
            ) : (
              initialLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  {/* Action Badge */}
                  <TableCell>{getActionBadge(log.action)}</TableCell>

                  {/* Target Type and ID */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-semibold text-xs text-foreground uppercase tracking-wider block">
                        {log.target_type}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground truncate block max-w-[120px]">
                        {log.target_id}
                      </span>
                    </div>
                  </TableCell>

                  {/* Admin User */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-border">
                        <AvatarImage src={log.admin?.avatar_url || ""} />
                        <AvatarFallback className="text-[9px] font-bold">
                          {log.admin?.full_name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate block">
                          {log.admin?.full_name || "Platform Admin"}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          @{log.admin?.username || "admin"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Metadata JSON preview */}
                  <TableCell>
                    <div className="font-mono text-[11px] text-muted-foreground bg-muted/40 px-2 py-1 rounded-lg max-w-[280px] truncate">
                      {JSON.stringify(log.metadata)}
                    </div>
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <span>
            Showing {initialLogs.length} of {total} audit records
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
    </div>
  )
}
