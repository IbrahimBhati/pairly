"use client"

import React, { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { completeOnboardingAction } from "./actions"
import { checkUsernameAvailability } from "@/app/(auth)/actions"
import { createClient } from "@/lib/supabase/client"
import { UserType, SkillProficiency, Category, Skill } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  GraduationCap,
  Users,
  Briefcase,
  HeartHandshake,
  Check,
  Upload,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Search,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface CategoryWithSkills extends Category {
  skills: Skill[]
}

interface OnboardingWizardProps {
  initialUsername?: string
  initialFullName?: string
  initialAvatarUrl?: string
  categories: CategoryWithSkills[]
}

const COMMON_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Arabic",
  "Japanese",
  "Italian",
  "Portuguese",
  "Hindi",
  "Russian",
  "Korean",
]

const USER_TYPE_CARDS: {
  type: UserType
  title: string
  subtitle: string
  icon: React.ElementType
}[] = [
  {
    type: "student",
    title: "Student",
    subtitle: "Coursework, exam study groups, term projects, and academic peer help",
    icon: GraduationCap,
  },
  {
    type: "teacher",
    title: "Teacher / Educator",
    subtitle: "Pedagogy, lesson plans, teaching strategies, and cross-discipline methods",
    icon: Users,
  },
  {
    type: "professional",
    title: "Professional",
    subtitle: "Industry mentorship, code reviews, career switching, and interview prep",
    icon: Briefcase,
  },
  {
    type: "community",
    title: "Community Member",
    subtitle: "Language exchange, hobbies, arts & crafts, cooking, and neighborhood support",
    icon: HeartHandshake,
  },
]

export function OnboardingWizard({
  initialUsername = "",
  initialFullName = "",
  initialAvatarUrl = "",
  categories,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  // Step 1: Identity & Username
  const [selectedUserType, setSelectedUserType] = useState<UserType>("student")
  const [username, setUsername] = useState(initialUsername)
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "unavailable" | "invalid"
  >("idle")
  const [usernameFeedback, setUsernameFeedback] = useState<string>("")

  // Step 2: About You
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bio, setBio] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [languages, setLanguages] = useState<string[]>(["English"])
  const [customLanguage, setCustomLanguage] = useState("")

  // Step 3: Offered Skills
  const [offeredSkills, setOfferedSkills] = useState<{
    skillId: number
    proficiency: SkillProficiency
  }[]>([])
  const [offeredSearch, setOfferedSearch] = useState("")
  const [activeCategoryTab, setActiveCategoryTab] = useState<number>(categories[0]?.id || 1)

  // Step 4: Wanted Skills
  const [wantedSkills, setWantedSkills] = useState<{ skillId: number }[]>([])
  const [wantedSearch, setWantedSearch] = useState("")
  const [activeWantedCategoryTab, setActiveWantedCategoryTab] = useState<number>(categories[0]?.id || 1)

  // Debounced Username Availability Check
  useEffect(() => {
    if (!username || username.trim().length < 3) {
      setUsernameStatus("invalid")
      setUsernameFeedback("Username must be at least 3 characters")
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      setUsernameStatus("invalid")
      setUsernameFeedback("Letters, numbers, underscores, and dashes only")
      return
    }

    setUsernameStatus("checking")
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(username)
        if (res.available) {
          setUsernameStatus("available")
          setUsernameFeedback("Username is available!")
        } else {
          setUsernameStatus("unavailable")
          setUsernameFeedback(res.error || "Username is already taken")
        }
      } catch {
        setUsernameStatus("available")
        setUsernameFeedback("Username is valid")
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [username])

  // Avatar Upload Handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 2MB validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Avatar image must be under 2MB.",
      })
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Unsupported file type", {
        description: "Please upload a JPG, PNG, or WebP image.",
      })
      return
    }

    try {
      setAvatarUploading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const fileExt = file.name.split(".").pop()
      const filePath = `${user?.id || "guest"}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, cacheControl: "3600" })

      if (uploadError) {
        console.warn("Storage upload error, using object URL for preview:", uploadError)
        // Fallback to local object URL
        const localUrl = URL.createObjectURL(file)
        setAvatarUrl(localUrl)
        toast.info("Avatar preview updated")
        return
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      toast.success("Avatar uploaded successfully!")
    } catch (err: unknown) {
      console.error(err)
      toast.error("Failed to upload avatar")
    } finally {
      setAvatarUploading(false)
    }
  }

  // Language management
  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang))
      }
    } else {
      setLanguages([...languages, lang])
    }
  }

  const addCustomLanguage = () => {
    const trimmed = customLanguage.trim()
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed])
      setCustomLanguage("")
    }
  }

  // Skills toggle handlers
  const toggleOfferedSkill = (skillId: number) => {
    const exists = offeredSkills.find((s) => s.skillId === skillId)
    if (exists) {
      setOfferedSkills(offeredSkills.filter((s) => s.skillId !== skillId))
    } else {
      setOfferedSkills([...offeredSkills, { skillId, proficiency: "intermediate" }])
    }
  }

  const setSkillProficiency = (skillId: number, proficiency: SkillProficiency) => {
    setOfferedSkills(
      offeredSkills.map((s) => (s.skillId === skillId ? { ...s, proficiency } : s))
    )
  }

  const toggleWantedSkill = (skillId: number) => {
    const exists = wantedSkills.find((s) => s.skillId === skillId)
    if (exists) {
      setWantedSkills(wantedSkills.filter((s) => s.skillId !== skillId))
    } else {
      setWantedSkills([...wantedSkills, { skillId }])
    }
  }

  // Validation before advancing
  const canAdvance = () => {
    if (currentStep === 1) {
      return (
        usernameStatus === "available" ||
        (username.trim().length >= 3 && usernameStatus !== "unavailable")
      )
    }
    if (currentStep === 2) {
      return languages.length > 0
    }
    if (currentStep === 3) {
      return offeredSkills.length >= 1
    }
    if (currentStep === 4) {
      return wantedSkills.length >= 1
    }
    return true
  }

  // Finish Onboarding
  const handleFinish = () => {
    if (!canAdvance()) return

    startTransition(async () => {
      try {
        const payload = {
          userType: selectedUserType,
          username: username.trim(),
          bio: bio.trim(),
          avatarUrl,
          city: city.trim(),
          country: country.trim(),
          languages,
          offeredSkills,
          wantedSkills,
        }

        const result = await completeOnboardingAction(payload)

        if (!result.success) {
          toast.error("Onboarding failed", {
            description: result.error,
          })
          return
        }

        toast.success("🎉 Welcome to Pairly!", {
          description: "Your skill exchange profile is live. Calculating smart matches...",
        })

        router.push(result.redirectUrl || "/dashboard")
        router.refresh()
      } catch (err: unknown) {
        console.error(err)
        toast.error("An error occurred while saving your profile.")
      }
    })
  }

  // Progress Calculation
  const progressPercent = currentStep * 25

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-6">
      {/* Top Header & Step Progress Bar */}
      <div className="space-y-4 text-center">
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
          Step {currentStep} of 4
        </Badge>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {currentStep === 1 && "Who are you?"}
          {currentStep === 2 && "Tell us about yourself"}
          {currentStep === 3 && "What skills can you offer?"}
          {currentStep === 4 && "What skills do you want to learn?"}
        </h1>
        <p className="mx-auto max-w-lg text-xs sm:text-sm text-muted-foreground">
          {currentStep === 1 &&
            "Choose your primary learning role and pick a handle for your public profile."}
          {currentStep === 2 &&
            "Add your avatar, short bio, and languages to connect with compatible peers."}
          {currentStep === 3 &&
            "Select skills you feel comfortable sharing and specify your experience level."}
          {currentStep === 4 &&
            "Select the skills and subjects you are eager to learn from your peers."}
        </p>

        {/* Visual Progress Bar */}
        <div className="mx-auto max-w-md pt-2">
          <Progress value={progressPercent} className="h-2 rounded-full bg-accent" />
          <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground">
            <span className={cn(currentStep >= 1 && "text-primary font-semibold")}>Role</span>
            <span className={cn(currentStep >= 2 && "text-primary font-semibold")}>About</span>
            <span className={cn(currentStep >= 3 && "text-primary font-semibold")}>Offer</span>
            <span className={cn(currentStep >= 4 && "text-primary font-semibold")}>Learn</span>
          </div>
        </div>
      </div>

      {/* Main Step Card Container */}
      <div className="card-soft p-6 sm:p-8">
        {/* STEP 1: IDENTITY & USERNAME */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Select Your Exchange Community Track
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {USER_TYPE_CARDS.map((card) => {
                  const Icon = card.icon
                  const isSelected = selectedUserType === card.type
                  return (
                    <div
                      key={card.type}
                      onClick={() => setSelectedUserType(card.type)}
                      className={cn(
                        "relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all select-none",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/20 dark:bg-primary/10"
                          : "border-border bg-card/60 hover:border-border/80 hover:bg-accent/40"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-muted-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-heading text-sm font-bold text-foreground">
                            {card.title}
                          </p>
                          {isSelected && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Username Input with Live Debounced Availability Check */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label htmlFor="username" className="text-xs font-semibold text-foreground">
                  Choose a Unique Username
                </Label>
                {usernameStatus === "checking" && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking availability...
                  </span>
                )}
                {usernameStatus === "available" && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-[#A7F3D0]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {usernameFeedback}
                  </span>
                )}
                {usernameStatus === "unavailable" && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {usernameFeedback}
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
                  @
                </span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  placeholder="alex_morgan"
                  className={cn(
                    "min-h-[44px] rounded-xl pl-8 border-border bg-card/60 focus-visible:ring-primary text-sm font-mono",
                    usernameStatus === "available" && "border-emerald-500 focus-visible:ring-emerald-500",
                    usernameStatus === "unavailable" && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your username will appear on your smart match cards and public listings.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: ABOUT YOU */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-border">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-lg">
                  <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                  <AvatarFallback className="bg-[#4B3F72] text-white text-xl font-bold font-heading">
                    {initialFullName?.[0] || username?.[0]?.toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-xs">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <h4 className="text-sm font-bold font-heading text-foreground">Profile Picture</h4>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or WebP. Maximum size 2MB. A clear photo builds peer trust.
                </p>
                <div className="pt-1">
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-xs"
                  >
                    <Upload className="h-3.5 w-3.5 text-primary" />
                    <span>{avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                      disabled={avatarUploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Short Bio (Max 280 chars) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="text-xs font-semibold text-foreground">
                  Short Bio
                </Label>
                <span
                  className={cn(
                    "text-[11px] font-mono",
                    bio.length > 280 ? "text-destructive font-bold" : "text-muted-foreground"
                  )}
                >
                  {bio.length}/280
                </span>
              </div>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 280))}
                rows={3}
                placeholder="Hi! I'm a third-year CS student passionate about UI design and looking to practice conversational Spanish in exchange for Next.js mentoring."
                className="rounded-xl border-border bg-card/60 focus-visible:ring-primary text-sm resize-none"
              />
            </div>

            {/* City & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-semibold text-foreground">
                  City (optional)
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Boston, Madrid, Toronto"
                  className="min-h-[44px] rounded-xl border-border bg-card/60 focus-visible:ring-primary text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs font-semibold text-foreground">
                  Country (optional)
                </Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., United States, Spain, Canada"
                  className="min-h-[44px] rounded-xl border-border bg-card/60 focus-visible:ring-primary text-sm"
                />
              </div>
            </div>

            {/* Languages Multi-Select */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-foreground">
                Languages You Speak (select at least one)
              </Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_LANGUAGES.map((lang) => {
                  const isSelected = languages.includes(lang)
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-all select-none cursor-pointer flex items-center gap-1.5",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "border border-border bg-card hover:bg-accent text-foreground"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{lang}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom Language Add */}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomLanguage())}
                  placeholder="Add another language..."
                  className="h-9 max-w-xs rounded-xl border-border bg-card/60 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomLanguage}
                  className="h-9 rounded-xl text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WHAT CAN YOU OFFER? */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold font-heading text-foreground">
                  Select Skills You Can Offer &amp; Mentor
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pick at least 1 skill. For each, select your experience level.
                </p>
              </div>
              <Badge className="bg-[#A7F3D0] text-[#064E3B] font-bold w-fit">
                {offeredSkills.length} Selected
              </Badge>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={offeredSearch}
                onChange={(e) => setOfferedSearch(e.target.value)}
                placeholder="Filter skills (e.g. React, Spanish, Piano, Calculus)..."
                className="min-h-[44px] rounded-xl pl-9 border-border bg-card/60 focus-visible:ring-primary text-sm"
              />
            </div>

            {/* Category Filter Tabs */}
            {!offeredSearch && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={cn(
                      "shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all select-none cursor-pointer",
                      activeCategoryTab === cat.id
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {categories
                .filter((cat) => (offeredSearch ? true : cat.id === activeCategoryTab))
                .flatMap((cat) =>
                  cat.skills.filter((skill) =>
                    skill.name.toLowerCase().includes(offeredSearch.toLowerCase())
                  )
                )
                .map((skill) => {
                  const isSelected = offeredSkills.some((s) => s.skillId === skill.id)
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleOfferedSkill(skill.id)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3 text-left transition-all select-none cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                          : "border-border bg-card hover:bg-accent/50 text-foreground"
                      )}
                    >
                      <span className="text-xs">{skill.name}</span>
                      {isSelected ? (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  )
                })}
            </div>

            {/* Selected Skills Configuration with Proficiency Level */}
            {offeredSkills.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Configured Offered Skills ({offeredSkills.length})
                </Label>
                <div className="space-y-2.5">
                  {offeredSkills.map((offered) => {
                    const skill = categories
                      .flatMap((c) => c.skills)
                      .find((s) => s.id === offered.skillId)
                    return (
                      <div
                        key={offered.skillId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border bg-accent/40 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {skill?.name || `Skill #${offered.skillId}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">Proficiency:</span>
                          <select
                            value={offered.proficiency}
                            onChange={(e) =>
                              setSkillProficiency(
                                offered.skillId,
                                e.target.value as SkillProficiency
                              )
                            }
                            className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleOfferedSkill(offered.skillId)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: WHAT DO YOU WANT TO LEARN? */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold font-heading text-foreground">
                  Select Skills You Want to Learn &amp; Master
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pick at least 1 wanted skill. The smart matching engine pairs this with peer offerings.
                </p>
              </div>
              <Badge className="bg-[#A78BFA]/20 text-primary dark:text-[#A78BFA] font-bold w-fit">
                {wantedSkills.length} Selected
              </Badge>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={wantedSearch}
                onChange={(e) => setWantedSearch(e.target.value)}
                placeholder="Filter wanted skills (e.g. Python, Spanish, Guitar)..."
                className="min-h-[44px] rounded-xl pl-9 border-border bg-card/60 focus-visible:ring-primary text-sm"
              />
            </div>

            {/* Category Filter Tabs */}
            {!wantedSearch && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveWantedCategoryTab(cat.id)}
                    className={cn(
                      "shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all select-none cursor-pointer",
                      activeWantedCategoryTab === cat.id
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {categories
                .filter((cat) => (wantedSearch ? true : cat.id === activeWantedCategoryTab))
                .flatMap((cat) =>
                  cat.skills.filter((skill) =>
                    skill.name.toLowerCase().includes(wantedSearch.toLowerCase())
                  )
                )
                .map((skill) => {
                  const isSelected = wantedSkills.some((s) => s.skillId === skill.id)
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleWantedSkill(skill.id)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3 text-left transition-all select-none cursor-pointer",
                        isSelected
                          ? "border-secondary bg-secondary/15 text-foreground font-semibold shadow-xs"
                          : "border-border bg-card hover:bg-accent/50 text-foreground"
                      )}
                    >
                      <span className="text-xs">{skill.name}</span>
                      {isSelected ? (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  )
                })}
            </div>

            {/* Selected Wanted Skills Chips */}
            {wantedSkills.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Wanted Skills ({wantedSkills.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {wantedSkills.map((wanted) => {
                    const skill = categories
                      .flatMap((c) => c.skills)
                      .find((s) => s.id === wanted.skillId)
                    return (
                      <span
                        key={wanted.skillId}
                        className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-medium text-foreground"
                      >
                        <span>{skill?.name || `Skill #${wanted.skillId}`}</span>
                        <button
                          type="button"
                          onClick={() => toggleWantedSkill(wanted.skillId)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isPending}
            className="rounded-xl min-h-[44px] text-xs font-medium gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              disabled={!canAdvance()}
              className="rounded-xl min-h-[44px] px-6 bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] font-semibold text-xs shadow-md gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              disabled={!canAdvance() || isPending}
              className="rounded-xl min-h-[44px] px-7 bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] font-bold text-xs shadow-lg gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Finalizing Profile...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#A7F3D0]" />
                  <span>Complete Onboarding &amp; Enter Dashboard</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
