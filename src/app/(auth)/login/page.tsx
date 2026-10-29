"use client"

import React, { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validators"
import { signInAction } from "@/app/(auth)/actions"
import { AuthSplitLayout } from "@/components/layout/auth-split-layout"
import { GoogleOAuthButton } from "@/components/shared/google-oauth-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, AlertCircle } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const urlError = searchParams.get("error")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(
    urlError === "auth_callback_failed"
      ? "Authentication callback failed. Please try signing in again."
      : null
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsSubmitting(true)
      setServerError(null)

      const result = await signInAction(data)

      if (!result.success) {
        setServerError(result.error)
        toast.error("Sign in failed", {
          description: result.error,
        })
        return
      }

      toast.success("Welcome back!", {
        description: "Successfully signed in to Pairly.",
      })

      const target = result.redirectUrl || redirectTo
      router.push(target)
      router.refresh()
    } catch (err: unknown) {
      console.error(err)
      setServerError("An unexpected error occurred. Please try again.")
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Sign In to Pairly
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your credentials to access your peer exchange network
        </p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <GoogleOAuthButton label="Sign in with Google" redirectTo={redirectTo} />

      <div className="relative flex items-center justify-center">
        <Separator className="w-full" />
        <span className="absolute bg-card px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          or continue with email
        </span>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="alex@university.edu"
            disabled={isSubmitting}
            className="min-h-[44px] rounded-xl border-border bg-card/60 focus-visible:ring-primary text-sm"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isSubmitting}
            className="min-h-[44px] rounded-xl border-border bg-card/60 focus-visible:ring-primary text-sm"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[44px] rounded-xl bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] dark:hover:bg-[#906ef8] font-semibold text-sm shadow-md shadow-[#4B3F72]/20 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-border/60">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  )
}
