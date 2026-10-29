import React from "react"
import { Badge } from "@/components/ui/badge"
import type { SkillDirection, SkillProficiency } from "@/types/database"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SkillChipProps {
  name: string
  direction?: SkillDirection
  proficiency?: SkillProficiency | null
  onRemove?: () => void
  className?: string
  size?: "sm" | "md"
}

export function SkillChip({
  name,
  direction,
  proficiency,
  onRemove,
  className,
  size = "md",
}: SkillChipProps) {
  const isOffered = direction === "offered"
  const isWanted = direction === "wanted"

  const proficiencyLabels: Record<SkillProficiency, string> = {
    beginner: "Beg",
    intermediate: "Int",
    advanced: "Adv",
    expert: "Exp",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 font-medium transition-all select-none",
        size === "sm" ? "py-0.5 text-[11px]" : "py-1 text-xs",
        isOffered &&
          "border-emerald-300/50 bg-emerald-50 text-[#064E3B] dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-[#A7F3D0]",
        isWanted &&
          "border-[#A78BFA]/30 bg-[#A78BFA]/15 text-[#4B3F72] dark:border-[#A78BFA]/20 dark:bg-[#A78BFA]/10 dark:text-[#A78BFA]",
        !direction && "border-border bg-accent/60 text-foreground",
        className
      )}
    >
      <span className="font-semibold">{name}</span>

      {proficiency && (
        <span
          className={cn(
            "rounded-md px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider",
            isOffered
              ? "bg-[#064E3B]/10 text-[#064E3B] dark:bg-[#A7F3D0]/20 dark:text-[#A7F3D0]"
              : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
          )}
        >
          {proficiencyLabels[proficiency]}
        </span>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label={`Remove ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
