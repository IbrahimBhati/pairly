import React from "react"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { fetchAdminReportsAction } from "@/lib/actions/admin"
import { ReportsClient } from "./reports-client"

interface PageProps {
  searchParams: Promise<{
    status?: string
    page?: string
  }>
}

export default async function AdminReportsPage(props: PageProps) {
  const searchParams = await props.searchParams
  const status = searchParams.status || "open"
  const page = parseInt(searchParams.page || "1", 10)

  const res = await fetchAdminReportsAction({
    status,
    page,
    limit: 15,
  })

  return (
    <div className="min-h-screen pb-16">
      <AdminTopbar
        title="Trust & Safety Queue"
        subtitle="Investigate community incident reports, enforce platform rules, and resolve disputes"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <ReportsClient
          initialReports={res.reports || []}
          total={res.total || 0}
          totalPages={res.totalPages || 1}
          currentPage={page}
          currentStatus={status}
        />
      </div>
    </div>
  )
}
