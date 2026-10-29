import React, { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth"
import { getCategoriesWithSkills } from "@/lib/data/categories"
import {
  fetchExploreListingsAction,
  fetchExplorePeopleAction,
} from "@/lib/actions/explore"
import { ExploreView } from "./explore-view"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

function ExploreLoadingFallback() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <Skeleton className="h-13 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Skeleton className="hidden lg:block lg:col-span-3 h-96 rounded-2xl" />
        <div className="lg:col-span-9 space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ExplorePage() {
  const { user } = await getCurrentUser()
  const categories = await getCategoriesWithSkills()

  // Initial SSR fetches for fast initial page render
  const [initialListingsRes, initialPeopleRes, recommendedRes] = await Promise.all([
    fetchExploreListingsAction({ limit: 12, sort: "best_match" }),
    fetchExplorePeopleAction({ limit: 12 }),
    fetchExplorePeopleAction({ limit: 6, minMatch: 50 }),
  ])

  return (
    <div className="py-2 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Explore Peer Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Discover bilateral exchange proposals, peer offerings, and learn directly from verified scholars.
        </p>
      </div>

      <Suspense fallback={<ExploreLoadingFallback />}>
        <ExploreView
          categories={categories}
          recommendedPeers={recommendedRes.people}
          initialListings={initialListingsRes.listings}
          initialPeople={initialPeopleRes.people}
          currentUserId={user?.id}
        />
      </Suspense>
    </div>
  )
}
