"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signupSchema, type SignupInput } from "@/lib/validators"
import { signUpAction } from "@/app/(auth)/actions"
import { AuthSplitLayout } from "@/components/layout/auth-split-layout"
import { GoogleOAuthButton } from "@/components/shared/google-oauth-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, AlertCircle, MailCheck } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  const termsChecked = watch("terms")

  const onSubmit = async (data: SignupInput) => {
    try {
      setIsSubmitting(true)
      setServerError(null)

      const result = await signUpAction(data)

      if (!result.success) {
        setServerError(result.error)
        toast.error("Registration failed", {
          description: result.error,
        })
        return
      }

      if (result.requiresEmailConfirmation) {
        setConfirmationMessage(
          result.message || "Please check your inbox to confirm your email before logging in."
        )
        toast.info("Account Created!", {
          description: "Check your email for confirmation instructions.",
        })
        return
      }

      toast.success("Account created successfully!", {
        description: "Let's set up your skill exchange profile.",
      })

      const target = result.redirectUrl || "/onboarding"
      router.push(target)
      router.refresh()
    } catch (err: unknown) {
      console.error(err)
      setServerError("An unexpected error occurred during signup.")
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Join the Pairly Community
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect with peers, trade valuable skills, and grow together
          </p>
        </div>

        {serverError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {confirmationMessage ? (
          <div className="rounded-2xl border border-emerald-300/40 bg-emerald-50 dark:bg-emerald-950/30 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-[#A7F3D0]">
              <MailCheck className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Verification Email Dispatched
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {confirmationMessage}
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" className="min-h-[44px] rounded-xl text-xs w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Google OAuth Button */}
            <GoogleOAuthButton label="Sign up with Google" redirectTo="/onboarding" />

            <div className="relative flex items-center justify-center">
              <Separator className="w-full" />
              <span className="absolute bg-card px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                or register with email
              </span>
            </div>

            {/* Email Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold text-foreground">
                  Full name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Alex Morgan"
                  disabled={isSubmitting}
                  className="min-h-[44px] rounded-xl border-border bg-card/60 focus-visible:ring-primary text-sm"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs font-medium text-destructive">{errors.fullName.message}</p>
                )}
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min 8 chars + 1 number"
                    disabled={isSubmitting}
                    className="min-h-[44px] rounded-xl border-border bg-card/60 focus-visible:ring-primary text-sm"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    disabled={isSubmitting}
                    className="min-h-[44px] rounded-xl border-border bg-card/60 focus-visible:ring-primary text-sm"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="terms"
                    checked={termsChecked}
                    onCheckedChange={(checked) => setValue("terms", checked === true, { shouldValidate: true })}
                    className="mt-0.5 rounded-md"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-xs text-muted-foreground leading-snug cursor-pointer select-none"
                  >
                    I agree to the Pairly Terms of Service, Honor Code, and Community Guidelines for peer learning.
                  </Label>
                </div>
                {errors.terms && (
                  <p className="mt-1 text-xs font-medium text-destructive">{errors.terms.message}</p>
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
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </Button>
            </form>
          </>
        )}

        <div className="text-center pt-2 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
