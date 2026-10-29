import React from "react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { fetchExplorePeopleAction } from "@/lib/actions/explore"
import { fetchUserAchievementsAction } from "@/lib/actions/gamification"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ListingCard } from "@/components/shared/listing-card"
import { MatchBadge } from "@/components/shared/match-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { SkillChip } from "@/components/shared/skill-chip"
import { BadgeTile } from "@/components/shared/badge-tile"
import { ReviewStars } from "@/components/shared/review-stars"
import { ProductTour } from "@/components/shared/product-tour"
import {
  Sparkles,
  Repeat,
  Star,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Compass,
  Layers,
  Plus,
  Users,
  ChevronRight,
} from "lucide-react"
import type { ListingWithDetails } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUser()

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    profile?.username ||
    user?.email?.split("@")[0] ||
    "Scholar"

  const supabase = await createClient()

  // 1. Fetch user's active listings count and recent listings
  let activeListingsCount = 0
  let recentListings: ListingWithDetails[] = []

  if (user) {
    try {
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(`
          *,
          category:categories(*),
          offered_skill:skills!listings_offered_skill_id_fkey(*),
          wanted_skill:skills!listings_wanted_skill_id_fkey(*),
          owner:profiles!listings_owner_id_fkey(*)
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (!listingsError && listingsData) {
        const all = listingsData as unknown as ListingWithDetails[]
        activeListingsCount = all.filter((l) => l.status === "active").length
        recentListings = all.slice(0, 3)
      } else {
        const { data: relaxedData } = await supabase
          .from("listings")
          .select(`
            *,
            category:categories(*),
            offered_skill:skills!offered_skill_id(*),
            wanted_skill:skills!wanted_skill_id(*),
            owner:profiles!owner_id(*)
          `)
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })

        if (relaxedData) {
          const all = relaxedData as unknown as ListingWithDetails[]
          activeListingsCount = all.filter((l) => l.status === "active").length
          recentListings = all.slice(0, 3)
        }
      }
    } catch (err) {
      console.error("Dashboard error fetching listings:", err)
    }
  }

  // 2. Fetch Top Smart Matches (People scoring with our algorithm)
  const { people: topMatches } = await fetchExplorePeopleAction({ limit: 8 })
  const matchesAbove60Count = topMatches.filter((p) => p.score >= 60).length
  const highestMatchScore = topMatches[0]?.score || (matchesAbove60Count > 0 ? 85 : 0)

  // 3. Real Profile Completeness calculation
  let completenessScore = 20
  if (profile?.full_name) completenessScore += 15
  if (profile?.username) completenessScore += 15
  if (profile?.bio) completenessScore += 15
  if (profile?.avatar_url) completenessScore += 10
  if (profile?.city || profile?.country) completenessScore += 10
  if (profile?.languages && profile.languages.length > 0) completenessScore += 5
  if (activeListingsCount > 0) completenessScore += 10
  completenessScore = Math.min(100, completenessScore)

  // 4. Gamification & Progress
  const { data: achievements } = user
    ? await fetchUserAchievementsAction(user.id)
    : { data: undefined }
  const nextBadgeToUnlock = achievements?.allBadges.find((b) => !b.earned)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="gradient-brand relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 right-1/3 h-48 w-48 rounded-full bg-[#A7F3D0]/20 blur-2xl"
        />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-md">
              {profile?.user_type ? `${profile.user_type.toUpperCase()} TRACK` : "PEER TRACK"}
            </Badge>
            {profile?.username && (
              <span className="text-xs text-purple-200 font-mono">@{profile.username}</span>
            )}
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {firstName}!
          </h1>

          <p className="text-sm text-purple-100 leading-relaxed">
            Your reciprocal skill matrix is active. Pairly has computed bilateral match scores with peers across the university network.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/explore">
              <Button
                size="sm"
                className="h-10 px-4 rounded-xl bg-white text-[#4B3F72] hover:bg-slate-100 font-bold text-xs gap-1.5 shadow-sm"
              >
                <Compass className="h-4 w-4" />
                <span>Explore Bilateral Matches</span>
              </Button>
            </Link>
            <Link href="/listings/new">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 font-medium text-xs backdrop-blur-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Listing</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Three Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Stat 1: Real Active Listings Count */}
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                My Active Listings
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground mt-1">
              {activeListingsCount} {activeListingsCount === 1 ? "Listing" : "Listings"}
            </CardTitle>
            <CardDescription className="text-xs">
              Live exchange proposals published
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link
              href="/listings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Manage all listings</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Stat 2: Real Smart Matches (Scoring 60+) */}
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Smart Matches
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A78BFA]/20 text-secondary">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground mt-1">
              {matchesAbove60Count} {matchesAbove60Count === 1 ? "Peer" : "Peers"}
            </CardTitle>
            <CardDescription className="text-xs">
              Peers with 60%+ reciprocal compatibility
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#A7F3D0] text-[#064E3B] font-bold text-[11px] border-0">
                {highestMatchScore > 0 ? `${highestMatchScore}% Top Match` : "Matches Ready"}
              </Badge>
              <Link
                href="/explore?tab=people&match=60"
                className="text-[11px] text-primary hover:underline font-semibold ml-auto"
              >
                View all
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stat 3: Real Peer Rating */}
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Peer Rating
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA]">
                <Star className="h-4 w-4 fill-current" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground mt-1">
              {(profile?.avg_rating ? Number(profile.avg_rating) : 0) > 0
                ? `${Number(profile?.avg_rating).toFixed(1)} / 5.0`
                : "New Member"}
            </CardTitle>
            <CardDescription className="text-xs">
              {profile?.review_count || 0} verified peer {profile?.review_count === 1 ? "review" : "reviews"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center justify-between">
              <ReviewStars
                value={profile?.avg_rating ? Number(profile.avg_rating) : 0}
                readOnly
                size="sm"
              />
              <Link
                href="/profile"
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                View reviews
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Progress Card */}
      {achievements && (
        <Card className="card-soft overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-card to-emerald-500/5 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: Level & Points */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#4B3F72] to-[#A78BFA] text-white flex items-center justify-center font-heading font-black text-xl shrink-0 shadow-sm">
                  L{achievements.levelInfo.currentLevel}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Level {achievements.levelInfo.currentLevel} • {achievements.levelInfo.tierName}
                    </span>
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
                      {achievements.levelInfo.totalPoints} pts
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 w-64 max-w-full">
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#4B3F72] to-[#A78BFA]"
                        style={{ width: `${achievements.levelInfo.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      {achievements.levelInfo.pointsToNextLevel} pts to L{achievements.levelInfo.currentLevel + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle: Next Badge to Unlock */}
              {nextBadgeToUnlock && (
                <div className="flex items-center gap-3 bg-secondary/50 border border-border/80 rounded-2xl p-3 shrink-0">
                  <BadgeTile
                    name={nextBadgeToUnlock.name}
                    iconName={nextBadgeToUnlock.icon}
                    tier={nextBadgeToUnlock.tier}
                    earned={false}
                    size="sm"
                  />
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Next Badge to Unlock
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      {nextBadgeToUnlock.name}
                    </div>
                    <div className="text-[11px] text-primary">
                      {nextBadgeToUnlock.progressHint}
                    </div>
                  </div>
                </div>
              )}

              {/* Right: Link to Achievements */}
              <Link href="/achievements" className="shrink-0 self-start md:self-center">
                <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 border-primary/20 hover:bg-primary/5">
                  <span>View Progress</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TOP MATCHES FOR YOU (Top 5 People) */}
      {topMatches.length > 0 && (
        <Card className="card-soft overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-heading text-foreground">
                    Top Matches for You
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Peers whose skills and learning interests align reciprocally with yours.
                  </CardDescription>
                </div>
              </div>

              <Link href="/explore?tab=people">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1 text-primary">
                  <span>Explore all</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-border/60">
            {topMatches.slice(0, 5).map((peer) => (
              <div
                key={peer.user_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-accent/40 transition-colors"
              >
                {/* Peer Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    profile={{
                      avatar_url: peer.avatar_url,
                      full_name: peer.full_name,
                      username: peer.username,
                    }}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/u/${peer.username || peer.user_id}`}
                        className="font-heading text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
                      >
                        {peer.full_name || peer.username}
                      </Link>
                      {peer.is_verified && <VerifiedBadge size="sm" />}
                      <Badge className="text-[10px] uppercase font-bold bg-[#A7F3D0] text-[#064E3B] px-1.5 py-0">
                        {peer.user_type || "Student"}
                      </Badge>
                    </div>

                    {/* Skill hints */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
                      {peer.matched_you_want.length > 0 ? (
                        <span className="truncate">
                          Offers:{" "}
                          <span className="font-semibold text-foreground">
                            {peer.matched_you_want.slice(0, 2).join(", ")}
                          </span>
                        </span>
                      ) : (
                        peer.top_offered_skills.length > 0 && (
                          <span className="truncate">
                            Offers: {peer.top_offered_skills[0]}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Score & View Button */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <MatchBadge
                    score={peer.score}
                    matchedYouWant={peer.matched_you_want}
                    matchedTheyWant={peer.matched_they_want}
                    size="md"
                    variant="ring"
                  />

                  <Link href={`/u/${peer.username || peer.user_id}`}>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1 h-8 font-semibold">
                      <span>View</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Listings Section */}
      {recentListings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Your Published Listings
              </h2>
              <p className="text-xs text-muted-foreground">
                Recent exchange proposals published on the marketplace.
              </p>
            </div>
            <Link href="/listings">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1 text-primary">
                <span>View all ({recentListings.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isOwner={true}
                currentUserId={user?.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Profile Completeness Progress Card */}
      <Card className="card-soft">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  Profile Optimization
                </Badge>
                <span className="text-xs font-bold text-foreground">
                  {completenessScore}% Complete
                </span>
              </div>
              <CardTitle className="text-lg font-bold font-heading text-foreground mt-1.5">
                Strengthen Your Skill Match Reach
              </CardTitle>
              <CardDescription className="text-xs">
                Profiles with detailed bios and 2+ offered skills receive 3x more reciprocal invitations.
              </CardDescription>
            </div>
            <Link href="/profile/edit">
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 shrink-0">
                <span>Edit Profile</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={completenessScore} className="h-2 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-[#A7F3D0] shrink-0" />
              <span>Handle &amp; Bio Configured</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-[#A7F3D0] shrink-0" />
              <span>
                {activeListingsCount > 0 ? "Active Listings Published" : "Publish an Exchange Listing"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-medium">
              <BookOpen className="h-4 w-4 text-secondary shrink-0" />
              <span>Add languages &amp; locations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* First-time onboarding product tour */}
      <ProductTour />
    </div>
  )
}
