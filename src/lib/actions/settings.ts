"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { UserSettings, Database } from "@/types/database"

export async function fetchUserSettingsAction(): Promise<{
  success: boolean
  settings: UserSettings | null
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, settings: null, error: "Not authenticated" }
    }

    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) throw error

    if (!settings) {
      // Create defaults if row doesn't exist yet
      const { data: created, error: insertError } = await supabase
        .from("user_settings")
        .insert({
          user_id: user.id,
          theme: "system",
          email_notifications: true,
          notify_new_request: true,
          notify_messages: true,
          notify_reviews: true,
          profile_visibility: "public",
          show_city: true,
          language: "en",
        })
        .select()
        .single()

      if (insertError) throw insertError
      return { success: true, settings: created }
    }

    return { success: true, settings }
  } catch (error: any) {
    console.error("fetchUserSettingsAction error:", error)
    return { success: false, settings: null, error: error.message }
  }
}

export async function updateUserSettingsAction(
  updates: Partial<Omit<UserSettings, "user_id" | "updated_at">>
): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required." }
    }

    const { data: updated, error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/settings")
    return { success: true, settings: updated }
  } catch (error: any) {
    console.error("updateUserSettingsAction error:", error)
    return { success: false, error: error.message || "Failed to update settings." }
  }
}

export async function updateAccountDetailsAction(data: {
  fullName?: string
  username?: string
  email?: string
}): Promise<{ success: boolean; error?: string; emailChangePending?: boolean }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required." }
    }

    const profileUpdates: Database["public"]["Tables"]["profiles"]["Update"] = {}
    if (data.fullName !== undefined) profileUpdates.full_name = data.fullName.trim()
    if (data.username !== undefined) {
      const cleanUsername = data.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
      if (cleanUsername.length < 3) {
        return { success: false, error: "Username must be at least 3 characters long." }
      }
      profileUpdates.username = cleanUsername
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id)

      if (profileError) {
        if (profileError.code === "23505") {
          return { success: false, error: "That username is already taken. Please choose another." }
        }
        throw profileError
      }
    }

    let emailChangePending = false
    if (data.email && data.email.trim().toLowerCase() !== user.email?.toLowerCase()) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: data.email.trim().toLowerCase(),
      })
      if (emailError) throw emailError
      emailChangePending = true
    }

    revalidatePath("/settings")
    revalidatePath(`/u/${user.id}`)
    return { success: true, emailChangePending }
  } catch (error: any) {
    console.error("updateAccountDetailsAction error:", error)
    return { success: false, error: error.message || "Failed to update account details." }
  }
}

export async function updatePasswordAction(data: {
  newPassword: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required." }
    }

    if (!data.newPassword || data.newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." }
    }

    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("updatePasswordAction error:", error)
    return { success: false, error: error.message || "Failed to update password." }
  }
}

export async function deleteAccountAction(data: {
  confirmation: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (data.confirmation !== "DELETE MY ACCOUNT") {
      return { success: false, error: 'Confirmation must exactly match "DELETE MY ACCOUNT".' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required." }
    }

    // Cascade delete: deleting the profile triggers cascade deletion on
    // user_skills, listings, reviews, connection_requests, notifications, user_settings.
    // Also mark suspended as a defensive measure
    await supabase.from("profiles").update({ is_suspended: true }).eq("id", user.id)

    // Delete user profile (cascades on database)
    const { error } = await supabase.from("profiles").delete().eq("id", user.id)
    if (error) throw error

    // Sign out user session
    await supabase.auth.signOut()

    return { success: true }
  } catch (error: any) {
    console.error("deleteAccountAction error:", error)
    return { success: false, error: error.message || "Failed to delete account." }
  }
}
