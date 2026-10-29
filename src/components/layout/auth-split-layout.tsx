"use client"

import React from "react"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Sparkles, Quote, CheckCircle2, ArrowLeft } from "lucide-react"

interface AuthSplitLayoutProps {
  children: React.ReactNode
  backHref?: string
  backLabel?: string
}

export function AuthSplitLayout({
  children,
  backHref = "/",
  backLabel = "Back to home",
}: AuthSplitLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 bg-background">
      {/* Top bar controls */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4 px-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>{backLabel}</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Split Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-border bg-card shadow-2xl overflow-hidden min-h-[620px]">
        {/* Left Brand Panel */}
        <div className="lg:col-span-5 gradient-brand relative p-8 sm:p-10 flex flex-col justify-between text-white overflow-hidden">
          {/* Ambient Glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#A7F3D0]/20 blur-3xl"
          />

          <div className="relative z-10 space-y-6">
            <Logo href="/" className="brightness-110" />

            <div className="space-y-3 pt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#A7F3D0]" />
                University Major Project
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                Share Skills. <br />
                Help Others. <br />
                <span className="text-[#A7F3D0]">Grow Together.</span>
              </h2>
              <p className="text-xs sm:text-sm text-purple-100 leading-relaxed max-w-sm">
                Pairly pairs what you offer with what you want to learn through mutual bilateral matching.
              </p>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="relative z-10 mt-8 rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-[#A7F3D0]">
              <Quote className="h-4 w-4 fill-[#A7F3D0]" />
              <span className="text-[11px] font-bold uppercase tracking-wider">94% Mutual Match</span>
            </div>
            <p className="text-xs text-white/95 italic leading-relaxed">
              &ldquo;I offered 3 weeks of React & Next.js frontend mentoring and matched with an Organic Chemistry tutor. We both aced our finals without spending a dime.&rdquo;
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-purple-200">
              <span className="font-semibold text-white">Elena S.</span>
              <span>CS &amp; Pre-Med &bull; 3rd Year</span>
            </div>
          </div>

          {/* Value Prop Checklist */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/15 grid grid-cols-1 gap-2 text-xs text-purple-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#A7F3D0]" />
              <span>Smart Bilateral Match Algorithm</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#A7F3D0]" />
              <span>100% Free Peer Exchange</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-card">
          <div className="mx-auto w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
