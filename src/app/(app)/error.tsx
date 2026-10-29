"use client"

import React, { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCcw } from "lucide-react"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App boundary error:", error)
  }, [error])

  return (
    <div className="max-w-xl mx-auto py-16">
      <Card className="card-soft border-destructive/20 text-center">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="p-3 rounded-2xl bg-destructive/10 text-destructive mb-1">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold font-heading">
            Failed to load this section
          </CardTitle>
          <CardDescription className="text-xs">
            We ran into a synchronization issue while loading your data. Please retry or refresh.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-2">
          <Button
            onClick={() => reset()}
            size="sm"
            className="rounded-xl text-xs font-semibold gap-2 bg-primary text-primary-foreground min-h-[38px]"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
