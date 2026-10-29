import React from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import {
  fetchConversationsAction,
  fetchConversationByIdAction,
  fetchMessagesAction,
} from "@/lib/actions/messages"
import { ChatLayout } from "@/components/chat/chat-layout"

export const dynamic = "force-dynamic"

interface ConversationDetailPageProps {
  params: Promise<{ conversationId: string }>
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { user } = await getCurrentUser()
  if (!user) {
    redirect("/login?redirectTo=/messages")
  }

  const { conversationId } = await params

  const [conversations, activeConversation, initialMessagesRes] = await Promise.all([
    fetchConversationsAction(),
    fetchConversationByIdAction(conversationId),
    fetchMessagesAction(conversationId, { limit: 30 }),
  ])

  if (!activeConversation) {
    redirect("/messages")
  }

  return (
    <ChatLayout
      conversations={conversations}
      activeConversation={activeConversation}
      initialMessages={initialMessagesRes.messages}
      currentUserId={user.id}
    />
  )
}
