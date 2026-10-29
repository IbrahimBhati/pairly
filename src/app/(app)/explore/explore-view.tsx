"use client"

import React, { useState, useEffect, useTransition, useDeferredValue } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ListingCard } from "@/components/shared/listing-card"
import { PersonCard, type PersonMatchItem } from "@/components/shared/person-card"
import { RecommendedRow } from "@/components/shared/recommended-row"
import { EmptyState } from "@/components/shared/empty-state"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  fetchExploreListingsAction,
  fetchExplorePeopleAction,
  type ExploreListingItem,
} from "@/lib/actions/explore"
import {
  Search,
  Filter,
  X,
  Compass,
  Users,
  Layers,
  Sparkles,
  MapPin,
  ArrowUpDown,
  RotateCcw,
  Loader2,
} from "lucide-react"
import type { Category, ListingType, ListingMode } from "@/types/database"
import { cn } from "@/lib/utils"

interface ExploreViewProps {
  categories: Category[]
  recommendedPeers: PersonMatchItem[]
  initialListings: ExploreListingItem[]
  initialPeople: PersonMatchItem[]
  currentUserId?: string
}

export function ExploreView({
  categories,
  recommendedPeers,
  initialListings,
  initialPeople,
  currentUserId,
}: ExploreViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL state synchronization
  const initialTab = searchParams.get("tab") === "people" ? "people" : "listings"
  const [activeTab, setActiveTab] = useState<"listings" | "people">(initialTab)

  const [search, setSearch] = useState(searchParams.get("q") || "")
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    searchParams.get("cat") ? Number(searchParams.get("cat")) : undefined
  )
  const [selectedType, setSelectedType] = useState<ListingType | undefined>(
    (searchParams.get("type") as ListingType) || undefined
  )
  const [selectedMode, setSelectedMode] = useState<ListingMode | undefined>(
    (searchParams.get("mode") as ListingMode) || undefined
  )
  const [city, setCity] = useState(searchParams.get("city") || "")
  const [minMatch, setMinMatch] = useState<number>(
    searchParams.get("match") ? Number(searchParams.get("match")) : 0
  )
  const [sort, setSort] = useState<"best_match" | "newest" | "most_viewed">(
    (searchParams.get("sort") as any) || "best_match"
  )

  // Results State
  const [listings, setListings] = useState<ExploreListingItem[]>(initialListings)
  const [people, setPeople] = useState<PersonMatchItem[]>(initialPeople)
  const [hasMoreListings, setHasMoreListings] = useState(initialListings.length >= 12)
  const [hasMorePeople, setHasMorePeople] = useState(initialPeople.length >= 12)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // 300ms Debounce on Search Query
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTab === "people") params.set("tab", "people")
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim())
    if (selectedCategory) params.set("cat", String(selectedCategory))
    if (selectedType) params.set("type", selectedType)
    if (selectedMode) params.set("mode", selectedMode)
    if (city.trim()) params.set("city", city.trim())
    if (minMatch > 0) params.set("match", String(minMatch))
    if (sort !== "best_match") params.set("sort", sort)

    const queryString = params.toString()
    const targetUrl = queryString ? `/explore?${queryString}` : "/explore"
    router.replace(targetUrl, { scroll: false })
  }, [
    activeTab,
    debouncedSearch,
    selectedCategory,
    selectedType,
    selectedMode,
    city,
    minMatch,
    sort,
    router,
  ])

  // Fetch results when filters change
  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    startTransition(async () => {
      if (activeTab === "listings") {
        const res = await fetchExploreListingsAction({
          search: debouncedSearch,
          categoryId: selectedCategory,
          type: selectedType,
          mode: selectedMode,
          city: city,
          minMatch: minMatch,
          sort: sort,
          limit: 12,
          offset: 0,
        })
        if (!isCancelled) {
          setListings(res.listings)
          setHasMoreListings(res.hasMore)
          setLoading(false)
        }
      } else {
        const res = await fetchExplorePeopleAction({
          search: debouncedSearch,
          minMatch: minMatch,
          limit: 12,
          offset: 0,
        })
        if (!isCancelled) {
          setPeople(res.people)
          setHasMorePeople(res.hasMore)
          setLoading(false)
        }
      }
    })

    return () => {
      isCancelled = true
    }
  }, [
    activeTab,
    debouncedSearch,
    selectedCategory,
    selectedType,
    selectedMode,
    city,
    minMatch,
    sort,
  ])

  // Pagination Handler
  const handleLoadMore = async () => {
    setLoadingMore(true)
    if (activeTab === "listings") {
      const res = await fetchExploreListingsAction({
        search: debouncedSearch,
        categoryId: selectedCategory,
        type: selectedType,
        mode: selectedMode,
        city: city,
        minMatch: minMatch,
        sort: sort,
        limit: 12,
        offset: listings.length,
      })
      setListings((prev) => [...prev, ...res.listings])
      setHasMoreListings(res.hasMore)
    } else {
      const res = await fetchExplorePeopleAction({
        search: debouncedSearch,
        minMatch: minMatch,
        limit: 12,
        offset: people.length,
      })
      setPeople((prev) => [...prev, ...res.people])
      setHasMorePeople(res.hasMore)
    }
    setLoadingMore(false)
  }

  // Clear All Filters
  const handleClearFilters = () => {
    setSearch("")
    setSelectedCategory(undefined)
    setSelectedType(undefined)
    setSelectedMode(undefined)
    setCity("")
    setMinMatch(0)
    setSort("best_match")
  }

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedType ? 1 : 0) +
    (selectedMode ? 1 : 0) +
    (city.trim() ? 1 : 0) +
    (minMatch > 0 ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0)

  // Reusable Filter Controls Panel
  const renderFilterPanel = () => (
    <div className="space-y-6">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge className="bg-primary/15 text-primary text-[10px] px-1.5 py-0">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* 1. Minimum Match Score Slider */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span>Minimum Compatibility</span>
          </span>
          <span className="text-xs font-bold text-primary font-heading">
            {minMatch > 0 ? `${minMatch}%+` : "Any"}
          </span>
        </div>
        <Slider
          value={minMatch}
          min={0}
          max={90}
          step={5}
          onChange={setMinMatch}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>All peers</span>
          <span>50% (Good)</span>
          <span>75%+ (High)</span>
        </div>
      </div>

      {/* 2. Listing Type (Visible in Listings Tab) */}
      {activeTab === "listings" && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground">Listing Type</span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: undefined, label: "All" },
              { id: "exchange" as const, label: "Exchange" },
              { id: "help_offer" as const, label: "Offers" },
              { id: "help_request" as const, label: "Requests" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setSelectedType(item.id)}
                className={cn(
                  "p-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer",
                  selectedType === item.id
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Delivery Mode (Visible in Listings Tab) */}
      {activeTab === "listings" && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground">Delivery Mode</span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: undefined, label: "Any" },
              { id: "online" as const, label: "Online" },
              { id: "in_person" as const, label: "In Person" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setSelectedMode(item.id)}
                className={cn(
                  "p-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer",
                  selectedMode === item.id
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Location / City Input */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span>City or Campus</span>
        </span>
        <div className="relative">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Boston or Cambridge"
            className="h-9 rounded-xl text-xs bg-background pl-8"
          />
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          {city && (
            <button
              type="button"
              onClick={() => setCity("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Category Filter */}
      {activeTab === "listings" && categories.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground">Categories</span>
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setSelectedCategory(undefined)}
              className={cn(
                "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer",
                selectedCategory === undefined
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span>All Categories</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat.id ? undefined : cat.id)
                }
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Large Top Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by topic, skill, or keyword (e.g. Next.js, Spanish, Figma, Calculus)..."
          className="h-13 w-full rounded-2xl pl-12 pr-10 text-sm sm:text-base border-border bg-card shadow-sm focus-visible:ring-primary/60 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Recommended for You Row (Default Explore view) */}
      {recommendedPeers.length > 0 && activeFilterCount === 0 && (
        <RecommendedRow recommendedPeers={recommendedPeers} />
      )}

      {/* 3. Main Discovery Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Left Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 card-soft p-5 sticky top-24">
          {renderFilterPanel()}
        </aside>

        {/* Right Content Area */}
        <main className="lg:col-span-9 space-y-5">
          {/* Top Bar: Tabs, Mobile Filter Sheet & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
            {/* Tabs: Listings vs People */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("listings")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === "listings"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>Listings ({listings.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("people")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === "people"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="h-3.5 w-3.5 text-secondary" />
                <span>People ({people.length})</span>
              </button>
            </div>

            {/* Mobile Filter Sheet Trigger & Sort Select */}
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              {/* Mobile Filter Trigger */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden rounded-xl text-xs gap-1.5 h-9"
                    />
                  }
                >
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-6 overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-left font-heading font-bold text-base">
                      Filter Marketplace
                    </SheetTitle>
                  </SheetHeader>
                  {renderFilterPanel()}
                </SheetContent>
              </Sheet>

              {/* Sort Selector */}
              {activeTab === "listings" && (
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as any)}
                    className="h-9 rounded-xl border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="best_match">Best Match</option>
                    <option value="newest">Newest First</option>
                    <option value="most_viewed">Most Viewed</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
              <span className="text-[11px] text-muted-foreground font-semibold">Active:</span>
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px]">
                  <span>Query: &ldquo;{debouncedSearch}&rdquo;</span>
                  <button type="button" onClick={() => setSearch("")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px]">
                  <span>{categories.find((c) => c.id === selectedCategory)?.name}</span>
                  <button type="button" onClick={() => setSelectedCategory(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedType && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] capitalize">
                  <span>Type: {selectedType.replace("_", " ")}</span>
                  <button type="button" onClick={() => setSelectedType(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedMode && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] capitalize">
                  <span>Mode: {selectedMode}</span>
                  <button type="button" onClick={() => setSelectedMode(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {city && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px]">
                  <span>City: {city}</span>
                  <button type="button" onClick={() => setCity("")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {minMatch > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px]">
                  <span>Match &ge; {minMatch}%</span>
                  <button type="button" onClick={() => setMinMatch(0)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Skeletons while loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-soft p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Display */}
          {!loading && (
            <>
              {/* TAB 1: LISTINGS */}
              {activeTab === "listings" && (
                <>
                  {listings.length === 0 ? (
                    <EmptyState
                      icon={Compass}
                      title="No matching listings found"
                      description="Try widening your search terms, lowering the minimum match percentage, or clearing specific filters."
                      actionLabel="Reset Filters"
                      onAction={handleClearFilters}
                      className="my-8"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.map((listing) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          isOwner={listing.owner_id === currentUserId}
                          currentUserId={currentUserId}
                          matchScore={listing.match_score}
                          matchedYouWant={listing.matched_you_want}
                          matchedTheyWant={listing.matched_they_want}
                        />
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {hasMoreListings && (
                    <div className="pt-6 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="rounded-xl px-6 text-xs font-semibold gap-1.5 h-10 shadow-2xs"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Loading more listings...</span>
                          </>
                        ) : (
                          <span>Load More Listings</span>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: PEOPLE */}
              {activeTab === "people" && (
                <>
                  {people.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No peers found matching criteria"
                      description="Try clearing your search query or adjusting your minimum match filter to discover more partners."
                      actionLabel="Reset Filters"
                      onAction={handleClearFilters}
                      className="my-8"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {people.map((person) => (
                        <PersonCard
                          key={person.user_id}
                          person={person}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {hasMorePeople && (
                    <div className="pt-6 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="rounded-xl px-6 text-xs font-semibold gap-1.5 h-10 shadow-2xs"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Loading more peers...</span>
                          </>
                        ) : (
                          <span>Load More People</span>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
