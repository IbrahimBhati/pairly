"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewStarsProps {
  value: number; // 0 to 5
  onChange?: (val: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg" | "xl";
  readOnly?: boolean;
  showValueText?: boolean;
  className?: string;
}

export function ReviewStars({
  value,
  onChange,
  max = 5,
  size = "md",
  readOnly = false,
  showValueText = false,
  className,
}: ReviewStarsProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const activeValue = hoverValue !== null ? hoverValue : value;

  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-9 h-9",
  };

  const handleMouseEnter = (index: number) => {
    if (!readOnly && onChange) {
      setHoverValue(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly && onChange) {
      setHoverValue(null);
    }
  };

  const handleClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
        {Array.from({ length: max }).map((_, i) => {
          const starIndex = i + 1;
          const isFilled = activeValue >= starIndex;
          const isPartial = !isFilled && activeValue > i && activeValue < starIndex;

          return (
            <button
              key={i}
              type="button"
              disabled={readOnly}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              className={cn(
                "relative transition-all duration-150 focus:outline-none",
                readOnly
                  ? "cursor-default"
                  : "cursor-pointer hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              )}
              aria-label={`Rate ${starIndex} out of ${max}`}
            >
              {/* Background empty star */}
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-muted-foreground/30 transition-colors",
                  isFilled
                    ? "fill-primary text-primary"
                    : "fill-transparent text-muted-foreground/30"
                )}
              />

              {/* Partial star fill if fractional and readOnly */}
              {isPartial && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(activeValue - i) * 100}%` }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "fill-primary text-primary"
                    )}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {showValueText && (
        <span
          className={cn(
            "font-semibold text-foreground tracking-tight ml-1",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
          )}
        >
          {value > 0 ? value.toFixed(1) : "New"}
        </span>
      )}
    </div>
  );
}
