"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { signOutAction } from "@/app/(auth)/actions"
import { Bell, Search, Menu, User, Settings, LogOut, Bookmark, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { NotificationDropdown } from "@/components/layout/notification-dropdown"
import type { Profile } from "@/types/database"

interface TopbarProps {
  profile?: Profile | null
  userEmail?: string | null
}

export function Topbar({ profile, userEmail }: TopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const displayName = profile?.full_name || profile?.username || userEmail?.split("@")[0] || "Scholar"
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/85 px-4 sm:px-6 backdrop-blur-md">
      {/* Mobile Menu Trigger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-xl text-foreground"
                aria-label="Open sidebar menu"
              />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-border bg-card">
            <Sidebar onItemClick={() => setMobileOpen(false)} className="border-r-0" />
          </SheetContent>
        </Sheet>

        {/* Non-functional Search Input */}
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search skills, topics, or peers (e.g. Next.js, Spanish)..."
            className="pl-9 h-9 rounded-xl border-border bg-card/60 focus-visible:ring-primary text-xs"
          />
        </div>
      </div>

      {/* Right Controls: Notification, Theme Toggle, User Dropdown */}
      <div className="flex items-center gap-3">
        {/* Real Notification Bell with Dropdown */}
        <NotificationDropdown currentUserId={profile?.id} />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary transition-opacity hover:opacity-90"
              />
            }
          >
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
              <AvatarFallback className="bg-[#4B3F72] text-white text-xs font-bold font-heading">
                {initials || "P"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-foreground leading-tight">{displayName}</span>
              <span className="text-[10px] text-muted-foreground capitalize">
                {profile?.user_type || "Student"}
              </span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl border border-border bg-card p-1.5 shadow-xl"
          >
            <DropdownMenuLabel className="px-2 py-1.5">
              <p className="text-xs font-bold text-foreground">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{userEmail || "@" + profile?.username}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              render={<Link href="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer" />}
            >
              <User className="h-3.5 w-3.5 text-primary" />
              <span>View profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              render={<Link href="/saved" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer" />}
            >
              <Bookmark className="h-3.5 w-3.5 text-rose-500" />
              <span>Saved listings</span>
            </DropdownMenuItem>

            {profile?.role === "admin" && (
              <DropdownMenuItem
                render={<Link href="/admin" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer" />}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              render={<Link href="/settings" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer" />}
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOutAction()}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-destructive cursor-pointer hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5 text-destructive" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
