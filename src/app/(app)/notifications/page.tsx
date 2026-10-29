"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  fetchNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/actions/notifications"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Bell,
  CheckCheck,
  UserPlus,
  Sparkles,
  MessageSquare,
  Award,
  ArrowRight,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { formatDistanceToNowStrict, format } from "date-fns"
import type { Notification } from "@/types/database"

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetchNotificationsAction({
        limit: 100,
        unreadOnly: filter === "unread",
      })
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    } catch {
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filter])

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadAction()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } catch {
      toast.error("Failed to mark notifications as read")
    }
  }

  const handleItemClick = async (notif: Notification) => {
    if (!notif.is_read) {
      markNotificationReadAction(notif.id).catch(() => {})
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    if (notif.link) {
      router.push(notif.link)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "connection_request":
        return <UserPlus className="h-4 w-4 text-[#A78BFA]" />
      case "request_accepted":
        return <Sparkles className="h-4 w-4 text-emerald-500" />
      case "new_message":
        return <MessageSquare className="h-4 w-4 text-sky-500" />
      case "badge_earned":
      case "review_received":
        return <Award className="h-4 w-4 text-amber-500" />
      default:
        return <Info className="h-4 w-4 text-primary" />
    }
  }

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(notifications.length / pageSize))
  const displayed = notifications.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA]">
              <Bell className="h-4 w-4" />
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-[#4B3F72] text-white dark:bg-[#A78BFA] dark:text-[#0F0B1A]">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Stay updated with exchange invitations, accepted partners, and chat alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllRead}
              className="rounded-xl text-xs gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
              <span>Mark all read</span>
            </Button>
          )}

          <div className="flex rounded-xl border border-border p-0.5 bg-card text-xs">
            <button
              onClick={() => {
                setFilter("all")
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === "all"
                  ? "bg-[#4B3F72] text-white dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilter("unread")
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === "unread"
                  ? "bg-[#4B3F72] text-white dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Unread
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="card-soft p-12 text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Loading notifications...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="card-soft p-16 text-center space-y-2">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
          <h3 className="font-heading text-sm font-bold text-foreground">
            No notifications found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {filter === "unread"
              ? "You have caught up with all your notifications!"
              : "When peers interact with your profile or listings, notifications will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayed.map((notif) => {
            const timeAgo = formatDistanceToNowStrict(new Date(notif.created_at), {
              addSuffix: true,
            })
            const formattedDate = format(new Date(notif.created_at), "MMM d, yyyy • h:mm a")

            return (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`card-soft p-4 flex items-start gap-4 transition-all cursor-pointer hover:border-primary/40 ${
                  !notif.is_read ? "border-l-4 border-l-[#A78BFA] bg-[#A78BFA]/5" : ""
                }`}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-heading text-sm font-bold text-foreground">
                      {notif.title}
                    </h4>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {timeAgo}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notif.body}
                  </p>

                  <p className="text-[10px] text-muted-foreground/70">{formattedDate}</p>
                </div>

                {notif.link && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 rounded-xl text-xs gap-1 self-center hidden sm:flex text-primary"
                  >
                    <span>View</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl text-xs gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
