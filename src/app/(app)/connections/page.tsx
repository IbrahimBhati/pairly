import React, { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchUserConnectionsAction } from "@/lib/actions/connections"
import { ConnectionsView } from "./connections-view"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

interface ConnectionsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ConnectionsPage({ searchParams }: ConnectionsPageProps) {
  const { user } = await getCurrentUser()
  if (!user) {
    redirect("/login?redirectTo=/connections")
  }

  const { tab } = await searchParams
  const safeTab = (tab as any) || "received"

  const { connections, counts } = await fetchUserConnectionsAction({
    tab: safeTab,
  })

  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <ConnectionsView
        initialTab={safeTab}
        initialConnections={connections}
        counts={counts}
        currentUserId={user.id}
      />
    </Suspense>
  )
}
