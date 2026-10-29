"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators"
import { forgotPasswordAction } from "@/app/(auth)/actions"
import { AuthSplitLayout } from "@/components/layout/auth-split-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, MailCheck, AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsSubmitting(true)
      setServerError(null)

      const result = await forgotPasswordAction(data)

      if (!result.success) {
        setServerError(result.error)
        toast.error("Request failed", {
          description: result.error,
        })
        return
      }

      setSuccessMessage(
        result.message || "A secure reset link has been dispatched to your email."
      )
      toast.success("Reset link sent!", {
        description: "Check your email inbox for instructions.",
      })
    } catch (err: unknown) {
      console.error(err)
      setServerError("An unexpected error occurred. Please try again.")
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout backHref="/login" backLabel="Back to login">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your account email to receive a password recovery link
          </p>
        </div>

        {serverError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-300/40 bg-emerald-50 dark:bg-emerald-950/30 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-[#A7F3D0]">
              <MailCheck className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Check Your Inbox
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {successMessage}
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] rounded-xl bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </Button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
