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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { adminUpdateReportStatusAction } from "@/lib/actions/admin"
import { toast } from "sonner"
import {
  Flag,
  AlertTriangle,
  UserX,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  Eye,
} from "lucide-react"

interface ReportsClientProps {
  initialReports: any[]
  total: number
  totalPages: number
  currentPage: number
  currentStatus: string
}

export function ReportsClient({
  initialReports,
  total,
  totalPages,
  currentPage,
  currentStatus,
}: ReportsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Detail Sheet state
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [actionInProgress, setActionInProgress] = useState(false)

  const handleTabChange = (status: string) => {
    startTransition(() => {
      router.push(`/admin/reports?status=${status}`)
    })
  }

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      router.push(`/admin/reports?status=${currentStatus}&page=${newPage}`)
    })
  }

  const handleReportAction = async (
    status: "open" | "reviewing" | "resolved" | "dismissed",
    actionTaken: "suspend_user" | "remove_listing" | "warn" | "none" = "none"
  ) => {
    if (!selectedReport) return
    setActionInProgress(true)

    const res = await adminUpdateReportStatusAction({
      reportId: selectedReport.id,
      status,
      adminNotes: adminNotes.trim(),
      actionTaken,
    })

    setActionInProgress(false)

    if (res.success) {
      toast.success(
        status === "resolved"
          ? "Report resolved and enforcement action taken"
          : status === "dismissed"
          ? "Report dismissed"
          : "Report status updated"
      )
      setSelectedReport(null)
      setAdminNotes("")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to process report.")
    }
  }

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case "spam":
        return <Badge variant="secondary" className="text-[10px]">Spam</Badge>
      case "harassment":
        return <Badge variant="destructive" className="text-[10px]">Harassment</Badge>
      case "inappropriate_content":
        return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">Inappropriate</Badge>
      case "scam":
        return <Badge variant="destructive" className="text-[10px]">Scam</Badge>
      case "fake_profile":
        return <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px]">Fake Profile</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">{reason}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={currentStatus} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 rounded-xl h-10 w-full sm:w-[480px]">
            <TabsTrigger value="open" className="rounded-lg text-xs font-semibold">
              Open
            </TabsTrigger>
            <TabsTrigger value="reviewing" className="rounded-lg text-xs font-semibold">
              Reviewing
            </TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-lg text-xs font-semibold">
              Resolved
            </TabsTrigger>
            <TabsTrigger value="dismissed" className="rounded-lg text-xs font-semibold">
              Dismissed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 2. Reports Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[140px]">Reason</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date Filed</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No {currentStatus} reports in the moderation queue.
                </TableCell>
              </TableRow>
            ) : (
              initialReports.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  {/* Reason */}
                  <TableCell>{getReasonBadge(r.reason)}</TableCell>

                  {/* Target (User or Listing) */}
                  <TableCell>
                    {r.reported_user ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border border-border">
                          <AvatarImage src={r.reported_user.avatar_url || ""} />
                          <AvatarFallback className="text-[10px] font-bold">
                            {r.reported_user.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-foreground block truncate">
                            {r.reported_user.full_name || "Unnamed"}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            User Profile • {r.target_prior_reports_count || 0} prior flags
                          </span>
                        </div>
                      </div>
                    ) : r.reported_listing ? (
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-foreground block truncate max-w-[200px]">
                          {r.reported_listing.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Listing target</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unknown Target</span>
                    )}
                  </TableCell>

                  {/* Reporter */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={r.reporter?.avatar_url || ""} />
                        <AvatarFallback className="text-[9px]">
                          {r.reporter?.full_name?.charAt(0) || "R"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {r.reporter?.full_name || "Anonymous"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Details snippet */}
                  <TableCell>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[240px]">
                      {r.details || "No explanation entered by reporter."}
                    </p>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>

                  {/* Review Action */}
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold gap-1.5 h-8"
                      onClick={() => {
                        setSelectedReport(r)
                        setAdminNotes(r.admin_notes || "")
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Review</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <span>
            Showing {initialReports.length} of {total} {currentStatus} reports
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => handlePageChange(currentPage - 1)}
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
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-8 rounded-xl text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Detail Moderation Sheet */}
      <Sheet open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              <SheetTitle className="font-heading text-lg">
                Trust &amp; Safety Investigation
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs">
              Review incident details, target history, and administer appropriate moderation sanctions.
            </SheetDescription>
          </SheetHeader>

          {selectedReport && (
            <div className="space-y-6 text-sm">
              {/* Reason & Status */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/50 border border-border">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                    Alleged Violation
                  </span>
                  <div className="mt-1">{getReasonBadge(selectedReport.reason)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                    Queue Status
                  </span>
                  <Badge variant="outline" className="capitalize text-xs font-semibold mt-1">
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>

              {/* Reported Target Info */}
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  Reported Subject / Target
                </span>

                {selectedReport.reported_user && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={selectedReport.reported_user.avatar_url || ""} />
                        <AvatarFallback className="text-xs font-bold">
                          {selectedReport.reported_user.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {selectedReport.reported_user.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{selectedReport.reported_user.username} •{" "}
                          {selectedReport.target_prior_reports_count} prior flags
                        </p>
                      </div>
                    </div>
                    <Link href={`/u/${selectedReport.reported_user.id}`} target="_blank">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1">
                        <span>Profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )}

                {selectedReport.reported_listing && (
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {selectedReport.reported_listing.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {selectedReport.reported_listing.description}
                      </p>
                    </div>
                    <Link href={`/listings/${selectedReport.reported_listing.id}`} target="_blank">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1 shrink-0">
                        <span>Listing</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Reporter Info & Incident Narrative */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  Incident Report Narrative
                </span>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border text-xs leading-relaxed text-foreground">
                  {selectedReport.details || "Reporter did not provide additional written narrative."}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Filed by: {selectedReport.reporter?.full_name || "Community Member"}</span>
                  <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Administrative Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">
                  Internal Moderator Notes
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record findings, communications with parties, or enforcement notes..."
                  className="rounded-xl text-xs resize-none"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-foreground block">
                  Enforcement Actions
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {selectedReport.reported_user && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={actionInProgress}
                      onClick={() => handleReportAction("resolved", "suspend_user")}
                      className="rounded-xl text-xs gap-1.5 font-semibold"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>Suspend User</span>
                    </Button>
                  )}

                  {selectedReport.reported_listing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={actionInProgress}
                      onClick={() => handleReportAction("resolved", "remove_listing")}
                      className="rounded-xl text-xs gap-1.5 font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Listing</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionInProgress}
                    onClick={() => handleReportAction("resolved", "none")}
                    className="rounded-xl text-xs gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Resolve (No Action)</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actionInProgress}
                    onClick={() => handleReportAction("dismissed", "none")}
                    className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Dismiss Report</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
