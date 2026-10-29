import React from "react"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { fetchAdminUsersAction } from "@/lib/actions/admin"
import { UsersClient } from "./users-client"

interface PageProps {
  searchParams: Promise<{
    q?: string
    type?: string
    verified?: string
    suspended?: string
    role?: string
    page?: string
  }>
}

export default async function AdminUsersPage(props: PageProps) {
  const searchParams = await props.searchParams
  const query = searchParams.q || ""
  const userType = searchParams.type || "all"
  const isVerified = searchParams.verified || "all"
  const isSuspended = searchParams.suspended || "all"
  const role = searchParams.role || "all"
  const page = parseInt(searchParams.page || "1", 10)

  const res = await fetchAdminUsersAction({
    query,
    userType,
    isVerified,
    isSuspended,
    role,
    page,
    limit: 15,
  })

  return (
    <div className="min-h-screen pb-16">
      <AdminTopbar
        title="User Management"
        subtitle="Search, audit, verify credentials, manage platform roles, and handle account suspensions"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <UsersClient
          initialUsers={res.users || []}
          total={res.total || 0}
          totalPages={res.totalPages || 1}
          currentPage={page}
          currentFilters={{
            query,
            userType,
            isVerified,
            isSuspended,
            role,
          }}
        />
      </div>
    </div>
  )
}
