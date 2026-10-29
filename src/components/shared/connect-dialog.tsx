"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { MatchBadge } from "@/components/shared/match-badge"
import { Badge } from "@/components/ui/badge"
import { sendConnectionRequestAction } from "@/lib/actions/connections"
import { toast } from "sonner"
import { Sparkles, Send, Repeat, Loader2 } from "lucide-react"
import type { Profile, ListingWithDetails } from "@/types/database"

interface ConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUser: Profile | { id: string; full_name?: string | null; username?: string | null; avatar_url?: string | null; is_verified?: boolean; user_type?: string }
  targetListing?: ListingWithDetails | { id: string; title: string; offered_skill?: { name: string } | null; wanted_skill?: { name: string } | null } | null
  matchScore?: number | null
  matchedYouWant?: string[]
  matchedTheyWant?: string[]
  onSuccess?: () => void
}

export function ConnectDialog({
  open,
  onOpenChange,
  targetUser,
  targetListing,
  matchScore,
  matchedYouWant = [],
  matchedTheyWant = [],
  onSuccess,
}: ConnectDialogProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const targetName = targetUser.full_name || targetUser.username || "Scholar"
  const theirOffered = targetListing?.offered_skill?.name || matchedYouWant[0] || "your expertise"
  const theirWanted = targetListing?.wanted_skill?.name || matchedTheyWant[0] || "my skills"

  const defaultTemplate = `Hi ${targetName}, I saw your profile on Pairly and would love to connect! I'm really keen to learn ${theirOffered} and would be delighted to exchange with ${theirWanted}. Looking forward to learning together!`

  const [message, setMessage] = useState(defaultTemplate)
  const maxChars = 500

  // Update default template when opening with new user
  React.useEffect(() => {
    if (open) {
      setMessage(defaultTemplate)
    }
  }, [open, targetUser.id, targetListing?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)

    try {
      const res = await sendConnectionRequestAction({
        receiverId: targetUser.id,
        listingId: targetListing?.id || null,
        message,
        matchScore: matchScore != null ? matchScore : undefined,
      })

      if (res.error) {
        toast.error("Could not send request", { description: res.error })
        return
      }

      toast.success("Connection request sent! 🎉", {
        description: `Your request was delivered to ${targetName}. They will receive a notification.`,
      })

      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (err: any) {
      toast.error("An unexpected error occurred", { description: err?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl border-border bg-card shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA]">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="font-heading text-lg font-bold text-foreground">
                Connect with Peer
              </DialogTitle>
            </div>

            {matchScore !== undefined && matchScore !== null && (
              <MatchBadge
                score={matchScore}
                matchedYouWant={matchedYouWant}
                matchedTheyWant={matchedTheyWant}
                size="sm"
                variant="pill"
              />
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Introduce yourself and propose an initial skill exchange schedule.
          </DialogDescription>
        </DialogHeader>

        {/* Target Peer Card Preview */}
        <div className="rounded-xl border border-border bg-accent/30 p-3.5 space-y-2.5">
          <div className="flex items-center gap-3">
            <UserAvatar profile={targetUser as any} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-heading text-sm font-bold text-foreground truncate">
                  {targetName}
                </span>
                {targetUser.is_verified && <VerifiedBadge size="sm" />}
              </div>
              {targetUser.username && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  @{targetUser.username}
                </span>
              )}
            </div>
            {targetUser.user_type && (
              <Badge className="bg-[#A7F3D0] text-[#064E3B] text-[10px] font-bold uppercase">
                {targetUser.user_type}
              </Badge>
            )}
          </div>

          {/* Related Listing Chip */}
          {targetListing && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
              <Repeat className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate font-medium text-foreground">
                Listing: {targetListing.title}
              </span>
            </div>
          )}
        </div>

        {/* Intro Message Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="intro-message" className="font-semibold text-foreground">
                Introduction Message
              </label>
              <span
                className={`text-[10px] font-mono ${
                  message.length > maxChars ? "text-destructive font-bold" : "text-muted-foreground"
                }`}
              >
                {message.length}/{maxChars}
              </span>
            </div>
            <Textarea
              id="intro-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a friendly note introducing yourself..."
              rows={4}
              maxLength={maxChars}
              className="resize-none rounded-xl border-border bg-background text-xs leading-relaxed focus-visible:ring-primary"
              required
            />
          </div>

          <DialogFooter className="flex-row items-center justify-end gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !message.trim() || message.length > maxChars}
              className="rounded-xl text-xs h-9 font-semibold gap-1.5 bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] dark:hover:bg-[#906ef8]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Request</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
