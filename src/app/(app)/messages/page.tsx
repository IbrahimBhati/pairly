import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchConversationsAction } from "@/lib/actions/messages"
import { ChatLayout } from "@/components/chat/chat-layout"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const { user } = await getCurrentUser()
  if (!user) {
    redirect("/login?redirectTo=/messages")
  }

  const conversations = await fetchConversationsAction()

  return (
    <ChatLayout
      conversations={conversations}
      activeConversation={null}
      currentUserId={user.id}
    />
  )
}
