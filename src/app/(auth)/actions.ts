"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSiteUrl } from "@/lib/utils"
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type SignupInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validators"

export type ActionResult<T = unknown> =
  | { success: true; data?: T; redirectUrl?: string; message?: string; requiresEmailConfirmation?: boolean }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function signInAction(input: LoginInput): Promise<ActionResult> {
  const parseResult = loginSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: "Invalid login credentials",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    }
  }

  const { email, password } = parseResult.data

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "Failed to authenticate user." }
    }

    // Check if account is suspended
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_suspended, onboarding_completed")
      .eq("id", data.user.id)
      .maybeSingle()

    if (profile?.is_suspended) {
      await supabase.auth.signOut()
      return {
        success: false,
        error: "Your account is currently suspended. Please contact support.",
      }
    }

    if (profile && !profile.onboarding_completed) {
      return { success: true, redirectUrl: "/onboarding" }
    }

    return { success: true, redirectUrl: "/dashboard" }
  } catch (err: unknown) {
    console.error("signInAction error:", err)
    return { success: false, error: "An unexpected error occurred during sign in." }
  }
}

export async function signUpAction(input: SignupInput): Promise<ActionResult> {
  const parseResult = signupSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please fix the validation errors below.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    }
  }

  const { fullName, email, password } = parseResult.data

  try {
    const origin = getSiteUrl()

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // If email confirmation is required and user session is not immediately active
    if (data.user && !data.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        message:
          "Account created! Please check your email inbox to confirm your registration.",
      }
    }

    return {
      success: true,
      requiresEmailConfirmation: false,
      redirectUrl: "/onboarding",
    }
  } catch (err: unknown) {
    console.error("signUpAction error:", err)
    return { success: false, error: "An unexpected error occurred during registration." }
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parseResult = forgotPasswordSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please enter a valid email address.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    }
  }

  try {
    const origin = getSiteUrl()

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(parseResult.data.email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been dispatched.",
    }
  } catch (err: unknown) {
    console.error("forgotPasswordAction error:", err)
    return { success: false, error: "Failed to dispatch password reset link." }
  }
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parseResult = resetPasswordSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please enter a valid password.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
      password: parseResult.data.password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      redirectUrl: "/dashboard",
      message: "Password updated successfully!",
    }
  } catch (err: unknown) {
    console.error("resetPasswordAction error:", err)
    return { success: false, error: "Failed to update password." }
  }
}

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
  if (!username || username.trim().length < 3) {
    return { available: false, error: "Username must be at least 3 characters." }
  }

  const cleanUsername = username.trim().toLowerCase()

  if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
    return { available: false, error: "Only letters, numbers, underscores, and dashes allowed." }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const query = supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", cleanUsername)

    // Exclude current user from conflict check
    if (user) {
      query.neq("id", user.id)
    }

    const { data: existing, error } = await query.maybeSingle()

    if (error) {
      console.error("checkUsernameAvailability error:", error)
      return { available: true }
    }

    return { available: !existing }
  } catch (error) {
    console.error("checkUsernameAvailability error:", error)
    return { available: true }
  }
}
