import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ProfileView } from "@/components/shared/profile-view"
import type {
  ListingWithDetails,
  UserSkillWithDetails,
} from "@/types/database"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    redirect("/login?next=/profile")
  }

  const supabase = await createClient()

  // 1. Fetch User Skills
  let offeredSkills: UserSkillWithDetails[] = []
  let wantedSkills: UserSkillWithDetails[] = []

  try {
    const { data: skillsData, error: skillsError } = await supabase
      .from("user_skills")
      .select(`
        *,
        skill:skills(
          *,
          category:categories(*)
        )
      `)
      .eq("user_id", user.id)

    if (!skillsError && skillsData) {
      const allSkills = skillsData as unknown as UserSkillWithDetails[]
      offeredSkills = allSkills.filter((s) => s.direction === "offered")
      wantedSkills = allSkills.filter((s) => s.direction === "wanted")
    }
  } catch (err) {
    console.error("Error fetching user skills:", err)
  }

  // 2. Fetch User Listings
  let listings: ListingWithDetails[] = []

  try {
    const { data: listingsData, error: listingsError } = await supabase
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

    if (!listingsError && listingsData) {
      listings = listingsData as unknown as ListingWithDetails[]
    } else {
      // Relaxed fallback query
      const { data: relaxedData } = await supabase
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

      if (relaxedData) {
        listings = relaxedData as unknown as ListingWithDetails[]
      }
    }
  } catch (err) {
    console.error("Error fetching profile listings:", err)
  }

  return (
    <div className="py-2">
      <ProfileView
        profile={profile}
        userEmail={user.email}
        offeredSkills={offeredSkills}
        wantedSkills={wantedSkills}
        listings={listings}
        isOwner={true}
        currentUserId={user.id}
      />
    </div>
  )
}
