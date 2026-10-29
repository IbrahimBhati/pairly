import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { fetchUserAchievementsAction } from "@/lib/actions/gamification";
import { BadgeTile } from "@/components/shared/badge-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Flame,
  Star,
  Repeat,
  Compass,
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { success, data } = await fetchUserAchievementsAction(user.id);

  if (!success || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Could not load achievements</h2>
        <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  const { levelInfo, badges, allBadges, completedExchanges, reviewCount, avgRating } = data;

  const earnedCount = allBadges.filter((b) => b.earned).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Trophy className="h-4 w-4" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Achievements & Reputation
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Earn experience points by exchanging skills, leaving verified reviews, and building campus trust.
          </p>
        </div>

        <Link href="/leaderboard">
          <Button
            variant="outline"
            className="rounded-xl text-xs font-semibold gap-2 border-primary/20 hover:bg-primary/5"
          >
            <Flame className="h-4 w-4 text-amber-500" />
            <span>Community Leaderboard</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </Link>
      </div>

      {/* 1. Level & Progress Hero Card */}
      <Card className="card-soft overflow-hidden border-border bg-card shadow-lg relative">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Level Hexagon / Circle */}
              <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#4B3F72] to-[#A78BFA] text-white shadow-md shrink-0">
                <span className="font-heading text-2xl sm:text-3xl font-black">
                  L{levelInfo.currentLevel}
                </span>
                <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
                  {levelInfo.tierName}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Current Rank
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  {levelInfo.tierName} Scholar
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {levelInfo.totalPoints} total points earned across {completedExchanges} exchanges
                </p>
              </div>
            </div>

            {/* Quick Stat Pill */}
            <div className="flex items-center gap-6 bg-secondary/40 border border-border/80 rounded-2xl p-4 shrink-0">
              <div className="text-center">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Badges</span>
                <p className="font-heading text-lg font-bold text-foreground">
                  {earnedCount}/{allBadges.length}
                </p>
              </div>
              <div className="h-8 w-px bg-border/80" />
              <div className="text-center">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Exchanges</span>
                <p className="font-heading text-lg font-bold text-foreground">{completedExchanges}</p>
              </div>
              <div className="h-8 w-px bg-border/80" />
              <div className="text-center">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Reviews</span>
                <p className="font-heading text-lg font-bold text-foreground">{reviewCount}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar to Next Level */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">
                Progress to Level {levelInfo.currentLevel + 1} ({levelInfo.nextTierName})
              </span>
              <span className="text-primary font-mono">
                {levelInfo.pointsToNextLevel > 0
                  ? `${levelInfo.pointsToNextLevel} pts needed`
                  : "Max Tier Achieved"}
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-secondary/80 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4B3F72] via-[#7B61FF] to-[#A78BFA] transition-all duration-500 shadow-xs"
                style={{ width: `${levelInfo.progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{levelInfo.currentLevelMinPoints} pts</span>
              <span>{levelInfo.nextLevelMinPoints} pts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Badge Collection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Badges & Milestones ({earnedCount}/{allBadges.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Unlock distinct honorary badges for your profile as you collaborate with peers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allBadges.map((badge) => {
            const isEarned = badge.earned;
            return (
              <div
                key={badge.id}
                className={`card-soft p-5 flex flex-col justify-between transition-all duration-200 border ${
                  isEarned
                    ? "border-emerald-300/80 bg-card dark:border-emerald-800/60 shadow-xs"
                    : "border-border/60 bg-muted/20 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <BadgeTile
                      name={badge.name}
                      description={badge.description}
                      iconName={badge.icon}
                      tier={badge.tier}
                      earned={isEarned}
                      size="lg"
                    />

                    {isEarned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5">
                        <Lock className="h-3 w-3" />
                        Locked
                      </span>
                    )}
                  </div>

                  <h4 className="font-heading font-bold text-sm text-foreground mb-1">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-border/50 text-[11px]">
                  {isEarned && badge.earned_at ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Earned on {new Date(badge.earned_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-mono">
                      {badge.progressHint || "Milestone required"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Points Rules & Level System Guide */}
      <div className="card-soft p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-heading text-base font-bold text-foreground">
            How Points & Reputation Work
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-background border border-border/80 space-y-1">
            <div className="text-xs font-semibold text-primary uppercase">+20 Points</div>
            <div className="text-sm font-bold text-foreground">Completed Exchange</div>
            <p className="text-xs text-muted-foreground">
              Awarded automatically to both peers upon mutual completion confirmation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/80 space-y-1">
            <div className="text-xs font-semibold text-primary uppercase">+5 Points</div>
            <div className="text-sm font-bold text-foreground">Review Given</div>
            <p className="text-xs text-muted-foreground">
              Awarded for leaving feedback to support community trust and safety.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/80 space-y-1">
            <div className="text-xs font-semibold text-primary uppercase">+10 Points</div>
            <div className="text-sm font-bold text-foreground">5-Star Rating Received</div>
            <p className="text-xs text-muted-foreground">
              Delivered when your learning partner rates your exchange 5 stars.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/80 space-y-1">
            <div className="text-xs font-semibold text-primary uppercase">+50 Points</div>
            <div className="text-sm font-bold text-foreground">Identity Verified</div>
            <p className="text-xs text-muted-foreground">
              Unlock the verified student/scholar badge and a one-time +50 points boost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
