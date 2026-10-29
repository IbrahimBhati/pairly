"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/validators"
import type { SkillProficiency } from "@/types/database"

export async function updateProfileAction(input: ProfileUpdateInput) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Authentication required to update profile." }
  }

  const parseResult = profileUpdateSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please fix the form errors.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    }
  }

  const data = parseResult.data

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName.trim(),
        user_type: data.userType,
        bio: data.bio?.trim() || null,
        city: data.city?.trim() || null,
        country: data.country?.trim() || null,
        languages: data.languages,
        avatar_url: data.avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("updateProfile error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/profile")
    revalidatePath("/dashboard")
    return { success: true, message: "Profile updated successfully!" }
  } catch (err: unknown) {
    console.error("updateProfile exception:", err)
    return { success: false, error: "An unexpected error occurred while updating profile." }
  }
}

export async function updateUserSkillsAction(payload: {
  offeredSkills: { skillId: number; proficiency: SkillProficiency }[]
  wantedSkills: { skillId: number }[]
}) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Authentication required to manage skills." }
  }

  if (payload.offeredSkills.length === 0) {
    return { success: false, error: "Please offer at least 1 skill." }
  }

  if (payload.wantedSkills.length === 0) {
    return { success: false, error: "Please specify at least 1 wanted skill." }
  }

  try {
    const supabase = await createClient()

    // 1. Remove previous skills
    await supabase.from("user_skills").delete().eq("user_id", user.id)

    // 2. Insert new offered & wanted skills
    const records = [
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

    const { error } = await supabase.from("user_skills").insert(records)

    if (error) {
      console.error("updateUserSkills error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/profile")
    revalidatePath("/dashboard")
    return { success: true, message: "Skill matrix updated successfully!" }
  } catch (err: unknown) {
    console.error("updateUserSkills exception:", err)
    return { success: false, error: "Failed to update skill matrix." }
  }
}
