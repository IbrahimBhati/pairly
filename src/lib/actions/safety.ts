"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "scam"
  | "fake_profile"
  | "other";

export interface SubmitReportInput {
  reportedUserId?: string;
  reportedListingId?: string;
  reason: ReportReason;
  details: string;
}

export async function submitReportAction(input: SubmitReportInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    if (!input.reportedUserId && !input.reportedListingId) {
      return { success: false, error: "Must specify a user or a listing to report" };
    }

    if (input.reportedUserId === user.id) {
      return { success: false, error: "You cannot report your own profile" };
    }

    // Check for existing open/reviewing report from this user on this target
    let query = supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .in("status", ["open", "reviewing"]);

    if (input.reportedUserId) {
      query = query.eq("reported_user_id", input.reportedUserId);
    }
    if (input.reportedListingId) {
      query = query.eq("reported_listing_id", input.reportedListingId);
    }

    const { data: existingReports } = await query;
    if (existingReports && existingReports.length > 0) {
      return {
        success: false,
        error: "You have already submitted an active report for this item. Our moderation team is reviewing it.",
      };
    }

    const { error: insertErr } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: input.reportedUserId || null,
      reported_listing_id: input.reportedListingId || null,
      reason: input.reason,
      details: input.details.trim(),
      status: "open",
    });

    if (insertErr) {
      return { success: false, error: insertErr.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit report" };
  }
}

export async function blockUserAction(blockedUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    if (user.id === blockedUserId) {
      return { success: false, error: "You cannot block yourself" };
    }

    const { error } = await supabase.from("blocks").upsert(
      {
        blocker_id: user.id,
        blocked_id: blockedUserId,
      },
      { onConflict: "blocker_id,blocked_id" }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/messages");
    revalidatePath("/explore");
    revalidatePath("/connections");
    revalidatePath(`/profile/${blockedUserId}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to block user" };
  }
}

export async function unblockUserAction(blockedUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedUserId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/messages");
    revalidatePath("/explore");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to unblock user" };
  }
}

export interface BlockedUserItem {
  blockedId: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  blockedAt: string;
}

export async function fetchBlockedUsersAction(): Promise<{
  success: boolean;
  data: BlockedUserItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, data: [], error: "Authentication required" };
    }

    const { data, error } = await supabase
      .from("blocks")
      .select("blocked_id, created_at, blocked:profiles!blocks_blocked_id_fkey(id, full_name, avatar_url, headline)")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const formatted: BlockedUserItem[] = (data || []).map((item: any) => ({
      blockedId: item.blocked_id,
      fullName: item.blocked?.full_name || "User",
      avatarUrl: item.blocked?.avatar_url || null,
      headline: item.blocked?.headline || null,
      blockedAt: item.created_at,
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || "Failed to fetch blocked users" };
  }
}

export type VerificationMethod =
  | "student_id"
  | "institution_email"
  | "professional_link"
  | "government_id";

export interface VerificationRequestInput {
  method: VerificationMethod;
  documentUrl?: string;
  note?: string;
}

export async function submitVerificationRequestAction(
  input: VerificationRequestInput
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Check if already verified
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (profile?.is_verified) {
      return { success: false, error: "Your identity is already verified!" };
    }

    // Check for existing pending request
    const { data: existing } = await supabase
      .from("verification_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "You already have a pending verification request in review.",
      };
    }

    const { error: insertErr } = await supabase.from("verification_requests").insert({
      user_id: user.id,
      method: input.method,
      document_url: input.documentUrl || null,
      note: input.note?.trim() || null,
      status: "pending",
    });

    if (insertErr) {
      return { success: false, error: insertErr.message };
    }

    revalidatePath("/settings/verification");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit verification request" };
  }
}

export async function fetchVerificationStatusAction(): Promise<{
  success: boolean;
  isVerified: boolean;
  latestRequest?: {
    id: string;
    method: VerificationMethod;
    documentUrl: string | null;
    note: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    reviewedAt: string | null;
  } | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, isVerified: false, latestRequest: null, error: "Not logged in" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    const isVerified = Boolean(profile?.is_verified);

    const { data: requests, error } = await supabase
      .from("verification_requests")
      .select("id, method, document_url, note, status, created_at, reviewed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return { success: true, isVerified, latestRequest: null };
    }

    const latest = requests && requests[0] ? {
      id: requests[0].id,
      method: requests[0].method as VerificationMethod,
      documentUrl: requests[0].document_url,
      note: requests[0].note,
      status: requests[0].status as "pending" | "approved" | "rejected",
      createdAt: requests[0].created_at,
      reviewedAt: requests[0].reviewed_at,
    } : null;

    return {
      success: true,
      isVerified,
      latestRequest: latest,
    };
  } catch (err: any) {
    return { success: false, isVerified: false, latestRequest: null, error: err.message };
  }
}
