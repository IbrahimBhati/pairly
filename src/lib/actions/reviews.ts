"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { ReviewWithDetails } from "@/types/database"

export interface SubmitReviewInput {
  connectionId: string
  revieweeId?: string
  rating: number
  comment?: string
  skillsRating?: number | null
  communicationRating?: number | null
  punctualityRating?: number | null
}

/**
 * Submit a post-exchange review
 */
export async function submitReviewAction(input: SubmitReviewInput) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { error: "Authentication required to leave a review." }
  }

  if (input.rating < 1 || input.rating > 5) {
    return { error: "Rating must be between 1 and 5 stars." }
  }

  const trimmedComment = input.comment?.trim().slice(0, 500) || null

  const supabase = await createClient()

  // 1. Fetch connection and verify status is 'completed'
  const { data: conn, error: connErr } = await supabase
    .from("connection_requests")
    .select("id, sender_id, receiver_id, status")
    .eq("id", input.connectionId)
    .single()

  if (connErr || !conn) {
    return { error: "Connection exchange record not found." }
  }

  if (conn.status !== "completed") {
    return { error: "Reviews can only be submitted after the exchange is completed." }
  }

  const isSender = conn.sender_id === user.id
  const isReceiver = conn.receiver_id === user.id

  if (!isSender && !isReceiver) {
    return { error: "You are not a participant in this exchange." }
  }

  const revieweeId = isSender ? conn.receiver_id : conn.sender_id

  // 2. Insert Review (unique constraint will catch duplicate reviews)
  const { data: newReview, error: insertErr } = await supabase
    .from("reviews")
    .insert({
      connection_id: conn.id,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating: input.rating,
      comment: trimmedComment,
      skills_rating: input.skillsRating || null,
      communication_rating: input.communicationRating || null,
      punctuality_rating: input.punctualityRating || null,
    })
    .select("id, rating")
    .single()

  if (insertErr) {
    if (insertErr.code === "23505") {
      return { error: "You have already submitted a review for this exchange." }
    }
    console.error("Error submitting review:", insertErr)
    return { error: insertErr.message }
  }

  revalidatePath(`/connections`)
  revalidatePath(`/profile`)
  revalidatePath(`/achievements`)

  return {
    success: true,
    reviewId: newReview.id,
    pointsEarned: 5,
    isFiveStar: input.rating === 5,
  }
}

/**
 * Fetch reviews received by a user with reviewer details and stats breakdown
 */
export async function fetchUserReviewsAction(userId: string): Promise<{
  success: boolean
  reviews: ReviewWithDetails[]
  averageRating: number
  totalCount: number
  totalReviews: number
  distribution: { [stars: number]: number }
}> {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from("reviews")
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(*),
      reviewee:profiles!reviews_reviewee_id_fkey(*),
      connection:connection_requests!reviews_connection_id_fkey(
        *,
        listing:listings(title)
      )
    `)
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false })

  if (error || !rows) {
    return {
      success: false,
      reviews: [],
      averageRating: 0,
      totalCount: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    }
  }

  const distribution: { [stars: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let sum = 0

  rows.forEach((r) => {
    sum += r.rating
    distribution[r.rating] = (distribution[r.rating] || 0) + 1
  })

  const averageRating = rows.length > 0 ? Number((sum / rows.length).toFixed(2)) : 0

  return {
    success: true,
    reviews: rows as unknown as ReviewWithDetails[],
    averageRating,
    totalCount: rows.length,
    totalReviews: rows.length,
    distribution,
  }
}

/**
 * Fetch completed exchanges that the current user has not yet reviewed
 */
export async function fetchPendingReviewsAction() {
  const { user } = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  // 1. Fetch completed connections
  const { data: conns } = await supabase
    .from("connection_requests")
    .select(`
      *,
      sender:profiles!connection_requests_sender_id_fkey(*),
      receiver:profiles!connection_requests_receiver_id_fkey(*),
      listing:listings(*)
    `)
    .eq("status", "completed")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

  if (!conns || conns.length === 0) return []

  // 2. Fetch existing reviews by current user
  const { data: existingReviews } = await supabase
    .from("reviews")
    .select("connection_id")
    .eq("reviewer_id", user.id)

  const reviewedConnIds = new Set((existingReviews || []).map((r) => r.connection_id))

  // Filter completed connections missing a review from me
  const pending = conns.filter((c) => !reviewedConnIds.has(c.id))

  return pending
}
