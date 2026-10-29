import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
})

function validateEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    console.error(`\n❌ [Pairly Environment Error] Invalid environment configuration:\n${errorMessages}\n`)
    throw new Error(
      `Pairly environment validation failed. Check your .env.local file or Vercel environment variables:\n${errorMessages}`
    )
  }

  return parsed.data
}

export const env = validateEnv()
