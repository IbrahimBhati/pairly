"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import {
  listingFormSchema,
  type ListingFormInput,
} from "@/lib/validators"
import type { ListingStatus } from "@/types/database"

export async function createListingAction(input: ListingFormInput) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Please log in to publish a listing." }
  }

  const parseResult = listingFormSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please complete all required fields properly.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    }
  }

  const data = parseResult.data

  try {
    const supabase = await createClient()

    const { data: inserted, error } = await supabase
      .from("listings")
      .insert({
        owner_id: user.id,
        type: data.type,
        title: data.title.trim(),
        description: data.description.trim(),
        category_id: data.category_id,
        offered_skill_id: data.type === "help_request" ? null : data.offered_skill_id || null,
        wanted_skill_id: data.type === "help_offer" ? null : data.wanted_skill_id || null,
        mode: data.mode,
        city: data.mode === "online" ? null : data.city?.trim() || null,
        availability: data.availability?.trim() || null,
        duration_estimate: data.duration_estimate?.trim() || null,
        status: "active" as ListingStatus,
        view_count: 0,
      })
      .select("id")
      .single()

    if (error) {
      console.error("createListing error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/listings")
    revalidatePath("/my-listings")
    revalidatePath("/dashboard")
    revalidatePath("/explore")

    return { success: true, listingId: inserted.id }
  } catch (err: unknown) {
    console.error("createListing exception:", err)
    return { success: false, error: "An unexpected error occurred while creating listing." }
  }
}

export async function updateListingAction(listingId: string, input: ListingFormInput) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Authentication required." }
  }

  const parseResult = listingFormSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please complete all required fields properly.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    }
  }

  const data = parseResult.data

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("listings")
      .update({
        type: data.type,
        title: data.title.trim(),
        description: data.description.trim(),
        category_id: data.category_id,
        offered_skill_id: data.type === "help_request" ? null : data.offered_skill_id || null,
        wanted_skill_id: data.type === "help_offer" ? null : data.wanted_skill_id || null,
        mode: data.mode,
        city: data.mode === "online" ? null : data.city?.trim() || null,
        availability: data.availability?.trim() || null,
        duration_estimate: data.duration_estimate?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("owner_id", user.id)

    if (error) {
      console.error("updateListing error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/listings/${listingId}`)
    revalidatePath("/listings")
    revalidatePath("/my-listings")
    revalidatePath("/dashboard")

    return { success: true, listingId }
  } catch (err: unknown) {
    console.error("updateListing exception:", err)
    return { success: false, error: "Failed to update listing." }
  }
}

export async function toggleListingStatusAction(listingId: string, status: ListingStatus) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Authentication required." }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("listings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("owner_id", user.id)

    if (error) {
      console.error("toggleListingStatus error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/listings/${listingId}`)
    revalidatePath("/listings")
    revalidatePath("/my-listings")
    revalidatePath("/dashboard")

    return { success: true, status }
  } catch (err: unknown) {
    console.error("toggleListingStatus exception:", err)
    return { success: false, error: "Failed to update status." }
  }
}

export async function deleteListingAction(listingId: string) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Authentication required." }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId)
      .eq("owner_id", user.id)

    if (error) {
      console.error("deleteListing error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/listings")
    revalidatePath("/my-listings")
    revalidatePath("/dashboard")
    revalidatePath("/explore")

    return { success: true }
  } catch (err: unknown) {
    console.error("deleteListing exception:", err)
    return { success: false, error: "Failed to delete listing." }
  }
}

export async function toggleSaveListingAction(listingId: string) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Please sign in to save listings." }
  }

  try {
    const supabase = await createClient()

    // Check if already saved
    const { data: existing } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId)

      revalidatePath("/saved")
      revalidatePath(`/listings/${listingId}`)
      return { success: true, isSaved: false }
    } else {
      await supabase
        .from("saved_listings")
        .insert({ user_id: user.id, listing_id: listingId })

      revalidatePath("/saved")
      revalidatePath(`/listings/${listingId}`)
      return { success: true, isSaved: true }
    }
  } catch (err: unknown) {
    console.error("toggleSaveListing exception:", err)
    return { success: false, error: "Failed to bookmark listing." }
  }
}

export async function recordListingViewAction(listingId: string) {
  try {
    const supabase = await createClient()
    // Call the safe SECURITY DEFINER RPC function
    await supabase.rpc("increment_listing_view_count", {
      target_listing_id: listingId,
    })
  } catch (err) {
    // Suppress non-critical view count errors
    console.warn("recordListingViewAction suppressed error:", err)
  }
}
