"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useConversationMessages } from "@/hooks/use-conversation-messages"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { BadgeTile } from "@/components/shared/badge-tile"
import { ReportDialog } from "@/components/shared/report-dialog"
import { BlockDialog } from "@/components/shared/block-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fetchUserTopBadgesAction } from "@/lib/actions/gamification"
import { validateContentSafety } from "@/lib/safety"
import { toast } from "sonner"
import {
  ArrowLeft,
  Send,
  Loader2,
  Repeat,
  Check,
  CheckCheck,
  ChevronUp,
  MoreVertical,
  Flag,
  UserX,
  Shield,
  X,
  Info,
} from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import type {
  ConversationWithDetails,
  MessageWithSender,
  UserBadgeWithDetails,
} from "@/types/database"

interface ChatWindowProps {
  conversation: ConversationWithDetails
  initialMessages: MessageWithSender[]
  currentUserId: string
  onBack?: () => void
}

export function ChatWindow({
  conversation,
  initialMessages,
  currentUserId,
  onBack,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("")
  const [sending, setSending] = useState(false)
  const [topBadges, setTopBadges] = useState<UserBadgeWithDetails[]>([])
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [showSafetyTips, setShowSafetyTips] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  const otherUser = conversation.other_user

  // Fetch top badges for peer
  useEffect(() => {
    if (otherUser?.id) {
      fetchUserTopBadgesAction(otherUser.id).then((res) => {
        if (res.success) setTopBadges(res.data)
      })
    }
  }, [otherUser?.id])

  const {
    messages,
    sendMessage,
    loadOlderMessages,
    hasMore,
    loadingMore,
    isPeerTyping,
    isPeerOnline,
    sendTyping,
  } = useConversationMessages(
    conversation.id,
    initialMessages,
    currentUserId,
    otherUser
  )

  // Scroll detection to disable auto-scroll when user manually scrolls up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    shouldAutoScrollRef.current = isAtBottom
  }

  // Scroll to bottom on initial load and when new messages arrive if near bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isPeerTyping])

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    sendTyping(e.target.value.length > 0)
  }

  const handleSend = async () => {
    const content = inputText.trim()
    if (!content || sending) return

    // Client-side content safety check
    const isFirstMessage = messages.length === 0
    const safetyCheck = validateContentSafety(content, isFirstMessage)
    if (!safetyCheck.valid) {
      toast.error("Message Blocked by Safety Filters", {
        description: safetyCheck.warning,
      })
      return
    }

    setSending(true)
    setInputText("")
    sendTyping(false)
    shouldAutoScrollRef.current = true

    try {
      await sendMessage(content)
    } catch (err: any) {
      toast.error("Failed to send message", { description: err?.message })
      setInputText(content) // restore on error
    } finally {
      setSending(false)
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Format date headers
  const formatMessageDate = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isToday(d)) return "Today"
    if (isYesterday(d)) return "Yesterday"
    return format(d, "MMMM d, yyyy")
  }

  // Identify last read own message for "Seen" receipt
  const lastReadOwnMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.sender_id === currentUserId && m.read_at) {
        return m.id
      }
    }
    return null
  })()

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* 1. Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/70 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="lg:hidden rounded-xl text-foreground"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div className="relative shrink-0">
            <UserAvatar profile={otherUser} size="md" />
            {isPeerOnline && (
              <span
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card"
                title="Online now"
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/u/${otherUser?.username || otherUser?.id}`}
                className="font-heading text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
              >
                {otherUser?.full_name || otherUser?.username || "Scholar"}
              </Link>
              {otherUser?.is_verified && <VerifiedBadge size="sm" />}
              {otherUser?.user_type && (
                <Badge className="text-[9px] font-bold uppercase bg-[#A7F3D0] text-[#064E3B] px-1.5 py-0">
                  {otherUser.user_type}
                </Badge>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              {isPeerOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online now</span>
              ) : otherUser?.username ? (
                `@${otherUser.username}`
              ) : (
                "Peer"
              )}
            </p>
          </div>
        </div>

        {/* Right header actions: Listing chip, Top Badges, More options */}
        <div className="flex items-center gap-2">
          {/* Related Listing Chip */}
          {conversation.listing && (
            <Link
              href={`/listings/${conversation.listing.id}`}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-border bg-accent/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors max-w-xs truncate"
            >
              <Repeat className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate font-medium">{conversation.listing.title}</span>
            </Link>
          )}

          {/* Peer Top Badges */}
          {topBadges.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 bg-secondary/50 border border-border/60 rounded-xl px-2 py-1">
              {topBadges.map((ub) => (
                <BadgeTile
                  key={ub.badge_id}
                  name={ub.badge?.name || "Badge"}
                  description={ub.badge?.description}
                  iconName={ub.badge?.icon}
                  tier={(ub.badge?.tier as any) || "bronze"}
                  earned={true}
                  size="sm"
                />
              ))}
            </div>
          )}

          {/* Safety Menu */}
          {otherUser && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-xl h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Safety menu"
                  />
                }
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem
                  onClick={() => setReportOpen(true)}
                  className="text-xs gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>Report User</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setBlockOpen(true)}
                  className="text-xs gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <UserX className="h-3.5 w-3.5" />
                  <span>Block User</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 2. Messages Scroll Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
      >
        {/* Dismissible Safety Tips Card */}
        {showSafetyTips && (
          <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setShowSafetyTips(false)}
              className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground p-1 rounded-lg"
              aria-label="Dismiss safety tips"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Pairly Community Safety Notice</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              • Keep conversations focused on your collaborative exchange goals.
              <br />• Never share personal account passwords, banking details, or private keys.
              <br />• If meeting offline, use public university libraries or open campus spaces.
              <br />• Report suspicious conduct or spam using the top right options menu.
            </p>
          </div>
        )}

        {/* Load older messages button */}
        {hasMore && (
          <div className="flex justify-center pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadOlderMessages}
              disabled={loadingMore}
              className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              {loadingMore ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span>Load earlier messages</span>
            </Button>
          </div>
        )}

        {/* Empty messages state */}
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
              <Repeat className="h-6 w-6" />
            </div>
            <h4 className="font-heading font-bold text-sm text-foreground">
              Direct Learning Channel
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Say hello to {otherUser?.full_name || "your partner"}! Schedule your video call or campus meetup and coordinate your exchange.
            </p>
          </div>
        )}

        {/* Messages list with date grouping */}
        {messages.map((msg, index) => {
          const isOwn = msg.sender_id === currentUserId
          const prevMsg = messages[index - 1]

          // Check if date divider is needed
          const showDateDivider =
            !prevMsg ||
            new Date(msg.created_at).toDateString() !==
              new Date(prevMsg.created_at).toDateString()

          // Check if message is consecutive from same sender
          const isConsecutive =
            prevMsg &&
            prevMsg.sender_id === msg.sender_id &&
            !showDateDivider &&
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000

          const isLastOwnRead = msg.id === lastReadOwnMessageId

          return (
            <React.Fragment key={msg.id}>
              {/* Date Header Divider */}
              {showDateDivider && (
                <div className="flex items-center justify-center my-4">
                  <span className="rounded-full bg-muted/80 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-2xs">
                    {formatMessageDate(msg.created_at)}
                  </span>
                </div>
              )}

              {/* Message Bubble Row */}
              <div
                className={`flex gap-2.5 ${isOwn ? "justify-end" : "justify-start"} ${
                  isConsecutive ? "mt-1" : "mt-3"
                }`}
              >
                {!isOwn && (
                  <div className="w-7 shrink-0 flex items-end">
                    {!isConsecutive && <UserAvatar profile={msg.sender} size="xs" />}
                  </div>
                )}

                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[82%] sm:max-w-[70%]`}>
                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs break-words ${
                      isOwn
                        ? "bg-[#4B3F72] text-white rounded-br-xs dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
                        : "bg-muted text-foreground rounded-bl-xs border border-border/40"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Metadata Row: Time & Read Receipts */}
                  <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-muted-foreground">
                    <span>{format(new Date(msg.created_at), "h:mm a")}</span>
                    {isOwn && (
                      <span>
                        {msg.read_at ? (
                          <CheckCheck className="h-3 w-3 text-emerald-500 inline" />
                        ) : (
                          <Check className="h-3 w-3 text-muted-foreground inline" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Seen Indicator below last read message */}
                  {isLastOwnRead && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium px-1 mt-0.5">
                      Seen
                    </span>
                  )}
                </div>
              </div>
            </React.Fragment>
          )
        })}

        {/* Peer Typing Indicator */}
        {isPeerTyping && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 animate-pulse">
            <span className="font-medium text-foreground">
              {otherUser?.full_name || "Peer"} is typing
            </span>
            <div className="flex gap-1 items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Composer */}
      <div className="p-3 sm:p-4 border-t border-border bg-card/60 backdrop-blur-md shrink-0">
        <div className="relative flex items-end gap-2 bg-background border border-border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary shadow-xs">
          <Textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherUser?.full_name || "peer"} (Enter to send, Shift+Enter for new line)...`}
            rows={1}
            maxLength={2000}
            className="flex-1 min-h-[38px] max-h-32 border-0 bg-transparent resize-none p-2 text-xs focus-visible:ring-0 shadow-none leading-relaxed"
          />

          {inputText.length > 1800 && (
            <span className="text-[10px] text-muted-foreground font-mono self-center pr-1">
              {inputText.length}/2000
            </span>
          )}

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="h-8 w-8 rounded-xl shrink-0 bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] dark:hover:bg-[#906ef8] shadow-xs"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Trust & Safety Dialogs */}
      {otherUser && (
        <>
          <ReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            reportedUserId={otherUser.id}
            reportedUserName={otherUser.full_name || otherUser.username || "Peer"}
          />
          <BlockDialog
            open={blockOpen}
            onOpenChange={setBlockOpen}
            userId={otherUser.id}
            userName={otherUser.full_name || otherUser.username || "Peer"}
            onSuccess={() => {
              if (onBack) onBack()
            }}
          />
        </>
      )}
    </div>
  )
}
