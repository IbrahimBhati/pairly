"use client"

import React, { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Sparkles, Check, Info, Repeat, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchBadgeProps {
  score: number // 0 - 100
  matchedYouWant?: string[]
  matchedTheyWant?: string[]
  size?: "sm" | "md" | "lg"
  variant?: "ring" | "pill"
  showExplanation?: boolean
  className?: string
}

export function MatchBadge({
  score,
  matchedYouWant = [],
  matchedTheyWant = [],
  size = "md",
  variant = "ring",
  showExplanation = true,
  className,
}: MatchBadgeProps) {
  const [open, setOpen] = useState(false)

  // Color theme tiers
  const isHigh = score >= 75
  const isMedium = score >= 50 && score < 75
  const isLow = score < 50

  const colorStyles = isHigh
    ? {
        ringColor: "#10b981", // Emerald
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
        badgeBorder: "border-emerald-300 dark:border-emerald-800",
        badgeText: "text-[#064E3B] dark:text-[#A7F3D0]",
        label: "High Match",
      }
    : isMedium
    ? {
        ringColor: "#A78BFA", // Lavender
        badgeBg: "bg-[#A78BFA]/15 dark:bg-[#A78BFA]/10",
        badgeBorder: "border-[#A78BFA]/40 dark:border-[#A78BFA]/30",
        badgeText: "text-[#4B3F72] dark:text-[#A78BFA]",
        label: "Good Match",
      }
    : {
        ringColor: "#94a3b8", // Slate
        badgeBg: "bg-muted/60 dark:bg-muted/30",
        badgeBorder: "border-border",
        badgeText: "text-muted-foreground",
        label: "Potential Match",
      }

  // Size configurations
  const sizeConfig = {
    sm: {
      ringSize: 28,
      stroke: 3,
      fontSize: "text-[10px]",
      pillPadding: "px-2 py-0.5 text-[10px]",
      iconSize: "h-2.5 w-2.5",
    },
    md: {
      ringSize: 38,
      stroke: 3.5,
      fontSize: "text-xs",
      pillPadding: "px-2.5 py-1 text-xs",
      iconSize: "h-3 w-3",
    },
    lg: {
      ringSize: 56,
      stroke: 4.5,
      fontSize: "text-sm",
      pillPadding: "px-3 py-1.5 text-sm",
      iconSize: "h-4 w-4",
    },
  }[size]

  // SVG Circle Progress calculation
  const radius = (sizeConfig.ringSize - sizeConfig.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  // Render Ring Visual
  const renderRing = () => (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 rounded-full select-none cursor-pointer group transition-transform active:scale-95",
        className
      )}
      style={{ width: sizeConfig.ringSize, height: sizeConfig.ringSize }}
      aria-label={`${score}% Compatibility Match`}
    >
      <svg
        className="transform -rotate-90"
        width={sizeConfig.ringSize}
        height={sizeConfig.ringSize}
      >
        {/* Track */}
        <circle
          cx={sizeConfig.ringSize / 2}
          cy={sizeConfig.ringSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={sizeConfig.stroke}
          fill="transparent"
          className="text-border/60"
        />
        {/* Progress */}
        <circle
          cx={sizeConfig.ringSize / 2}
          cy={sizeConfig.ringSize / 2}
          r={radius}
          stroke={colorStyles.ringColor}
          strokeWidth={sizeConfig.stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Inner Score Text */}
      <span
        className={cn(
          "absolute font-heading font-extrabold tracking-tight",
          sizeConfig.fontSize,
          colorStyles.badgeText
        )}
      >
        {score}%
      </span>
    </div>
  )

  // Render Pill Visual
  const renderPill = () => (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-heading font-bold select-none cursor-pointer transition-transform active:scale-95 shadow-2xs",
        sizeConfig.pillPadding,
        colorStyles.badgeBg,
        colorStyles.badgeBorder,
        colorStyles.badgeText,
        className
      )}
    >
      <Sparkles className={sizeConfig.iconSize} />
      <span>{score}% Match</span>
    </div>
  )

  const trigger = variant === "ring" ? renderRing() : renderPill()

  if (!showExplanation) {
    return trigger
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<div role="button" tabIndex={0} className="inline-block outline-none" />}>
        {trigger}
      </PopoverTrigger>

      <PopoverContent
        align="center"
        sideOffset={6}
        className="w-72 sm:w-80 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 text-left"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-heading text-xs font-bold text-foreground">
                Why this match? ({score}%)
              </h4>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                colorStyles.badgeBg,
                colorStyles.badgeBorder,
                colorStyles.badgeText
              )}
            >
              {colorStyles.label}
            </span>
          </div>

          {/* Explanation 1: What they offer that you want */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>They offer skills you want:</span>
            </p>
            {matchedYouWant.length > 0 ? (
              <div className="flex flex-wrap gap-1 pl-3.5">
                {matchedYouWant.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-emerald-300/60 bg-emerald-50/80 px-2 py-0.5 text-[10px] font-semibold text-[#064E3B] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-[#A7F3D0]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground pl-3.5 italic">
                No direct skill overlap with your wanted list yet.
              </p>
            )}
          </div>

          {/* Explanation 2: What they want that you offer */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-[#A78BFA] shrink-0" />
              <span>They want skills you offer:</span>
            </p>
            {matchedTheyWant.length > 0 ? (
              <div className="flex flex-wrap gap-1 pl-3.5">
                {matchedTheyWant.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-[#A78BFA]/40 bg-[#A78BFA]/15 px-2 py-0.5 text-[10px] font-semibold text-[#4B3F72] dark:border-[#A78BFA]/30 dark:bg-[#A78BFA]/20 dark:text-[#A78BFA]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground pl-3.5 italic">
                No direct skill overlap with your offered skills yet.
              </p>
            )}
          </div>

          {/* Reciprocal Dynamic Note */}
          <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground leading-relaxed flex items-center gap-1.5">
            <Repeat className="h-3 w-3 text-secondary shrink-0" />
            <span>Harmonic mean computes true two-way reciprocal exchange.</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
