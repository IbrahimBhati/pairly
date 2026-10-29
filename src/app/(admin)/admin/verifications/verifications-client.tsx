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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { adminReviewVerificationAction } from "@/lib/actions/admin"
import { toast } from "sonner"
import {
  ShieldCheck,
  ShieldX,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"

interface VerificationsClientProps {
  initialVerifications: any[]
  total: number
  totalPages: number
  currentPage: number
  currentStatus: string
}

export function VerificationsClient({
  initialVerifications,
  total,
  totalPages,
  currentPage,
  currentStatus,
}: VerificationsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Preview & Action Dialog
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(false)

  const handleTabChange = (status: string) => {
    startTransition(() => {
      router.push(`/admin/verifications?status=${status}`)
    })
  }

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      router.push(`/admin/verifications?status=${currentStatus}&page=${newPage}`)
    })
  }

  const handleApprove = async () => {
    if (!selectedRequest) return
    setActionInProgress(true)

    const res = await adminReviewVerificationAction({
      requestId: selectedRequest.id,
      status: "approved",
    })

    setActionInProgress(false)

    if (res.success) {
      toast.success(`Approved verification for ${selectedRequest.user?.full_name}. +50 points & badge awarded!`)
      setSelectedRequest(null)
      setShowRejectBox(false)
      router.refresh()
    } else {
      toast.error(res.error || "Failed to approve verification.")
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return
    if (!rejectNote.trim()) {
      toast.error("Please explain why this verification document was rejected.")
      return
    }

    setActionInProgress(true)

    const res = await adminReviewVerificationAction({
      requestId: selectedRequest.id,
      status: "rejected",
      note: rejectNote.trim(),
    })

    setActionInProgress(false)

    if (res.success) {
      toast.success("Verification request rejected and applicant notified.")
      setSelectedRequest(null)
      setShowRejectBox(false)
      setRejectNote("")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to reject verification.")
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "student_id":
        return "Student ID Card"
      case "institution_email":
        return "Institutional Email"
      case "professional_link":
        return "Academic / Professional Profile"
      case "government_id":
        return "Government Issued ID"
      default:
        return method
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={currentStatus} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 rounded-xl h-10 w-full sm:w-[360px]">
            <TabsTrigger value="pending" className="rounded-lg text-xs font-semibold">
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg text-xs font-semibold">
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg text-xs font-semibold">
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 2. Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[280px]">Applicant</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Document / Proof</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialVerifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No {currentStatus} verification requests found.
                </TableCell>
              </TableRow>
            ) : (
              initialVerifications.map((v) => (
                <TableRow key={v.id} className="hover:bg-muted/30">
                  {/* Applicant */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={v.user?.avatar_url || ""} />
                        <AvatarFallback className="text-xs font-bold">
                          {v.user?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm text-foreground block truncate">
                          {v.user?.full_name || "Applicant"}
                        </span>
                        <span className="text-xs text-muted-foreground block truncate">
                          @{v.user?.username || "no-handle"} • {v.user?.user_type}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Method */}
                  <TableCell>
                    <span className="text-xs font-semibold text-foreground">
                      {getMethodLabel(v.method)}
                    </span>
                  </TableCell>

                  {/* Document / Link Preview */}
                  <TableCell>
                    {v.preview_url ? (
                      <a
                        href={v.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>View Document</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No file attached</span>
                    )}
                  </TableCell>

                  {/* Submitted Date */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(v.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {v.status === "approved" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                        Approved
                      </Badge>
                    ) : v.status === "rejected" ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
                        Pending Review
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold gap-1.5 h-8"
                      onClick={() => {
                        setSelectedRequest(v)
                        setShowRejectBox(false)
                        setRejectNote(v.note || "")
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Examine</span>
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
            Showing {initialVerifications.length} of {total} {currentStatus} requests
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

      {/* 3. Verification Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Identity Verification Examination</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Validate credentials to grant the Verified Scholar badge and +50 gamification points.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-2">
              {/* Applicant Card */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedRequest.user?.avatar_url || ""} />
                    <AvatarFallback>{selectedRequest.user?.full_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedRequest.user?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{selectedRequest.user?.username} • {selectedRequest.user?.user_type}
                    </p>
                  </div>
                </div>
                <Link href={`/u/${selectedRequest.user?.id}`} target="_blank">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1">
                    <span>Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Verification Method:</span>
                  <span className="font-semibold text-foreground">
                    {getMethodLabel(selectedRequest.method)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Submission Date:</span>
                  <span className="text-foreground">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedRequest.note && (
                  <div className="pt-1">
                    <span className="text-muted-foreground block mb-1">Applicant Note:</span>
                    <p className="p-2.5 rounded-xl bg-muted/30 border border-border text-foreground">
                      {selectedRequest.note}
                    </p>
                  </div>
                )}
              </div>

              {/* Document Link */}
              {selectedRequest.preview_url && (
                <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      Verification Credentials Document
                    </span>
                  </div>
                  <a
                    href={selectedRequest.preview_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" className="rounded-xl text-xs gap-1 bg-primary text-primary-foreground">
                      <span>Open Document</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              )}

              {/* Rejection Note Input if Rejecting */}
              {showRejectBox && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-destructive block">
                    Reason for Rejection (Required)
                  </label>
                  <Textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="E.g. Student ID expired, image blurry, name mismatch..."
                    className="rounded-xl text-xs resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>

            {showRejectBox ? (
              <Button
                variant="destructive"
                disabled={actionInProgress}
                onClick={handleReject}
                className="rounded-xl text-xs font-semibold"
              >
                Confirm Rejection
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectBox(true)}
                  className="rounded-xl text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-semibold"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Reject</span>
                </Button>
                <Button
                  disabled={actionInProgress}
                  onClick={handleApprove}
                  className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  <span>Approve &amp; Verify</span>
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
