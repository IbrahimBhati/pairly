"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  className?: string
  id?: string
  "aria-label"?: string
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 5,
  onChange,
  className,
  id,
  "aria-label": ariaLabel = "Match Percentage Slider",
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        style={{
          background: `linear-gradient(to right, #4B3F72 ${percentage}%, var(--muted) ${percentage}%)`,
        }}
      />
    </div>
  )
}
