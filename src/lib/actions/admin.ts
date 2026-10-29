"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database, AdminAnalyticsData, UserType, UserRole, ListingStatus } from "@/types/database"

// ============================================================================
// ADMIN SECURITY & AUDIT HELPERS
// ============================================================================

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized: Please sign in as an administrator.")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, username, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    throw new Error("Forbidden: Administrator privileges required.")
  }

  return { supabase, adminUser: user, adminProfile: profile }
}

export async function logAdminAction(
  supabase: any,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, any> = {}
) {
  try {
    await supabase.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata,
    })
  } catch (err) {
    console.error("Failed to log admin action:", err)
  }
}

// ============================================================================
// 1. ADMIN ANALYTICS
// ============================================================================

export async function fetchAdminAnalyticsAction(): Promise<{
  success: boolean
  data: AdminAnalyticsData | null
  error?: string
}> {
  try {
    const { supabase } = await requireAdmin()

    // 1. Try invoking the database RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_admin_analytics" as any)

    if (!rpcError && rpcData) {
      return { success: true, data: rpcData as unknown as AdminAnalyticsData }
    }

    // 2. Resilient fallback aggregation in TypeScript if RPC not yet deployed
    const [
      { count: totalUsers },
      { count: activeListings },
      { count: completedExchanges },
      { count: openReports },
      { count: pendingVerifications },
      { data: recentProfiles },
      { data: categoriesList },
      { data: allProfiles },
      { data: offeredSkills },
      { data: wantedSkills }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("connection_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("reports").select("*", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
      supabase.from("verification_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("created_at").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from("categories").select("id, name, listings(id)"),
      supabase.from("profiles").select("user_type"),
      supabase.from("user_skills").select("skills(name)").eq("direction", "offered"),
      supabase.from("user_skills").select("skills(name)").eq("direction", "wanted"),
    ])

    // Compute user types donut
    const typeCounts: Record<string, number> = {}
    ;(allProfiles || []).forEach((p: any) => {
      const t = p.user_type || "student"
      typeCounts[t] = (typeCounts[t] || 0) + 1
    })
    const usersByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }))

    // Compute listings by category
    const listingsByCategory = (categoriesList || []).map((cat: any) => ({
      category: cat.name,
      count: Array.isArray(cat.listings) ? cat.listings.length : 0,
    })).sort((a: any, b: any) => b.count - a.count).slice(0, 8)

    // Compute 30-day signup timeline
    const daysMap: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      daysMap[label] = 0
    }
    ;(recentProfiles || []).forEach((p: any) => {
      const label = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      if (daysMap[label] !== undefined) {
        daysMap[label] += 1
      }
    })
    const newUsersDaily = Object.entries(daysMap).map(([date, count]) => ({ date, count }))

    // Compute top skills
    const countSkills = (arr: any[]) => {
      const counts: Record<string, number> = {}
      ;(arr || []).forEach((item: any) => {
        const name = item.skills?.name
        if (name) counts[name] = (counts[name] || 0) + 1
      })
      return Object.entries(counts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    }

    const fallbackData: AdminAnalyticsData = {
      total_users: totalUsers || 0,
      new_this_month: (recentProfiles || []).length,
      active_listings: activeListings || 0,
      completed_exchanges: completedExchanges || 0,
      open_reports: openReports || 0,
      pending_verifications: pendingVerifications || 0,
      users_by_type: usersByType,
      listings_by_category: listingsByCategory,
      new_users_daily: newUsersDaily,
      top_offered_skills: countSkills(offeredSkills || []),
      top_wanted_skills: countSkills(wantedSkills || []),
    }

    return { success: true, data: fallbackData }
  } catch (error: any) {
    console.error("fetchAdminAnalyticsAction error:", error)
    return { success: false, data: null, error: error.message || "Failed to load admin analytics." }
  }
}

// ============================================================================
// 2. USERS MANAGEMENT
// ============================================================================

export interface FetchAdminUsersParams {
  query?: string
  userType?: string
  isVerified?: boolean | string
  isSuspended?: boolean | string
  role?: string
  page?: number
  limit?: number
}

export async function fetchAdminUsersAction(params: FetchAdminUsersParams = {}) {
  try {
    const { supabase } = await requireAdmin()
    const {
      query = "",
      userType,
      isVerified,
      isSuspended,
      role,
      page = 1,
      limit = 20,
    } = params

    let queryBuilder = supabase
      .from("profiles")
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        user_type,
        role,
        city,
        is_verified,
        is_suspended,
        avg_rating,
        review_count,
        completed_exchanges,
        points,
        created_at
      `, { count: "exact" })

    if (query.trim()) {
      const q = `%${query.trim()}%`
      queryBuilder = queryBuilder.or(`full_name.ilike.${q},username.ilike.${q},city.ilike.${q}`)
    }

    if (userType && userType !== "all") {
      queryBuilder = queryBuilder.eq("user_type", userType as UserType)
    }

    if (isVerified !== undefined && isVerified !== "all") {
      queryBuilder = queryBuilder.eq("is_verified", isVerified === true || isVerified === "true")
    }

    if (isSuspended !== undefined && isSuspended !== "all") {
      queryBuilder = queryBuilder.eq("is_suspended", isSuspended === true || isSuspended === "true")
    }

    if (role && role !== "all") {
      queryBuilder = queryBuilder.eq("role", role as UserRole)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: users, count, error } = await queryBuilder
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    // Fetch report counts for these users
    const userIds = (users || []).map((u: any) => u.id)
    const reportCountMap: Record<string, number> = {}

    if (userIds.length > 0) {
      const { data: reportData } = await supabase
        .from("reports")
        .select("reported_user_id")
        .in("reported_user_id", userIds)

      ;(reportData || []).forEach((r: any) => {
        if (r.reported_user_id) {
          reportCountMap[r.reported_user_id] = (reportCountMap[r.reported_user_id] || 0) + 1
        }
      })
    }

    const enrichedUsers = (users || []).map((u: any) => ({
      ...u,
      report_count: reportCountMap[u.id] || 0,
    }))

    return {
      success: true,
      users: enrichedUsers,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error: any) {
    console.error("fetchAdminUsersAction error:", error)
    return { success: false, users: [], total: 0, error: error.message }
  }
}

export async function adminSuspendUserAction(data: {
  userId: string
  suspend: boolean
  reason?: string
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: data.suspend })
      .eq("id", data.userId)

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      data.suspend ? "user.suspend" : "user.reinstate",
      "user",
      data.userId,
      { reason: data.reason || "No reason provided", targetUserId: data.userId }
    )

    // Notify user if suspended
    if (data.suspend) {
      await supabase.from("notifications").insert({
        user_id: data.userId,
        type: "system",
        title: "Account Suspended",
        body: `Your Pairly account was suspended by administration. Reason: ${data.reason || "Terms violation."}`,
        link: "/suspended",
      })
    }

    revalidatePath("/admin/users")
    revalidatePath(`/u/${data.userId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update user suspension status." }
  }
}

export async function adminVerifyUserAction(data: {
  userId: string
  verify: boolean
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    const updatePayload: Database["public"]["Tables"]["profiles"]["Update"] = { is_verified: data.verify }
    if (data.verify) {
      // Award 50 points on manual verification if not already verified
      const { data: userRecord } = await supabase
        .from("profiles")
        .select("points, is_verified")
        .eq("id", data.userId)
        .single()

      if (userRecord && !userRecord.is_verified) {
        updatePayload.points = (userRecord.points || 0) + 50
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", data.userId)

    if (error) throw error

    // Call award_badges to auto-award "Verified Member" badge
    if (data.verify) {
      try {
        await (supabase.rpc as any)("award_badges", { p_user: data.userId })
      } catch (err) {
        // proceed if rpc fails
      }

      await supabase.from("notifications").insert({
        user_id: data.userId,
        type: "badge_earned",
        title: "Account Verified! 🛡️",
        body: "Your identity has been verified by Pairly administration.",
        link: "/profile",
      })
    }

    await logAdminAction(
      supabase,
      adminProfile.id,
      data.verify ? "user.verify" : "user.unverify",
      "user",
      data.userId
    )

    revalidatePath("/admin/users")
    revalidatePath(`/u/${data.userId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update verification status." }
  }
}

export async function adminChangeUserRoleAction(data: {
  userId: string
  role: UserRole
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    const { error } = await supabase
      .from("profiles")
      .update({ role: data.role })
      .eq("id", data.userId)

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      data.role === "admin" ? "user.promote_admin" : "user.demote_user",
      "user",
      data.userId,
      { newRole: data.role }
    )

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to change user role." }
  }
}

// ============================================================================
// 3. LISTINGS MANAGEMENT
// ============================================================================

export interface FetchAdminListingsParams {
  query?: string
  status?: string
  categoryId?: number | string
  page?: number
  limit?: number
}

export async function fetchAdminListingsAction(params: FetchAdminListingsParams = {}) {
  try {
    const { supabase } = await requireAdmin()
    const { query = "", status, categoryId, page = 1, limit = 20 } = params

    let queryBuilder = supabase
      .from("listings")
      .select(`
        id,
        title,
        description,
        type,
        mode,
        status,
        view_count,
        created_at,
        category:categories(id, name, icon),
        owner:profiles(id, full_name, username, avatar_url, is_verified, is_suspended)
      `, { count: "exact" })

    if (query.trim()) {
      const q = `%${query.trim()}%`
      queryBuilder = queryBuilder.or(`title.ilike.${q},description.ilike.${q}`)
    }

    if (status && status !== "all") {
      queryBuilder = queryBuilder.eq("status", status as ListingStatus)
    }

    if (categoryId && categoryId !== "all") {
      queryBuilder = queryBuilder.eq("category_id", Number(categoryId))
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: listings, count, error } = await queryBuilder
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      success: true,
      listings: listings || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error: any) {
    console.error("fetchAdminListingsAction error:", error)
    return { success: false, listings: [], total: 0, error: error.message }
  }
}

export async function adminUpdateListingStatusAction(data: {
  listingId: string
  status: ListingStatus
  reason?: string
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    const { error } = await supabase
      .from("listings")
      .update({ status: data.status })
      .eq("id", data.listingId)

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      `listing.${data.status}`,
      "listing",
      data.listingId,
      { reason: data.reason || "Status updated by admin" }
    )

    revalidatePath("/admin/listings")
    revalidatePath("/explore")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update listing status." }
  }
}

export async function adminDeleteListingAction(data: {
  listingId: string
  reason?: string
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    // Retrieve listing owner to notify
    const { data: listing } = await supabase
      .from("listings")
      .select("owner_id, title")
      .eq("id", data.listingId)
      .single()

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", data.listingId)

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      "listing.remove",
      "listing",
      data.listingId,
      { title: listing?.title, reason: data.reason || "Violated platform policy" }
    )

    if (listing?.owner_id) {
      await supabase.from("notifications").insert({
        user_id: listing.owner_id,
        type: "system",
        title: "Listing Removed",
        body: `Your listing "${listing.title}" was removed by moderation. Reason: ${data.reason || "Content policy."}`,
        link: "/my-listings",
      })
    }

    revalidatePath("/admin/listings")
    revalidatePath("/explore")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete listing." }
  }
}

// ============================================================================
// 4. REPORTS MODERATION
// ============================================================================

export interface FetchAdminReportsParams {
  status?: string
  page?: number
  limit?: number
}

export async function fetchAdminReportsAction(params: FetchAdminReportsParams = {}) {
  try {
    const { supabase } = await requireAdmin()
    const { status = "open", page = 1, limit = 20 } = params

    let queryBuilder = supabase
      .from("reports")
      .select(`
        id,
        reason,
        details,
        status,
        admin_notes,
        created_at,
        resolved_at,
        reporter:profiles!reports_reporter_id_fkey(id, full_name, username, avatar_url),
        reported_user:profiles!reports_reported_user_id_fkey(id, full_name, username, avatar_url, is_suspended, is_verified, avg_rating, review_count),
        reported_listing:listings!reports_reported_listing_id_fkey(id, title, status, description, owner_id)
      `, { count: "exact" })

    if (status && status !== "all") {
      queryBuilder = queryBuilder.eq("status", status as any)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: reports, count, error } = await queryBuilder
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    // Fetch prior reports count for targets to give admins full context
    const enrichedReports = await Promise.all(
      (reports || []).map(async (r: any) => {
        let targetPriorReports = 0
        if (r.reported_user?.id) {
          const { count: priorCount } = await supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("reported_user_id", r.reported_user.id)
          targetPriorReports = priorCount || 0
        }
        return {
          ...r,
          target_prior_reports_count: targetPriorReports,
        }
      })
    )

    return {
      success: true,
      reports: enrichedReports,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error: any) {
    console.error("fetchAdminReportsAction error:", error)
    return { success: false, reports: [], total: 0, error: error.message }
  }
}

export async function adminUpdateReportStatusAction(data: {
  reportId: string
  status: "open" | "reviewing" | "resolved" | "dismissed"
  adminNotes?: string
  actionTaken?: "suspend_user" | "remove_listing" | "warn" | "none"
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    // Fetch current report
    const { data: report } = await supabase
      .from("reports")
      .select("reporter_id, reported_user_id, reported_listing_id, reason")
      .eq("id", data.reportId)
      .single()

    if (!report) throw new Error("Report not found.")

    // Update report
    const isResolved = data.status === "resolved" || data.status === "dismissed"
    const { error } = await supabase
      .from("reports")
      .update({
        status: data.status,
        admin_notes: data.adminNotes || null,
        resolved_by: isResolved ? adminProfile.id : null,
        resolved_at: isResolved ? new Date().toISOString() : null,
      })
      .eq("id", data.reportId)

    if (error) throw error

    // Execute linked moderation action if selected
    if (data.actionTaken === "suspend_user" && report.reported_user_id) {
      await adminSuspendUserAction({
        userId: report.reported_user_id,
        suspend: true,
        reason: `Report investigation resolved: ${report.reason}`,
      })
    } else if (data.actionTaken === "remove_listing" && report.reported_listing_id) {
      await adminDeleteListingAction({
        listingId: report.reported_listing_id,
        reason: `Report investigation resolved: ${report.reason}`,
      })
    }

    // Notify reporter on resolution
    if (isResolved && report.reporter_id) {
      await supabase.from("notifications").insert({
        user_id: report.reporter_id,
        type: "system",
        title: "Report Status Update",
        body: data.status === "resolved"
          ? "Our moderation team reviewed and took action on your report. Thank you for protecting the Pairly community."
          : "Our team reviewed your report and determined no immediate violation was present.",
        link: "/dashboard",
      })
    }

    await logAdminAction(
      supabase,
      adminProfile.id,
      `report.${data.status}`,
      "report",
      data.reportId,
      { adminNotes: data.adminNotes, actionTaken: data.actionTaken }
    )

    revalidatePath("/admin/reports")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update report status." }
  }
}

// ============================================================================
// 5. VERIFICATIONS QUEUE
// ============================================================================

export interface FetchAdminVerificationsParams {
  status?: string
  page?: number
  limit?: number
}

export async function fetchAdminVerificationsAction(params: FetchAdminVerificationsParams = {}) {
  try {
    const { supabase } = await requireAdmin()
    const { status = "pending", page = 1, limit = 20 } = params

    let queryBuilder = supabase
      .from("verification_requests")
      .select(`
        id,
        method,
        document_url,
        note,
        status,
        created_at,
        reviewed_at,
        user:profiles(id, full_name, username, avatar_url, user_type, city, is_verified)
      `, { count: "exact" })

    if (status && status !== "all") {
      queryBuilder = queryBuilder.eq("status", status as any)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: verifications, count, error } = await queryBuilder
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    // Generate signed URLs for private verification documents if from verification-docs
    const enrichedVerifications = await Promise.all(
      (verifications || []).map(async (v: any) => {
        let signedUrl = v.document_url
        if (v.document_url && !v.document_url.startsWith("http")) {
          // Document path in private bucket
          const { data: signed } = await supabase.storage
            .from("verification-docs")
            .createSignedUrl(v.document_url, 3600) // 1 hour validity

          if (signed?.signedUrl) {
            signedUrl = signed.signedUrl
          }
        }
        return {
          ...v,
          preview_url: signedUrl,
        }
      })
    )

    return {
      success: true,
      verifications: enrichedVerifications,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error: any) {
    console.error("fetchAdminVerificationsAction error:", error)
    return { success: false, verifications: [], total: 0, error: error.message }
  }
}

export async function adminReviewVerificationAction(data: {
  requestId: string
  status: "approved" | "rejected"
  note?: string
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    if (data.status === "rejected" && !data.note?.trim()) {
      return { success: false, error: "A note explaining the rejection reason is required." }
    }

    const { data: request } = await supabase
      .from("verification_requests")
      .select("user_id, method")
      .eq("id", data.requestId)
      .single()

    if (!request) throw new Error("Verification request not found.")

    const { error } = await supabase
      .from("verification_requests")
      .update({
        status: data.status,
        note: data.note || null,
        reviewed_by: adminProfile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.requestId)

    if (error) throw error

    // Note: Migration 007 trigger 'trg_verification_approved' automatically sets
    // profiles.is_verified = true, awards +50 points, and calls award_badges()!
    if (data.status === "rejected") {
      await supabase.from("notifications").insert({
        user_id: request.user_id,
        type: "system",
        title: "Verification Request Update",
        body: `Your identity verification was not approved: ${data.note}. You may submit updated credentials anytime.`,
        link: "/settings/verification",
      })
    }

    await logAdminAction(
      supabase,
      adminProfile.id,
      `verification.${data.status}`,
      "verification",
      data.requestId,
      { userId: request.user_id, method: request.method, note: data.note }
    )

    revalidatePath("/admin/verifications")
    revalidatePath(`/u/${request.user_id}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to process verification." }
  }
}

// ============================================================================
// 6. REVIEWS MODERATION
// ============================================================================

export interface FetchAdminReviewsParams {
  query?: string
  minRating?: number
  maxRating?: number
  page?: number
  limit?: number
}

export async function fetchAdminReviewsAction(params: FetchAdminReviewsParams = {}) {
  try {
    const { supabase } = await requireAdmin()
    const { query = "", minRating, maxRating, page = 1, limit = 20 } = params

    let queryBuilder = supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        skills_rating,
        communication_rating,
        punctuality_rating,
        created_at,
        connection_id,
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, username, avatar_url),
        reviewee:profiles!reviews_reviewee_id_fkey(id, full_name, username, avatar_url)
      `, { count: "exact" })

    if (query.trim()) {
      queryBuilder = queryBuilder.ilike("comment", `%${query.trim()}%`)
    }

    if (minRating !== undefined) {
      queryBuilder = queryBuilder.gte("rating", minRating)
    }

    if (maxRating !== undefined) {
      queryBuilder = queryBuilder.lte("rating", maxRating)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: reviews, count, error } = await queryBuilder
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      success: true,
      reviews: reviews || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error: any) {
    console.error("fetchAdminReviewsAction error:", error)
    return { success: false, reviews: [], total: 0, error: error.message }
  }
}

export async function adminDeleteReviewAction(data: {
  reviewId: string
  reason?: string
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    // Fetch review before deletion to record in audit log
    const { data: review } = await supabase
      .from("reviews")
      .select("reviewee_id, reviewer_id, rating, comment")
      .eq("id", data.reviewId)
      .single()

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", data.reviewId)

    if (error) throw error

    // Note: Migration 008 trigger 'trg_review_deleted' automatically recomputes
    // avg_rating and review_count on profiles!

    await logAdminAction(
      supabase,
      adminProfile.id,
      "review.delete",
      "review",
      data.reviewId,
      { revieweeId: review?.reviewee_id, reviewerId: review?.reviewer_id, reason: data.reason }
    )

    revalidatePath("/admin/reviews")
    if (review?.reviewee_id) {
      revalidatePath(`/u/${review.reviewee_id}`)
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove review." }
  }
}

// ============================================================================
// 7. CATEGORIES & SKILLS MANAGEMENT
// ============================================================================

export async function fetchAdminCategoriesAndSkillsAction() {
  try {
    const { supabase } = await requireAdmin()

    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select(`
        id,
        name,
        slug,
        icon,
        description,
        created_at,
        skills(id, name, created_at)
      `)
      .order("name", { ascending: true })

    if (catError) throw catError

    // Enrich skills with usage counts
    const enrichedCategories = await Promise.all(
      (categories || []).map(async (cat: any) => {
        const enrichedSkills = await Promise.all(
          (cat.skills || []).map(async (s: any) => {
            const [
              { count: userSkillsCount },
              { count: listingsCount }
            ] = await Promise.all([
              supabase.from("user_skills").select("*", { count: "exact", head: true }).eq("skill_id", s.id),
              supabase.from("listings").select("*", { count: "exact", head: true }).or(`offered_skill_id.eq.${s.id},wanted_skill_id.eq.${s.id}`)
            ])

            return {
              ...s,
              usageCount: (userSkillsCount || 0) + (listingsCount || 0),
              userSkillsCount: userSkillsCount || 0,
              listingsCount: listingsCount || 0,
            }
          })
        )

        return {
          ...cat,
          skills: enrichedSkills,
          skillsCount: enrichedSkills.length,
        }
      })
    )

    return { success: true, categories: enrichedCategories }
  } catch (error: any) {
    console.error("fetchAdminCategoriesAndSkillsAction error:", error)
    return { success: false, categories: [], error: error.message }
  }
}

export async function adminCreateCategoryAction(data: {
  name: string
  slug: string
  icon: string
  description?: string
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    const { data: created, error } = await supabase
      .from("categories")
      .insert({
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase(),
        icon: data.icon.trim(),
        description: data.description?.trim() || null,
      })
      .select()
      .single()

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      "category.create",
      "category",
      String(created.id),
      { name: created.name }
    )

    revalidatePath("/admin/categories-skills")
    revalidatePath("/explore")
    return { success: true, category: created }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create category." }
  }
}

export async function adminUpdateCategoryAction(data: {
  id: number
  name: string
  slug: string
  icon: string
  description?: string
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    const { error } = await supabase
      .from("categories")
      .update({
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase(),
        icon: data.icon.trim(),
        description: data.description?.trim() || null,
      })
      .eq("id", data.id)

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      "category.update",
      "category",
      String(data.id),
      { name: data.name }
    )

    revalidatePath("/admin/categories-skills")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update category." }
  }
}

export async function adminDeleteCategoryAction(data: { id: number }) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    // Safety check: verify no skills or listings depend on this category
    const { count: skillCount } = await supabase
      .from("skills")
      .select("*", { count: "exact", head: true })
      .eq("category_id", data.id)

    if (skillCount && skillCount > 0) {
      return {
        success: false,
        error: `Cannot delete category: ${skillCount} skill(s) belong to this category. Delete or reassign skills first.`,
      }
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", data.id)

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      "category.delete",
      "category",
      String(data.id)
    )

    revalidatePath("/admin/categories-skills")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete category." }
  }
}

export async function adminCreateSkillAction(data: {
  name: string
  categoryId: number
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    const { data: created, error } = await supabase
      .from("skills")
      .insert({
        name: data.name.trim(),
        category_id: data.categoryId,
      })
      .select()
      .single()

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      "skill.create",
      "skill",
      String(created.id),
      { name: created.name, categoryId: data.categoryId }
    )

    revalidatePath("/admin/categories-skills")
    return { success: true, skill: created }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add skill." }
  }
}

export async function adminUpdateSkillAction(data: {
  id: number
  name: string
  categoryId?: number
}) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    const payload: Database["public"]["Tables"]["skills"]["Update"] = { name: data.name.trim() }
    if (data.categoryId) payload.category_id = data.categoryId

    const { error } = await supabase
      .from("skills")
      .update(payload)
      .eq("id", data.id)

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      "skill.update",
      "skill",
      String(data.id),
      { name: data.name }
    )

    revalidatePath("/admin/categories-skills")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update skill." }
  }
}

export async function adminDeleteSkillAction(data: { id: number }) {
  try {
    const { supabase, adminProfile } = await requireAdmin()

    // Safety check: is this skill used in user_skills or listings?
    const [
      { count: userSkillCount },
      { count: listingCount }
    ] = await Promise.all([
      supabase.from("user_skills").select("*", { count: "exact", head: true }).eq("skill_id", data.id),
      supabase.from("listings").select("*", { count: "exact", head: true }).or(`offered_skill_id.eq.${data.id},wanted_skill_id.eq.${data.id}`)
    ])

    const totalUsage = (userSkillCount || 0) + (listingCount || 0)
    if (totalUsage > 0) {
      return {
        success: false,
        error: `Safety Guard: This skill is currently in use across ${userSkillCount || 0} user profile(s) and ${listingCount || 0} listing(s). You cannot safely delete an active skill.`,
      }
    }

    const { error } = await supabase
      .from("skills")
      .delete()
      .eq("id", data.id)

    if (error) throw error

    await logAdminAction(
      supabase,
      adminProfile.id,
      "skill.delete",
      "skill",
      String(data.id)
    )

    revalidatePath("/admin/categories-skills")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove skill." }
  }
}

// ============================================================================
// 8. AUDIT LOG
// ============================================================================

export interface FetchAdminAuditLogsParams {
  action?: string
  targetType?: string
  page?: number
  limit?: number
}

export async function fetchAdminAuditLogsAction(params: FetchAdminAuditLogsParams = {}) {
  try {
    const { supabase } = await requireAdmin()
    const { action, targetType, page = 1, limit = 25 } = params

    let queryBuilder = supabase
      .from("admin_audit_log")
      .select(`
        id,
        action,
        target_type,
        target_id,
        metadata,
        created_at,
        admin:profiles(id, full_name, username, avatar_url)
      `, { count: "exact" })

    if (action && action !== "all") {
      queryBuilder = queryBuilder.ilike("action", `%${action}%`)
    }

    if (targetType && targetType !== "all") {
      queryBuilder = queryBuilder.eq("target_type", targetType)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: logs, count, error } = await queryBuilder
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      success: true,
      logs: logs || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error: any) {
    console.error("fetchAdminAuditLogsAction error:", error)
    return { success: false, logs: [], total: 0, error: error.message }
  }
}
