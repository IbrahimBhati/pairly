"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { AlertCircle, RefreshCcw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global runtime error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center mb-2">
          <Logo href="/" />
        </div>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Something unexpected occurred
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We encountered an unexpected error while loading this page. Our technical team has been notified.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-2 bg-primary text-primary-foreground min-h-[40px]"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-2 min-h-[40px]">
              <Home className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
