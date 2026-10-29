import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ListingsView } from "./listings-view"
import type { ListingWithDetails } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function ListingsPage() {
  const { user } = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  let listings: ListingWithDetails[] = []

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        category:categories(*),
        offered_skill:skills!listings_offered_skill_id_fkey(*),
        wanted_skill:skills!listings_wanted_skill_id_fkey(*),
        owner:profiles!listings_owner_id_fkey(*)
      `)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      listings = data as unknown as ListingWithDetails[]
    } else if (error) {
      console.warn("Could not fetch user listings via foreign keys, trying relaxed query:", error.message)
      // Fallback query without explicit foreign key constraint names if needed
      const { data: relaxedData, error: relaxedError } = await supabase
        .from("listings")
        .select(`
          *,
          category:categories(*),
          offered_skill:skills!offered_skill_id(*),
          wanted_skill:skills!wanted_skill_id(*),
          owner:profiles!owner_id(*)
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (!relaxedError && relaxedData) {
        listings = relaxedData as unknown as ListingWithDetails[]
      }
    }
  } catch (err) {
    console.error("Error loading user listings:", err)
  }

  return (
    <div className="max-w-6xl mx-auto py-2">
      <ListingsView initialListings={listings} currentUserId={user.id} />
    </div>
  )
}
