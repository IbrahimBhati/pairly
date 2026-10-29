"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { MatchBadge } from "@/components/shared/match-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  respondConnectionRequestAction,
  requestCompletionAction,
} from "@/lib/actions/connections"
import { toast } from "sonner"
import {
  Users,
  Inbox,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Repeat,
  Sparkles,
  Award,
  Loader2,
  ArrowRight,
  Star,
} from "lucide-react"
import type { ConnectionRequestWithDetails } from "@/types/database"
import { ReviewDialog } from "@/components/shared/review-dialog"

interface ConnectionsViewProps {
  initialTab: "received" | "sent" | "active" | "completed"
  initialConnections: ConnectionRequestWithDetails[]
  counts: { received: number; sent: number; active: number; completed: number }
  currentUserId: string
}

export function ConnectionsView({
  initialTab,
  initialConnections,
  counts,
  currentUserId,
}: ConnectionsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as any) || initialTab || "received"

  const [isPending, startTransition] = useTransition()
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedReqForComplete, setSelectedReqForComplete] = useState<ConnectionRequestWithDetails | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedReqForReview, setSelectedReqForReview] = useState<ConnectionRequestWithDetails | null>(null)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", newTab)
    router.push(`/connections?${params.toString()}`)
  }

  // Handle Accept / Decline / Cancel
  const handleRespond = async (
    requestId: string,
    action: "accept" | "decline" | "cancel"
  ) => {
    setLoadingActionId(requestId)
    try {
      const res = await respondConnectionRequestAction({ requestId, action })
      if (res.error) {
        toast.error("Action failed", { description: res.error })
        return
      }

      if (action === "accept") {
        toast.success("Connection Accepted! 🎉", {
          description: "You can now chat in real time and schedule your skill exchange.",
        })
        if (res.conversationId) {
          router.push(`/messages/${res.conversationId}`)
          return
        }
      } else if (action === "decline") {
        toast.info("Connection request declined.")
      } else {
        toast.info("Connection request cancelled.")
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (err: any) {
      toast.error("An error occurred", { description: err?.message })
    } finally {
      setLoadingActionId(null)
    }
  }

  // Handle Request/Confirm Completion
  const handleConfirmCompletion = async () => {
    if (!selectedReqForComplete) return
    setLoadingActionId(selectedReqForComplete.id)

    try {
      const res = await requestCompletionAction({
        requestId: selectedReqForComplete.id,
      })

      if (res.error) {
        toast.error("Completion update failed", { description: res.error })
        return
      }

      toast.success(res.status === "completed" ? "Exchange Completed! 🎉" : "Completion Requested", {
        description: res.message,
      })

      setCompleteDialogOpen(false)
      setSelectedReqForComplete(null)

      startTransition(() => {
        router.refresh()
      })
    } catch (err: any) {
      toast.error("An error occurred", { description: err?.message })
    } finally {
      setLoadingActionId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA]">
            <Users className="h-4 w-4" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Peer Connections
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your skill exchange invitations, active learning partnerships, and completed trades.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange("received")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "received"
              ? "bg-[#4B3F72] text-white shadow-sm dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          <span>Received</span>
          {counts.received > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "received"
                  ? "bg-white/20 text-white dark:bg-[#0F0B1A]/20 dark:text-[#0F0B1A]"
                  : "bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA]"
              }`}
            >
              {counts.received}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("sent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "sent"
              ? "bg-[#4B3F72] text-white shadow-sm dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Sent</span>
          {counts.sent > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "sent"
                  ? "bg-white/20 text-white dark:bg-[#0F0B1A]/20 dark:text-[#0F0B1A]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts.sent}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("active")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "active"
              ? "bg-[#4B3F72] text-white shadow-sm dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Active Exchanges</span>
          {counts.active > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "active"
                  ? "bg-white/20 text-white dark:bg-[#0F0B1A]/20 dark:text-[#0F0B1A]"
                  : "bg-[#A7F3D0] text-[#064E3B]"
              }`}
            >
              {counts.active}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("completed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "completed"
              ? "bg-[#4B3F72] text-white shadow-sm dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Completed</span>
          {counts.completed > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "completed"
                  ? "bg-white/20 text-white dark:bg-[#0F0B1A]/20 dark:text-[#0F0B1A]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts.completed}
            </span>
          )}
        </button>
      </div>

      {/* Completed Tab Review Prompt Banner */}
      {activeTab === "completed" && initialConnections.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#4B3F72]/10 via-[#A78BFA]/10 to-emerald-500/10 border border-[#A78BFA]/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Completed Exchanges & Trust Reviews</h4>
              <p className="text-xs text-muted-foreground">
                Share your peer feedback to award your partner +10 points on 5-star ratings and earn +5 points for your profile!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection List */}
      {initialConnections.length === 0 ? (
        <div className="card-soft text-center py-16 px-4 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            {activeTab === "received" && <Inbox className="h-6 w-6" />}
            {activeTab === "sent" && <Send className="h-6 w-6" />}
            {activeTab === "active" && <Sparkles className="h-6 w-6" />}
            {activeTab === "completed" && <Award className="h-6 w-6" />}
          </div>
          <h3 className="font-heading text-base font-bold text-foreground">
            {activeTab === "received" && "No pending requests received"}
            {activeTab === "sent" && "No pending requests sent"}
            {activeTab === "active" && "No active exchanges yet"}
            {activeTab === "completed" && "No completed exchanges yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === "received" && "When peers discover your listings or skills, invitations will appear here."}
            {activeTab === "sent" && "Browse listings or people on the Explore page to send exchange requests."}
            {activeTab === "active" && "Accepted connections become active exchanges with private chat rooms."}
            {activeTab === "completed" && "After finishing skill sessions, both peers can confirm completion here."}
          </p>
          <div className="pt-2">
            <Link href="/explore">
              <Button size="sm" className="rounded-xl text-xs font-semibold gap-1.5">
                <span>Explore Peers &amp; Listings</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {initialConnections.map((conn) => {
            const isReceiver = conn.receiver_id === currentUserId
            const otherUser = isReceiver ? conn.sender : conn.receiver
            const isLoading = loadingActionId === conn.id

            // Status Badge Config
            const statusConfig = {
              pending: {
                label: "Pending",
                className: "border-[#A78BFA]/40 bg-[#A78BFA]/15 text-[#4B3F72] dark:text-[#A78BFA]",
              },
              accepted: {
                label: "Accepted & Active",
                className: "border-emerald-300 bg-emerald-50 text-[#064E3B] dark:bg-emerald-950/40 dark:text-[#A7F3D0]",
              },
              declined: {
                label: "Declined",
                className: "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
              },
              cancelled: {
                label: "Cancelled",
                className: "border-border bg-muted text-muted-foreground",
              },
              completed: {
                label: "Completed",
                className: "border-[#4B3F72]/40 bg-[#4B3F72]/15 text-[#4B3F72] dark:text-[#A78BFA]",
              },
            }

            const currentStatus = statusConfig[conn.status] || statusConfig.pending

            const createdDate = new Date(conn.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })

            const hasRequestedCompletion = conn.completion_requested_by != null
            const iRequestedCompletion = conn.completion_requested_by === currentUserId

            return (
              <div
                key={conn.id}
                className="card-soft p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all"
              >
                {/* Left: User & Request Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <Link href={`/u/${otherUser.username || otherUser.id}`}>
                    <UserAvatar profile={otherUser} size="lg" />
                  </Link>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/u/${otherUser.username || otherUser.id}`}
                        className="font-heading text-base font-bold text-foreground hover:text-primary transition-colors truncate"
                      >
                        {otherUser.full_name || otherUser.username || "Scholar"}
                      </Link>
                      {otherUser.is_verified && <VerifiedBadge size="sm" />}
                      <Badge className="text-[10px] font-bold uppercase bg-muted text-muted-foreground">
                        {otherUser.user_type || "Student"}
                      </Badge>

                      <Badge className={`text-[10px] font-bold ${currentStatus.className}`}>
                        {currentStatus.label}
                      </Badge>
                    </div>

                    {/* Listing reference if any */}
                    {conn.listing && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Repeat className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          Related to:{" "}
                          <Link
                            href={`/listings/${conn.listing.id}`}
                            className="font-semibold text-foreground hover:underline"
                          >
                            {conn.listing.title}
                          </Link>
                        </span>
                      </div>
                    )}

                    {/* Intro message */}
                    {conn.message && (
                      <p className="text-xs text-muted-foreground bg-accent/40 rounded-xl p-3 leading-relaxed border border-border/50">
                        &ldquo;{conn.message}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                      <span>Date: {createdDate}</span>
                      {hasRequestedCompletion && conn.status === "accepted" && (
                        <span className="text-amber-600 font-semibold dark:text-amber-400">
                          {iRequestedCompletion
                            ? "Waiting for partner to confirm completion"
                            : "Partner requested to mark exchange completed"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Match Badge & Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                  {conn.match_score !== null && conn.match_score !== undefined && (
                    <MatchBadge score={conn.match_score} size="md" variant="pill" />
                  )}

                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    {/* RECEIVER PENDING ACTIONS */}
                    {conn.status === "pending" && isReceiver && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => handleRespond(conn.id, "decline")}
                          className="rounded-xl text-xs text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          <span>Decline</span>
                        </Button>
                        <Button
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleRespond(conn.id, "accept")}
                          className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          <span>Accept Request</span>
                        </Button>
                      </>
                    )}

                    {/* SENDER PENDING ACTIONS */}
                    {conn.status === "pending" && !isReceiver && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => handleRespond(conn.id, "cancel")}
                        className="rounded-xl text-xs text-muted-foreground hover:bg-accent"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span>Cancel Request</span>
                      </Button>
                    )}

                    {/* ACCEPTED ACTIONS */}
                    {conn.status === "accepted" && (
                      <>
                        <Link href="/messages">
                          <Button
                            size="sm"
                            className="rounded-xl text-xs font-semibold gap-1.5 bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Open Chat</span>
                          </Button>
                        </Link>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => {
                            setSelectedReqForComplete(conn)
                            setCompleteDialogOpen(true)
                          }}
                          className={`rounded-xl text-xs font-semibold ${
                            hasRequestedCompletion && !iRequestedCompletion
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : ""
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          <span>
                            {hasRequestedCompletion && !iRequestedCompletion
                              ? "Confirm Completion"
                              : "Mark as Completed"}
                          </span>
                        </Button>
                      </>
                    )}

                    {/* COMPLETED ACTIONS */}
                    {conn.status === "completed" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedReqForReview(conn)
                            setReviewDialogOpen(true)
                          }}
                          className="rounded-xl text-xs font-semibold gap-1.5 bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
                        >
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>Leave Review</span>
                        </Button>
                        <Link href="/messages">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs gap-1.5"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>View History</span>
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completion Confirmation Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl border-border bg-card shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Award className="h-5 w-5" />
            </div>
            <DialogTitle className="font-heading text-lg font-bold text-foreground">
              Confirm Skill Exchange Completion
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Marking this exchange as completed verifies that both learning sessions were fulfilled.
              Once both peers confirm, Pairly will unlock reciprocal reviews and trust badges!
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-row items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCompleteDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmCompletion}
              disabled={loadingActionId != null}
              className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loadingActionId ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              )}
              <span>Yes, Confirm Completed</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post-Exchange Review Dialog */}
      {selectedReqForReview && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={(open) => {
            setReviewDialogOpen(open)
            if (!open) setSelectedReqForReview(null)
          }}
          connectionId={selectedReqForReview.id}
          revieweeId={
            selectedReqForReview.sender_id === currentUserId
              ? selectedReqForReview.receiver_id
              : selectedReqForReview.sender_id
          }
          revieweeName={
            selectedReqForReview.sender_id === currentUserId
              ? selectedReqForReview.receiver?.full_name || "Partner"
              : selectedReqForReview.sender?.full_name || "Partner"
          }
          skillsInvolved={{
            offered: selectedReqForReview.listing?.offered_skill?.name,
            wanted: selectedReqForReview.listing?.wanted_skill?.name,
          }}
          onSuccess={() => {
            startTransition(() => {
              router.refresh()
            })
          }}
        />
      )}
    </div>
  )
}
