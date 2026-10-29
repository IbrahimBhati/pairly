import React from "react"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProfileView } from "@/components/shared/profile-view"
import type {
  Profile,
  ListingWithDetails,
  UserSkillWithDetails,
} from "@/types/database"

export const dynamic = "force-dynamic"

interface PublicProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params
  const decodedUsername = decodeURIComponent(username)

  const { user } = await getCurrentUser()
  const supabase = await createClient()

  // 1. Fetch Profile by username or id
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", decodedUsername)
    .maybeSingle()

  let profile: Profile | null = profileData

  if (!profile && decodedUsername.length === 36) {
    // Attempt query by UUID id
    const { data: idData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", decodedUsername)
      .maybeSingle()
    profile = idData
  }

  if (!profile) {
    notFound()
  }

  const isOwner = user?.id === profile.id

  // 2. Fetch User Skills
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
      .eq("user_id", profile.id)

    if (!skillsError && skillsData) {
      const allSkills = skillsData as unknown as UserSkillWithDetails[]
      offeredSkills = allSkills.filter((s) => s.direction === "offered")
      wantedSkills = allSkills.filter((s) => s.direction === "wanted")
    }
  } catch (err) {
    console.error("Error fetching public profile skills:", err)
  }

  // 3. Fetch Active Listings
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
      .eq("owner_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (!listingsError && listingsData) {
      listings = listingsData as unknown as ListingWithDetails[]
    } else {
      const { data: relaxedData } = await supabase
        .from("listings")
        .select(`
          *,
          category:categories(*),
          offered_skill:skills!offered_skill_id(*),
          wanted_skill:skills!wanted_skill_id(*),
          owner:profiles!owner_id(*)
        `)
        .eq("owner_id", profile.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (relaxedData) {
        listings = relaxedData as unknown as ListingWithDetails[]
      }
    }
  } catch (err) {
    console.error("Error fetching public profile listings:", err)
  }

  // 4. Calculate Bilateral Match Score if viewing another profile as authenticated user
  let matchScore: number | undefined
  let matchedYouWant: string[] = []
  let matchedTheyWant: string[] = []

  if (user && !isOwner) {
    try {
      const { data: rpcScore, error: rpcErr } = await supabase.rpc("calculate_match_score", {
        user_a: user.id,
        user_b: profile.id,
      })

      if (!rpcErr && rpcScore && rpcScore.length > 0) {
        matchScore = rpcScore[0].score
        matchedYouWant = rpcScore[0].matched_you_want || []
        matchedTheyWant = rpcScore[0].matched_they_want || []
      }
    } catch {
      // Ignore RPC fallback
    }

    // TypeScript fallback if RPC wasn't available
    if (matchScore === undefined) {
      try {
        const { calculateMatchScore } = await import("@/lib/matching")
        const { data: myProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        const { data: mySkills } = await supabase.from("user_skills").select("*, skill:skills(*)").eq("user_id", user.id)

        if (myProfile && mySkills) {
          const userA = {
            id: user.id,
            userType: myProfile.user_type,
            city: myProfile.city,
            country: myProfile.country,
            isVerified: myProfile.is_verified,
            bio: myProfile.bio,
            avatarUrl: myProfile.avatar_url,
            skills: mySkills.map((s: any) => ({
              skillId: s.skill_id,
              skillName: s.skill?.name || `Skill ${s.skill_id}`,
              categoryId: s.skill?.category_id || 1,
              direction: s.direction,
            })),
          }
          const userB = {
            id: profile.id,
            userType: profile.user_type,
            city: profile.city,
            country: profile.country,
            isVerified: profile.is_verified,
            bio: profile.bio,
            avatarUrl: profile.avatar_url,
            skills: [...offeredSkills, ...wantedSkills].map((s) => ({
              skillId: s.skill_id,
              skillName: s.skill?.name || `Skill ${s.skill_id}`,
              categoryId: s.skill?.category_id || 1,
              direction: s.direction,
            })),
          }
          const res = calculateMatchScore(userA, userB)
          matchScore = res.score
          matchedYouWant = res.matchedYouWant
          matchedTheyWant = res.matchedTheyWant
        }
      } catch (err) {
        console.warn("Could not calculate match score fallback:", err)
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <ProfileView
          profile={profile}
          offeredSkills={offeredSkills}
          wantedSkills={wantedSkills}
          listings={listings}
          isOwner={isOwner}
          currentUserId={user?.id}
          matchScore={matchScore}
          matchedYouWant={matchedYouWant}
          matchedTheyWant={matchedTheyWant}
        />
      </main>
      <Footer />
    </div>
  )
}
