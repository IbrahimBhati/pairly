"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import {
  calculateMatchScore,
  calculateListingMatchScore,
  type UserMatchProfile,
  type SkillItem,
} from "@/lib/matching"
import type {
  ListingWithDetails,
  ListingType,
  ListingMode,
  ListingStatus,
  UserType,
} from "@/types/database"
import type { PersonMatchItem } from "@/components/shared/person-card"

export interface ExploreListingItem extends ListingWithDetails {
  match_score: number
  matched_you_want: string[]
  matched_they_want: string[]
}

export interface ExploreFilters {
  search?: string
  categoryId?: number
  type?: ListingType
  mode?: ListingMode
  city?: string
  minMatch?: number
  sort?: "best_match" | "newest" | "most_viewed"
  limit?: number
  offset?: number
}

export async function fetchExploreListingsAction(filters: ExploreFilters = {}): Promise<{
  listings: ExploreListingItem[]
  total: number
  hasMore: boolean
}> {
  const { user } = await getCurrentUser()
  const limit = filters.limit || 12
  const offset = filters.offset || 0
  const supabase = await createClient()

  // 1. Try calling the high-performance PostgreSQL RPC
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("explore_listings", {
      p_user: user?.id || null,
      p_search: filters.search?.trim() || null,
      p_category: filters.categoryId || null,
      p_type: filters.type || null,
      p_mode: filters.mode || null,
      p_city: filters.city?.trim() || null,
      p_min_match: filters.minMatch || 0,
      p_sort: filters.sort || "best_match",
      p_limit: limit,
      p_offset: offset,
    })

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
      const items: ExploreListingItem[] = rpcData.map((row: any) => ({
        id: row.id,
        owner_id: row.owner_id,
        type: row.type,
        title: row.title,
        description: row.description,
        category_id: row.category_id,
        offered_skill_id: row.offered_skill_id,
        wanted_skill_id: row.wanted_skill_id,
        mode: row.mode,
        city: row.city,
        availability: row.availability,
        duration_estimate: row.duration_estimate,
        status: row.status,
        view_count: row.view_count || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        owner: {
          id: row.owner_id,
          username: row.owner_username,
          full_name: row.owner_full_name,
          avatar_url: row.owner_avatar_url,
          user_type: row.owner_user_type,
          is_verified: row.owner_is_verified ?? false,
          is_suspended: false,
          bio: null,
          role: "user" as const,
          city: row.city,
          country: null,
          timezone: null,
          languages: [],
          onboarding_completed: true,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        category: row.category_id
          ? {
              id: row.category_id,
              name: row.category_name || "Category",
              slug: row.category_slug || "",
              icon: row.category_icon || "BookOpen",
              description: null,
              created_at: row.created_at,
            }
          : null,
        offered_skill: row.offered_skill_id
          ? {
              id: row.offered_skill_id,
              name: row.offered_skill_name || "",
              category_id: row.category_id || 1,
              created_at: row.created_at,
            }
          : null,
        wanted_skill: row.wanted_skill_id
          ? {
              id: row.wanted_skill_id,
              name: row.wanted_skill_name || "",
              category_id: row.category_id || 1,
              created_at: row.created_at,
            }
          : null,
        match_score: row.match_score || 0,
        matched_you_want: row.matched_you_want || [],
        matched_they_want: row.matched_they_want || [],
      }))

      return {
        listings: items,
        total: items.length,
        hasMore: items.length === limit,
      }
    }
  } catch (rpcErr) {
    console.warn("RPC explore_listings unavailable or failed, utilizing TypeScript algorithm fallback:", rpcErr)
  }

  // 2. TypeScript Resilient Fallback Engine
  try {
    let query = supabase
      .from("listings")
      .select(`
        *,
        category:categories(*),
        offered_skill:skills!listings_offered_skill_id_fkey(*),
        wanted_skill:skills!listings_wanted_skill_id_fkey(*),
        owner:profiles!listings_owner_id_fkey(*)
      `)
      .eq("status", "active")

    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId)
    }
    if (filters.type) {
      query = query.eq("type", filters.type)
    }
    if (filters.mode) {
      query = query.or(`mode.eq.${filters.mode},mode.eq.both`)
    }
    if (filters.city) {
      query = query.ilike("city", `%${filters.city.trim()}%`)
    }

    const { data: rawListings } = await query

    if (!rawListings || rawListings.length === 0) {
      return { listings: [], total: 0, hasMore: false }
    }

    // Load active user's skills profile if logged in
    let userAProfile: UserMatchProfile | null = null
    if (user) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      const { data: userSkills } = await supabase
        .from("user_skills")
        .select("*, skill:skills(*)")
        .eq("user_id", user.id)

      if (userProfile && userSkills) {
        userAProfile = {
          id: userProfile.id,
          userType: userProfile.user_type,
          city: userProfile.city,
          country: userProfile.country,
          isVerified: userProfile.is_verified,
          bio: userProfile.bio,
          avatarUrl: userProfile.avatar_url,
          skills: userSkills.map((s: any) => ({
            skillId: s.skill_id,
            skillName: s.skill?.name || `Skill ${s.skill_id}`,
            categoryId: s.skill?.category_id || 1,
            direction: s.direction,
          })),
        }
      }
    }

    // Cache unique owner skills for fast scoring
    const ownerIds = Array.from(new Set(rawListings.map((l: any) => l.owner_id)))
    const { data: allOwnerSkills } = await supabase
      .from("user_skills")
      .select("*, skill:skills(*)")
      .in("user_id", ownerIds)

    const ownerSkillsMap = new Map<string, SkillItem[]>()
    if (allOwnerSkills) {
      allOwnerSkills.forEach((s: any) => {
        const list = ownerSkillsMap.get(s.user_id) || []
        list.push({
          skillId: s.skill_id,
          skillName: s.skill?.name || `Skill ${s.skill_id}`,
          categoryId: s.skill?.category_id || 1,
          direction: s.direction,
        })
        ownerSkillsMap.set(s.user_id, list)
      })
    }

    // Filter by text search if provided
    let filtered = rawListings as unknown as ListingWithDetails[]
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase()
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(term) ||
          l.description.toLowerCase().includes(term) ||
          l.offered_skill?.name.toLowerCase().includes(term) ||
          l.wanted_skill?.name.toLowerCase().includes(term)
      )
    }

    // Score listings
    const scoredListings: ExploreListingItem[] = filtered.map((listing) => {
      if (!userAProfile || listing.owner_id === userAProfile.id) {
        return {
          ...listing,
          match_score: 0,
          matched_you_want: [],
          matched_they_want: [],
        }
      }

      const ownerSkills = ownerSkillsMap.get(listing.owner_id) || []
      const ownerProfile: UserMatchProfile = {
        id: listing.owner.id,
        userType: listing.owner.user_type,
        city: listing.owner.city,
        country: listing.owner.country,
        isVerified: listing.owner.is_verified,
        bio: listing.owner.bio,
        avatarUrl: listing.owner.avatar_url,
        skills: ownerSkills,
      }

      const matchRes = calculateListingMatchScore(
        userAProfile,
        ownerProfile,
        listing.offered_skill_id,
        listing.wanted_skill_id,
        listing.mode === "online" || listing.mode === "both"
      )

      return {
        ...listing,
        match_score: matchRes.score,
        matched_you_want: matchRes.matchedYouWant,
        matched_they_want: matchRes.matchedTheyWant,
      }
    })

    // Filter by minimum match
    let finalItems = scoredListings
    if (filters.minMatch && filters.minMatch > 0) {
      finalItems = finalItems.filter((l) => l.match_score >= (filters.minMatch || 0))
    }

    // Sort
    if (filters.sort === "most_viewed") {
      finalItems.sort((a, b) => b.view_count - a.view_count)
    } else if (filters.sort === "newest") {
      finalItems.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else {
      // Best match default
      finalItems.sort((a, b) => b.match_score - a.match_score)
    }

    const paginated = finalItems.slice(offset, offset + limit)
    return {
      listings: paginated,
      total: finalItems.length,
      hasMore: offset + limit < finalItems.length,
    }
  } catch (err) {
    console.error("Error in fetchExploreListingsAction fallback:", err)
    return { listings: [], total: 0, hasMore: false }
  }
}

export async function fetchExplorePeopleAction(filters: {
  search?: string
  minMatch?: number
  limit?: number
  offset?: number
} = {}): Promise<{
  people: PersonMatchItem[]
  total: number
  hasMore: boolean
}> {
  const { user } = await getCurrentUser()
  const limit = filters.limit || 12
  const offset = filters.offset || 0
  const supabase = await createClient()

  // 1. Try PostgreSQL RPC
  if (user) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_matches_for_user",
        {
          p_user: user.id,
          p_limit: limit,
          p_offset: offset,
        }
      )

      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        let items: PersonMatchItem[] = rpcData.map((row: any) => ({
          user_id: row.matched_user_id || row.user_id,
          username: row.username,
          full_name: row.full_name,
          avatar_url: row.avatar_url,
          user_type: row.user_type,
          is_verified: row.is_verified ?? false,
          city: row.city,
          country: row.country,
          bio: row.bio,
          score: row.score || 0,
          matched_you_want: row.matched_you_want || [],
          matched_they_want: row.matched_they_want || [],
          top_offered_skills: row.top_offered_skills || [],
          top_wanted_skills: row.top_wanted_skills || [],
        }))

        // Search filter
        if (filters.search && filters.search.trim()) {
          const term = filters.search.trim().toLowerCase()
          items = items.filter(
            (p) =>
              p.full_name.toLowerCase().includes(term) ||
              p.username.toLowerCase().includes(term) ||
              p.top_offered_skills.some((s) => s.toLowerCase().includes(term)) ||
              p.top_wanted_skills.some((s) => s.toLowerCase().includes(term))
          )
        }

        if (filters.minMatch && filters.minMatch > 0) {
          items = items.filter((p) => p.score >= (filters.minMatch || 0))
        }

        return {
          people: items,
          total: items.length,
          hasMore: items.length === limit,
        }
      }
    } catch (rpcErr) {
      console.warn("RPC get_matches_for_user failed, falling back to TypeScript engine:", rpcErr)
    }
  }

  // 2. Fallback TypeScript Engine
  try {
    let profilesQuery = supabase.from("profiles").select("*")
    if (user) {
      profilesQuery = profilesQuery.neq("id", user.id)
    }
    const { data: allProfiles } = await profilesQuery

    if (!allProfiles || allProfiles.length === 0) {
      return { people: [], total: 0, hasMore: false }
    }

    // Active User profile
    let userAProfile: UserMatchProfile | null = null
    if (user) {
      const activeP = allProfiles.find((p) => p.id === user.id)
      const { data: userSkills } = await supabase
        .from("user_skills")
        .select("*, skill:skills(*)")
        .eq("user_id", user.id)

      if (userSkills) {
        userAProfile = {
          id: user.id,
          userType: activeP?.user_type || "student",
          city: activeP?.city,
          country: activeP?.country,
          isVerified: activeP?.is_verified,
          bio: activeP?.bio,
          avatarUrl: activeP?.avatar_url,
          skills: userSkills.map((s: any) => ({
            skillId: s.skill_id,
            skillName: s.skill?.name || `Skill ${s.skill_id}`,
            categoryId: s.skill?.category_id || 1,
            direction: s.direction,
          })),
        }
      }
    }

    // Load skills of all candidate profiles
    const candidateIds = allProfiles.map((p) => p.id)
    const { data: candidateSkills } = await supabase
      .from("user_skills")
      .select("*, skill:skills(*)")
      .in("user_id", candidateIds)

    const candidateSkillsMap = new Map<string, SkillItem[]>()
    if (candidateSkills) {
      candidateSkills.forEach((s: any) => {
        const list = candidateSkillsMap.get(s.user_id) || []
        list.push({
          skillId: s.skill_id,
          skillName: s.skill?.name || `Skill ${s.skill_id}`,
          categoryId: s.skill?.category_id || 1,
          direction: s.direction,
        })
        candidateSkillsMap.set(s.user_id, list)
      })
    }

    const items: PersonMatchItem[] = allProfiles.map((p) => {
      const skills = candidateSkillsMap.get(p.id) || []
      const offered = skills.filter((s) => s.direction === "offered").map((s) => s.skillName)
      const wanted = skills.filter((s) => s.direction === "wanted").map((s) => s.skillName)

      let score = 50
      let matchedYouWant: string[] = []
      let matchedTheyWant: string[] = []

      if (userAProfile) {
        const candidateProfile: UserMatchProfile = {
          id: p.id,
          userType: p.user_type,
          city: p.city,
          country: p.country,
          isVerified: p.is_verified,
          bio: p.bio,
          avatarUrl: p.avatar_url,
          skills,
        }
        const matchRes = calculateMatchScore(userAProfile, candidateProfile)
        score = matchRes.score
        matchedYouWant = matchRes.matchedYouWant
        matchedTheyWant = matchRes.matchedTheyWant
      }

      return {
        user_id: p.id,
        username: p.username || "scholar",
        full_name: p.full_name || p.username || "Scholar",
        avatar_url: p.avatar_url,
        user_type: p.user_type,
        is_verified: p.is_verified ?? false,
        city: p.city,
        country: p.country,
        bio: p.bio,
        score,
        matched_you_want: matchedYouWant,
        matched_they_want: matchedTheyWant,
        top_offered_skills: offered.slice(0, 3),
        top_wanted_skills: wanted.slice(0, 3),
      }
    })

    // Filter search
    let filtered = items
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.full_name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.top_offered_skills.some((s) => s.toLowerCase().includes(term)) ||
          p.top_wanted_skills.some((s) => s.toLowerCase().includes(term))
      )
    }

    if (filters.minMatch && filters.minMatch > 0) {
      filtered = filtered.filter((p) => p.score >= (filters.minMatch || 0))
    }

    filtered.sort((a, b) => b.score - a.score)

    return {
      people: filtered.slice(offset, offset + limit),
      total: filtered.length,
      hasMore: offset + limit < filtered.length,
    }
  } catch (err) {
    console.error("Error in fetchExplorePeopleAction fallback:", err)
    return { people: [], total: 0, hasMore: false }
  }
}
