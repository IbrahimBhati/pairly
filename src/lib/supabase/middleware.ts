import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/types/database"

// Routes that require authentication
const APP_PROTECTED_ROUTES = [
  "/dashboard",
  "/explore",
  "/my-listings",
  "/connections",
  "/messages",
  "/profile",
  "/settings",
  "/achievements",
  "/leaderboard",
  "/verify",
  "/matches",
  "/exchanges",
  "/skills",
]

const ADMIN_ROUTES = ["/admin"]

const AUTH_PAGES = ["/login", "/signup", "/forgot-password"]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const { pathname } = request.nextUrl

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If environment variables are missing or placeholders, pass through during build
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("placeholder-pairly") ||
    supabaseAnonKey.includes("placeholder")
  ) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isAppRoute = APP_PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
    const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
    const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/")
    const isAuthRoute = AUTH_PAGES.some((route) => pathname.startsWith(route))
    const isSuspendedRoute = pathname === "/suspended"

    // 1. Unauthenticated users hitting protected routes
    if (!user) {
      if (isAppRoute || isAdminRoute || isOnboardingRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // 2. Fetch profile status for authenticated user
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_suspended, onboarding_completed, role")
      .eq("id", user.id)
      .maybeSingle()

    // 3. Suspended account handling
    if (profile?.is_suspended) {
      if (!isSuspendedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/suspended"
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // If user is on /suspended but is not suspended, redirect to dashboard
    if (isSuspendedRoute && !profile?.is_suspended) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // 4. Authenticated users hitting login or signup
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      if (profile && !profile.onboarding_completed) {
        url.pathname = "/onboarding"
      } else {
        url.pathname = "/dashboard"
      }
      return NextResponse.redirect(url)
    }

    // 4.5 Admin route protection: only users with role='admin' can enter /admin
    if (isAdminRoute && profile?.role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // 5. Onboarding checks
    if (profile && !profile.onboarding_completed) {
      // Must complete onboarding before accessing app or admin routes
      if (isAppRoute || isAdminRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/onboarding"
        return NextResponse.redirect(url)
      }
    } else if (profile?.onboarding_completed && isOnboardingRoute) {
      // Already completed onboarding, go straight to dashboard
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("Middleware session error:", error)
    return supabaseResponse
  }
}
