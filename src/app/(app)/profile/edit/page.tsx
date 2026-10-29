import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getCategoriesWithSkills } from "@/lib/data/categories"
import { ProfileEditForm } from "./profile-edit-form"
import { ArrowLeft } from "lucide-react"
import type { UserSkillWithDetails } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function ProfileEditPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    redirect("/login?next=/profile/edit")
  }

  const supabase = await createClient()

  // 1. Fetch current skills
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
    console.error("Error fetching skills for edit:", err)
  }

  // 2. Fetch categories with all skills
  const categories = await getCategoriesWithSkills()

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Header & Back link */}
      <div className="space-y-1">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Profile</span>
        </Link>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Edit Profile & Skills Matrix
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Update your public profile information, bio, and manage your bilateral skills matrix.
        </p>
      </div>

      <ProfileEditForm
        profile={profile}
        initialOfferedSkills={offeredSkills}
        initialWantedSkills={wantedSkills}
        categories={categories}
      />
    </div>
  )
}
