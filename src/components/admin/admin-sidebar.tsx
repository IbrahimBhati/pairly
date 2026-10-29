"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/shared/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  ShieldCheck,
  Star,
  Tags,
  History,
  ArrowLeft,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react"

interface AdminSidebarProps {
  adminProfile: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    role: string
  }
}

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: FileText },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/categories-skills", label: "Categories & Skills", icon: Tags },
  { href: "/admin/audit-log", label: "Audit Log", icon: History },
]

export function AdminSidebar({ adminProfile }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#2F2648] text-white dark:bg-[#13111C] p-4 lg:p-6 border-r border-[#4B3F72]/40 dark:border-border/40">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo href="/admin" />
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold tracking-wide text-amber-300 border border-amber-400/30">
              <ShieldAlert className="h-3 w-3" />
              ADMIN
            </span>
          </div>
          {mobileOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Admin Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#A78BFA] text-white font-semibold shadow-md shadow-[#4B3F72]/50"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-white" : "text-[#A78BFA]"}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer / Exit & Profile */}
      <div className="pt-6 border-t border-white/10 space-y-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit to Member Platform</span>
        </Link>

        <div className="flex items-center gap-3 px-2 pt-1">
          <Avatar className="h-9 w-9 border border-[#A78BFA]/40 ring-2 ring-primary/20">
            <AvatarImage src={adminProfile.avatar_url || ""} />
            <AvatarFallback className="bg-[#4B3F72] text-xs font-bold text-white">
              {adminProfile.full_name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {adminProfile.full_name || "Admin"}
            </p>
            <p className="text-[10px] text-white/60 truncate">
              @{adminProfile.username || "admin"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="lg:hidden flex items-center justify-between bg-[#2F2648] text-white px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Logo href="/admin" />
          <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
            ADMIN
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => setMobileOpen(true)}
          aria-label="Open Admin Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  )
}
