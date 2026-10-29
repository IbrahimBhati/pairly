"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validators"
import { resetPasswordAction } from "@/app/(auth)/actions"
import { AuthSplitLayout } from "@/components/layout/auth-split-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsSubmitting(true)
      setServerError(null)

      const result = await resetPasswordAction(data)

      if (!result.success) {
        setServerError(result.error)
        toast.error("Password update failed", {
          description: result.error,
        })
        return
      }

      setIsDone(true)
      toast.success("Password updated!", {
        description: "Redirecting to your dashboard...",
      })

      setTimeout(() => {
        router.push(result.redirectUrl || "/dashboard")
        router.refresh()
      }, 1500)
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
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new secure password below to regain full access
          </p>
        </div>

        {serverError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {isDone ? (
          <div className="rounded-2xl border border-emerald-300/40 bg-emerald-50 dark:bg-emerald-950/30 p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-[#A7F3D0]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Password Changed Successfully
            </h3>
            <p className="text-xs text-muted-foreground">
              Taking you to your Pairly Dashboard now...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                New password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min 8 chars with 1 number"
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
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat new password"
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] rounded-xl bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  )
}
