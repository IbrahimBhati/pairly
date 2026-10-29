import React from "react"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { fetchAdminListingsAction } from "@/lib/actions/admin"
import { createClient } from "@/lib/supabase/server"
import { ListingsClient } from "./listings-client"

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    category?: string
    page?: string
  }>
}

export default async function AdminListingsPage(props: PageProps) {
  const searchParams = await props.searchParams
  const query = searchParams.q || ""
  const status = searchParams.status || "all"
  const categoryId = searchParams.category || "all"
  const page = parseInt(searchParams.page || "1", 10)

  const supabase = await createClient()
  const [{ data: categories }, res] = await Promise.all([
    supabase.from("categories").select("id, name").order("name", { ascending: true }),
    fetchAdminListingsAction({
      query,
      status,
      categoryId,
      page,
      limit: 15,
    }),
  ])

  return (
    <div className="min-h-screen pb-16">
      <AdminTopbar
        title="Listing Moderation"
        subtitle="Review exchange offers, filter categories, handle reports, and enforce content safety"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <ListingsClient
          initialListings={res.listings || []}
          categories={categories || []}
          total={res.total || 0}
          totalPages={res.totalPages || 1}
          currentPage={page}
          currentFilters={{
            query,
            status,
            categoryId,
          }}
        />
      </div>
    </div>
  )
}
