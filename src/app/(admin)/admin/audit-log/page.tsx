import React from "react"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { fetchAdminAuditLogsAction } from "@/lib/actions/admin"
import { AuditLogClient } from "./audit-log-client"

interface PageProps {
  searchParams: Promise<{
    action?: string
    targetType?: string
    page?: string
  }>
}

export default async function AdminAuditLogPage(props: PageProps) {
  const searchParams = await props.searchParams
  const action = searchParams.action || ""
  const targetType = searchParams.targetType || "all"
  const page = parseInt(searchParams.page || "1", 10)

  const res = await fetchAdminAuditLogsAction({
    action,
    targetType,
    page,
    limit: 20,
  })

  return (
    <div className="min-h-screen pb-16">
      <AdminTopbar
        title="Admin Audit Trail"
        subtitle="Immutable security log recording all moderation decisions, role changes, and administrative mutations"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <AuditLogClient
          initialLogs={res.logs || []}
          total={res.total || 0}
          totalPages={res.totalPages || 1}
          currentPage={page}
          currentFilters={{ action, targetType }}
        />
      </div>
    </div>
  )
}
