import React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirectTo=/admin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    // Non-admins are redirected back to member dashboard
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      <AdminSidebar adminProfile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
