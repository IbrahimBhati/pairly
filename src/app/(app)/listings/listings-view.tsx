"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ListingCard } from "@/components/shared/listing-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Plus, Layers, Filter } from "lucide-react"
import type { ListingWithDetails, ListingStatus } from "@/types/database"
import { cn } from "@/lib/utils"

interface ListingsViewProps {
  initialListings: ListingWithDetails[]
  currentUserId: string
}

type TabType = "all" | ListingStatus

export function ListingsView({ initialListings, currentUserId }: ListingsViewProps) {
  const router = useRouter()
  const [listings, setListings] = useState<ListingWithDetails[]>(initialListings)
  const [activeTab, setActiveTab] = useState<TabType>("all")

  // Counts
  const counts = {
    all: listings.length,
    active: listings.filter((l) => l.status === "active").length,
    paused: listings.filter((l) => l.status === "paused").length,
    completed: listings.filter((l) => l.status === "completed").length,
  }

  // Filtered listings
  const filteredListings = listings.filter((item) => {
    if (activeTab === "all") return true
    return item.status === activeTab
  })

  // Handlers for optimistic card updates
  const handleDeleteSuccess = (id: string) => {
    setListings((prev) => prev.filter((item) => item.id !== id))
  }

  const handleStatusChange = (id: string, newStatus: ListingStatus) => {
    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            My Exchange Listings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage, pause, or complete your skill offers and learning requests.
          </p>
        </div>

        <Link href="/listings/new">
          <Button className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold gap-1.5 shadow-sm hover:shadow-md transition-all">
            <Plus className="h-4 w-4" />
            <span>Create New Listing</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        {[
          { id: "all" as const, label: "All Listings", count: counts.all },
          { id: "active" as const, label: "Active", count: counts.active },
          { id: "paused" as const, label: "Paused", count: counts.paused },
          { id: "completed" as const, label: "Completed", count: counts.completed },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                activeTab === tab.id
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Listings Grid or Empty State */}
      {filteredListings.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={
            activeTab === "all"
              ? "No listings created yet"
              : `No ${activeTab} listings found`
          }
          description={
            activeTab === "all"
              ? "Publish your first skill exchange or request to connect with peers and kick off reciprocal learning."
              : `You do not have any listings currently marked as ${activeTab}.`
          }
          actionLabel={activeTab === "all" ? "Create Your First Listing" : "View All Listings"}
          onAction={() => {
            if (activeTab === "all") {
              router.push("/listings/new")
            } else {
              setActiveTab("all")
            }
          }}
          className="my-10"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isOwner={true}
              currentUserId={currentUserId}
              onDeleteSuccess={handleDeleteSuccess}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
