import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSiteUrl } from "@/lib/utils"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const siteUrl = getSiteUrl()

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user has finished onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .maybeSingle()

      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(`${siteUrl}/onboarding`)
      }

      const targetPath = next.startsWith("/") ? next : `/${next}`
      return NextResponse.redirect(`${siteUrl}${targetPath}`)
    }
  }

  // Return the user to an error page or login with error instructions
  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_failed`)
}
