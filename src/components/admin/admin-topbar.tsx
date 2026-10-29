"use client"

import React from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { ExternalLink, ShieldCheck } from "lucide-react"

interface AdminTopbarProps {
  title?: string
  subtitle?: string
}

export function AdminTopbar({ title = "Administration", subtitle }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 sm:px-8 backdrop-blur-md">
      <div>
        <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>{title}</span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <ShieldCheck className="h-3 w-3" />
            Verified Admin
          </span>
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/explore" target="_blank">
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-9">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden md:inline">View Public App</span>
          </Button>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
