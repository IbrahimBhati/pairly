import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-6 animate-in fade-in-50 duration-200">
      <Skeleton className="h-8 w-40 rounded-xl" />
      <Skeleton className="h-4 w-60 rounded-lg" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}
