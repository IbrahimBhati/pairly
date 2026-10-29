import React from "react"
import { cn } from "@/lib/utils"
import { Sparkles, LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Sparkles,
  action,
  secondaryAction,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const renderedAction =
    action ||
    (actionLabel ? (
      <Button
        onClick={onAction}
        className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground min-h-[40px] px-5 shadow-xs hover:shadow-md transition-all cursor-pointer"
      >
        {actionLabel}
      </Button>
    ) : null)

  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center transition-colors",
        className
      )}
    >
      {/* Decorative Icon Composition */}
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary dark:bg-[#A78BFA]/15 dark:text-[#A78BFA] shadow-xs">
        <div
          aria-hidden="true"
          className="absolute -inset-2 rounded-full bg-[#A78BFA]/10 blur-md dark:bg-[#A78BFA]/5"
        />
        <Icon className="relative h-8 w-8 stroke-[1.75]" />
      </div>

      <h3 className="font-heading text-lg font-bold text-foreground max-w-sm">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {(renderedAction || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {renderedAction}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
