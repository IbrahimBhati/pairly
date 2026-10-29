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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ReviewStars } from "@/components/shared/review-stars"
import { adminDeleteReviewAction } from "@/lib/actions/admin"
import { toast } from "sonner"
import {
  Search,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageSquare,
  Star,
} from "lucide-react"

interface ReviewsClientProps {
  initialReviews: any[]
  total: number
  totalPages: number
  currentPage: number
  currentFilters: {
    query: string
    minRating?: number
  }
}

export function ReviewsClient({
  initialReviews,
  total,
  totalPages,
  currentPage,
  currentFilters,
}: ReviewsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(currentFilters.query)
  const [deleteDialogReview, setDeleteDialogReview] = useState<any | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [actionInProgress, setActionInProgress] = useState(false)

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (newPage > 1) params.set("page", String(newPage))

    startTransition(() => {
      router.push(`/admin/reviews?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters(1)
  }

  const handleDeleteSubmit = async () => {
    if (!deleteDialogReview) return
    setActionInProgress(true)

    const res = await adminDeleteReviewAction({
      reviewId: deleteDialogReview.id,
      reason: deleteReason.trim() || "Policy violation.",
    })

    setActionInProgress(false)

    if (res.success) {
      toast.success("Review permanently deleted. Peer ratings recalculated automatically.")
      setDeleteDialogReview(null)
      setDeleteReason("")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to delete review.")
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Search Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviews by comment content..."
              className="pl-10 rounded-xl"
            />
          </div>
          <Button type="submit" className="rounded-xl text-xs font-semibold gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Search</span>
          </Button>
        </form>
      </div>

      {/* 2. Reviews Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[140px]">Rating</TableHead>
              <TableHead className="w-[280px]">Feedback &amp; Sub-ratings</TableHead>
              <TableHead>Recipient (Reviewee)</TableHead>
              <TableHead>Author (Reviewer)</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No reviews found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              initialReviews.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  {/* Rating Stars */}
                  <TableCell>
                    <div className="space-y-1">
                      <ReviewStars value={r.rating} size="sm" readOnly />
                      <span className="text-[11px] font-semibold text-foreground">
                        {r.rating}.0 / 5.0
                      </span>
                    </div>
                  </TableCell>

                  {/* Comment & Subratings */}
                  <TableCell>
                    <div className="space-y-1.5">
                      <p className="text-xs text-foreground font-medium line-clamp-2">
                        &ldquo;{r.comment || "No written comment"}&rdquo;
                      </p>
                      {(r.skills_rating || r.communication_rating || r.punctuality_rating) && (
                        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          {r.skills_rating && <span>Skill: {r.skills_rating}★</span>}
                          {r.communication_rating && <span>Comm: {r.communication_rating}★</span>}
                          {r.punctuality_rating && <span>Punct: {r.punctuality_rating}★</span>}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Reviewee */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={r.reviewee?.avatar_url || ""} />
                        <AvatarFallback className="text-[10px]">
                          {r.reviewee?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={`/u/${r.reviewee?.id}`}
                          target="_blank"
                          className="font-semibold text-xs text-foreground hover:underline truncate block"
                        >
                          {r.reviewee?.full_name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          @{r.reviewee?.username}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Reviewer */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={r.reviewer?.avatar_url || ""} />
                        <AvatarFallback className="text-[10px]">
                          {r.reviewer?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={`/u/${r.reviewer?.id}`}
                          target="_blank"
                          className="font-semibold text-xs text-foreground hover:underline truncate block"
                        >
                          {r.reviewer?.full_name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          @{r.reviewer?.username}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2.5 text-xs rounded-xl gap-1"
                      onClick={() => {
                        setDeleteDialogReview(r)
                        setDeleteReason("")
                      }}
                      title="Delete Review (Recalculates Rating)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
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
            Showing {initialReviews.length} of {total} community reviews
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

      {/* Delete Review Dialog */}
      <Dialog open={!!deleteDialogReview} onOpenChange={(open) => !open && setDeleteDialogReview(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Delete Peer Review</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deleting this review will immediately remove it and recalculate the recipient’s average rating and trust score automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground">
              Reason for Removal
            </label>
            <Textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="State reason (e.g. abusive language, defamatory remarks, fake exchange)..."
              className="rounded-xl text-xs resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogReview(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionInProgress}
              onClick={handleDeleteSubmit}
              className="rounded-xl text-xs font-semibold"
            >
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
