import React from "react"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { fetchAdminVerificationsAction } from "@/lib/actions/admin"
import { VerificationsClient } from "./verifications-client"

interface PageProps {
  searchParams: Promise<{
    status?: string
    page?: string
  }>
}

export default async function AdminVerificationsPage(props: PageProps) {
  const searchParams = await props.searchParams
  const status = searchParams.status || "pending"
  const page = parseInt(searchParams.page || "1", 10)

  const res = await fetchAdminVerificationsAction({
    status,
    page,
    limit: 15,
  })

  return (
    <div className="min-h-screen pb-16">
      <AdminTopbar
        title="Verification Queue"
        subtitle="Review uploaded credentials, inspect student & academic IDs, and award Verified Scholar credentials"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <VerificationsClient
          initialVerifications={res.verifications || []}
          total={res.total || 0}
          totalPages={res.totalPages || 1}
          currentPage={page}
          currentStatus={status}
        />
      </div>
    </div>
  )
}
