import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { OnboardingWizard, type CategoryWithSkills } from "./onboarding-wizard"

export const dynamic = "force-dynamic"

// Fallback seed catalog in case Supabase is in local mock mode
const FALLBACK_CATEGORIES: CategoryWithSkills[] = [
  {
    id: 1,
    name: "Programming",
    slug: "programming",
    icon: "Code",
    description: "Software engineering and development",
    created_at: new Date().toISOString(),
    skills: [
      { id: 1, category_id: 1, name: "React & Next.js", created_at: "" },
      { id: 2, category_id: 1, name: "Python & Data Science", created_at: "" },
      { id: 3, category_id: 1, name: "TypeScript & JavaScript", created_at: "" },
      { id: 4, category_id: 1, name: "Full-Stack Web Development", created_at: "" },
      { id: 5, category_id: 1, name: "Mobile App Dev (React Native/Flutter)", created_at: "" },
      { id: 6, category_id: 1, name: "SQL & Database Architecture", created_at: "" },
      { id: 7, category_id: 1, name: "Git & Version Control", created_at: "" },
      { id: 8, category_id: 1, name: "Data Structures & Algorithms", created_at: "" },
      { id: 9, category_id: 1, name: "Cloud Deployment & Docker", created_at: "" },
      { id: 10, category_id: 1, name: "REST & GraphQL APIs", created_at: "" },
    ],
  },
  {
    id: 2,
    name: "Design",
    slug: "design",
    icon: "Palette",
    description: "UI/UX, visual branding and product design",
    created_at: new Date().toISOString(),
    skills: [
      { id: 11, category_id: 2, name: "Figma UI/UX & Prototyping", created_at: "" },
      { id: 12, category_id: 2, name: "User Research & Journey Mapping", created_at: "" },
      { id: 13, category_id: 2, name: "Graphic Design (Photoshop & Illustrator)", created_at: "" },
      { id: 14, category_id: 2, name: "Design Systems & Component Libraries", created_at: "" },
      { id: 15, category_id: 2, name: "Brand Identity & Logo Crafting", created_at: "" },
      { id: 16, category_id: 2, name: "3D Modeling & Blender", created_at: "" },
      { id: 17, category_id: 2, name: "Motion Graphics & After Effects", created_at: "" },
      { id: 18, category_id: 2, name: "Typography & Layout", created_at: "" },
      { id: 19, category_id: 2, name: "Mobile App Interface Design", created_at: "" },
      { id: 20, category_id: 2, name: "Webflow & Framer Development", created_at: "" },
    ],
  },
  {
    id: 3,
    name: "Languages",
    slug: "languages",
    icon: "Languages",
    description: "Language conversation and writing",
    created_at: new Date().toISOString(),
    skills: [
      { id: 21, category_id: 3, name: "Spanish Conversational Fluency", created_at: "" },
      { id: 22, category_id: 3, name: "English Academic & Professional Writing", created_at: "" },
      { id: 23, category_id: 3, name: "French for Beginners & Travelers", created_at: "" },
      { id: 24, category_id: 3, name: "German Grammar & Conversation", created_at: "" },
      { id: 25, category_id: 3, name: "Mandarin Chinese & Pinyin", created_at: "" },
      { id: 26, category_id: 3, name: "Japanese Speaking & Kana Basics", created_at: "" },
      { id: 27, category_id: 3, name: "Arabic Language & Script Fundamentals", created_at: "" },
      { id: 28, category_id: 3, name: "Italian Everyday Conversation", created_at: "" },
      { id: 29, category_id: 3, name: "IELTS & TOEFL Test Preparation", created_at: "" },
      { id: 30, category_id: 3, name: "Korean Language & Hangul Basics", created_at: "" },
    ],
  },
  {
    id: 4,
    name: "Music",
    slug: "music",
    icon: "Music",
    description: "Instruments, vocals, and music theory",
    created_at: new Date().toISOString(),
    skills: [
      { id: 31, category_id: 4, name: "Acoustic & Electric Guitar", created_at: "" },
      { id: 32, category_id: 4, name: "Piano & Keyboard Fundamentals", created_at: "" },
      { id: 33, category_id: 4, name: "Music Theory & Ear Training", created_at: "" },
      { id: 34, category_id: 4, name: "Vocal Technique & Range Expansion", created_at: "" },
      { id: 35, category_id: 4, name: "DAW Production (Ableton/Logic)", created_at: "" },
      { id: 36, category_id: 4, name: "Songwriting & Composition", created_at: "" },
      { id: 37, category_id: 4, name: "Bass Guitar Grooves", created_at: "" },
      { id: 38, category_id: 4, name: "Drums & Percussion", created_at: "" },
      { id: 39, category_id: 4, name: "Audio Mixing & Mastering", created_at: "" },
      { id: 40, category_id: 4, name: "Violin Technique", created_at: "" },
    ],
  },
  {
    id: 5,
    name: "Academics",
    slug: "academics-and-tutoring",
    icon: "GraduationCap",
    description: "Coursework tutoring and sciences",
    created_at: new Date().toISOString(),
    skills: [
      { id: 41, category_id: 5, name: "Calculus & Linear Algebra", created_at: "" },
      { id: 42, category_id: 5, name: "General & Organic Chemistry", created_at: "" },
      { id: 43, category_id: 5, name: "Physics & Classical Mechanics", created_at: "" },
      { id: 44, category_id: 5, name: "Academic Research & Thesis Writing", created_at: "" },
      { id: 45, category_id: 5, name: "Probability & Applied Statistics", created_at: "" },
      { id: 46, category_id: 5, name: "Cell Biology & Genetics", created_at: "" },
      { id: 47, category_id: 5, name: "Micro & Macroeconomics", created_at: "" },
      { id: 48, category_id: 5, name: "Standardized Testing (GRE/GMAT)", created_at: "" },
    ],
  },
  {
    id: 6,
    name: "Business",
    slug: "business-and-career",
    icon: "Briefcase",
    description: "Career development, resume reviews, finance",
    created_at: new Date().toISOString(),
    skills: [
      { id: 51, category_id: 6, name: "Resume & LinkedIn Optimization", created_at: "" },
      { id: 52, category_id: 6, name: "Technical & Behavioral Interviews", created_at: "" },
      { id: 53, category_id: 6, name: "Digital Marketing & Growth", created_at: "" },
      { id: 54, category_id: 6, name: "Product Management Foundations", created_at: "" },
      { id: 55, category_id: 6, name: "Public Speaking & Presentations", created_at: "" },
      { id: 56, category_id: 6, name: "Financial Modeling & Excel", created_at: "" },
    ],
  },
]

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentUser()

  // If user already completed onboarding, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect("/dashboard")
  }

  // Fetch categories and skills from Supabase
  let categories: CategoryWithSkills[] = FALLBACK_CATEGORIES

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("categories")
      .select("*, skills(*)")
      .order("id")

    if (!error && data && data.length > 0) {
      categories = data as unknown as CategoryWithSkills[]
    }
  } catch (err) {
    console.warn("Using fallback categories for onboarding:", err)
  }

  const initialUsername = profile?.username || user?.email?.split("@")[0] || ""
  const initialFullName = profile?.full_name || (user?.user_metadata?.full_name as string) || ""
  const initialAvatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string) || ""

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Top Navigation */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo href="/" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Skill Exchange Setup
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Wizard */}
      <main className="px-4 sm:px-6">
        <OnboardingWizard
          initialUsername={initialUsername}
          initialFullName={initialFullName}
          initialAvatarUrl={initialAvatarUrl}
          categories={categories}
        />
      </main>
    </div>
  )
}
