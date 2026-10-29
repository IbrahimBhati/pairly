"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  fetchMessagesAction,
  sendMessageAction,
  markConversationReadAction,
} from "@/lib/actions/messages"
import type { MessageWithSender } from "@/types/database"

export function useConversationMessages(
  conversationId: string,
  initialMessages: MessageWithSender[] = [],
  currentUserId: string,
  otherUser?: { id: string; full_name?: string | null; username?: string | null; avatar_url?: string | null }
) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
  const [hasMore, setHasMore] = useState(initialMessages.length >= 30)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isPeerTyping, setIsPeerTyping] = useState(false)
  const [isPeerOnline, setIsPeerOnline] = useState(false)

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const supabase = createClient()

  // Keep messages state synced when conversationId changes
  useEffect(() => {
    setMessages(initialMessages)
    setHasMore(initialMessages.length >= 30)
  }, [conversationId, initialMessages])

  // Realtime subscription for messages, typing, and presence
  useEffect(() => {
    if (!conversationId) return

    // Mark current messages as read on mount
    markConversationReadAction(conversationId).catch(() => {})

    const channelName = `conversation:${conversationId}`
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: currentUserId },
        broadcast: { ack: false },
      },
    })

    // 1. Listen for new messages & updates
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any

          // Auto mark as read if received from peer
          if (newMsg.sender_id !== currentUserId) {
            markConversationReadAction(conversationId).catch(() => {})
          }

          setMessages((prev) => {
            // Check if already in list (e.g. from optimistic update)
            const existsIndex = prev.findIndex(
              (m) => m.id === newMsg.id || (m.id.startsWith("optimistic-") && m.content === newMsg.content && m.sender_id === newMsg.sender_id)
            )

            const enrichedMsg: MessageWithSender = {
              ...newMsg,
              sender:
                newMsg.sender_id === currentUserId
                  ? prev[existsIndex]?.sender || { id: currentUserId, full_name: "You" }
                  : otherUser || { id: newMsg.sender_id, full_name: "Peer" },
            }

            if (existsIndex >= 0) {
              const updated = [...prev]
              updated[existsIndex] = enrichedMsg
              return updated
            }

            return [...prev, enrichedMsg]
          })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as any
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMsg.id
                ? { ...m, read_at: updatedMsg.read_at }
                : m
            )
          )
        }
      )
      // 2. Broadcast for typing indicators
      .on("broadcast", { event: "typing" }, (event) => {
        if (event.payload?.userId !== currentUserId) {
          setIsPeerTyping(Boolean(event.payload?.isTyping))

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }

          if (event.payload?.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsPeerTyping(false)
            }, 3000)
          }
        }
      })
      // 3. Presence for online dot
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const peerPresent = otherUser?.id ? Boolean(state[otherUser.id]) : false
        setIsPeerOnline(peerPresent)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId, otherUser?.id])

  // Broadcast typing event
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current) return
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, isTyping },
      })
    },
    [currentUserId]
  )

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const tempId = `optimistic-${Date.now()}`
      const optimisticMsg: MessageWithSender = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: trimmed,
        message_type: "text",
        read_at: null,
        created_at: new Date().toISOString(),
        sender: {
          id: currentUserId,
          full_name: "You",
          username: "you",
          avatar_url: null,
          user_type: "student",
          role: "user",
          city: null,
          country: null,
          timezone: null,
          languages: [],
          is_verified: false,
          onboarding_completed: true,
          is_suspended: false,
          bio: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }

      // Optimistically append
      setMessages((prev) => [...prev, optimisticMsg])

      // Send to server
      const res = await sendMessageAction({
        conversationId,
        content: trimmed,
      })

      if (res.error) {
        // Rollback on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        throw new Error(res.error)
      }

      if (res.message) {
        // Replace optimistic message with server message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.message! : m))
        )
      }
    },
    [conversationId, currentUserId]
  )

  // Load older messages (infinite scroll up)
  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return

    setLoadingMore(true)
    try {
      const oldestTimestamp = messages[0]?.created_at
      const res = await fetchMessagesAction(conversationId, {
        limit: 30,
        before: oldestTimestamp,
      })

      if (res.messages.length > 0) {
        setMessages((prev) => [...res.messages, ...prev])
      }
      setHasMore(res.hasMore)
    } catch (err) {
      console.error("Failed to load older messages:", err)
    } finally {
      setLoadingMore(false)
    }
  }, [conversationId, hasMore, loadingMore, messages])

  return {
    messages,
    sendMessage,
    loadOlderMessages,
    hasMore,
    loadingMore,
    isPeerTyping,
    isPeerOnline,
    sendTyping,
  }
}
