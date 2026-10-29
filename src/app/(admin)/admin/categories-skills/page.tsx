import React from "react"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { fetchAdminCategoriesAndSkillsAction } from "@/lib/actions/admin"
import { CategoriesSkillsClient } from "./categories-skills-client"

export const dynamic = "force-dynamic"

export default async function AdminCategoriesSkillsPage() {
  const res = await fetchAdminCategoriesAndSkillsAction()

  return (
    <div className="min-h-screen pb-16">
      <AdminTopbar
        title="Categories & Skills Catalog"
        subtitle="Manage peer exchange categories, add or edit platform skills, and audit active adoption"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <CategoriesSkillsClient initialCategories={res.categories || []} />
      </div>
    </div>
  )
}
