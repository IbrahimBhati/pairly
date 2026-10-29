"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { MatchBadge } from "@/components/shared/match-badge"
import { SkillChip } from "@/components/shared/skill-chip"
import { ListingCard } from "@/components/shared/listing-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { ConnectButton } from "@/components/shared/connect-button"
import { ReviewStars } from "@/components/shared/review-stars"
import { BadgeTile } from "@/components/shared/badge-tile"
import { ReportDialog } from "@/components/shared/report-dialog"
import { BlockDialog } from "@/components/shared/block-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fetchUserReviewsAction } from "@/lib/actions/reviews"
import { fetchUserTopBadgesAction } from "@/lib/actions/gamification"
import {
  Edit,
  MapPin,
  Globe,
  Calendar,
  Layers,
  Repeat,
  Star,
  CheckCircle2,
  Sparkles,
  BookOpen,
  MoreVertical,
  Flag,
  UserX,
  Loader2,
  Award,
} from "lucide-react"
import type {
  Profile,
  ListingWithDetails,
  UserSkillWithDetails,
  SkillProficiency,
  ReviewWithDetails,
  UserBadgeWithDetails,
} from "@/types/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ProfileViewProps {
  profile: Profile
  userEmail?: string | null
  offeredSkills: UserSkillWithDetails[]
  wantedSkills: UserSkillWithDetails[]
  listings: ListingWithDetails[]
  isOwner?: boolean
  currentUserId?: string
  matchScore?: number
  matchedYouWant?: string[]
  matchedTheyWant?: string[]
}

export function ProfileView({
  profile,
  userEmail,
  offeredSkills,
  wantedSkills,
  listings,
  isOwner = false,
  currentUserId,
  matchScore,
  matchedYouWant = [],
  matchedTheyWant = [],
}: ProfileViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"skills" | "listings" | "reviews">("skills")
  const [topBadges, setTopBadges] = useState<UserBadgeWithDetails[]>([])
  const [reviewsData, setReviewsData] = useState<{
    reviews: ReviewWithDetails[]
    distribution: Record<number, number>
    averageRating: number
    totalReviews: number
  } | null>(null)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)

  const displayName = profile.full_name || profile.username || userEmail?.split("@")[0] || "Scholar"

  // Fetch top 3 badges on load
  useEffect(() => {
    fetchUserTopBadgesAction(profile.id).then((res) => {
      if (res.success) {
        setTopBadges(res.data)
      }
    })
  }, [profile.id])

  // Fetch reviews when reviews tab is active
  useEffect(() => {
    if (activeTab === "reviews" && !reviewsData && !loadingReviews) {
      setLoadingReviews(true)
      fetchUserReviewsAction(profile.id)
        .then((res) => {
          if (res.success) {
            setReviewsData({
              reviews: res.reviews,
              distribution: res.distribution,
              averageRating: res.averageRating,
              totalReviews: res.totalReviews,
            })
          }
        })
        .finally(() => setLoadingReviews(false))
    }
  }, [activeTab, profile.id, reviewsData, loadingReviews])

  // Calculate profile completeness percentage
  let completenessScore = 20 // baseline signup
  if (profile.full_name) completenessScore += 15
  if (profile.username) completenessScore += 15
  if (profile.bio) completenessScore += 15
  if (profile.avatar_url) completenessScore += 10
  if (profile.city || profile.country) completenessScore += 10
  if (profile.languages && profile.languages.length > 0) completenessScore += 5
  if (offeredSkills.length > 0) completenessScore += 5
  if (wantedSkills.length > 0) completenessScore += 5
  completenessScore = Math.min(100, completenessScore)

  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently"

  const proficiencyColors: Record<SkillProficiency, string> = {
    beginner: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    intermediate: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    advanced: "border-purple-300 bg-purple-50 text-[#4B3F72] dark:border-purple-800 dark:bg-purple-950/40 dark:text-[#A78BFA]",
    expert: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  }

  const avgRatingNum = profile.avg_rating ? Number(profile.avg_rating) : 0
  const reviewCountNum = profile.review_count || 0
  const completedCount = profile.completed_exchanges || 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Profile Header Card */}
      <Card className="card-soft overflow-hidden border-border/80">
        {/* Banner Gradient */}
        <div className="h-36 sm:h-44 w-full bg-linear-to-r from-[#4B3F72] via-[#63558f] to-[#A78BFA] relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(167,243,208,0.2),transparent_50%)]" />

          {/* Action buttons in banner */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isOwner ? (
              <Link href="/profile/edit">
                <Button
                  size="sm"
                  className="rounded-xl border border-white/30 bg-white/15 text-white hover:bg-white/25 text-xs backdrop-blur-md gap-1.5 shadow-sm"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <ConnectButton
                  targetUser={profile}
                  matchScore={matchScore}
                  matchedYouWant={matchedYouWant}
                  matchedTheyWant={matchedTheyWant}
                  currentUserId={currentUserId}
                  size="sm"
                  className="border border-white/30 bg-white/15 text-white hover:bg-white/25 backdrop-blur-md"
                />

                {currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-xl border border-white/30 bg-white/15 text-white hover:bg-white/25 backdrop-blur-md h-8 w-8"
                          aria-label="User safety options"
                        />
                      }
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem
                        onClick={() => setReportDialogOpen(true)}
                        className="text-xs gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        <span>Report Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setBlockDialogOpen(true)}
                        className="text-xs gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        <span>Block User</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Header Profile Body */}
        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-4">
            {/* Large Avatar */}
            <UserAvatar
              profile={profile}
              size="2xl"
              className="ring-4 ring-card shadow-2xl"
            />

            {/* User Type & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#A7F3D0] text-[#064E3B] font-bold text-xs uppercase px-3 py-1">
                {profile.user_type || "Student"}
              </Badge>
              {profile.is_verified && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#064E3B] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-[#A7F3D0]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-[#A7F3D0]" />
                  <span>Verified Scholar</span>
                </div>
              )}
              {!isOwner && matchScore !== undefined && matchScore !== null && (
                <MatchBadge
                  score={matchScore}
                  matchedYouWant={matchedYouWant}
                  matchedTheyWant={matchedTheyWant}
                  size="md"
                  variant="pill"
                />
              )}
            </div>
          </div>

          {/* User Identifiers & Info */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
                    {displayName}
                  </h1>
                  {profile.is_verified && <VerifiedBadge size="md" />}
                </div>
                {profile.username && (
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    @{profile.username}
                  </p>
                )}
              </div>

              {/* Top Badges Display in Header */}
              {topBadges.length > 0 && (
                <div className="flex items-center gap-2 bg-secondary/40 border border-border/60 rounded-2xl p-2 shrink-0">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                    Badges
                  </span>
                  <div className="flex items-center gap-1.5">
                    {topBadges.map((ub) => (
                      <BadgeTile
                        key={ub.badge_id}
                        name={ub.badge?.name || "Badge"}
                        description={ub.badge?.description}
                        iconName={ub.badge?.icon}
                        tier={(ub.badge?.tier as any) || "bronze"}
                        earned={true}
                        size="sm"
                      />
                    ))}
                    <Link
                      href="/achievements"
                      className="text-[11px] font-semibold text-primary hover:underline px-1"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-foreground/90 max-w-3xl leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            )}

            {/* Meta Row: Location, Languages, Join Date */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-muted-foreground pt-1">
              {(profile.city || profile.country) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {[profile.city, profile.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}

              {profile.languages && profile.languages.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Globe className="h-3.5 w-3.5 text-secondary" />
                  <span>Languages:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {profile.languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Listings Count */}
        <div className="card-soft p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Listings</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <p className="font-heading text-2xl font-bold text-foreground mt-2">
            {listings.length}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Active proposals</span>
        </div>

        {/* Completed Exchanges */}
        <div className="card-soft p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Completed</span>
            <Repeat className="h-4 w-4 text-emerald-600 dark:text-[#A7F3D0]" />
          </div>
          <p className="font-heading text-2xl font-bold text-foreground mt-2">
            {completedCount}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Peer exchanges</span>
        </div>

        {/* Rating */}
        <div className="card-soft p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Rating</span>
            <Star className="h-4 w-4 text-[#A78BFA] fill-[#A78BFA]" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="font-heading text-2xl font-bold text-foreground">
              {avgRatingNum > 0 ? avgRatingNum.toFixed(1) : "New"}
            </p>
            {avgRatingNum > 0 && <span className="text-xs text-muted-foreground">/ 5.0</span>}
          </div>
          <div className="flex items-center justify-between mt-1">
            <ReviewStars value={avgRatingNum} readOnly size="sm" />
            <span className="text-[10px] text-muted-foreground">
              {reviewCountNum} {reviewCountNum === 1 ? "review" : "reviews"}
            </span>
          </div>
        </div>

        {/* Profile Completeness / Points */}
        <div className="card-soft p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Trust & Points</span>
            <Sparkles className="h-4 w-4 text-secondary" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <p className="font-heading text-2xl font-bold text-foreground">
              {profile.points || 0}
            </p>
            <span className="text-xs font-semibold text-primary">pts</span>
          </div>
          <div className="mt-1.5">
            <Progress value={completenessScore} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs: Skills, Listings, Reviews */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "skills"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Skills Matrix ({offeredSkills.length + wantedSkills.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "listings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            <span>Active Listings ({listings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "reviews"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Star className="h-4 w-4" />
            <span>Reviews ({reviewCountNum})</span>
          </button>
        </div>

        {/* TAB 1: SKILLS */}
        {activeTab === "skills" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column A: Offers */}
            <div className="card-soft p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Skills I Offer ({offeredSkills.length})
                  </h3>
                </div>
                {isOwner && (
                  <Link href="/profile/edit">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                      Manage
                    </Button>
                  </Link>
                )}
              </div>

              {offeredSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">
                  No offered skills listed yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {offeredSkills.map((us) => (
                    <div
                      key={us.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-2xs",
                        proficiencyColors[us.proficiency || "intermediate"]
                      )}
                    >
                      <span>{us.skill?.name || "Skill"}</span>
                      <span className="opacity-60 text-[10px]">
                        • {us.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column B: Wants */}
            <div className="card-soft p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#A78BFA]" />
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Skills I Want to Learn ({wantedSkills.length})
                  </h3>
                </div>
                {isOwner && (
                  <Link href="/profile/edit">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                      Manage
                    </Button>
                  </Link>
                )}
              </div>

              {wantedSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">
                  No learning goals listed yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {wantedSkills.map((us) => (
                    <div
                      key={us.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground shadow-2xs"
                    >
                      <Sparkles className="h-3 w-3 text-secondary" />
                      <span>{us.skill?.name || "Skill"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LISTINGS */}
        {activeTab === "listings" && (
          <div>
            {listings.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No active listings published"
                description={
                  isOwner
                    ? "You haven't posted any exchange proposals yet. Create your first listing to start collaborating."
                    : `${displayName} has not published any active exchange listings yet.`
                }
                actionLabel={isOwner ? "Create a Listing" : undefined}
                onAction={
                  isOwner
                    ? () => {
                        router.push("/listings/new")
                      }
                    : undefined
                }
                className="my-6"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isOwner={isOwner}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REVIEWS */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {loadingReviews ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 card-soft">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading verified peer reviews...</span>
              </div>
            ) : !reviewsData || reviewsData.totalReviews === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Peer ratings, reviews, and testimonials will populate here once reciprocal skill exchanges are completed."
                className="my-6"
              />
            ) : (
              <>
                {/* Rating Summary Card */}
                <div className="card-soft p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Left: Overall score */}
                  <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                    <span className="font-heading text-5xl font-black text-foreground">
                      {reviewsData.averageRating.toFixed(1)}
                    </span>
                    <ReviewStars value={reviewsData.averageRating} readOnly size="lg" className="my-2" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Based on {reviewsData.totalReviews} peer {reviewsData.totalReviews === 1 ? "review" : "reviews"}
                    </span>
                  </div>

                  {/* Right: Star distribution bars in lavender */}
                  <div className="md:col-span-2 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewsData.distribution[star] || 0
                      const pct = reviewsData.totalReviews > 0 ? (count / reviewsData.totalReviews) * 100 : 0
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="w-12 font-medium text-foreground flex items-center gap-1">
                            {star} <Star className="h-3 w-3 fill-primary text-primary" />
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-secondary/80 overflow-hidden">
                            <div
                              className="h-full bg-[#A78BFA] rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsData.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="card-soft p-5 space-y-3 border-border/80 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Reviewer info */}
                        <div className="flex items-center gap-3">
                          <UserAvatar profile={rev.reviewer} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-foreground">
                                {rev.reviewer?.full_name || "Scholar"}
                              </span>
                              {rev.reviewer?.is_verified && <VerifiedBadge size="sm" />}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(rev.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Stars */}
                        <ReviewStars value={rev.rating} readOnly size="sm" />
                      </div>

                      {/* Comment */}
                      {rev.comment && (
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed pl-1">
                          "{rev.comment}"
                        </p>
                      )}

                      {/* Sub-ratings & Exchange Skill Context */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                        {rev.connection?.listing?.offered_skill && rev.connection?.listing?.wanted_skill && (
                          <div className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-0.5 text-foreground font-medium">
                            <span>Exchange:</span>
                            <span>{rev.connection.listing.offered_skill.name}</span>
                            <span>⇄</span>
                            <span>{rev.connection.listing.wanted_skill.name}</span>
                          </div>
                        )}
                        {rev.skills_rating && (
                          <span className="rounded-md bg-muted px-2 py-0.5">
                            Skill: {rev.skills_rating}★
                          </span>
                        )}
                        {rev.communication_rating && (
                          <span className="rounded-md bg-muted px-2 py-0.5">
                            Communication: {rev.communication_rating}★
                          </span>
                        )}
                        {rev.punctuality_rating && (
                          <span className="rounded-md bg-muted px-2 py-0.5">
                            Punctuality: {rev.punctuality_rating}★
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Trust & Safety Dialogs */}
      {!isOwner && (
        <>
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            reportedUserId={profile.id}
            reportedUserName={displayName}
          />
          <BlockDialog
            open={blockDialogOpen}
            onOpenChange={setBlockDialogOpen}
            userId={profile.id}
            userName={displayName}
          />
        </>
      )}
    </div>
  )
}
