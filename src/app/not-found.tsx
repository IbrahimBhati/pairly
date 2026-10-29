import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { Compass, Home, Search, Sparkles } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center mb-4">
          <Logo href="/" />
        </div>

        <div className="space-y-2">
          <span className="text-6xl sm:text-7xl font-extrabold font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#4B3F72] via-[#A78BFA] to-[#10B981] dark:from-[#A78BFA] dark:to-[#10B981]">
            404
          </span>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Exchange Path Not Found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page, peer profile, or skill exchange listing you requested may have moved, expired, or doesn’t exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-2 bg-primary text-primary-foreground min-h-[42px]">
              <Home className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>

          <Link href="/explore" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-2 min-h-[42px]">
              <Compass className="h-4 w-4 text-secondary" />
              <span>Explore Listings</span>
            </Button>
          </Link>
        </div>

        <div className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span>Pairly — Share Skills. Help Others. Grow Together.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
