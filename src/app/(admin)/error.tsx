"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ShieldAlert, RefreshCcw, Home } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin dashboard runtime error:", error)
  }, [error])

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <Card className="card-soft border-destructive/20 text-center">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="p-3 rounded-2xl bg-destructive/10 text-destructive mb-1">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold font-heading">
            Admin Console Exception
          </CardTitle>
          <CardDescription className="text-xs">
            An error occurred while loading administrative tables or executing elevated queries.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            size="sm"
            className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-2 bg-primary text-primary-foreground min-h-[38px]"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Retry Query</span>
          </Button>

          <Link href="/admin" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-xl text-xs font-semibold min-h-[38px]">
              <span>Overview Home</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
