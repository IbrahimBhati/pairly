import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchUserSettingsAction } from "@/lib/actions/settings"
import { SettingsView } from "./settings-view"

export default async function SettingsPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/login?redirectTo=/settings")
  }

  const res = await fetchUserSettingsAction()

  const safeSettings = res.settings || {
    user_id: user.id,
    theme: "system" as const,
    email_notifications: true,
    notify_new_request: true,
    notify_messages: true,
    notify_reviews: true,
    profile_visibility: "public" as const,
    show_city: true,
    language: "en",
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="pb-12">
      <SettingsView
        initialProfile={profile}
        initialSettings={safeSettings}
        userEmail={user.email || ""}
      />
    </div>
  )
}
