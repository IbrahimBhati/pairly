import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import type { Profile } from "@/types/database"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  profile?: Partial<Profile> | null
  name?: string
  avatarUrl?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  showVerified?: boolean
  className?: string
}

export function UserAvatar({
  profile,
  name,
  avatarUrl,
  size = "md",
  showVerified = false,
  className,
}: UserAvatarProps) {
  const resolvedName = name || profile?.full_name || profile?.username || "Scholar"
  const resolvedAvatar = avatarUrl || profile?.avatar_url || ""
  const isVerified = showVerified && !!profile?.is_verified

  const initials = resolvedName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
    "2xl": "h-28 w-28 text-2xl",
  }

  const badgePosition = {
    xs: "-bottom-0.5 -right-0.5 scale-75",
    sm: "-bottom-0.5 -right-0.5 scale-90",
    md: "-bottom-0.5 -right-0.5",
    lg: "bottom-0 right-0 scale-110",
    xl: "bottom-1 right-1 scale-125",
    "2xl": "bottom-1.5 right-1.5 scale-150",
  }

  return (
    <div className={cn("relative inline-block shrink-0 select-none", className)}>
      <Avatar className={cn("ring-2 ring-border/80 shadow-xs", sizeClasses[size])}>
        <AvatarImage src={resolvedAvatar} alt={resolvedName} className="object-cover" />
        <AvatarFallback className="bg-[#4B3F72] text-white font-bold font-heading">
          {initials || "P"}
        </AvatarFallback>
      </Avatar>

      {isVerified && (
        <div className={cn("absolute", badgePosition[size])}>
          <VerifiedBadge size={size === "xs" || size === "sm" ? "sm" : "md"} />
        </div>
      )}
    </div>
  )
}
