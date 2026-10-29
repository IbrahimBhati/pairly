"use client"

import React from "react"
import Link from "next/link"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { MatchBadge } from "@/components/shared/match-badge"
import { SkillChip } from "@/components/shared/skill-chip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, ArrowRight, Star } from "lucide-react"
import { ConnectButton } from "@/components/shared/connect-button"
import type { UserType } from "@/types/database"

export interface PersonMatchItem {
  user_id: string
  username: string
  full_name: string
  avatar_url: string | null
  user_type: UserType
  is_verified: boolean
  city: string | null
  country: string | null
  bio: string | null
  score: number
  matched_you_want: string[]
  matched_they_want: string[]
  top_offered_skills: string[]
  top_wanted_skills: string[]
  avg_rating?: number | null
  review_count?: number | null
}

interface PersonCardProps {
  person: PersonMatchItem
  currentUserId?: string | null
}

export function PersonCard({ person, currentUserId }: PersonCardProps) {
  const profileMock = {
    id: person.user_id,
    avatar_url: person.avatar_url,
    full_name: person.full_name,
    username: person.username,
    is_verified: person.is_verified,
    user_type: person.user_type,
  }

  return (
    <div className="card-soft group relative flex flex-col justify-between overflow-hidden p-5 transition-all">
      {/* Top Header: Avatar, Name & Match Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link
            href={`/u/${person.username || person.user_id}`}
            className="flex items-center gap-3 min-w-0 group/profile"
          >
            <UserAvatar profile={profileMock} size="md" showVerified={false} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-heading text-sm font-bold text-foreground group-hover/profile:text-primary transition-colors truncate">
                  {person.full_name || person.username || "Scholar"}
                </h3>
                {person.is_verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-[11px] font-mono text-muted-foreground truncate">
                @{person.username}
              </p>
            </div>
          </Link>

          {/* Match Score Badge with Popover */}
          <MatchBadge
            score={person.score}
            matchedYouWant={person.matched_you_want}
            matchedTheyWant={person.matched_they_want}
            size="md"
            variant="ring"
          />
        </div>

        {/* User Type & Location Chips + Compact Rating */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge className="bg-[#A7F3D0] text-[#064E3B] font-bold text-[10px] uppercase px-2 py-0.5">
            {person.user_type || "Student"}
          </Badge>

          {person.avg_rating !== undefined && person.avg_rating !== null && Number(person.avg_rating) > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A78BFA] bg-secondary/60 rounded-full px-2 py-0.5">
              <Star className="h-3 w-3 fill-current text-[#A78BFA]" />
              <span>{Number(person.avg_rating).toFixed(1)}</span>
              {person.review_count ? (
                <span className="text-[10px] text-muted-foreground font-normal">
                  ({person.review_count})
                </span>
              ) : null}
            </span>
          )}

          {(person.city || person.country) && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">
                {[person.city, person.country].filter(Boolean).join(", ")}
              </span>
            </span>
          )}
        </div>

        {/* Bio */}
        {person.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
            {person.bio}
          </p>
        )}

        {/* Skills Offered & Wanted */}
        <div className="space-y-2 mb-4">
          {person.top_offered_skills && person.top_offered_skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                Offers:
              </span>
              {person.top_offered_skills.map((skill) => (
                <SkillChip key={skill} name={skill} direction="offered" size="sm" />
              ))}
            </div>
          )}

          {person.top_wanted_skills && person.top_wanted_skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                Wants:
              </span>
              {person.top_wanted_skills.map((skill) => (
                <SkillChip key={skill} name={skill} direction="wanted" size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground truncate">
          {person.matched_you_want.length > 0
            ? `${person.matched_you_want.length} skills match`
            : "Reciprocal match"}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link href={`/u/${person.username || person.user_id}`}>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs gap-1 h-8 px-2.5 font-semibold hover:bg-accent transition-all"
            >
              <span>Profile</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <ConnectButton
            targetUser={profileMock}
            matchScore={person.score}
            matchedYouWant={person.matched_you_want}
            matchedTheyWant={person.matched_they_want}
            currentUserId={currentUserId}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}
