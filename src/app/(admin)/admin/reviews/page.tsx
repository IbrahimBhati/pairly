import React from "react"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { fetchAdminReviewsAction } from "@/lib/actions/admin"
import { ReviewsClient } from "./reviews-client"

interface PageProps {
  searchParams: Promise<{
    q?: string
    page?: string
  }>
}

export default async function AdminReviewsPage(props: PageProps) {
  const searchParams = await props.searchParams
  const query = searchParams.q || ""
  const page = parseInt(searchParams.page || "1", 10)

  const res = await fetchAdminReviewsAction({
    query,
    page,
    limit: 15,
  })

  return (
    <div className="min-h-screen pb-16">
      <AdminTopbar
        title="Reviews Moderation"
        subtitle="Audit exchange reviews, remove policy-violating comments, and automatically recalculate member ratings"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <ReviewsClient
          initialReviews={res.reviews || []}
          total={res.total || 0}
          totalPages={res.totalPages || 1}
          currentPage={page}
          currentFilters={{ query }}
        />
      </div>
    </div>
  )
}
