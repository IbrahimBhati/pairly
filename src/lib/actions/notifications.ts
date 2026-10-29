"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { Notification } from "@/types/database"

export interface UnreadCounts {
  unreadNotifications: number
  unreadMessages: number
  pendingRequests: number
}

/**
 * Fetch notifications for current user
 */
export async function fetchNotificationsAction(
  options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const { user } = await getCurrentUser()
  if (!user) {
    return { notifications: [], unreadCount: 0 }
  }

  const limit = options.limit || 20
  const supabase = await createClient()

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (options.unreadOnly) {
    query = query.eq("is_read", false)
  }

  const [listRes, countRes] = await Promise.all([
    query,
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ])

  return {
    notifications: (listRes.data || []) as Notification[],
    unreadCount: countRes.count || 0,
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationReadAction(notificationId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { success: false }

  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/notifications")
  return { success: true }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsReadAction() {
  const { user } = await getCurrentUser()
  if (!user) return { success: false }

  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/notifications")
  return { success: true }
}

/**
 * Fetch total unread notifications, unread messages, and pending connection requests
 * Used by topbar bell and sidebar indicators
 */
export async function fetchUnreadCountsAction(): Promise<UnreadCounts> {
  const { user } = await getCurrentUser()
  if (!user) {
    return { unreadNotifications: 0, unreadMessages: 0, pendingRequests: 0 }
  }

  const supabase = await createClient()

  // 1. Unread notifications
  const notifPromise = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  // 2. Pending connection requests received
  const reqPromise = supabase
    .from("connection_requests")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending")

  // 3. Unread messages across all active conversations
  const msgPromise = supabase
    .from("conversations")
    .select(`
      id,
      messages!messages_conversation_id_fkey(id)
    `)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  const [notifRes, reqRes, convRes] = await Promise.all([
    notifPromise,
    reqPromise,
    msgPromise,
  ])

  // Count unread messages where sender_id != user.id and read_at is null
  let unreadMessagesCount = 0
  if (convRes.data && convRes.data.length > 0) {
    const convIds = convRes.data.map((c) => c.id)
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .neq("sender_id", user.id)
      .is("read_at", null)

    unreadMessagesCount = count || 0
  }

  return {
    unreadNotifications: notifRes.count || 0,
    unreadMessages: unreadMessagesCount,
    pendingRequests: reqRes.count || 0,
  }
}
