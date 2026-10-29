import React from "react"
import Link from "next/link"
import { fetchAdminAnalyticsAction } from "@/lib/actions/admin"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { OverviewCharts } from "@/components/admin/overview-charts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  UserPlus,
  FileText,
  Repeat,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  const { data: analytics, error } = await fetchAdminAnalyticsAction()

  const safeAnalytics = analytics || {
    total_users: 0,
    new_this_month: 0,
    active_listings: 0,
    completed_exchanges: 0,
    open_reports: 0,
    pending_verifications: 0,
    users_by_type: [],
    listings_by_category: [],
    new_users_daily: [],
    top_offered_skills: [],
    top_wanted_skills: [],
  }

  const kpis = [
    {
      title: "Total Members",
      value: safeAnalytics.total_users,
      icon: Users,
      trend: `+${safeAnalytics.new_this_month} this month`,
      trendPositive: true,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/users",
    },
    {
      title: "Active Listings",
      value: safeAnalytics.active_listings,
      icon: FileText,
      trend: "Peer exchange catalog",
      color: "text-secondary",
      bg: "bg-secondary/15",
      href: "/admin/listings",
    },
    {
      title: "Completed Exchanges",
      value: safeAnalytics.completed_exchanges,
      icon: Repeat,
      trend: "Mutual peer sessions",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/admin/listings",
    },
    {
      title: "Open Reports",
      value: safeAnalytics.open_reports,
      icon: AlertTriangle,
      trend: safeAnalytics.open_reports > 0 ? "Requires review" : "Queue clear",
      trendAlert: safeAnalytics.open_reports > 0,
      color: safeAnalytics.open_reports > 0 ? "text-rose-600" : "text-muted-foreground",
      bg: safeAnalytics.open_reports > 0 ? "bg-rose-500/10" : "bg-muted/30",
      href: "/admin/reports",
    },
    {
      title: "Pending Verifications",
      value: safeAnalytics.pending_verifications,
      icon: ShieldCheck,
      trend: safeAnalytics.pending_verifications > 0 ? "Awaiting review" : "Up to date",
      trendAlert: safeAnalytics.pending_verifications > 0,
      color: safeAnalytics.pending_verifications > 0 ? "text-amber-600" : "text-muted-foreground",
      bg: safeAnalytics.pending_verifications > 0 ? "bg-amber-500/10" : "bg-muted/30",
      href: "/admin/verifications",
    },
    {
      title: "Monthly Growth",
      value: `+${safeAnalytics.new_this_month}`,
      icon: UserPlus,
      trend: "New scholars (30d)",
      trendPositive: true,
      color: "text-[#A78BFA]",
      bg: "bg-[#A78BFA]/10",
      href: "/admin/users",
    },
  ]

  return (
    <div className="min-h-screen pb-16">
      <AdminTopbar
        title="Admin Overview"
        subtitle="Real-time platform metrics, member growth, and trust safety queues"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8">
        {error && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
            Notice: Displaying cached platform aggregates. Reason: {error}
          </div>
        )}

        {/* 1. KPI Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <Link key={kpi.title} href={kpi.href}>
                <Card className="card-soft hover:shadow-md transition-all hover:border-primary/40 h-full cursor-pointer">
                  <CardHeader className="pb-1 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {kpi.title}
                    </span>
                    <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-1">
                    <div className="text-2xl font-bold font-heading text-foreground">
                      {kpi.value}
                    </div>
                    <p
                      className={`text-[11px] font-medium mt-1 ${
                        kpi.trendAlert
                          ? "text-rose-600 dark:text-rose-400 font-semibold"
                          : kpi.trendPositive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {kpi.trend}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* 2. Priority Moderation Alerts */}
        {(safeAnalytics.open_reports > 0 || safeAnalytics.pending_verifications > 0) && (
          <div className="p-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Action Items Requiring Administrator Attention</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                You have {safeAnalytics.open_reports} unresolved safety report(s) and{" "}
                {safeAnalytics.pending_verifications} pending verification request(s).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {safeAnalytics.open_reports > 0 && (
                <Link href="/admin/reports">
                  <Button size="sm" variant="destructive" className="rounded-xl text-xs gap-1.5">
                    <span>Resolve Reports ({safeAnalytics.open_reports})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
              {safeAnalytics.pending_verifications > 0 && (
                <Link href="/admin/verifications">
                  <Button size="sm" className="rounded-xl text-xs gap-1.5 bg-primary text-primary-foreground">
                    <span>Review Docs ({safeAnalytics.pending_verifications})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* 3. Recharts Analytics Suite */}
        <OverviewCharts analytics={safeAnalytics} />
      </div>
    </div>
  )
}
