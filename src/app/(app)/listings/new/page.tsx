import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getCategoriesWithSkills } from "@/lib/data/categories"
import { ListingForm } from "@/components/shared/listing-form"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function NewListingPage() {
  const { user, profile } = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const categories = await getCategoriesWithSkills()

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Back link & Header */}
      <div className="space-y-1">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to My Listings</span>
        </Link>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Create New Skill Listing
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Publish an exchange proposal or learning request to pair up with peers.
        </p>
      </div>

      <ListingForm
        categories={categories}
        currentUserProfile={profile}
        isEdit={false}
      />
    </div>
  )
}
