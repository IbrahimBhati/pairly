import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  href?: string
}

export function Logo({ className, iconOnly = false, href = "/" }: LogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4B3F72] via-[#635294] to-[#A78BFA] shadow-md shadow-[#4B3F72]/20 transition-transform group-hover:scale-105">
        {/* Two interlocking pill shapes representing peer-to-peer exchange */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-white"
        >
          {/* Left loop / person A */}
          <path
            d="M8.5 7.5C6.567 7.5 5 9.067 5 11C5 12.933 6.567 14.5 8.5 14.5H11.5C12.0523 14.5 12.5 14.9477 12.5 15.5C12.5 16.0523 12.0523 16.5 11.5 16.5H8.5C5.46243 16.5 3 14.0376 3 11C3 7.96243 5.46243 5.5 8.5 5.5H11.5C12.0523 5.5 12.5 5.94772 12.5 6.5C12.5 7.05228 12.0523 7.5 11.5 7.5H8.5Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          {/* Right loop / person B interlocking with mint accent */}
          <path
            d="M15.5 16.5C17.433 16.5 19 14.933 19 13C19 11.067 17.433 9.5 15.5 9.5H12.5C11.9477 9.5 11.5 9.05228 11.5 8.5C11.5 7.94772 11.9477 7.5 12.5 7.5H15.5C18.5376 7.5 21 9.96243 21 13C21 16.0376 18.5376 18.5 15.5 18.5H12.5C11.9477 18.5 11.5 18.0523 11.5 17.5C11.5 16.9477 11.9477 16.5 12.5 16.5H15.5Z"
            fill="#A7F3D0"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">
            Pair<span className="text-[#A78BFA] dark:text-[#A78BFA]">ly</span>
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
        {content}
      </Link>
    )
  }

  return content
}
