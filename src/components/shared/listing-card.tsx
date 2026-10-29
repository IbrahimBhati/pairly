"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { UserAvatar } from "@/components/shared/user-avatar"
import { SkillChip } from "@/components/shared/skill-chip"
import { MatchBadge } from "@/components/shared/match-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  toggleSaveListingAction,
  toggleListingStatusAction,
  deleteListingAction,
} from "@/lib/actions/listings"
import {
  Repeat,
  Heart,
  Eye,
  MapPin,
  Calendar,
  MoreVertical,
  Edit,
  Pause,
  Play,
  CheckCircle,
  Trash2,
  Sparkles,
  ArrowRight,
  HandHelping,
  Star,
} from "lucide-react"
import type { ListingWithDetails, ListingStatus } from "@/types/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ListingCardProps {
  listing: ListingWithDetails
  isOwner?: boolean
  currentUserId?: string
  matchScore?: number
  matchedYouWant?: string[]
  matchedTheyWant?: string[]
  onDeleteSuccess?: (id: string) => void
  onStatusChange?: (id: string, status: ListingStatus) => void
}

export function ListingCard({
  listing,
  isOwner = false,
  currentUserId,
  matchScore,
  matchedYouWant,
  matchedTheyWant,
  onDeleteSuccess,
  onStatusChange,
}: ListingCardProps) {
  const [isSaved, setIsSaved] = useState(listing.is_saved ?? false)
  const [currentStatus, setCurrentStatus] = useState<ListingStatus>(listing.status)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Bookmark toggle
  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId) {
      toast.info("Sign in to save listings", {
        description: "Save listings to review and exchange later.",
      })
      return
    }

    // Optimistic update
    const previous = isSaved
    setIsSaved(!previous)

    startTransition(async () => {
      const res = await toggleSaveListingAction(listing.id)
      if (!res.success) {
        setIsSaved(previous)
        toast.error("Could not update bookmark")
      } else {
        toast.success(res.isSaved ? "Saved to your bookmarks" : "Removed from bookmarks")
      }
    })
  }

  // Status toggle handler
  const handleStatusChange = (newStatus: ListingStatus) => {
    setCurrentStatus(newStatus)
    startTransition(async () => {
      const res = await toggleListingStatusAction(listing.id, newStatus)
      if (res.success) {
        toast.success(`Listing status updated to ${newStatus}`)
        onStatusChange?.(listing.id, newStatus)
      } else {
        toast.error("Could not update status")
        setCurrentStatus(listing.status)
      }
    })
  }

  // Delete handler
  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteListingAction(listing.id)
      if (res.success) {
        setDeleteOpen(false)
        toast.success("Listing deleted successfully")
        onDeleteSuccess?.(listing.id)
      } else {
        toast.error("Failed to delete listing")
      }
    })
  }

  const typeConfig = {
    exchange: {
      label: "Skill Exchange",
      icon: Repeat,
      className:
        "border-[#A78BFA]/40 bg-[#A78BFA]/15 text-[#4B3F72] dark:border-[#A78BFA]/25 dark:bg-[#A78BFA]/10 dark:text-[#A78BFA]",
    },
    help_offer: {
      label: "Help Offer",
      icon: HandHelping,
      className:
        "border-emerald-300/60 bg-emerald-50 text-[#064E3B] dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-[#A7F3D0]",
    },
    help_request: {
      label: "Help Request",
      icon: Sparkles,
      className:
        "border-blue-300/60 bg-blue-50 text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300",
    },
  }

  const typeInfo = typeConfig[listing.type] || typeConfig.exchange
  const TypeIcon = typeInfo.icon

  const statusBadges = {
    active: null,
    paused: <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">Paused</Badge>,
    completed: <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:text-emerald-300">Completed</Badge>,
    closed: <Badge variant="secondary">Closed</Badge>,
  }

  const createdDate = new Date(listing.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  return (
    <>
      <div className="card-soft group relative flex flex-col justify-between overflow-hidden p-5 transition-all">
        {/* Top Header: Type badge, Status & Controls */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
                typeInfo.className
              )}
            >
              <TypeIcon className="h-3 w-3" />
              <span>{typeInfo.label}</span>
            </span>

            {statusBadges[currentStatus]}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Match Badge */}
            {matchScore !== undefined && matchScore !== null && !isOwner && (
              <MatchBadge
                score={matchScore}
                matchedYouWant={matchedYouWant}
                matchedTheyWant={matchedTheyWant}
                size="sm"
                variant="ring"
              />
            )}

            {/* Save Bookmark button */}
            {!isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSave}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                aria-label={isSaved ? "Remove bookmark" : "Save listing"}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-all",
                    isSaved ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground"
                  )}
                />
              </Button>
            )}

            {/* Owner Management Menu */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                      aria-label="Listing options"
                    />
                  }
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl border border-border bg-card p-1 shadow-lg">
                  <DropdownMenuItem
                    render={
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer"
                      />
                    }
                  >
                    <Edit className="h-3.5 w-3.5 text-primary" />
                    <span>Edit Listing</span>
                  </DropdownMenuItem>

                  {currentStatus === "active" ? (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("paused")}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      <Pause className="h-3.5 w-3.5 text-amber-500" />
                      <span>Pause Listing</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("active")}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Activate Listing</span>
                    </DropdownMenuItem>
                  )}

                  {currentStatus !== "completed" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("completed")}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Mark Completed</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-destructive cursor-pointer hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    <span>Delete Listing</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Title & Description Link */}
        <Link href={`/listings/${listing.id}`} className="group/link block space-y-1.5 mb-4">
          <h3 className="font-heading text-base font-bold text-foreground leading-snug group-hover/link:text-primary transition-colors line-clamp-1">
            {listing.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        </Link>

        {/* Skill Pair Chips */}
        <div className="space-y-2 mb-4">
          {listing.type === "exchange" && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {listing.offered_skill && (
                <SkillChip name={listing.offered_skill.name} direction="offered" size="sm" />
              )}
              <Repeat className="h-3 w-3 text-secondary shrink-0" />
              {listing.wanted_skill && (
                <SkillChip name={listing.wanted_skill.name} direction="wanted" size="sm" />
              )}
            </div>
          )}

          {listing.type === "help_offer" && listing.offered_skill && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Offers:</span>
              <SkillChip name={listing.offered_skill.name} direction="offered" size="sm" />
            </div>
          )}

          {listing.type === "help_request" && listing.wanted_skill && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Seeks:</span>
              <SkillChip name={listing.wanted_skill.name} direction="wanted" size="sm" />
            </div>
          )}
        </div>

        {/* Footer info: Owner mini-card + metadata */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          {/* Owner Info */}
          {listing.owner ? (
            <Link
              href={`/u/${listing.owner.username || listing.owner.id}`}
              className="flex items-center gap-2 group/owner max-w-[65%]"
            >
              <UserAvatar profile={listing.owner} size="xs" showVerified />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground truncate group-hover/owner:text-primary transition-colors">
                    {listing.owner.full_name || listing.owner.username || "Scholar"}
                  </p>
                  {(listing.owner.avg_rating ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#A78BFA]">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      <span>{Number(listing.owner.avg_rating).toFixed(1)}</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">Pairly Member</span>
          )}

          {/* Mode & Views */}
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="capitalize">{listing.mode.replace("_", " ")}</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span>{listing.view_count}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading">Delete Listing</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Are you sure you want to delete &ldquo;{listing.title}&rdquo;? This action is permanent and will remove the exchange offer from the marketplace.
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
