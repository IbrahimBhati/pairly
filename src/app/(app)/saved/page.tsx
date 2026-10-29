import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ListingCard } from "@/components/shared/listing-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Heart, Compass } from "lucide-react"
import type { ListingWithDetails } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function SavedListingsPage() {
  const { user } = await getCurrentUser()
  if (!user) {
    redirect("/login?next=/saved")
  }

  let savedListings: ListingWithDetails[] = []

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("saved_listings")
      .select(`
        listing:listings(
          *,
          category:categories(*),
          offered_skill:skills!listings_offered_skill_id_fkey(*),
          wanted_skill:skills!listings_wanted_skill_id_fkey(*),
          owner:profiles!listings_owner_id_fkey(*)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      savedListings = data
        .map((item) => {
          const l = item.listing as unknown as ListingWithDetails
          if (!l) return null
          return { ...l, is_saved: true }
        })
        .filter(Boolean) as ListingWithDetails[]
    } else if (error) {
      // Relaxed query
      const { data: relaxedData } = await supabase
        .from("saved_listings")
        .select(`
          listing:listings(
            *,
            category:categories(*),
            offered_skill:skills!offered_skill_id(*),
            wanted_skill:skills!wanted_skill_id(*),
            owner:profiles!owner_id(*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (relaxedData) {
        savedListings = relaxedData
          .map((item) => {
            const l = item.listing as unknown as ListingWithDetails
            if (!l) return null
            return { ...l, is_saved: true }
          })
          .filter(Boolean) as ListingWithDetails[]
      }
    }
  } catch (err) {
    console.error("Error fetching saved listings:", err)
  }

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Saved Listings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Review exchange offers and requests you have bookmarked for later.
        </p>
      </div>

      {savedListings.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved listings yet"
          description="Explore skills and exchange proposals across the community and bookmark ones you'd love to connect with."
          action={
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-primary text-primary-foreground min-h-[40px] px-5 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Explore Marketplace
            </Link>
          }
          className="my-10"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isOwner={listing.owner_id === user.id}
              currentUserId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
