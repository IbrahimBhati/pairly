"use client"

import React from "react"
import Link from "next/link"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { MatchBadge } from "@/components/shared/match-badge"
import { SkillChip } from "@/components/shared/skill-chip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, ChevronRight, Repeat } from "lucide-react"
import type { PersonMatchItem } from "@/components/shared/person-card"

interface RecommendedRowProps {
  recommendedPeers: PersonMatchItem[]
}

export function RecommendedRow({ recommendedPeers }: RecommendedRowProps) {
  if (!recommendedPeers || recommendedPeers.length === 0) {
    return null
  }

  const topMatches = recommendedPeers.slice(0, 6)

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A78BFA]/20 text-secondary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Recommended for You
            </h2>
            <p className="text-xs text-muted-foreground">
              Top reciprocal learning partners matched with your offered &amp; wanted skills.
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Row */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none pt-1">
        {topMatches.map((peer) => (
          <div
            key={peer.user_id}
            className="card-soft shrink-0 w-72 sm:w-80 p-4.5 flex flex-col justify-between hover:shadow-md transition-all group"
          >
            <div>
              {/* Header: User Avatar, Info & Match Badge */}
              <div className="flex items-start justify-between gap-2.5 mb-3">
                <Link
                  href={`/u/${peer.username || peer.user_id}`}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <UserAvatar
                    profile={{
                      avatar_url: peer.avatar_url,
                      full_name: peer.full_name,
                      username: peer.username,
                    }}
                    size="sm"
                  />
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1">
                      <p className="font-heading text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {peer.full_name || peer.username}
                      </p>
                      {peer.is_verified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      @{peer.username}
                    </p>
                  </div>
                </Link>

                <MatchBadge
                  score={peer.score}
                  matchedYouWant={peer.matched_you_want}
                  matchedTheyWant={peer.matched_they_want}
                  size="sm"
                  variant="ring"
                />
              </div>

              {/* Match Highlights */}
              <div className="space-y-1.5 mb-3 bg-accent/30 rounded-xl p-2.5 border border-border/60 text-xs">
                {peer.matched_you_want.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-[11px] truncate">
                    <span className="text-[10px] font-bold uppercase text-[#064E3B] dark:text-[#A7F3D0] shrink-0">
                      Offers:
                    </span>
                    <span className="font-semibold text-foreground truncate">
                      {peer.matched_you_want.join(", ")}
                    </span>
                  </div>
                ) : (
                  peer.top_offered_skills.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] truncate">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">
                        Offers:
                      </span>
                      <span className="text-foreground truncate">
                        {peer.top_offered_skills[0]}
                      </span>
                    </div>
                  )
                )}

                {peer.matched_they_want.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-[11px] truncate">
                    <span className="text-[10px] font-bold uppercase text-[#4B3F72] dark:text-[#A78BFA] shrink-0">
                      Wants:
                    </span>
                    <span className="font-semibold text-foreground truncate">
                      {peer.matched_they_want.join(", ")}
                    </span>
                  </div>
                ) : (
                  peer.top_wanted_skills.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] truncate">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">
                        Wants:
                      </span>
                      <span className="text-foreground truncate">
                        {peer.top_wanted_skills[0]}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Bottom Link */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="text-[10px] text-muted-foreground capitalize">
                {peer.user_type || "Student"}
              </span>

              <Link
                href={`/u/${peer.username || peer.user_id}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                <span>View Match</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
