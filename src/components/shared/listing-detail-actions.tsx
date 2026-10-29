"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  toggleListingStatusAction,
  deleteListingAction,
  toggleSaveListingAction,
} from "@/lib/actions/listings"
import {
  Edit,
  Pause,
  Play,
  CheckCircle,
  Trash2,
  Heart,
  UserPlus,
  Loader2,
  Clock,
  Sparkles,
  Flag,
} from "lucide-react"
import { ReportDialog } from "@/components/shared/report-dialog"
import type { ListingStatus } from "@/types/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ListingOwnerBarProps {
  listingId: string
  currentStatus: ListingStatus
}

export function ListingOwnerBar({ listingId, currentStatus: initialStatus }: ListingOwnerBarProps) {
  const router = useRouter()
  const [status, setStatus] = useState<ListingStatus>(initialStatus)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (newStatus: ListingStatus) => {
    setStatus(newStatus)
    startTransition(async () => {
      const res = await toggleListingStatusAction(listingId, newStatus)
      if (res.success) {
        toast.success(`Listing status updated to ${newStatus}`)
        router.refresh()
      } else {
        toast.error("Could not update status")
        setStatus(initialStatus)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteListingAction(listingId)
      if (res.success) {
        setDeleteOpen(false)
        toast.success("Listing deleted successfully")
        router.push("/listings")
        router.refresh()
      } else {
        toast.error("Failed to delete listing")
      }
    })
  }

  return (
    <>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold font-heading text-foreground">
            Listing Management:
          </span>
          {status === "active" && (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300">
              Active
            </Badge>
          )}
          {status === "paused" && (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300">
              Paused
            </Badge>
          )}
          {status === "completed" && (
            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300">
              Completed
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/listings/${listingId}/edit`}>
            <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 h-8">
              <Edit className="h-3.5 w-3.5 text-primary" />
              <span>Edit</span>
            </Button>
          </Link>

          {status === "active" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("paused")}
              disabled={isPending}
              className="rounded-xl text-xs gap-1.5 h-8 text-amber-600 hover:text-amber-700"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>Pause</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("active")}
              disabled={isPending}
              className="rounded-xl text-xs gap-1.5 h-8 text-emerald-600 hover:text-emerald-700"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Activate</span>
            </Button>
          )}

          {status !== "completed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("completed")}
              disabled={isPending}
              className="rounded-xl text-xs gap-1.5 h-8 text-emerald-600 hover:text-emerald-700"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Mark Completed</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            disabled={isPending}
            className="rounded-xl text-xs gap-1.5 h-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading">Delete Listing</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Are you sure you want to delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl text-xs"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="rounded-xl text-xs gap-1.5"
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Permanently</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface ListingSaveButtonProps {
  listingId: string
  initialSaved: boolean
  isLoggedIn: boolean
}

export function ListingSaveButton({
  listingId,
  initialSaved,
  isLoggedIn,
}: ListingSaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    if (!isLoggedIn) {
      toast.info("Sign in to save listings", {
        description: "Create a free Pairly account to bookmark opportunities.",
      })
      return
    }

    const previous = isSaved
    setIsSaved(!previous)

    startTransition(async () => {
      const res = await toggleSaveListingAction(listingId)
      if (!res.success) {
        setIsSaved(previous)
        toast.error("Failed to update bookmark")
      } else {
        toast.success(res.isSaved ? "Saved to your bookmarks" : "Removed from bookmarks")
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "rounded-xl gap-1.5 text-xs font-semibold transition-all",
        isSaved
          ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
          : "border-border text-foreground hover:bg-accent"
      )}
    >
      <Heart className={cn("h-4 w-4", isSaved && "fill-rose-500 text-rose-500")} />
      <span>{isSaved ? "Saved" : "Save Listing"}</span>
    </Button>
  )
}

export function ConnectPlaceholderButton() {
  const handleClick = () => {
    toast.info("Peer Messaging and Connection Requests", {
      description: "Direct exchange requests and messaging will be activated in Phase 5!",
    })
  }

  return (
    <Button
      onClick={handleClick}
      className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-xs min-h-[44px] gap-2 shadow-sm hover:shadow-md transition-all"
    >
      <UserPlus className="h-4 w-4" />
      <span>Send Connection Request</span>
    </Button>
  )
}

export function ListingReportButton({
  listingId,
  listingTitle,
  isLoggedIn,
}: {
  listingId: string
  listingTitle: string
  isLoggedIn: boolean
}) {
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    if (!isLoggedIn) {
      toast.info("Please sign in to report this listing")
      return
    }
    setOpen(true)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        <span>Report</span>
      </Button>
      <ReportDialog
        open={open}
        onOpenChange={setOpen}
        reportedListingId={listingId}
        reportedListingTitle={listingTitle}
      />
    </>
  )
}

