"use server"

import { createClient } from "@/lib/supabase/server"
import type { UserType, SkillProficiency } from "@/types/database"

export interface OnboardingPayload {
  userType: UserType
  username: string
  bio?: string
  avatarUrl?: string
  city?: string
  country?: string
  languages: string[]
  offeredSkills: { skillId: number; proficiency: SkillProficiency }[]
  wantedSkills: { skillId: number }[]
}

export async function completeOnboardingAction(payload: OnboardingPayload) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: "Authentication session expired. Please log in again." }
    }

    if (!payload.username || payload.username.trim().length < 3) {
      return { success: false, error: "A valid username of at least 3 characters is required." }
    }

    if (payload.offeredSkills.length === 0) {
      return { success: false, error: "Please select at least 1 skill you can offer." }
    }

    if (payload.wantedSkills.length === 0) {
      return { success: false, error: "Please select at least 1 skill you wish to learn." }
    }

    const cleanUsername = payload.username.trim().toLowerCase()

    // 1. Update Profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        user_type: payload.userType,
        username: cleanUsername,
        bio: payload.bio?.trim() || null,
        avatar_url: payload.avatarUrl || null,
        city: payload.city?.trim() || null,
        country: payload.country?.trim() || null,
        languages: payload.languages || [],
        onboarding_completed: true,
      })
      .eq("id", user.id)

    if (profileError) {
      console.error("Profile update error during onboarding:", profileError)
      return { success: false, error: `Failed to update profile: ${profileError.message}` }
    }

    // 2. Clear existing user_skills for idempotency
    await supabase.from("user_skills").delete().eq("user_id", user.id)

    // 3. Prepare user_skills inserts
    const skillsToInsert = [
      ...payload.offeredSkills.map((s) => ({
        user_id: user.id,
        skill_id: s.skillId,
        direction: "offered" as const,
        proficiency: s.proficiency,
      })),
      ...payload.wantedSkills.map((s) => ({
        user_id: user.id,
        skill_id: s.skillId,
        direction: "wanted" as const,
        proficiency: null,
      })),
    ]

    const { error: skillsError } = await supabase
      .from("user_skills")
      .insert(skillsToInsert)

    if (skillsError) {
      console.error("Skills insert error during onboarding:", skillsError)
      return { success: false, error: `Failed to save skills: ${skillsError.message}` }
    }

    return { success: true, redirectUrl: "/dashboard" }
  } catch (error: unknown) {
    console.error("completeOnboardingAction error:", error)
    return { success: false, error: "An unexpected error occurred during profile onboarding." }
  }
}
