"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConnectDialog } from "@/components/shared/connect-dialog"
import { getConnectionStatusAction } from "@/lib/actions/connections"
import { UserPlus, Check, MessageSquare, Loader2 } from "lucide-react"
import type { Profile, ListingWithDetails } from "@/types/database"

interface ConnectButtonProps {
  targetUser: Profile | { id: string; full_name?: string | null; username?: string | null; avatar_url?: string | null; is_verified?: boolean; user_type?: string }
  targetListing?: ListingWithDetails | { id: string; title: string; offered_skill?: { name: string } | null; wanted_skill?: { name: string } | null } | null
  matchScore?: number | null
  matchedYouWant?: string[]
  matchedTheyWant?: string[]
  currentUserId?: string | null
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "secondary"
  className?: string
  fullWidth?: boolean
}

export function ConnectButton({
  targetUser,
  targetListing,
  matchScore,
  matchedYouWant,
  matchedTheyWant,
  currentUserId,
  size = "default",
  variant = "default",
  className = "",
  fullWidth = false,
}: ConnectButtonProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusState, setStatusState] = useState<{
    status: "none" | "pending" | "accepted" | "completed"
    isSender?: boolean
    conversationId?: string
  }>({ status: "none" })

  const isSelf = currentUserId === targetUser.id

  useEffect(() => {
    if (!currentUserId || isSelf) return

    let isMounted = true
    const checkStatus = async () => {
      try {
        const res = await getConnectionStatusAction({
          otherUserId: targetUser.id,
          listingId: targetListing?.id || null,
        })
        if (isMounted) {
          if (res.status === "accepted" || res.status === "completed" || res.status === "pending") {
            setStatusState({
              status: res.status,
              isSender: res.isSender,
              conversationId: res.conversationId,
            })
          } else {
            setStatusState({ status: "none" })
          }
        }
      } catch {
        // Fallback to none
      }
    }

    checkStatus()

    return () => {
      isMounted = false
    }
  }, [currentUserId, targetUser.id, targetListing?.id, isSelf])

  if (isSelf) {
    return null
  }

  // 1. Accepted State -> Message Button
  if (statusState.status === "accepted" || statusState.status === "completed") {
    const chatUrl = statusState.conversationId
      ? `/messages/${statusState.conversationId}`
      : "/messages"

    return (
      <Link href={chatUrl} className={fullWidth ? "w-full block" : "inline-block"}>
        <Button
          size={size}
          className={`rounded-xl text-xs font-semibold gap-1.5 bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] dark:hover:bg-[#906ef8] shadow-xs ${
            fullWidth ? "w-full" : ""
          } ${className}`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Message</span>
        </Button>
      </Link>
    )
  }

  // 2. Pending State
  if (statusState.status === "pending") {
    if (statusState.isSender) {
      return (
        <Button
          size={size}
          disabled
          variant="outline"
          className={`rounded-xl text-xs font-semibold gap-1.5 opacity-80 cursor-not-allowed border-[#A78BFA]/40 bg-[#A78BFA]/10 text-[#4B3F72] dark:text-[#A78BFA] ${
            fullWidth ? "w-full" : ""
          } ${className}`}
        >
          <Check className="h-3.5 w-3.5" />
          <span>Request sent</span>
        </Button>
      )
    } else {
      return (
        <Link href="/connections?tab=received" className={fullWidth ? "w-full block" : "inline-block"}>
          <Button
            size={size}
            variant="outline"
            className={`rounded-xl text-xs font-semibold gap-1.5 border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ${
              fullWidth ? "w-full" : ""
            } ${className}`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Respond to Request</span>
          </Button>
        </Link>
      )
    }
  }

  // 3. None State -> Open Connect Dialog
  const handleOpenConnect = () => {
    if (!currentUserId) {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setDialogOpen(true)
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={handleOpenConnect}
        className={`rounded-xl text-xs font-semibold gap-1.5 bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] dark:hover:bg-[#906ef8] shadow-xs transition-all ${
          fullWidth ? "w-full" : ""
        } ${className}`}
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span>Connect</span>
      </Button>

      <ConnectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        targetUser={targetUser}
        targetListing={targetListing}
        matchScore={matchScore}
        matchedYouWant={matchedYouWant}
        matchedTheyWant={matchedTheyWant}
        onSuccess={() => {
          setStatusState({ status: "pending", isSender: true })
        }}
      />
    </>
  )
}
