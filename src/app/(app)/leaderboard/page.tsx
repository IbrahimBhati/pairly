import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { fetchLeaderboardAction } from "@/lib/actions/gamification";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ReviewStars } from "@/components/shared/review-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Flame,
  Medal,
  Award,
  Star,
  Repeat,
  ArrowLeft,
  Crown,
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface LeaderboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { period: periodParam } = await searchParams;
  const period = periodParam === "month" ? "month" : "all_time";

  const { success, entries, currentUserRank } = await fetchLeaderboardAction(period);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/achievements"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mr-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Achievements</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Trophy className="h-4 w-4" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Community Leaderboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Top academic exchange contributors and trusted skill mentors across Pairly.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-2xl border border-border/60 self-start sm:self-auto">
          <Link
            href="/leaderboard?period=all_time"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === "all_time"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Time
          </Link>
          <Link
            href="/leaderboard?period=month"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === "month"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            This Month
          </Link>
        </div>
      </div>

      {/* Current User Highlight Banner */}
      {currentUserRank && (
        <div className="card-soft p-4 sm:p-5 border-primary/30 bg-primary/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-sm shrink-0">
              #{currentUserRank.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Your Current Standing
                </span>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
                  {currentUserRank.levelInfo.tierName}
                </Badge>
              </div>
              <h3 className="font-heading font-bold text-base text-foreground">
                Rank #{currentUserRank.rank} • {currentUserRank.points} Points
              </h3>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
            <span>{currentUserRank.completedExchanges} exchanges</span>
            <span>•</span>
            <ReviewStars value={currentUserRank.avgRating} readOnly size="sm" />
          </div>
        </div>
      )}

      {/* Top 20 Entries List */}
      <div className="card-soft overflow-hidden border-border/80">
        <div className="divide-y divide-border/60">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No entries found for this period.
            </div>
          ) : (
            entries.map((entry) => {
              const isFirst = entry.rank === 1;
              const isSecond = entry.rank === 2;
              const isThird = entry.rank === 3;

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 sm:px-6 transition-colors ${
                    entry.isCurrentUser
                      ? "bg-primary/10 font-medium"
                      : "hover:bg-muted/30"
                  }`}
                >
                  {/* Left: Rank & User */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {isFirst ? (
                        <Crown className="h-6 w-6 text-amber-500 fill-amber-500" />
                      ) : isSecond ? (
                        <Medal className="h-6 w-6 text-slate-400 fill-slate-400" />
                      ) : isThird ? (
                        <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />
                      ) : (
                        <span className="font-mono text-sm font-bold text-muted-foreground">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/u/${entry.userId}`}
                      className="flex items-center gap-3 min-w-0 group"
                    >
                      <UserAvatar
                        profile={{
                          id: entry.userId,
                          full_name: entry.fullName,
                          avatar_url: entry.avatarUrl,
                        }}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {entry.fullName}
                          </span>
                          {entry.isCurrentUser && (
                            <span className="text-[10px] font-bold text-primary uppercase">
                              (You)
                            </span>
                          )}
                        </div>
                        {entry.headline && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {entry.headline}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Right: Stats & Points */}
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-right">
                    <div className="hidden sm:block text-right">
                      <div className="text-xs font-semibold text-foreground">
                        {entry.completedExchanges} {entry.completedExchanges === 1 ? "trade" : "trades"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {entry.avgRating > 0 ? `${entry.avgRating.toFixed(1)}★ rating` : "New"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-heading text-base sm:text-lg font-black text-foreground">
                        {entry.points}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                        pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
