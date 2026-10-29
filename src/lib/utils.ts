import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves the active base site URL for redirects, OAuth callbacks, and emails.
 * Order of precedence:
 * 1. NEXT_PUBLIC_SITE_URL (explicitly configured production domain)
 * 2. VERCEL_URL (automatically populated by Vercel for preview & production deployments)
 * 3. http://localhost:3000 (local development fallback)
 */
export function getSiteUrl(): string {
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (!siteUrl && process.env.NEXT_PUBLIC_VERCEL_URL) {
    siteUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  } else if (!siteUrl && process.env.VERCEL_URL) {
    siteUrl = `https://${process.env.VERCEL_URL}`
  }

  if (!siteUrl) {
    siteUrl = "http://localhost:3000"
  }

  // Strip trailing slashes
  return siteUrl.replace(/\/+$/, "")
}
