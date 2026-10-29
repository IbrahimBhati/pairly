import React from "react"
import { Logo } from "@/components/shared/logo"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Mail } from "lucide-react"
import { signOutAction } from "@/app/(auth)/actions"

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="mb-6">
        <Logo />
      </div>

      <Card className="w-full max-w-md card-soft border-destructive/40 shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading text-destructive">
            Account Suspended
          </CardTitle>
          <CardDescription>
            Your Pairly account has been temporarily suspended due to a safety review or policy violation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground text-center">
          <p>
            If you believe this is a mistake or would like to submit an appeal, please contact the campus peer safety committee.
          </p>
          <div className="flex items-center justify-center gap-2 rounded-xl bg-accent p-3 text-xs font-medium text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <span>support@pairly-platform.edu</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <form action={signOutAction} className="w-full">
            <Button variant="outline" type="submit" className="w-full min-h-[44px] rounded-xl">
              Sign Out
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
