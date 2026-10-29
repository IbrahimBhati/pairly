"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Repeat,
  MessageSquare,
  Trophy,
  ArrowRight,
  Check,
  ShieldCheck,
  Layers,
} from "lucide-react"

const TOUR_STEPS = [
  {
    title: "Welcome to Pairly!",
    badge: "Step 1 of 4",
    icon: Sparkles,
    iconBg: "bg-primary/10 text-primary",
    heading: "Share Skills. Help Others. Grow Together.",
    description:
      "Pairly is a university-level peer skill exchange platform. Exchange knowledge directly without money — learn a skill from a peer while sharing your own expertise in return.",
    tip: "Tip: Add at least 3 skills to your profile to maximize match recommendations.",
  },
  {
    title: "Smart Matching Algorithm",
    badge: "Step 2 of 4",
    icon: Repeat,
    iconBg: "bg-secondary/15 text-secondary",
    heading: "Reciprocal Compatibility Matching",
    description:
      "Our matching engine pairs you with peers where your offered skills match what they want to learn, and their offered skills match what you want to learn.",
    tip: "Explore matches on the Explore page with 0-100% reciprocal match percentages.",
  },
  {
    title: "Connections & Real-time Chat",
    badge: "Step 3 of 4",
    icon: MessageSquare,
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    heading: "Collaborate & Learn in Real-Time",
    description:
      "Send connection requests with introductory notes, schedule tutoring sessions, and chat live with built-in presence and safety filters.",
    tip: "Mutual exchange completion unlocks post-exchange reviews and trust points.",
  },
  {
    title: "Gamification & Reputation",
    badge: "Step 4 of 4",
    icon: Trophy,
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    heading: "Earn Badges & Level Up to Legend",
    description:
      "Complete exchanges, receive 5-star reviews, and verify your student ID to earn badges, climb the leaderboard, and build verified academic trust.",
    tip: "Visit Settings > Verification to upload your student credentials anytime.",
  },
]

export function ProductTour() {
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    try {
      const tourSeen = localStorage.getItem("pairly_product_tour_completed")
      if (!tourSeen) {
        // Small delay so dashboard finishes loading
        const timer = setTimeout(() => {
          setOpen(true)
        }, 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // Ignore localstorage errors
    }
  }, [])

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    try {
      localStorage.setItem("pairly_product_tour_completed", "true")
    } catch {
      // ignore
    }
    setOpen(false)
  }

  if (!open) return null

  const current = TOUR_STEPS[stepIndex]
  const Icon = current.icon

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleComplete()}>
      <DialogContent className="rounded-3xl max-w-md p-6 border-border shadow-2xl bg-card">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
              {current.badge}
            </Badge>
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === stepIndex
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className={`p-3 rounded-2xl ${current.iconBg} shrink-0`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="font-heading text-lg font-bold text-foreground">
                {current.heading}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">{current.title}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {current.description}
          </DialogDescription>

          <div className="p-3 rounded-2xl bg-primary/5 border border-primary/15 text-xs text-foreground font-medium flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{current.tip}</span>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleComplete}
            className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
          >
            Skip Tour
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground min-w-[100px]"
          >
            {stepIndex === TOUR_STEPS.length - 1 ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Get Started</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
