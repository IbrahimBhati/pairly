import { UserType, SkillProficiency } from "@/types/database"

export const APP_CONFIG = {
  name: "Pairly",
  tagline: "Share Skills. Help Others. Grow Together.",
  description:
    "A peer-to-peer skill exchange platform connecting students, educators, professionals, and community members with smart mutual matching.",
  version: "1.0.0",
}

export const USER_TYPES: {
  value: UserType
  label: string
  description: string
  badgeColor: string
}[] = [
  {
    value: "student",
    label: "Student",
    description: "Exchange academic subjects, exam preparation, and campus projects with peers.",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    value: "teacher",
    label: "Teacher / Educator",
    description: "Collaborate on lesson plans, teaching strategies, curriculum design, and pedagogy.",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Trade career mentorship, industry skills, portfolio reviews, and tech expertise.",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    value: "community",
    label: "Community Member",
    description: "Offer neighborly help, language exchange, arts, cooking, and everyday skills.",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
]

export const PROFICIENCY_LEVELS: {
  value: SkillProficiency
  label: string
  description: string
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Basic knowledge and concepts, still learning fundamentals.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Comfortable with practical applications and independent tasks.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Deep hands-on experience and able to guide others effectively.",
  },
  {
    value: "expert",
    label: "Expert",
    description: "Mastery level with extensive professional or academic depth.",
  },
]

export const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Community", href: "#community" },
  { label: "Smart Matching", href: "#smart-matching" },
]

export const CATEGORIES_PREVIEW = [
  { name: "Programming", icon: "Code", slug: "programming", count: "10 skills" },
  { name: "Design", icon: "Palette", slug: "design", count: "10 skills" },
  { name: "Languages", icon: "Languages", slug: "languages", count: "10 skills" },
  { name: "Music", icon: "Music", slug: "music", count: "10 skills" },
  { name: "Academics", icon: "GraduationCap", slug: "academics-and-tutoring", count: "10 skills" },
  { name: "Business", icon: "Briefcase", slug: "business-and-career", count: "10 skills" },
  { name: "Fitness", icon: "Activity", slug: "fitness-and-wellness", count: "10 skills" },
  { name: "Cooking", icon: "Utensils", slug: "cooking", count: "10 skills" },
  { name: "Arts & Crafts", icon: "Brush", slug: "arts-and-crafts", count: "10 skills" },
  { name: "Community Help", icon: "HeartHandshake", slug: "community-help", count: "10 skills" },
]
