"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ConversationList } from "@/components/chat/conversation-list"
import { ChatWindow } from "@/components/chat/chat-window"
import { MessageSquare, Sparkles } from "lucide-react"
import type {
  ConversationWithDetails,
  MessageWithSender,
} from "@/types/database"

interface ChatLayoutProps {
  conversations: ConversationWithDetails[]
  activeConversation?: ConversationWithDetails | null
  initialMessages?: MessageWithSender[]
  currentUserId: string
}

export function ChatLayout({
  conversations,
  activeConversation,
  initialMessages = [],
  currentUserId,
}: ChatLayoutProps) {
  const router = useRouter()

  return (
    <div className="h-[calc(100dvh-5.5rem)] rounded-3xl border border-border bg-card/40 backdrop-blur-md overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
      {/* Left Pane: Conversation List */}
      <div
        className={`h-full lg:col-span-4 xl:col-span-4 ${
          activeConversation ? "hidden lg:block" : "block"
        }`}
      >
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
          activeConversationId={activeConversation?.id}
        />
      </div>

      {/* Right Pane: Active Chat Window or Empty State */}
      <div
        className={`h-full lg:col-span-8 xl:col-span-8 ${
          activeConversation ? "block" : "hidden lg:flex"
        }`}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            initialMessages={initialMessages}
            currentUserId={currentUserId}
            onBack={() => router.push("/messages")}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-accent/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA]">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Select a conversation
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Choose an active peer connection from the left to start coordinating your
              skill exchange sessions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
