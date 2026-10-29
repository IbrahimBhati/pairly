import React from "react"
import { getCurrentUser } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getCurrentUser()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar className="fixed inset-y-0 left-0 w-64" />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <Topbar profile={profile} userEmail={user?.email} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
