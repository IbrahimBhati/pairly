import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { recordListingViewAction } from "@/lib/actions/listings"
import {
  ListingOwnerBar,
  ListingSaveButton,
  ListingReportButton,
} from "@/components/shared/listing-detail-actions"
import { ConnectButton } from "@/components/shared/connect-button"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { MatchBadge } from "@/components/shared/match-badge"
import { SkillChip } from "@/components/shared/skill-chip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Repeat,
  HandHelping,
  Sparkles,
  Globe,
  MapPin,
  Calendar,
  Clock,
  Eye,
  ShieldCheck,
  UserCheck,
} from "lucide-react"
import type { ListingWithDetails } from "@/types/database"

export const dynamic = "force-dynamic"

interface ListingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params
  const { user } = await getCurrentUser()
  const supabase = await createClient()

  // Fetch listing with full joins
  const { data: listingData, error } = await supabase
    .from("listings")
    .select(`
      *,
      category:categories(*),
      offered_skill:skills!listings_offered_skill_id_fkey(*),
      wanted_skill:skills!listings_wanted_skill_id_fkey(*),
      owner:profiles!listings_owner_id_fkey(*)
    `)
    .eq("id", id)
    .single()

  let listing: ListingWithDetails | null = listingData as unknown as ListingWithDetails

  if (error || !listing) {
    // Relaxed fallback query
    const { data: fallbackData } = await supabase
      .from("listings")
      .select(`
        *,
        category:categories(*),
        offered_skill:skills!offered_skill_id(*),
        wanted_skill:skills!wanted_skill_id(*),
        owner:profiles!owner_id(*)
      `)
      .eq("id", id)
      .single()

    listing = fallbackData as unknown as ListingWithDetails
  }

  if (!listing) {
    notFound()
  }

  const isOwner = user?.id === listing.owner_id

  // Increment view count if non-owner
  if (!isOwner) {
    try {
      await recordListingViewAction(listing.id)
    } catch {
      // Ignore non-critical view logging
    }
  }

  // Check if saved
  let isSaved = false
  if (user) {
    const { data: savedRecord } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", listing.id)
      .maybeSingle()

    isSaved = !!savedRecord
  }

  // Calculate Match Score for listing & owner
  let matchScore: number | undefined
  let matchedYouWant: string[] = []
  let matchedTheyWant: string[] = []

  if (user && !isOwner) {
    try {
      const { calculateListingMatchScore } = await import("@/lib/matching")
      const { data: myProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      const { data: mySkills } = await supabase.from("user_skills").select("*, skill:skills(*)").eq("user_id", user.id)
      const { data: ownerSkills } = await supabase.from("user_skills").select("*, skill:skills(*)").eq("user_id", listing.owner_id)

      if (myProfile && mySkills && listing.owner) {
        const userA = {
          id: user.id,
          userType: myProfile.user_type,
          city: myProfile.city,
          country: myProfile.country,
          isVerified: myProfile.is_verified,
          bio: myProfile.bio,
          avatarUrl: myProfile.avatar_url,
          skills: mySkills.map((s: any) => ({
            skillId: s.skill_id,
            skillName: s.skill?.name || `Skill ${s.skill_id}`,
            categoryId: s.skill?.category_id || 1,
            direction: s.direction,
          })),
        }
        const userB = {
          id: listing.owner.id,
          userType: listing.owner.user_type,
          city: listing.owner.city,
          country: listing.owner.country,
          isVerified: listing.owner.is_verified,
          bio: listing.owner.bio,
          avatarUrl: listing.owner.avatar_url,
          skills: (ownerSkills || []).map((s: any) => ({
            skillId: s.skill_id,
            skillName: s.skill?.name || `Skill ${s.skill_id}`,
            categoryId: s.skill?.category_id || 1,
            direction: s.direction,
          })),
        }
        const matchRes = calculateListingMatchScore(
          userA,
          userB,
          listing.offered_skill_id,
          listing.wanted_skill_id,
          listing.mode === "online" || listing.mode === "both"
        )
        matchScore = matchRes.score
        matchedYouWant = matchRes.matchedYouWant
        matchedTheyWant = matchRes.matchedTheyWant
      }
    } catch (err) {
      console.warn("Could not calculate listing match score:", err)
    }
  }

  const typeConfig = {
    exchange: {
      label: "Skill Exchange",
      icon: Repeat,
      className: "border-[#A78BFA]/40 bg-[#A78BFA]/15 text-[#4B3F72] dark:text-[#A78BFA]",
    },
    help_offer: {
      label: "Help Offer",
      icon: HandHelping,
      className: "border-emerald-300/60 bg-emerald-50 text-[#064E3B] dark:text-[#A7F3D0] dark:bg-emerald-950/40",
    },
    help_request: {
      label: "Help Request",
      icon: Sparkles,
      className: "border-blue-300/60 bg-blue-50 text-blue-800 dark:text-blue-300 dark:bg-blue-950/40",
    },
  }

  const typeInfo = typeConfig[listing.type] || typeConfig.exchange
  const TypeIcon = typeInfo.icon

  const formattedDate = new Date(listing.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const ownerJoinedDate = listing.owner?.created_at
    ? new Date(listing.owner.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Recently"

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Listings</span>
        </Link>

        {!isOwner && (
          <div className="flex items-center gap-2">
            <ListingReportButton
              listingId={listing.id}
              listingTitle={listing.title}
              isLoggedIn={!!user}
            />
            <ListingSaveButton
              listingId={listing.id}
              initialSaved={isSaved}
              isLoggedIn={!!user}
            />
          </div>
        )}
      </div>

      {/* Owner Management Bar */}
      {isOwner && (
        <ListingOwnerBar listingId={listing.id} currentStatus={listing.status} />
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Main Details) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hero Header Card */}
          <div className="card-soft p-6 sm:p-8 space-y-6">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${typeInfo.className}`}
              >
                <TypeIcon className="h-3.5 w-3.5" />
                <span>{typeInfo.label}</span>
              </span>

              {listing.category && (
                <Badge variant="outline" className="text-xs">
                  {listing.category.name}
                </Badge>
              )}

              {listing.status === "paused" && (
                <Badge variant="outline" className="border-amber-400 text-amber-600">
                  Paused
                </Badge>
              )}

              {listing.status === "completed" && (
                <Badge variant="outline" className="border-blue-400 text-blue-600">
                  Completed
                </Badge>
              )}

              {/* Bilateral Match Badge */}
              {matchScore !== undefined && matchScore !== null && (
                <MatchBadge
                  score={matchScore}
                  matchedYouWant={matchedYouWant}
                  matchedTheyWant={matchedTheyWant}
                  size="md"
                  variant="pill"
                />
              )}
            </div>

            {/* Title */}
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
              {listing.title}
            </h1>

            {/* Publication metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/60">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Published on {formattedDate}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{listing.view_count} views</span>
              </span>
              <span className="capitalize flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Mode: {listing.mode.replace("_", " ")}</span>
              </span>
            </div>

            {/* SKILL EXCHANGE VISUAL BANNER (Lavender & Mint Tones) */}
            <div className="rounded-2xl border border-[#A78BFA]/30 bg-linear-to-r from-[#A78BFA]/10 via-background to-[#A7F3D0]/10 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#A78BFA]" />
                <span className="text-xs font-bold font-heading uppercase tracking-wider text-foreground">
                  Exchange Dynamic
                </span>
              </div>

              {listing.type === "exchange" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Offers Side */}
                  <div className="flex-1 rounded-xl border border-emerald-300/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#064E3B] dark:text-[#A7F3D0] mb-1">
                      Partner Offers:
                    </p>
                    <p className="font-heading text-base font-bold text-foreground">
                      {listing.offered_skill?.name || "Specified Skill"}
                    </p>
                  </div>

                  {/* Arrow Swap Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4B3F72] text-white shadow-md mx-auto sm:mx-0">
                    <Repeat className="h-5 w-5" />
                  </div>

                  {/* Wants Side */}
                  <div className="flex-1 rounded-xl border border-[#A78BFA]/40 bg-[#A78BFA]/10 dark:bg-[#A78BFA]/15 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#4B3F72] dark:text-[#A78BFA] mb-1">
                      Partner Wants in Return:
                    </p>
                    <p className="font-heading text-base font-bold text-foreground">
                      {listing.wanted_skill?.name || "Specified Skill"}
                    </p>
                  </div>
                </div>
              )}

              {listing.type === "help_offer" && (
                <div className="rounded-xl border border-emerald-300/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#064E3B] dark:text-[#A7F3D0] mb-1">
                    Free Knowledge Offer:
                  </p>
                  <p className="font-heading text-base font-bold text-foreground">
                    {listing.offered_skill?.name || "Volunteer Skill"}
                  </p>
                </div>
              )}

              {listing.type === "help_request" && (
                <div className="rounded-xl border border-blue-300/40 bg-blue-50/60 dark:bg-blue-950/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-1">
                    Sought Assistance:
                  </p>
                  <p className="font-heading text-base font-bold text-foreground">
                    {listing.wanted_skill?.name || "Requested Skill"}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3 pt-2">
              <h2 className="font-heading text-base font-bold text-foreground">
                Overview & Expectations
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
                {listing.description}
              </div>
            </div>
          </div>

          {/* Details & Logistics Card */}
          <div className="card-soft p-6 space-y-4">
            <h2 className="font-heading text-base font-bold text-foreground">
              Session Logistics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-accent/30">
                <Globe className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Session Mode</p>
                  <p className="text-muted-foreground capitalize mt-0.5">
                    {listing.mode.replace("_", " ")}
                  </p>
                </div>
              </div>

              {listing.city && (
                <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-accent/30">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Location / Campus</p>
                    <p className="text-muted-foreground mt-0.5">{listing.city}</p>
                  </div>
                </div>
              )}

              {listing.availability && (
                <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-accent/30">
                  <Calendar className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Availability</p>
                    <p className="text-muted-foreground mt-0.5">{listing.availability}</p>
                  </div>
                </div>
              )}

              {listing.duration_estimate && (
                <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-accent/30">
                  <Clock className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Duration & Commitment</p>
                    <p className="text-muted-foreground mt-0.5">
                      {listing.duration_estimate}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Owner Card + Connect Action) */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          {/* Owner Mini-Profile Card */}
          <div className="card-soft p-6 space-y-5">
            <div className="flex items-center gap-3">
              <UserAvatar profile={listing.owner} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-heading text-base font-bold text-foreground truncate">
                    {listing.owner?.full_name || listing.owner?.username || "Scholar"}
                  </h3>
                  {listing.owner?.is_verified && <VerifiedBadge size="sm" />}
                </div>
                {listing.owner?.username && (
                  <p className="text-xs font-mono text-muted-foreground">
                    @{listing.owner.username}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge className="text-[10px] font-bold uppercase bg-[#A7F3D0] text-[#064E3B]">
                    {listing.owner?.user_type || "Student"}
                  </Badge>
                  {matchScore !== undefined && matchScore !== null && (
                    <MatchBadge
                      score={matchScore}
                      matchedYouWant={matchedYouWant}
                      matchedTheyWant={matchedTheyWant}
                      size="sm"
                      variant="pill"
                    />
                  )}
                </div>
              </div>
            </div>

            {listing.owner?.bio && (
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {listing.owner.bio}
              </p>
            )}

            <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border/60">
              {(listing.owner?.city || listing.owner?.country) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {[listing.owner.city, listing.owner.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Member since {ownerJoinedDate}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {listing.owner?.username ? (
                <Link href={`/u/${listing.owner.username}`} className="block w-full">
                  <Button variant="outline" className="w-full rounded-xl text-xs">
                    View Full Profile
                  </Button>
                </Link>
              ) : (
                <Link href="/profile" className="block w-full">
                  <Button variant="outline" className="w-full rounded-xl text-xs">
                    View Profile
                  </Button>
                </Link>
              )}

              {!isOwner && listing.owner && (
                <ConnectButton
                  targetUser={listing.owner}
                  targetListing={listing}
                  matchScore={matchScore}
                  matchedYouWant={matchedYouWant}
                  matchedTheyWant={matchedTheyWant}
                  currentUserId={user?.id}
                  fullWidth
                />
              )}
            </div>
          </div>

          {/* Safety & Guidelines card */}
          <div className="rounded-2xl border border-border bg-card/60 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-[#A7F3D0]" />
              <span>Pairly Peer Guarantee</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Exchanges on Pairly are strictly non-monetary. Always agree on clear lesson goals
              and session frequencies prior to scheduling meetings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
