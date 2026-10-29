"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  adminCreateCategoryAction,
  adminUpdateCategoryAction,
  adminDeleteCategoryAction,
  adminCreateSkillAction,
  adminUpdateSkillAction,
  adminDeleteSkillAction,
} from "@/lib/actions/admin"
import { toast } from "sonner"
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  FolderPlus,
  Users,
  FileText,
  AlertCircle,
} from "lucide-react"

interface CategoriesSkillsClientProps {
  initialCategories: any[]
}

export function CategoriesSkillsClient({ initialCategories }: CategoriesSkillsClientProps) {
  const router = useRouter()

  // Category Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [catName, setCatName] = useState("")
  const [catSlug, setCatSlug] = useState("")
  const [catIcon, setCatIcon] = useState("Code")
  const [catDesc, setCatDesc] = useState("")

  // Skill Modal state
  const [skillModalOpen, setSkillModalOpen] = useState(false)
  const [targetCategory, setTargetCategory] = useState<any | null>(null)
  const [editingSkill, setEditingSkill] = useState<any | null>(null)
  const [skillName, setSkillName] = useState("")

  const [loading, setLoading] = useState(false)

  // 1. Open Category Modal
  const openNewCategory = () => {
    setEditingCategory(null)
    setCatName("")
    setCatSlug("")
    setCatIcon("Code")
    setCatDesc("")
    setCategoryModalOpen(true)
  }

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatSlug(cat.slug)
    setCatIcon(cat.icon)
    setCatDesc(cat.description || "")
    setCategoryModalOpen(true)
  }

  const handleSaveCategory = async () => {
    if (!catName.trim() || !catSlug.trim()) {
      toast.error("Category name and slug are required.")
      return
    }

    setLoading(true)
    let res
    if (editingCategory) {
      res = await adminUpdateCategoryAction({
        id: editingCategory.id,
        name: catName,
        slug: catSlug,
        icon: catIcon,
        description: catDesc,
      })
    } else {
      res = await adminCreateCategoryAction({
        name: catName,
        slug: catSlug,
        icon: catIcon,
        description: catDesc,
      })
    }
    setLoading(false)

    if (res.success) {
      toast.success(editingCategory ? "Category updated." : "Category created.")
      setCategoryModalOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || "Action failed.")
    }
  }

  const handleDeleteCategory = async (cat: any) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return

    const res = await adminDeleteCategoryAction({ id: cat.id })
    if (res.success) {
      toast.success("Category deleted.")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to delete category.")
    }
  }

  // 2. Open Skill Modal
  const openNewSkill = (cat: any) => {
    setTargetCategory(cat)
    setEditingSkill(null)
    setSkillName("")
    setSkillModalOpen(true)
  }

  const openEditSkill = (skill: any, cat: any) => {
    setTargetCategory(cat)
    setEditingSkill(skill)
    setSkillName(skill.name)
    setSkillModalOpen(true)
  }

  const handleSaveSkill = async () => {
    if (!skillName.trim() || !targetCategory) {
      toast.error("Skill name is required.")
      return
    }

    setLoading(true)
    let res
    if (editingSkill) {
      res = await adminUpdateSkillAction({
        id: editingSkill.id,
        name: skillName,
        categoryId: targetCategory.id,
      })
    } else {
      res = await adminCreateSkillAction({
        name: skillName,
        categoryId: targetCategory.id,
      })
    }
    setLoading(false)

    if (res.success) {
      toast.success(editingSkill ? "Skill updated." : "Skill added to catalog.")
      setSkillModalOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || "Action failed.")
    }
  }

  const handleDeleteSkill = async (skill: any) => {
    if (!confirm(`Delete skill "${skill.name}"?`)) return

    const res = await adminDeleteSkillAction({ id: skill.id })
    if (res.success) {
      toast.success("Skill removed from catalog.")
      router.refresh()
    } else {
      toast.error(res.error || "Safety check triggered. Could not delete skill.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
        <div>
          <h2 className="text-sm font-bold font-heading text-foreground">
            Taxonomy &amp; Skill Directory
          </h2>
          <p className="text-xs text-muted-foreground">
            {initialCategories.length} categories organizing platform peer exchanges and smart matching
          </p>
        </div>
        <Button
          onClick={openNewCategory}
          size="sm"
          className="rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shrink-0"
        >
          <FolderPlus className="h-4 w-4" />
          <span>Add New Category</span>
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {initialCategories.map((cat) => (
          <Card key={cat.id} className="card-soft flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary font-bold text-xs">
                    <Tags className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold font-heading flex items-center gap-2">
                      <span>{cat.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {cat.slug}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">
                      {cat.description || "No description provided."}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => openEditCategory(cat)}
                    title="Edit Category"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteCategory(cat)}
                    title="Delete Category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-1 flex-1">
              {/* Skills Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Skills ({cat.skills?.length || 0})
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[11px] rounded-lg gap-1 font-semibold"
                    onClick={() => openNewSkill(cat)}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Skill</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 max-h-56 overflow-y-auto">
                  {(cat.skills || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No skills added to this category yet.
                    </p>
                  ) : (
                    (cat.skills || []).map((s: any) => (
                      <div
                        key={s.id}
                        className="group flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/50 hover:bg-muted border border-border/80 text-xs transition-colors"
                      >
                        <span className="font-medium text-foreground">{s.name}</span>
                        {s.usageCount > 0 && (
                          <span
                            className="text-[10px] px-1 rounded bg-primary/10 text-primary font-bold"
                            title={`Active usage: ${s.userSkillsCount} member profile(s), ${s.listingsCount} listing(s)`}
                          >
                            {s.usageCount}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditSkill(s, cat)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity ml-1"
                          title="Rename Skill"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(s)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          title="Delete Skill"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Organize skills into distinct domains for smart matching and catalog discovery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">Category Name</label>
              <Input
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value)
                  if (!editingCategory) {
                    setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"))
                  }
                }}
                placeholder="E.g. Computer Science"
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Slug URL Identifier</label>
              <Input
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="e.g. computer-science"
                className="rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Lucide Icon Name</label>
              <Input
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                placeholder="e.g. Code, Palette, BookOpen, Music"
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Description</label>
              <Input
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Brief summary of skills in this category"
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCategoryModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={handleSaveCategory}
              className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
            >
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Modal */}
      <Dialog open={skillModalOpen} onOpenChange={setSkillModalOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              {editingSkill ? "Rename Skill" : `Add Skill to ${targetCategory?.name}`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Skills are utilized in Smart Matching calculations between scholars and peer mentors.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">Skill Title</label>
              <Input
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="E.g. Python, Figma, Spanish, Calculus"
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSkillModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={handleSaveSkill}
              className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
            >
              {editingSkill ? "Save Skill" : "Add to Catalog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
