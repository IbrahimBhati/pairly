import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function AppLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Grid Skeletons */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-80 md:col-span-2 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  )
}
