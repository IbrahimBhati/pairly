"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/shared/logo"
import {
  LayoutDashboard,
  Compass,
  Layers,
  Users,
  MessageSquare,
  User,
  Settings,
  Bookmark,
  Sparkles,
  Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchUnreadCountsAction, type UnreadCounts } from "@/lib/actions/notifications"
import { createClient } from "@/lib/supabase/client"

export const APP_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "My Listings", href: "/listings", icon: Layers },
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "Connections", href: "/connections", icon: Users },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Achievements", href: "/achievements", icon: Trophy },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  onItemClick?: () => void
  className?: string
}

export function Sidebar({ onItemClick, className }: SidebarProps) {
  const pathname = usePathname()
  const [counts, setCounts] = useState<UnreadCounts>({
    unreadNotifications: 0,
    unreadMessages: 0,
    pendingRequests: 0,
  })
  const supabase = createClient()

  const loadCounts = async () => {
    try {
      const res = await fetchUnreadCountsAction()
      setCounts(res)
    } catch {
      // Ignore background failure
    }
  }

  useEffect(() => {
    loadCounts()

    // Listen to changes on connection_requests and messages
    const channel = supabase
      .channel("sidebar-badges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connection_requests" },
        () => loadCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => loadCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card/70 backdrop-blur-md p-4 transition-colors",
        className
      )}
    >
      <div className="px-2 py-4">
        <Logo href="/dashboard" />
      </div>

      <nav className="mt-6 flex-1 space-y-1.5" aria-label="App Sidebar Navigation">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          // Badges for Connections and Messages
          const badgeCount =
            item.href === "/connections"
              ? counts.pendingRequests
              : item.href === "/messages"
              ? counts.unreadMessages
              : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                isActive
                  ? "bg-[#A78BFA]/15 text-[#4B3F72] dark:text-[#A78BFA] shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive
                      ? "text-[#4B3F72] dark:text-[#A78BFA]"
                      : "text-muted-foreground"
                  )}
                />
                <span>{item.label}</span>
              </div>

              {badgeCount > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                    item.href === "/messages"
                      ? "bg-[#4B3F72] text-white dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
                      : "bg-[#A7F3D0] text-[#064E3B]"
                  )}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Matching Pill Status */}
      <div className="rounded-2xl border border-border bg-accent/40 p-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-secondary animate-pulse" />
          <span className="text-xs font-bold font-heading text-foreground">
            Smart Matching
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Reciprocal skill engine continuously finds new exchange partners.
        </p>
      </div>
    </aside>
  )
}
