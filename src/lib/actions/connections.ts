"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type {
  ConnectionStatus,
  ConnectionRequestWithDetails,
} from "@/types/database"
import { validateContentSafety } from "@/lib/safety"

export interface SendConnectionRequestInput {
  receiverId: string
  listingId?: string | null
  message?: string
  matchScore?: number | null
}

export interface ConnectionStatusResult {
  status: ConnectionStatus | "none"
  isSender?: boolean
  requestId?: string
  conversationId?: string
  completionRequestedBy?: string | null
}

/**
 * Check connection status between current user and target user
 */
export async function getConnectionStatusAction(params: {
  otherUserId: string
  listingId?: string | null
}): Promise<ConnectionStatusResult> {
  const { user } = await getCurrentUser()
  if (!user || user.id === params.otherUserId) {
    return { status: "none" }
  }

  const supabase = await createClient()

  // 1. Check for any active (accepted) connection first
  const { data: activeConns } = await supabase
    .from("connection_requests")
    .select(`
      id,
      sender_id,
      receiver_id,
      status,
      completion_requested_by,
      conversation:conversations(id)
    `)
    .eq("status", "accepted")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${params.otherUserId}),and(sender_id.eq.${params.otherUserId},receiver_id.eq.${user.id})`
    )
    .limit(1)

  if (activeConns && activeConns.length > 0) {
    const conn = activeConns[0]
    const conv = Array.isArray(conn.conversation) ? conn.conversation[0] : conn.conversation
    return {
      status: "accepted",
      isSender: conn.sender_id === user.id,
      requestId: conn.id,
      conversationId: conv?.id,
      completionRequestedBy: conn.completion_requested_by,
    }
  }

  // 2. Check for pending requests
  let pendingQuery = supabase
    .from("connection_requests")
    .select("id, sender_id, receiver_id, status, completion_requested_by")
    .eq("status", "pending")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${params.otherUserId}),and(sender_id.eq.${params.otherUserId},receiver_id.eq.${user.id})`
    )

  if (params.listingId) {
    pendingQuery = pendingQuery.eq("listing_id", params.listingId)
  }

  const { data: pendingConns } = await pendingQuery.limit(1)

  if (pendingConns && pendingConns.length > 0) {
    const conn = pendingConns[0]
    return {
      status: "pending",
      isSender: conn.sender_id === user.id,
      requestId: conn.id,
      completionRequestedBy: conn.completion_requested_by,
    }
  }

  return { status: "none" }
}

/**
 * Send a new connection request to a peer
 */
export async function sendConnectionRequestAction(input: SendConnectionRequestInput) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { error: "Authentication required to send connection request." }
  }

  if (user.id === input.receiverId) {
    return { error: "You cannot send a connection request to yourself." }
  }

  const supabase = await createClient()

  // Validate receiver is not suspended
  const { data: receiver } = await supabase
    .from("profiles")
    .select("id, is_suspended, full_name, username")
    .eq("id", input.receiverId)
    .single()

  if (!receiver) {
    return { error: "Target peer profile not found." }
  }

  if (receiver.is_suspended) {
    return { error: "Cannot send connection request to a suspended account." }
  }

  // Check if either user has blocked the other
  const { data: blocks } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${input.receiverId}),and(blocker_id.eq.${input.receiverId},blocked_id.eq.${user.id})`)
    .limit(1)

  if (blocks && blocks.length > 0) {
    return { error: "Cannot send connection request to this peer." }
  }

  // Check for existing pending request
  let dupQuery = supabase
    .from("connection_requests")
    .select("id")
    .eq("sender_id", user.id)
    .eq("receiver_id", input.receiverId)
    .eq("status", "pending")

  if (input.listingId) {
    dupQuery = dupQuery.eq("listing_id", input.listingId)
  }

  const { data: existing } = await dupQuery.maybeSingle()

  if (existing) {
    return { error: "You already have a pending connection request with this peer." }
  }

  const trimmedMessage = input.message?.trim().slice(0, 500) || null

  if (trimmedMessage) {
    const safety = validateContentSafety(trimmedMessage, true)
    if (!safety.valid) {
      return { error: safety.warning || "Introductory message contains restricted content." }
    }
  }

  const { data: newRequest, error: insertError } = await supabase
    .from("connection_requests")
    .insert({
      sender_id: user.id,
      receiver_id: input.receiverId,
      listing_id: input.listingId || null,
      message: trimmedMessage,
      match_score: input.matchScore != null ? Math.round(input.matchScore) : null,
      status: "pending",
    })
    .select("id")
    .single()

  if (insertError) {
    console.error("Error inserting connection request:", insertError)
    return { error: "Failed to send connection request: " + insertError.message }
  }

  revalidatePath("/connections")
  revalidatePath("/dashboard")
  revalidatePath(`/u/${receiver.username || receiver.id}`)

  return { success: true, requestId: newRequest.id }
}

/**
 * Respond to an existing connection request: accept, decline, or cancel
 */
export async function respondConnectionRequestAction(params: {
  requestId: string
  action: "accept" | "decline" | "cancel"
}) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { error: "Authentication required." }
  }

  const supabase = await createClient()

  const { data: req, error: fetchError } = await supabase
    .from("connection_requests")
    .select("*")
    .eq("id", params.requestId)
    .single()

  if (fetchError || !req) {
    return { error: "Connection request not found." }
  }

  if (req.status !== "pending") {
    return { error: `Request is already ${req.status}.` }
  }

  if (params.action === "cancel") {
    if (req.sender_id !== user.id) {
      return { error: "Only the sender can cancel a pending connection request." }
    }

    const { error: cancelError } = await supabase
      .from("connection_requests")
      .update({ status: "cancelled", responded_at: new Date().toISOString() })
      .eq("id", params.requestId)

    if (cancelError) {
      return { error: cancelError.message }
    }

    revalidatePath("/connections")
    return { success: true, status: "cancelled" }
  }

  // Accept or Decline by receiver
  if (req.receiver_id !== user.id) {
    return { error: "Only the recipient can respond to this connection request." }
  }

  const newStatus: ConnectionStatus = params.action === "accept" ? "accepted" : "declined"

  const { error: updateError } = await supabase
    .from("connection_requests")
    .update({
      status: newStatus,
      responded_at: new Date().toISOString(),
    })
    .eq("id", params.requestId)

  if (updateError) {
    return { error: updateError.message }
  }

  // If accepted, ensure conversation exists (in case trigger was bypassed or async)
  let conversationId: string | null = null
  if (newStatus === "accepted") {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("connection_id", req.id)
      .maybeSingle()

    if (conv) {
      conversationId = conv.id
    } else {
      // Fallback create conversation
      const { data: createdConv } = await supabase
        .from("conversations")
        .insert({
          connection_id: req.id,
          user_a: req.sender_id,
          user_b: req.receiver_id,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single()
      if (createdConv) conversationId = createdConv.id
    }
  }

  revalidatePath("/connections")
  revalidatePath("/messages")
  revalidatePath("/dashboard")

  return { success: true, status: newStatus, conversationId }
}

/**
 * Mark connection as completed with dual confirmation
 */
export async function requestCompletionAction(params: { requestId: string }) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { error: "Authentication required." }
  }

  const supabase = await createClient()

  const { data: req, error: fetchErr } = await supabase
    .from("connection_requests")
    .select("*")
    .eq("id", params.requestId)
    .single()

  if (fetchErr || !req) {
    return { error: "Connection not found." }
  }

  if (req.status !== "accepted") {
    return { error: `Only accepted exchanges can be marked as completed.` }
  }

  const isSender = req.sender_id === user.id
  const isReceiver = req.receiver_id === user.id

  if (!isSender && !isReceiver) {
    return { error: "You are not a participant in this exchange." }
  }

  // If nobody has requested completion yet, set completion_requested_by
  if (!req.completion_requested_by) {
    const { error: updateErr } = await supabase
      .from("connection_requests")
      .update({ completion_requested_by: user.id })
      .eq("id", req.id)

    if (updateErr) return { error: updateErr.message }

    revalidatePath("/connections")
    return {
      success: true,
      status: "accepted",
      waitingForOther: true,
      message: "Completion requested. Waiting for peer confirmation.",
    }
  }

  // If the same user clicks again, notify waiting
  if (req.completion_requested_by === user.id) {
    return {
      success: true,
      status: "accepted",
      waitingForOther: true,
      message: "You have already requested completion. Waiting for your partner to confirm.",
    }
  }

  // If the other user confirms, mark as COMPLETED!
  const { error: completeErr } = await supabase
    .from("connection_requests")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", req.id)

  if (completeErr) return { error: completeErr.message }

  // TODO (Phase 6): Trigger review prompt & badge unlock hook

  revalidatePath("/connections")
  revalidatePath("/dashboard")

  return {
    success: true,
    status: "completed",
    waitingForOther: false,
    message: "Exchange successfully completed! Both peers confirmed.",
  }
}

/**
 * Fetch user connections by tab
 */
export async function fetchUserConnectionsAction(params: {
  tab: "received" | "sent" | "active" | "completed"
}): Promise<{
  connections: ConnectionRequestWithDetails[]
  counts: { received: number; sent: number; active: number; completed: number }
}> {
  const { user } = await getCurrentUser()
  if (!user) {
    return {
      connections: [],
      counts: { received: 0, sent: 0, active: 0, completed: 0 },
    }
  }

  const supabase = await createClient()

  // 1. Fetch counts across all categories for tabs
  const [recCount, sentCount, activeCount, compCount] = await Promise.all([
    supabase
      .from("connection_requests")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("connection_requests")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("connection_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabase
      .from("connection_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
  ])

  const counts = {
    received: recCount.count || 0,
    sent: sentCount.count || 0,
    active: activeCount.count || 0,
    completed: compCount.count || 0,
  }

  // 2. Fetch specific list for current tab
  let query = supabase.from("connection_requests").select(`
    *,
    sender:profiles!connection_requests_sender_id_fkey(*),
    receiver:profiles!connection_requests_receiver_id_fkey(*),
    listing:listings!connection_requests_listing_id_fkey(
      *,
      category:categories(*),
      offered_skill:skills!listings_offered_skill_id_fkey(*),
      wanted_skill:skills!listings_wanted_skill_id_fkey(*),
      owner:profiles!listings_owner_id_fkey(*)
    )
  `)

  if (params.tab === "received") {
    query = query.eq("receiver_id", user.id).eq("status", "pending")
  } else if (params.tab === "sent") {
    query = query.eq("sender_id", user.id).eq("status", "pending")
  } else if (params.tab === "active") {
    query = query
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
  } else {
    // completed
    query = query
      .eq("status", "completed")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
  }

  const { data: rows, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching connections:", error)
    return { connections: [], counts }
  }

  return {
    connections: (rows || []) as unknown as ConnectionRequestWithDetails[],
    counts,
  }
}
