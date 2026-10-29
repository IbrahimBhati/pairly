import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"
import type { User } from "@supabase/supabase-js"

export interface CurrentUserResult {
  user: User | null
  profile: Profile | null
}

/**
 * Returns the currently authenticated Supabase user along with their Pairly profile.
 * Can be called safely from Server Components, Server Actions, and Route Handlers.
 */
export async function getCurrentUser(): Promise<CurrentUserResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { user: null, profile: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Error fetching user profile:", profileError.message)
      return { user, profile: null }
    }

    return { user, profile: profile as Profile | null }
  } catch (error) {
    console.error("getCurrentUser error:", error)
    return { user: null, profile: null }
  }
}
