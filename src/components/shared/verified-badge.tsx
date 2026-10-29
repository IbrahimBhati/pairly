import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  className?: string
  size?: "sm" | "md" | "lg"
  tooltip?: boolean
}

export function VerifiedBadge({ className, size = "md" }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5 text-[8px]",
    md: "h-4 w-4 text-[10px]",
    lg: "h-5 w-5 text-xs",
  }

  const iconSizes = {
    sm: "h-2 w-2 stroke-[3]",
    md: "h-2.5 w-2.5 stroke-[3]",
    lg: "h-3 w-3 stroke-[3]",
  }

  return (
    <span
      title="Verified Pairly Scholar"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[#A7F3D0] text-[#064E3B] shadow-xs select-none",
        sizeClasses[size],
        className
      )}
    >
      <Check className={iconSizes[size]} />
      <span className="sr-only">Verified Member</span>
    </span>
  )
}
