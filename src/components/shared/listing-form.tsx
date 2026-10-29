"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createListingAction, updateListingAction } from "@/lib/actions/listings"
import { ListingCard } from "@/components/shared/listing-card"
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
import {
  Repeat,
  HandHelping,
  Sparkles,
  Globe,
  MapPin,
  Clock,
  Calendar,
  Loader2,
  Check,
  ArrowRight,
  Eye,
} from "lucide-react"
import type {
  ListingType,
  ListingMode,
  ListingStatus,
  ListingWithDetails,
  Profile,
} from "@/types/database"
import type { CategoryWithSkills } from "@/app/(auth)/onboarding/onboarding-wizard"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ListingFormProps {
  categories: CategoryWithSkills[]
  initialListing?: ListingWithDetails | null
  currentUserProfile?: Profile | null
  isEdit?: boolean
}

export function ListingForm({
  categories,
  initialListing,
  currentUserProfile,
  isEdit = false,
}: ListingFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form State
  const [type, setType] = useState<ListingType>(initialListing?.type || "exchange")
  const [title, setTitle] = useState(initialListing?.title || "")
  const [description, setDescription] = useState(initialListing?.description || "")
  const [categoryId, setCategoryId] = useState<number>(
    initialListing?.category_id || categories[0]?.id || 1
  )
  const [offeredSkillId, setOfferedSkillId] = useState<number | undefined>(
    initialListing?.offered_skill_id || undefined
  )
  const [wantedSkillId, setWantedSkillId] = useState<number | undefined>(
    initialListing?.wanted_skill_id || undefined
  )
  const [mode, setMode] = useState<ListingMode>(initialListing?.mode || "online")
  const [city, setCity] = useState(initialListing?.city || "")
  const [availability, setAvailability] = useState(initialListing?.availability || "")
  const [durationEstimate, setDurationEstimate] = useState(
    initialListing?.duration_estimate || ""
  )

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Flattened skills for easy lookup
  const allSkills = categories.flatMap((cat) =>
    cat.skills.map((s) => ({ ...s, categoryName: cat.name }))
  )

  // Specific skills for selected category, plus all skills for cross-category searches
  const selectedCategoryObj = categories.find((c) => c.id === categoryId) || categories[0]
  const offeredSkillObj = allSkills.find((s) => s.id === offeredSkillId)
  const wantedSkillObj = allSkills.find((s) => s.id === wantedSkillId)

  // Preview Listing Object
  const previewListing: ListingWithDetails = {
    id: initialListing?.id || "preview-id",
    owner_id: currentUserProfile?.id || "preview-owner",
    type,
    title: title.trim() || "Untitled Skill Exchange",
    description:
      description.trim() ||
      "Provide a clear description of what you will share or learn together. Peers love specifics!",
    category_id: categoryId,
    offered_skill_id: type === "help_request" ? null : offeredSkillId || null,
    wanted_skill_id: type === "help_offer" ? null : wantedSkillId || null,
    mode,
    city: mode === "online" ? null : city.trim() || null,
    availability: availability.trim() || null,
    duration_estimate: durationEstimate.trim() || null,
    status: (initialListing?.status || "active") as ListingStatus,
    view_count: initialListing?.view_count || 0,
    created_at: initialListing?.created_at || new Date().toISOString(),
    updated_at: initialListing?.updated_at || new Date().toISOString(),
    category: selectedCategoryObj
      ? {
          id: selectedCategoryObj.id,
          name: selectedCategoryObj.name,
          slug: selectedCategoryObj.slug,
          icon: selectedCategoryObj.icon,
          description: selectedCategoryObj.description || null,
          created_at: selectedCategoryObj.created_at || new Date().toISOString(),
        }
      : null,
    offered_skill:
      type !== "help_request" && offeredSkillObj
        ? {
            id: offeredSkillObj.id,
            name: offeredSkillObj.name,
            category_id: offeredSkillObj.category_id,
            created_at: offeredSkillObj.created_at || new Date().toISOString(),
          }
        : null,
    wanted_skill:
      type !== "help_offer" && wantedSkillObj
        ? {
            id: wantedSkillObj.id,
            name: wantedSkillObj.name,
            category_id: wantedSkillObj.category_id,
            created_at: wantedSkillObj.created_at || new Date().toISOString(),
          }
        : null,
    owner: currentUserProfile || {
      id: "preview-owner",
      username: "you",
      full_name: "Your Profile",
      avatar_url: null,
      bio: "Peer scholar on Pairly.",
      user_type: "student",
      role: "user",
      city: city || null,
      country: null,
      timezone: null,
      languages: ["English"],
      is_verified: true,
      onboarding_completed: true,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    is_saved: false,
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const payload = {
      type,
      title,
      description,
      category_id: categoryId,
      offered_skill_id: type === "help_request" ? undefined : offeredSkillId,
      wanted_skill_id: type === "help_offer" ? undefined : wantedSkillId,
      mode,
      city: mode === "online" ? undefined : city,
      availability: availability || undefined,
      duration_estimate: durationEstimate || undefined,
    }

    startTransition(async () => {
      let res
      if (isEdit && initialListing?.id) {
        res = await updateListingAction(initialListing.id, payload)
      } else {
        res = await createListingAction(payload)
      }

      if (!res.success) {
        toast.error(res.error || "Please fix errors before submitting.")
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors)
        }
      } else {
        toast.success(
          isEdit ? "Listing updated successfully!" : "Listing published to marketplace!"
        )
        const targetId = res.listingId || initialListing?.id
        router.push(targetId ? `/listings/${targetId}` : "/listings")
        router.refresh()
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Form Left Column */}
      <div className="lg:col-span-7 xl:col-span-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Listing Type Selector Cards */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-bold font-heading text-foreground">
                1. What kind of listing are you creating?
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose the bilateral dynamic of your offer or request.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option A: Exchange */}
              <button
                type="button"
                onClick={() => setType("exchange")}
                className={cn(
                  "relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer",
                  type === "exchange"
                    ? "border-[#4B3F72] bg-[#A78BFA]/15 dark:border-[#A78BFA] shadow-sm"
                    : "border-border bg-card hover:bg-accent/60"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl mb-3",
                    type === "exchange"
                      ? "bg-[#4B3F72] text-white dark:bg-[#A78BFA] dark:text-[#0F0B1A]"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Repeat className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold font-heading text-foreground">
                  Skill Exchange
                </span>
                <span className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  I will teach X in return for learning Y.
                </span>
                {type === "exchange" && (
                  <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Option B: Help Offer */}
              <button
                type="button"
                onClick={() => setType("help_offer")}
                className={cn(
                  "relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer",
                  type === "help_offer"
                    ? "border-emerald-600 bg-emerald-50/80 dark:border-[#A7F3D0] dark:bg-emerald-950/40 shadow-sm"
                    : "border-border bg-card hover:bg-accent/60"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl mb-3",
                    type === "help_offer"
                      ? "bg-emerald-600 text-white dark:bg-[#A7F3D0] dark:text-[#064E3B]"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <HandHelping className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold font-heading text-foreground">
                  Help Offer
                </span>
                <span className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Volunteering knowledge freely with no reciprocal request.
                </span>
                {type === "help_offer" && (
                  <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Option C: Help Request */}
              <button
                type="button"
                onClick={() => setType("help_request")}
                className={cn(
                  "relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer",
                  type === "help_request"
                    ? "border-blue-600 bg-blue-50/80 dark:border-blue-400 dark:bg-blue-950/40 shadow-sm"
                    : "border-border bg-card hover:bg-accent/60"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl mb-3",
                    type === "help_request"
                      ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-blue-950"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold font-heading text-foreground">
                  Help Request
                </span>
                <span className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Seeking mentorship or assistance with a project or skill.
                </span>
                {type === "help_request" && (
                  <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 2. Core Listing Details */}
          <div className="card-soft p-6 space-y-5">
            <h2 className="text-sm font-bold font-heading text-foreground">
              2. Title & Domain
            </h2>

            {/* Listing Title */}
            <div className="space-y-1.5">
              <Label htmlFor="listing-title" className="text-xs font-semibold">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="listing-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master React & Next.js for Conversational Spanish Practice"
                className="min-h-[44px] rounded-xl border-border bg-background text-sm"
                required
              />
              {fieldErrors.title && (
                <p className="text-[11px] text-destructive">{fieldErrors.title[0]}</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="listing-category" className="text-xs font-semibold">
                Primary Domain / Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(categoryId)}
                onValueChange={(val) => setCategoryId(Number(val))}
              >
                <SelectTrigger id="listing-category" className="min-h-[44px] rounded-xl">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Skills: Offered / Wanted */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Offered Skill (hidden for help_request) */}
              {type !== "help_request" && (
                <div className="space-y-1.5">
                  <Label htmlFor="offered-skill" className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Skill You Offer</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={offeredSkillId ? String(offeredSkillId) : ""}
                    onValueChange={(val) => setOfferedSkillId(Number(val))}
                  >
                    <SelectTrigger id="offered-skill" className="min-h-[44px] rounded-xl">
                      <SelectValue placeholder="Choose skill you can teach" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {allSkills.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} ({s.categoryName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.offered_skill_id && (
                    <p className="text-[11px] text-destructive">
                      {fieldErrors.offered_skill_id[0]}
                    </p>
                  )}
                </div>
              )}

              {/* Wanted Skill (hidden for help_offer) */}
              {type !== "help_offer" && (
                <div className="space-y-1.5">
                  <Label htmlFor="wanted-skill" className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-[#A78BFA]" />
                    <span>Skill You Seek / Want</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={wantedSkillId ? String(wantedSkillId) : ""}
                    onValueChange={(val) => setWantedSkillId(Number(val))}
                  >
                    <SelectTrigger id="wanted-skill" className="min-h-[44px] rounded-xl">
                      <SelectValue placeholder="Choose skill you want to learn" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {allSkills.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} ({s.categoryName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.wanted_skill_id && (
                    <p className="text-[11px] text-destructive">
                      {fieldErrors.wanted_skill_id[0]}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="listing-description" className="text-xs font-semibold">
                Detailed Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="listing-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your background, what topics you can cover, what learning goals you have, and how you envision your exchange sessions..."
                className="rounded-xl border-border bg-background text-sm leading-relaxed"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Minimum 20 characters recommended. Clear expectations lead to higher match rates.
              </p>
              {fieldErrors.description && (
                <p className="text-[11px] text-destructive">
                  {fieldErrors.description[0]}
                </p>
              )}
            </div>
          </div>

          {/* 3. Logistics & Availability */}
          <div className="card-soft p-6 space-y-5">
            <h2 className="text-sm font-bold font-heading text-foreground">
              3. Logistics & Availability
            </h2>

            {/* Delivery Mode: Online, In Person, Both */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Session Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "online", label: "Online", icon: Globe },
                  { id: "in_person", label: "In Person", icon: MapPin },
                  { id: "both", label: "Both / Flexible", icon: Repeat },
                ].map((item) => {
                  const Icon = item.icon
                  const isSelected = mode === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id as ListingMode)}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* City (shown only for in_person or both) */}
            {(mode === "in_person" || mode === "both") && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label htmlFor="listing-city" className="text-xs font-semibold">
                  Location / City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="listing-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Cambridge, MA or University Campus Library"
                  className="min-h-[44px] rounded-xl border-border bg-background text-sm"
                  required
                />
                {fieldErrors.city && (
                  <p className="text-[11px] text-destructive">{fieldErrors.city[0]}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Availability */}
              <div className="space-y-1.5">
                <Label htmlFor="listing-availability" className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Availability</span>
                </Label>
                <Input
                  id="listing-availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. Weekday evenings, Saturdays"
                  className="min-h-[44px] rounded-xl border-border bg-background text-sm"
                />
              </div>

              {/* Duration Estimate */}
              <div className="space-y-1.5">
                <Label htmlFor="listing-duration" className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Duration / Frequency</span>
                </Label>
                <Input
                  id="listing-duration"
                  value={durationEstimate}
                  onChange={(e) => setDurationEstimate(e.target.value)}
                  placeholder="e.g. 1 hour / week, 4 weeks"
                  className="min-h-[44px] rounded-xl border-border bg-background text-sm"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="rounded-xl px-5 text-xs"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-primary text-primary-foreground font-semibold px-6 text-xs gap-2 min-h-[44px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEdit ? "Saving Changes..." : "Publishing Listing..."}</span>
                </>
              ) : (
                <>
                  <span>{isEdit ? "Save Changes" : "Publish Listing"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Live Preview Right Column (Desktop Sticky) */}
      <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold font-heading text-foreground">
              Live Marketplace Preview
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Updates live as you type</span>
        </div>

        <ListingCard listing={previewListing} isOwner={false} />

        <div className="rounded-2xl border border-border/80 bg-accent/30 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span>Pairly Matching Engine</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Once published, Pairly will automatically evaluate peers offering{" "}
            <span className="font-semibold text-foreground">
              {wantedSkillObj?.name || "your wanted skill"}
            </span>{" "}
            and seeking{" "}
            <span className="font-semibold text-foreground">
              {offeredSkillObj?.name || "your offered skill"}
            </span>
            , computing high match scores for instant peer collaboration.
          </p>
        </div>
      </div>
    </div>
  )
}
