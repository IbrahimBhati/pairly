"use client"

import React, { useState } from "react"
import { Search, Plus, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { CategoryWithSkills } from "@/app/(auth)/onboarding/onboarding-wizard"
import type { SkillProficiency } from "@/types/database"
import { cn } from "@/lib/utils"

export interface SelectedSkillItem {
  skillId: number
  proficiency?: SkillProficiency
}

interface SkillPickerProps {
  categories: CategoryWithSkills[]
  selectedSkills: SelectedSkillItem[]
  onChange: (skills: SelectedSkillItem[]) => void
  mode?: "offered" | "wanted"
  maxSelection?: number
  className?: string
}

export function SkillPicker({
  categories,
  selectedSkills,
  onChange,
  mode = "offered",
  maxSelection,
  className,
}: SkillPickerProps) {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<number>(categories[0]?.id || 1)

  const toggleSkill = (skillId: number) => {
    const exists = selectedSkills.some((s) => s.skillId === skillId)
    if (exists) {
      onChange(selectedSkills.filter((s) => s.skillId !== skillId))
    } else {
      if (maxSelection && selectedSkills.length >= maxSelection) {
        return
      }
      onChange([
        ...selectedSkills,
        { skillId, proficiency: mode === "offered" ? "intermediate" : undefined },
      ])
    }
  }

  const updateProficiency = (skillId: number, proficiency: SkillProficiency) => {
    onChange(
      selectedSkills.map((s) => (s.skillId === skillId ? { ...s, proficiency } : s))
    )
  }

  const removeSkill = (skillId: number) => {
    onChange(selectedSkills.filter((s) => s.skillId !== skillId))
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${mode === "offered" ? "offered" : "wanted"} skills (e.g. Python, Figma, Spanish)...`}
          className="min-h-[44px] rounded-xl pl-9 border-border bg-card/60 focus-visible:ring-primary text-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      {!search && categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all select-none cursor-pointer",
                activeTab === cat.id
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
        {categories
          .filter((cat) => (search ? true : cat.id === activeTab))
          .flatMap((cat) =>
            cat.skills.filter((skill) =>
              skill.name.toLowerCase().includes(search.toLowerCase())
            )
          )
          .map((skill) => {
            const isSelected = selectedSkills.some((s) => s.skillId === skill.id)
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-2.5 text-left transition-all select-none cursor-pointer",
                  isSelected
                    ? mode === "offered"
                      ? "border-emerald-500/60 bg-emerald-50/80 text-[#064E3B] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-[#A7F3D0] font-semibold"
                      : "border-secondary bg-secondary/15 text-foreground font-semibold"
                    : "border-border bg-card hover:bg-accent/60 text-foreground"
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

      {/* Selected Skills Chips / Configuration */}
      {selectedSkills.length > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Selected ({selectedSkills.length})
            </Label>
            <span className="text-[11px] text-muted-foreground">
              {mode === "offered" ? "Select proficiency for each" : "Click X to remove"}
            </span>
          </div>

          <div className="space-y-2">
            {selectedSkills.map((item) => {
              const skill = categories
                .flatMap((c) => c.skills)
                .find((s) => s.id === item.skillId)
              const skillName = skill?.name || `Skill #${item.skillId}`

              if (mode === "offered") {
                return (
                  <div
                    key={item.skillId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border bg-accent/40 p-2.5"
                  >
                    <span className="text-xs font-bold text-foreground">{skillName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Proficiency:</span>
                      <select
                        value={item.proficiency || "intermediate"}
                        onChange={(e) =>
                          updateProficiency(
                            item.skillId,
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
                        onClick={() => removeSkill(item.skillId)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              }

              // Wanted mode: Chip view
              return (
                <span
                  key={item.skillId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/15 px-3 py-1 text-xs font-medium text-foreground mr-1.5 mb-1.5"
                >
                  <span>{skillName}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(item.skillId)}
                    className="hover:text-destructive transition-colors"
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
  )
}
