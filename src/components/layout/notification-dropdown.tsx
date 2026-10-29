"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  fetchNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/actions/notifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Bell,
  Check,
  CheckCheck,
  UserPlus,
  Sparkles,
  MessageSquare,
  Award,
  ArrowRight,
  Info,
} from "lucide-react"
import { formatDistanceToNowStrict } from "date-fns"
import type { Notification } from "@/types/database"

interface NotificationDropdownProps {
  currentUserId?: string | null
}

export function NotificationDropdown({ currentUserId }: NotificationDropdownProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  // Fetch initial notifications
  const loadNotifications = async () => {
    if (!currentUserId) return
    try {
      const res = await fetchNotificationsAction({ limit: 10 })
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    } catch (err) {
      console.error("Failed to load notifications:", err)
    }
  }

  useEffect(() => {
    loadNotifications()

    if (!currentUserId) return

    // Supabase Realtime channel for new notifications
    const channel = supabase
      .channel(`user-notifications:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev.slice(0, 9)])
          setUnreadCount((c) => c + 1)

          // Play live toast!
          toast.info(newNotif.title, {
            description: newNotif.body,
            action: newNotif.link
              ? {
                  label: "View",
                  onClick: () => router.push(newNotif.link!),
                }
              : undefined,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

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

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      markNotificationReadAction(notif.id).catch(() => {})
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    setOpen(false)
    if (notif.link) {
      router.push(notif.link)
    }
  }

  // Type Icon helper
  const getNotificationIcon = (type: string) => {
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl text-foreground hover:bg-accent"
            aria-label="Notifications"
          />
        }
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4B3F72] text-[9px] font-bold text-white px-1 shadow-sm animate-in zoom-in-75 dark:bg-[#A78BFA] dark:text-[#0F0B1A]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl border border-border bg-card p-0 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-border bg-accent/30">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs font-bold text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#4B3F72] text-white dark:bg-[#A78BFA] dark:text-[#0F0B1A] px-1.5 py-0.2 text-[10px] font-bold">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <Bell className="h-6 w-6 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs font-semibold text-foreground">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground">
                We will notify you when peers interact with your requests or listings.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const timeStr = formatDistanceToNowStrict(new Date(notif.created_at), {
                addSuffix: false,
              })

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-accent/60 ${
                    !notif.is_read ? "bg-[#A78BFA]/10" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card border border-border/80">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {timeStr}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.body}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <span className="h-2 w-2 rounded-full bg-[#A78BFA] shrink-0 mt-1" />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border bg-accent/20 text-center">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline py-1"
          >
            <span>View all notifications</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
