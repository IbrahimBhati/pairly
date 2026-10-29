"use client"

import React, { useEffect, useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import type { AdminAnalyticsData } from "@/types/database"
import { TrendingUp, PieChart as PieIcon, BarChart3, Award, Sparkles } from "lucide-react"

interface OverviewChartsProps {
  analytics: AdminAnalyticsData
}

// Brand color palette
const COLORS = {
  deepPurple: "#4B3F72",
  lavender: "#A78BFA",
  mint: "#10B981",
  amber: "#F59E0B",
  sky: "#38BDF8",
  rose: "#F43F5E",
}

const PIE_COLORS = [
  "#4B3F72", // Deep Purple
  "#A78BFA", // Lavender
  "#10B981", // Mint
  "#F59E0B", // Amber
]

export function OverviewCharts({ analytics }: OverviewChartsProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark" || theme === "dark"
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
  const axisTextColor = isDark ? "#94A3B8" : "#64748B"
  const tooltipBg = isDark ? "#1E1B2E" : "#FFFFFF"
  const tooltipBorder = isDark ? "#3B3254" : "#E2E8F0"
  const tooltipText = isDark ? "#F8FAFC" : "#0F172A"

  if (!mounted) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-80 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-80 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-80 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-80 rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    )
  }

  const customTooltipFormatter = (value: any, name: any) => [value, name]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 1. 30-Day User Growth Line Chart */}
      <Card className="card-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-bold font-heading">
                User Signups (Last 30 Days)
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              +{analytics.new_this_month} this month
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Daily pace of new scholars and peers joining Pairly
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.new_users_daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: axisTextColor, fontSize: 10 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axisTextColor, fontSize: 10 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: "12px",
                    color: tooltipText,
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                  }}
                  formatter={customTooltipFormatter}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Signups"
                  stroke={COLORS.lavender}
                  strokeWidth={3}
                  dot={{ fill: COLORS.deepPurple, r: 3, stroke: COLORS.lavender, strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: COLORS.mint }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Listings By Category Bar Chart */}
      <Card className="card-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-secondary" />
              <CardTitle className="text-base font-bold font-heading">
                Active Listings by Category
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {analytics.active_listings} Active
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Distribution of skill listings across primary categories
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.listings_by_category} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: axisTextColor, fontSize: 9 }}
                  angle={-25}
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axisTextColor, fontSize: 10 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: "12px",
                    color: tooltipText,
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                  }}
                  formatter={customTooltipFormatter}
                />
                <Bar
                  dataKey="count"
                  name="Active Listings"
                  fill={COLORS.deepPurple}
                  radius={[6, 6, 0, 0]}
                >
                  {(analytics.listings_by_category || []).map((_, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={index % 2 === 0 ? COLORS.deepPurple : COLORS.lavender}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Users By Type Donut Chart */}
      <Card className="card-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-base font-bold font-heading">
                Member Composition by Type
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {analytics.total_users} Total
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Students, teachers, professionals, and community members
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.users_by_type}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {(analytics.users_by_type || []).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: "12px",
                    color: tooltipText,
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} members (${analytics.total_users > 0 ? Math.round((Number(val) / analytics.total_users) * 100) : 0}%)`,
                    String(name).toUpperCase(),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {(analytics.users_by_type || []).map((entry, idx) => (
              <div key={entry.type} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="capitalize text-muted-foreground">{entry.type}:</span>
                <span className="font-semibold text-foreground">{entry.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Top Skills Offered vs Wanted */}
      <Card className="card-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base font-bold font-heading">
                Top In-Demand Skills
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Matching Demand
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Most frequently taught and sought-after skills across Pairly
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Tabs defaultValue="offered" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl mb-3">
              <TabsTrigger value="offered" className="rounded-lg text-xs font-semibold">
                Offered by Peers
              </TabsTrigger>
              <TabsTrigger value="wanted" className="rounded-lg text-xs font-semibold">
                Wanted by Scholars
              </TabsTrigger>
            </TabsList>

            <TabsContent value="offered" className="space-y-2 mt-0">
              {(analytics.top_offered_skills || []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No skills registered yet.</p>
              ) : (
                (analytics.top_offered_skills || []).slice(0, 5).map((item, idx) => (
                  <div
                    key={item.skill}
                    className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate">
                        {item.skill}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 font-semibold">
                      {item.count} peers
                    </Badge>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="wanted" className="space-y-2 mt-0">
              {(analytics.top_wanted_skills || []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No wanted skills recorded yet.</p>
              ) : (
                (analytics.top_wanted_skills || []).slice(0, 5).map((item, idx) => (
                  <div
                    key={item.skill}
                    className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/20 text-[10px] font-bold text-secondary shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate">
                        {item.skill}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-semibold">
                      {item.count} learners
                    </Badge>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
