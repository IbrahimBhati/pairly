"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type {
  ConversationWithDetails,
  MessageWithSender,
  Message,
} from "@/types/database"
import { validateContentSafety } from "@/lib/safety"

/**
 * Fetch all conversations for the current user with unread counts and last message preview
 */
export async function fetchConversationsAction(): Promise<ConversationWithDetails[]> {
  const { user } = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  const { data: convs, error } = await supabase
    .from("conversations")
    .select(`
      *,
      connection:connection_requests!conversations_connection_id_fkey(
        *,
        listing:listings(*)
      ),
      user_a_profile:profiles!conversations_user_a_fkey(*),
      user_b_profile:profiles!conversations_user_b_fkey(*)
    `)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false })

  if (error || !convs) {
    console.error("Error fetching conversations:", error)
    return []
  }

  // Enrich conversations with other user profile, last message, and unread count
  const enriched: ConversationWithDetails[] = await Promise.all(
    convs.map(async (row: any) => {
      const isUserA = row.user_a === user.id
      const otherUser = isUserA ? row.user_b_profile : row.user_a_profile

      // Fetch last message
      const { data: lastMsgData } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", row.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // Fetch unread count for current user
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", row.id)
        .neq("sender_id", user.id)
        .is("read_at", null)

      return {
        id: row.id,
        connection_id: row.connection_id,
        user_a: row.user_a,
        user_b: row.user_b,
        last_message_at: row.last_message_at,
        created_at: row.created_at,
        other_user: otherUser,
        connection: row.connection,
        listing: row.connection?.listing || null,
        last_message: (lastMsgData as Message) || null,
        unread_count: unreadCount || 0,
      }
    })
  )

  return enriched
}

/**
 * Fetch a single conversation by ID with access verification
 */
export async function fetchConversationByIdAction(
  conversationId: string
): Promise<ConversationWithDetails | null> {
  const { user } = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  const { data: conv, error } = await supabase
    .from("conversations")
    .select(`
      *,
      connection:connection_requests!conversations_connection_id_fkey(
        *,
        listing:listings(*)
      ),
      user_a_profile:profiles!conversations_user_a_fkey(*),
      user_b_profile:profiles!conversations_user_b_fkey(*)
    `)
    .eq("id", conversationId)
    .single()

  if (error || !conv) {
    return null
  }

  if (conv.user_a !== user.id && conv.user_b !== user.id) {
    return null
  }

  const isUserA = conv.user_a === user.id
  const otherUser = isUserA ? conv.user_b_profile : conv.user_a_profile

  // Fetch last message
  const { data: lastMsgData } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conv.id)
    .neq("sender_id", user.id)
    .is("read_at", null)

  return {
    id: conv.id,
    connection_id: conv.connection_id,
    user_a: conv.user_a,
    user_b: conv.user_b,
    last_message_at: conv.last_message_at,
    created_at: conv.created_at,
    other_user: otherUser,
    connection: conv.connection,
    listing: conv.connection?.listing || null,
    last_message: (lastMsgData as Message) || null,
    unread_count: unreadCount || 0,
  }
}

/**
 * Fetch paginated messages for a conversation
 */
export async function fetchMessagesAction(
  conversationId: string,
  options: { limit?: number; before?: string } = {}
): Promise<{ messages: MessageWithSender[]; hasMore: boolean }> {
  const { user } = await getCurrentUser()
  if (!user) return { messages: [], hasMore: false }

  const limit = options.limit || 30
  const supabase = await createClient()

  // Verify membership
  const { data: conv } = await supabase
    .from("conversations")
    .select("user_a, user_b")
    .eq("id", conversationId)
    .single()

  if (!conv || (conv.user_a !== user.id && conv.user_b !== user.id)) {
    return { messages: [], hasMore: false }
  }

  let query = supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(*)
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit + 1)

  if (options.before) {
    query = query.lt("created_at", options.before)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error("Error fetching messages:", error)
    return { messages: [], hasMore: false }
  }

  const hasMore = data.length > limit
  const rows = hasMore ? data.slice(0, limit) : data

  // Auto-mark unread incoming messages as read
  const unreadIds = rows
    .filter((m) => m.sender_id !== user.id && !m.read_at)
    .map((m) => m.id)

  if (unreadIds.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)
  }

  // Reverse so they are returned chronologically (oldest to newest)
  const sortedChronological = (rows as unknown as MessageWithSender[]).reverse()

  return {
    messages: sortedChronological,
    hasMore,
  }
}

/**
 * Send a message inside an active conversation
 */
export async function sendMessageAction(params: {
  conversationId: string
  content: string
}) {
  const { user } = await getCurrentUser()
  if (!user) {
    return { error: "Authentication required." }
  }

  const trimmed = params.content.trim()
  if (!trimmed) {
    return { error: "Message cannot be empty." }
  }

  if (trimmed.length > 2000) {
    return { error: "Message exceeds maximum length of 2000 characters." }
  }

  const supabase = await createClient()

  // Verify conversation and ensure connection is accepted
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select(`
      id,
      user_a,
      user_b,
      connection:connection_requests!conversations_connection_id_fkey(status)
    `)
    .eq("id", params.conversationId)
    .single()

  if (convErr || !conv) {
    return { error: "Conversation not found." }
  }

  if (conv.user_a !== user.id && conv.user_b !== user.id) {
    return { error: "Unauthorized access to this conversation." }
  }

  const connectionStatus = Array.isArray(conv.connection)
    ? conv.connection[0]?.status
    : conv.connection?.status

  if (connectionStatus !== "accepted") {
    return { error: "Messaging is only available for accepted connection requests." }
  }

  const peerId = conv.user_a === user.id ? conv.user_b : conv.user_a

  // Check if either user has blocked the other
  const { data: blocks } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${peerId}),and(blocker_id.eq.${peerId},blocked_id.eq.${user.id})`)
    .limit(1)

  if (blocks && blocks.length > 0) {
    return { error: "Cannot send messages to or receive messages from a blocked user." }
  }

  // Count existing messages to determine if this is the first message
  const { count: existingCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", params.conversationId)

  const isInitial = (existingCount || 0) === 0
  const safetyResult = validateContentSafety(trimmed, isInitial)
  if (!safetyResult.valid) {
    return { error: safetyResult.warning || "Message violated safety guidelines." }
  }

  const now = new Date().toISOString()

  const { data: newMessage, error: insertErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      sender_id: user.id,
      content: trimmed,
      message_type: "text",
      created_at: now,
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(*)
    `)
    .single()

  if (insertErr || !newMessage) {
    console.error("Error sending message:", insertErr)
    return { error: "Failed to send message: " + (insertErr?.message || "Unknown error") }
  }

  // Explicitly update last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: now })
    .eq("id", params.conversationId)

  revalidatePath(`/messages/${params.conversationId}`)
  revalidatePath("/messages")

  return { success: true, message: newMessage as unknown as MessageWithSender }
}

/**
 * Mark all messages in a conversation as read by current user
 */
export async function markConversationReadAction(conversationId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { success: false }

  const supabase = await createClient()

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null)

  return { success: true }
}
