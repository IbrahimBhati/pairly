"use client"

import React from "react"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { Sparkles, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-xs transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              Pairly is a university-level peer-to-peer skill exchange platform designed to bridge knowledge gaps across students, educators, professionals, and community builders.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Phase 1 Database & Design System Active
              </span>
            </div>
          </div>

          {/* Column 1: Platform */}
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase font-heading">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#smart-matching" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  Smart Matching
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Core</span>
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#audiences" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Communities
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Communities */}
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase font-heading">
              Exchange Tracks
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <span className="text-sm text-muted-foreground">Student-to-Student</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Teacher-to-Teacher</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Professional-to-Professional</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Community Help</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Project Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase font-heading">
              Project
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <span className="text-sm text-muted-foreground">University Major Project</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Next.js & Supabase SSR</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Tailwind CSS & Shadcn UI</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Open Architecture</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom banner */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Pairly Platform. All rights reserved. Share Skills. Help Others. Grow Together.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Built with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> for collaborative peer learning.
          </p>
        </div>
      </div>
    </footer>
  )
}
