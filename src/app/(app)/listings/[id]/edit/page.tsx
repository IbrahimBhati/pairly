import React from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getCategoriesWithSkills } from "@/lib/data/categories"
import { ListingForm } from "@/components/shared/listing-form"
import { ArrowLeft } from "lucide-react"
import type { ListingWithDetails } from "@/types/database"

export const dynamic = "force-dynamic"

interface EditListingPageProps {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params
  const { user, profile } = await getCurrentUser()

  if (!user) {
    redirect(`/login?next=/listings/${id}/edit`)
  }

  const supabase = await createClient()

  // Fetch listing and verify ownership
  const { data: listingData, error } = await supabase
    .from("listings")
    .select(`
      *,
      category:categories(*),
      offered_skill:skills!listings_offered_skill_id_fkey(*),
      wanted_skill:skills!listings_wanted_skill_id_fkey(*),
      owner:profiles!listings_owner_id_fkey(*)
    `)
    .eq("id", id)
    .single()

  let listing: ListingWithDetails | null = listingData as unknown as ListingWithDetails

  if (error || !listing) {
    // Attempt relaxed fallback query
    const { data: fallbackData } = await supabase
      .from("listings")
      .select(`
        *,
        category:categories(*),
        offered_skill:skills!offered_skill_id(*),
        wanted_skill:skills!wanted_skill_id(*),
        owner:profiles!owner_id(*)
      `)
      .eq("id", id)
      .single()

    listing = fallbackData as unknown as ListingWithDetails
  }

  if (!listing) {
    notFound()
  }

  // Check ownership
  if (listing.owner_id !== user.id) {
    redirect("/listings")
  }

  const categories = await getCategoriesWithSkills()

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Back link & Header */}
      <div className="space-y-1">
        <Link
          href={`/listings/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Listing Details</span>
        </Link>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Edit Listing
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Update the parameters, scope, or bilateral requirements for this exchange.
        </p>
      </div>

      <ListingForm
        categories={categories}
        initialListing={listing}
        currentUserProfile={profile}
        isEdit={true}
      />
    </div>
  )
}
