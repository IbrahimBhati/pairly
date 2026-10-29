"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, Repeat } from "lucide-react"
import { formatDistanceToNowStrict } from "date-fns"
import type { ConversationWithDetails } from "@/types/database"

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  currentUserId: string
  activeConversationId?: string
  className?: string
  onSelect?: () => void
}

export function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
  className = "",
  onSelect,
}: ConversationListProps) {
  const [search, setSearch] = useState("")

  const filtered = conversations.filter((c) => {
    const name = c.other_user?.full_name || ""
    const username = c.other_user?.username || ""
    const listing = c.listing?.title || ""
    const q = search.toLowerCase().trim()
    return (
      name.toLowerCase().includes(q) ||
      username.toLowerCase().includes(q) ||
      listing.toLowerCase().includes(q)
    )
  })

  return (
    <div className={`flex flex-col h-full bg-card/60 backdrop-blur-md border-r border-border ${className}`}>
      {/* Header & Search */}
      <div className="p-4 border-b border-border/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA]">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Messages
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {conversations.length} active
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-8 h-8 rounded-xl text-xs bg-background border-border focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">
              {search ? "No matching conversations" : "No conversations yet"}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              {search
                ? "Try searching for a different peer or skill."
                : "Accept a connection request or send one to start exchanging skills."}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeConversationId
            const other = conv.other_user
            const lastMsg = conv.last_message
            const unread = conv.unread_count || 0

            const timeStr = lastMsg?.created_at
              ? formatDistanceToNowStrict(new Date(lastMsg.created_at), { addSuffix: false })
              : conv.last_message_at
              ? formatDistanceToNowStrict(new Date(conv.last_message_at), { addSuffix: false })
              : "new"

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                onClick={onSelect}
                className={`flex items-start gap-3 p-3 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#A78BFA]/20 text-foreground shadow-xs border border-[#A78BFA]/30"
                    : "hover:bg-accent/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative shrink-0">
                  <UserAvatar profile={other} size="md" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-heading text-xs font-bold text-foreground truncate">
                        {other?.full_name || other?.username || "Scholar"}
                      </span>
                      {other?.is_verified && <VerifiedBadge size="sm" />}
                    </div>

                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {timeStr}
                    </span>
                  </div>

                  {conv.listing && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                      <Repeat className="h-2.5 w-2.5 text-primary shrink-0" />
                      <span className="truncate">{conv.listing.title}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        unread > 0 ? "font-bold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {lastMsg
                        ? lastMsg.sender_id === currentUserId
                          ? `You: ${lastMsg.content}`
                          : lastMsg.content
                        : "Started a conversation"}
                    </p>

                    {unread > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4B3F72] px-1 text-[9px] font-bold text-white shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
