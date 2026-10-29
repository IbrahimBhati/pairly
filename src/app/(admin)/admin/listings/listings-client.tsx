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
  adminUpdateListingStatusAction,
  adminDeleteListingAction,
} from "@/lib/actions/admin"
import { toast } from "sonner"
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  PauseCircle,
  XCircle,
  RotateCcw,
} from "lucide-react"

interface ListingsClientProps {
  initialListings: any[]
  categories: any[]
  total: number
  totalPages: number
  currentPage: number
  currentFilters: {
    query: string
    status: string
    categoryId: string
  }
}

export function ListingsClient({
  initialListings,
  categories,
  total,
  totalPages,
  currentPage,
  currentFilters,
}: ListingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(currentFilters.query)
  const [status, setStatus] = useState(currentFilters.status)
  const [categoryId, setCategoryId] = useState(currentFilters.categoryId)

  // Remove Listing Modal
  const [removeDialogListing, setRemoveDialogListing] = useState<any | null>(null)
  const [removeReason, setRemoveReason] = useState("")

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (status !== "all") params.set("status", status)
    if (categoryId !== "all") params.set("category", categoryId)
    if (newPage > 1) params.set("page", String(newPage))

    startTransition(() => {
      router.push(`/admin/listings?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters(1)
  }

  const handleStatusChange = async (listingId: string, newStatus: any) => {
    const res = await adminUpdateListingStatusAction({
      listingId,
      status: newStatus,
      reason: `Admin updated listing status to ${newStatus}`,
    })
    if (res.success) {
      toast.success(`Listing status updated to ${newStatus}`)
      router.refresh()
    } else {
      toast.error(res.error || "Failed to update listing.")
    }
  }

  const handleRemoveSubmit = async () => {
    if (!removeDialogListing) return

    const res = await adminDeleteListingAction({
      listingId: removeDialogListing.id,
      reason: removeReason.trim() || "Policy violation.",
    })

    if (res.success) {
      toast.success("Listing removed from platform")
      setRemoveDialogListing(null)
      setRemoveReason("")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to remove listing.")
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "active":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">Active</Badge>
      case "paused":
        return <Badge variant="secondary" className="text-[10px]">Paused</Badge>
      case "closed":
        return <Badge variant="destructive" className="text-[10px]">Closed</Badge>
      case "completed":
        return <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Completed</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">{s}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search listings by title or description..."
              className="pl-10 rounded-xl"
            />
          </div>
          <Button type="submit" className="rounded-xl text-xs font-semibold gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Search</span>
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Listing Status
            </label>
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val || "all")
                setTimeout(() => applyFilters(1), 0)
              }}
            >
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Category
            </label>
            <Select
              value={categoryId}
              onValueChange={(val) => {
                setCategoryId(val || "all")
                setTimeout(() => applyFilters(1), 0)
              }}
            >
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Listings Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[320px]">Listing Details</TableHead>
              <TableHead>Category &amp; Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialListings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No listings found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              initialListings.map((l) => (
                <TableRow key={l.id} className="hover:bg-muted/30">
                  {/* Title & Description */}
                  <TableCell>
                    <div className="space-y-1">
                      <Link
                        href={`/listings/${l.id}`}
                        target="_blank"
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span className="truncate max-w-[260px]">{l.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {l.description}
                      </p>
                    </div>
                  </TableCell>

                  {/* Category & Type */}
                  <TableCell>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-foreground block">
                        {l.category?.name || "Uncategorized"}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {l.type?.replace("_", " ")}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Owner */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarImage src={l.owner?.avatar_url || ""} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {l.owner?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {l.owner?.full_name || "Unknown"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          @{l.owner?.username || "no-handle"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>{getStatusBadge(l.status)}</TableCell>

                  {/* Views */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{l.view_count || 0}</span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/listings/${l.id}`} target="_blank">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View Listing Page"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {l.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs rounded-xl"
                          onClick={() => handleStatusChange(l.id, "closed")}
                          title="Close Listing"
                        >
                          Close
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleStatusChange(l.id, "active")}
                          title="Restore to Active"
                        >
                          Restore
                        </Button>
                      )}

                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => {
                          setRemoveDialogListing(l)
                          setRemoveReason("")
                        }}
                        title="Remove Listing (Permanent)"
                      >
                        <Trash2 className="h-4 w-4" />
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
            Showing {initialListings.length} of {total} total listings
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

      {/* Remove Listing Dialog */}
      <Dialog open={!!removeDialogListing} onOpenChange={(open) => !open && setRemoveDialogListing(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Remove Listing: {removeDialogListing?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will permanently delete this listing from the exchange catalog and notify the author of the reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground">
              Removal Reason &amp; Member Notification
            </label>
            <Textarea
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              placeholder="Explain violation (e.g. spam, inappropriate content, commercial advert)..."
              className="rounded-xl text-xs resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRemoveDialogListing(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveSubmit}
              className="rounded-xl text-xs font-semibold"
            >
              Confirm Removal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
