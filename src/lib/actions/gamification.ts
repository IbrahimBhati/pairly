"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { UserBadgeWithDetails, calculateUserLevel, UserLevelInfo } from "@/types/database";

export interface UserGamificationProfile {
  levelInfo: UserLevelInfo;
  completedExchanges: number;
  reviewCount: number;
  avgRating: number;
  trustScore: number;
  badges: UserBadgeWithDetails[];
  allBadges: Array<{
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    tier: "bronze" | "silver" | "gold";
    criteria: Record<string, any>;
    earned: boolean;
    earned_at?: string;
    progressHint?: string;
  }>;
}

export async function fetchUserAchievementsAction(userId?: string): Promise<{
  success: boolean;
  data?: UserGamificationProfile;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Authentication required" };
      }
      targetUserId = user.id;
    }

    // 1. Fetch user profile stats
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, points, completed_exchanges, review_count, avg_rating, trust_score, is_verified")
      .eq("id", targetUserId)
      .single();

    if (profileErr || !profile) {
      return { success: false, error: "Profile not found" };
    }

    // 2. Fetch all system badges
    const { data: allBadges, error: badgesErr } = await supabase
      .from("badges")
      .select("*")
      .order("id", { ascending: true });

    if (badgesErr) {
      return { success: false, error: badgesErr.message };
    }

    // 3. Fetch user's earned badges
    const { data: userBadges, error: userBadgesErr } = await supabase
      .from("user_badges")
      .select("user_id, badge_id, earned_at, badge:badges(*)")
      .eq("user_id", targetUserId);

    if (userBadgesErr) {
      return { success: false, error: userBadgesErr.message };
    }

    const earnedBadgeMap = new Map<number, string>();
    (userBadges || []).forEach((ub: any) => {
      earnedBadgeMap.set(ub.badge_id, ub.earned_at);
    });

    const levelInfo = calculateUserLevel(profile.points || 0);

    // Compute progress hints for locked badges
    const badgesWithStatus = (allBadges || []).map((b) => {
      const isEarned = earnedBadgeMap.has(b.id);
      let progressHint: string | undefined = undefined;

      if (!isEarned) {
        const criteria = (b.criteria as Record<string, any>) || {};
        if (criteria.type === "completed_exchanges") {
          const current = profile.completed_exchanges || 0;
          const target = criteria.count || 1;
          progressHint = `${Math.min(current, target)} of ${target} exchanges completed`;
        } else if (criteria.type === "avg_rating") {
          const currentRating = profile.avg_rating || 0;
          const currentReviews = profile.review_count || 0;
          progressHint = `${currentReviews}/${criteria.min_reviews || 5} reviews (${currentRating.toFixed(1)}/5.0 avg)`;
        } else if (criteria.type === "is_verified") {
          progressHint = profile.is_verified ? "Pending badge trigger" : "Complete identity verification";
        } else if (criteria.type === "profile_completeness") {
          progressHint = "Fill all profile details and add 3+ skills";
        } else if (criteria.type === "help_offer_exchanges") {
          progressHint = `${profile.completed_exchanges || 0} of ${criteria.count || 3} community offers`;
        } else {
          progressHint = "Locked";
        }
      }

      return {
        id: b.id,
        slug: b.slug,
        name: b.name,
        description: b.description,
        icon: b.icon,
        tier: b.tier as "bronze" | "silver" | "gold",
        criteria: (b.criteria as Record<string, any>) || {},
        earned: isEarned,
        earned_at: earnedBadgeMap.get(b.id),
        progressHint,
      };
    });

    return {
      success: true,
      data: {
        levelInfo,
        completedExchanges: profile.completed_exchanges || 0,
        reviewCount: profile.review_count || 0,
        avgRating: profile.avg_rating ? Number(profile.avg_rating) : 0,
        trustScore: profile.trust_score || 0,
        badges: (userBadges || []) as unknown as UserBadgeWithDetails[],
        allBadges: badgesWithStatus,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load achievements" };
  }
}

export async function fetchUserTopBadgesAction(userId: string): Promise<{
  success: boolean;
  data: UserBadgeWithDetails[];
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_badges")
      .select("user_id, badge_id, earned_at, badge:badges(*)")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })
      .limit(3);

    if (error) {
      return { success: false, data: [] };
    }

    return { success: true, data: (data || []) as unknown as UserBadgeWithDetails[] };
  } catch {
    return { success: false, data: [] };
  }
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  points: number;
  completedExchanges: number;
  avgRating: number;
  levelInfo: UserLevelInfo;
  isCurrentUser: boolean;
}

export async function fetchLeaderboardAction(period: "all_time" | "month" = "all_time"): Promise<{
  success: boolean;
  entries: LeaderboardEntry[];
  currentUserRank?: LeaderboardEntry;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Query top 20 profiles ordered by points
    const { data: topProfiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio, points, completed_exchanges, avg_rating")
      .order("points", { ascending: false })
      .limit(20);

    if (error) {
      return { success: false, entries: [], error: error.message };
    }

    const currentUserId = user?.id;
    let currentUserRank: LeaderboardEntry | undefined = undefined;

    const entries: LeaderboardEntry[] = (topProfiles || []).map((p: any, index: number) => {
      const isCurrent = p.id === currentUserId;
      const entry: LeaderboardEntry = {
        rank: index + 1,
        userId: p.id,
        fullName: p.full_name || "Community Member",
        avatarUrl: p.avatar_url,
        headline: p.bio,
        points: p.points || 0,
        completedExchanges: p.completed_exchanges || 0,
        avgRating: p.avg_rating ? Number(p.avg_rating) : 0,
        levelInfo: calculateUserLevel(p.points || 0),
        isCurrentUser: isCurrent,
      };

      if (isCurrent) {
        currentUserRank = entry;
      }
      return entry;
    });

    // If current user is not in top 20, fetch their individual rank
    if (currentUserId && !currentUserRank) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, points, completed_exchanges, avg_rating")
        .eq("id", currentUserId)
        .single();

      if (myProfile) {
        // Count how many have more points
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gt("points", (myProfile as any).points || 0);

        const myP = myProfile as any;
        currentUserRank = {
          rank: (count || 0) + 1,
          userId: myP.id,
          fullName: myP.full_name || "You",
          avatarUrl: myP.avatar_url,
          headline: myP.bio,
          points: myP.points || 0,
          completedExchanges: myP.completed_exchanges || 0,
          avgRating: myP.avg_rating ? Number(myP.avg_rating) : 0,
          levelInfo: calculateUserLevel(myP.points || 0),
          isCurrentUser: true,
        };
      }
    }

    return {
      success: true,
      entries,
      currentUserRank,
    };
  } catch (err: any) {
    return { success: false, entries: [], error: err.message || "Failed to fetch leaderboard" };
  }
}
