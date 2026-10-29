"use client";

import * as React from "react";
import {
  Sparkles,
  Repeat,
  Layers,
  Users,
  Star,
  Zap,
  CheckCircle2,
  Award,
  HeartHandshake,
  Shield,
  Clock,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeTileProps {
  name: string;
  description?: string;
  iconName?: string;
  tier: "bronze" | "silver" | "gold";
  earned?: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Repeat,
  Layers,
  Users,
  Star,
  Zap,
  CheckCircle2,
  Award,
  HeartHandshake,
  Shield,
  Clock,
};

export function BadgeTile({
  name,
  description,
  iconName = "Award",
  tier = "bronze",
  earned = true,
  earnedAt,
  size = "md",
  className,
}: BadgeTileProps) {
  const IconComponent = ICON_MAP[iconName] || Award;

  const tierStyles = {
    bronze: earned
      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60 ring-amber-400/30"
      : "bg-muted/40 text-muted-foreground/40 border-border/40 grayscale",
    silver: earned
      ? "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-600 ring-slate-400/30"
      : "bg-muted/40 text-muted-foreground/40 border-border/40 grayscale",
    gold: earned
      ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-200 dark:border-yellow-600 ring-yellow-400/40"
      : "bg-muted/40 text-muted-foreground/40 border-border/40 grayscale",
  };

  const sizeClasses = {
    sm: "w-8 h-8 rounded-xl p-1.5",
    md: "w-11 h-11 rounded-2xl p-2.5",
    lg: "w-14 h-14 rounded-2xl p-3.5",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center border transition-all shadow-xs group",
        tierStyles[tier],
        sizeClasses[size],
        earned && "ring-2 ring-offset-1 ring-offset-background",
        className
      )}
      title={`${name}${description ? ` — ${description}` : ""}`}
    >
      <IconComponent className={cn(iconSizes[size], "transition-transform group-hover:scale-110")} />
    </div>
  );
}
