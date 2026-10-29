"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateProfileAction, updateUserSkillsAction } from "@/lib/actions/profile"
import { SkillPicker, type SelectedSkillItem } from "@/components/shared/SkillPicker"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  User,
  MapPin,
  Globe,
  Loader2,
  Trash2,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  Upload,
} from "lucide-react"
import type {
  Profile,
  UserType,
  SkillProficiency,
  UserSkillWithDetails,
} from "@/types/database"
import type { CategoryWithSkills } from "@/app/(auth)/onboarding/onboarding-wizard"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

interface ProfileEditFormProps {
  profile: Profile
  initialOfferedSkills: UserSkillWithDetails[]
  initialWantedSkills: UserSkillWithDetails[]
  categories: CategoryWithSkills[]
}

export function ProfileEditForm({
  profile,
  initialOfferedSkills,
  initialWantedSkills,
  categories,
}: ProfileEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Profile Fields
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [userType, setUserType] = useState<UserType>(profile.user_type || "student")
  const [bio, setBio] = useState(profile.bio || "")
  const [city, setCity] = useState(profile.city || "")
  const [country, setCountry] = useState(profile.country || "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "")
  const [languages, setLanguages] = useState<string[]>(
    profile.languages && profile.languages.length > 0 ? profile.languages : ["English"]
  )
  const [customLanguage, setCustomLanguage] = useState("")

  // Skills State
  const [selectedOffered, setSelectedOffered] = useState<SelectedSkillItem[]>(
    initialOfferedSkills.map((s) => ({
      skillId: s.skill_id,
      proficiency: s.proficiency || "intermediate",
    }))
  )

  const [selectedWanted, setSelectedWanted] = useState<SelectedSkillItem[]>(
    initialWantedSkills.map((s) => ({
      skillId: s.skill_id,
    }))
  )

  // Language management
  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length === 1) {
        toast.warning("Keep at least one language")
        return
      }
      setLanguages(languages.filter((l) => l !== lang))
    } else {
      setLanguages([...languages, lang])
    }
  }

  const addCustomLanguage = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return
    e.preventDefault()
    const trimmed = customLanguage.trim()
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed])
      setCustomLanguage("")
    }
  }

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast.error("Please enter your full name")
      return
    }

    if (selectedOffered.length === 0) {
      toast.error("Please select at least 1 skill you can offer")
      return
    }

    if (selectedWanted.length === 0) {
      toast.error("Please select at least 1 skill you want to learn")
      return
    }

    startTransition(async () => {
      // 1. Update Profile Info
      const profileRes = await updateProfileAction({
        fullName,
        userType,
        bio,
        city,
        country,
        languages,
        avatarUrl,
      })

      if (!profileRes.success) {
        toast.error(profileRes.error || "Failed to update profile details")
        return
      }

      // 2. Update Skills Matrix
      const skillsRes = await updateUserSkillsAction({
        offeredSkills: selectedOffered.map((s) => ({
          skillId: s.skillId,
          proficiency: (s.proficiency || "intermediate") as SkillProficiency,
        })),
        wantedSkills: selectedWanted.map((s) => ({
          skillId: s.skillId,
        })),
      })

      if (!skillsRes.success) {
        toast.error(skillsRes.error || "Failed to update skills matrix")
        return
      }

      toast.success("Profile and skill matrix updated successfully!")
      router.push("/profile")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* 1. Profile Information Card */}
      <div className="card-soft p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            1. Personal & Academic Profile
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Information shown on your public Pairly profile and exchange proposals.
          </p>
        </div>

        {/* Avatar Upload / Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl border border-border bg-accent/30">
          <UserAvatar
            profile={{
              avatar_url: avatarUrl || null,
              full_name: fullName,
              username: profile.username,
            }}
            size="xl"
            className="ring-2 ring-primary/20 shrink-0"
          />

          <div className="flex-1 space-y-2">
            <Label htmlFor="avatar-url-input" className="text-xs font-semibold">
              Profile Avatar Image URL
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="avatar-url-input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or custom avatar URL"
                className="min-h-[40px] rounded-xl text-xs bg-background"
              />
              {avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAvatarUrl("")}
                  className="rounded-xl text-xs text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tip: Paste an image link or leave blank to automatically display stylized initials.
            </p>
          </div>
        </div>

        {/* Name & User Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full-name" className="text-xs font-semibold">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Maya Lin"
              className="min-h-[44px] rounded-xl bg-background text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-type" className="text-xs font-semibold">
              Primary Role / Category
            </Label>
            <Select
              value={userType}
              onValueChange={(val) => setUserType(val as UserType)}
            >
              <SelectTrigger id="user-type" className="min-h-[44px] rounded-xl">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="student">Student (Peer-to-Peer)</SelectItem>
                <SelectItem value="teacher">Teacher / Educator</SelectItem>
                <SelectItem value="professional">Working Professional</SelectItem>
                <SelectItem value="community">Community Contributor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="profile-bio" className="text-xs font-semibold">
              Short Bio
            </Label>
            <span
              className={cn(
                "text-[11px]",
                bio.length > 260 ? "text-amber-500 font-bold" : "text-muted-foreground"
              )}
            >
              {bio.length}/280
            </span>
          </div>
          <Textarea
            id="profile-bio"
            rows={3}
            maxLength={280}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share what you study, work on, or what brings you to Pairly..."
            className="rounded-xl bg-background text-sm leading-relaxed"
          />
        </div>

        {/* Location: City & Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-city" className="text-xs font-semibold">
              City / University
            </Label>
            <Input
              id="profile-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Boston, MA"
              className="min-h-[44px] rounded-xl bg-background text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-country" className="text-xs font-semibold">
              Country
            </Label>
            <Input
              id="profile-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United States"
              className="min-h-[44px] rounded-xl bg-background text-sm"
            />
          </div>
        </div>

        {/* Languages Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Languages You Speak</Label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_LANGUAGES.map((lang) => {
              const selected = languages.includes(lang)
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={cn(
                    "rounded-xl px-3 py-1 text-xs font-medium border transition-all cursor-pointer",
                    selected
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {lang}
                </button>
              )
            })}
          </div>

          {/* Custom Language input */}
          <div className="flex items-center gap-2 max-w-xs pt-1">
            <Input
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              onKeyDown={addCustomLanguage}
              placeholder="Other language..."
              className="h-8 rounded-lg text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomLanguage}
              className="h-8 rounded-lg text-xs"
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Skills You Offer */}
      <div className="card-soft p-6 sm:p-8 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
            <h2 className="font-heading text-lg font-bold text-foreground">
              2. Skills You Can Teach / Offer
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose domains you are confident guiding peers in, and set your proficiency level.
          </p>
        </div>

        <SkillPicker
          categories={categories}
          selectedSkills={selectedOffered}
          onChange={setSelectedOffered}
          mode="offered"
        />
      </div>

      {/* 3. Skills You Want */}
      <div className="card-soft p-6 sm:p-8 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-[#A78BFA]" />
            <h2 className="font-heading text-lg font-bold text-foreground">
              3. Skills You Want to Learn
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose skills you wish to learn. Pairly uses this to compute Smart Matches.
          </p>
        </div>

        <SkillPicker
          categories={categories}
          selectedSkills={selectedWanted}
          onChange={setSelectedWanted}
          mode="wanted"
        />
      </div>

      {/* Form Submission Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/profile")}
          disabled={isPending}
          className="rounded-xl px-5 text-xs min-h-[44px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-primary text-primary-foreground font-semibold px-6 text-xs gap-2 min-h-[44px] shadow-sm hover:shadow-md transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <>
              <span>Save Profile & Skills</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
