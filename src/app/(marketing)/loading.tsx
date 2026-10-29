import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function MarketingLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12 animate-in fade-in-50 duration-200">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-12 w-3/4 mx-auto rounded-2xl" />
        <Skeleton className="h-6 w-full rounded-xl" />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  )
}
