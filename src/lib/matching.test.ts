import { describe, it, expect } from "vitest"
import {
  calculateMatchScore,
  calculateListingMatchScore,
  type UserMatchProfile,
} from "./matching"

describe("Pairly Smart Matching Algorithm Unit Tests", () => {
  it("Scenario 1: Perfect Mutual Match (High Score)", () => {
    // User A offers React & Figma, wants Python & Spanish
    const userA: UserMatchProfile = {
      id: "user-a",
      userType: "student",
      city: "Boston",
      country: "USA",
      isVerified: true,
      bio: "CS sophomore interested in data science",
      avatarUrl: "https://example.com/avatar-a.jpg",
      skills: [
        { skillId: 1, skillName: "React & Next.js", categoryId: 1, direction: "offered" },
        { skillId: 11, skillName: "Figma UI/UX", categoryId: 2, direction: "offered" },
        { skillId: 2, skillName: "Python & Data Science", categoryId: 1, direction: "wanted" },
        { skillId: 21, skillName: "Spanish Conversational", categoryId: 3, direction: "wanted" },
      ],
    }

    // User B offers Python & Spanish, wants React & Figma (Reciprocal match!)
    const userB: UserMatchProfile = {
      id: "user-b",
      userType: "student",
      city: "Boston",
      country: "USA",
      isVerified: true,
      bio: "Data science enthusiast looking for frontend skills",
      avatarUrl: "https://example.com/avatar-b.jpg",
      skills: [
        { skillId: 2, skillName: "Python & Data Science", categoryId: 1, direction: "offered" },
        { skillId: 21, skillName: "Spanish Conversational", categoryId: 3, direction: "offered" },
        { skillId: 1, skillName: "React & Next.js", categoryId: 1, direction: "wanted" },
        { skillId: 11, skillName: "Figma UI/UX", categoryId: 2, direction: "wanted" },
      ],
    }

    const result = calculateMatchScore(userA, userB)

    // Expected breakdowns:
    // forward = 2/2 = 1.0
    // reverse = 2/2 = 1.0
    // mutualScore = 60 * (2 * 1 * 1) / (1 + 1) = 60.0
    // category affinity = Jaccard on A's wanted ({1, 3}) and B's offered ({1, 3}) = 2/2 = 1.0 -> 15.0
    // peerGroup = same user_type ('student') = 5.0
    // location = same city ('Boston') = 10.0
    // trust = verified (5) + bio (2) + avatar (1) + 3+ skills (2) = 10.0
    // Total raw = 60 + 15 + 5 + 10 + 10 = 100
    expect(result.score).toBe(100)
    expect(result.mutualScore).toBe(60)
    expect(result.categoryScore).toBe(15)
    expect(result.peerGroupScore).toBe(5)
    expect(result.locationScore).toBe(10)
    expect(result.trustScore).toBe(10)
    expect(result.matchedYouWant).toEqual(
      expect.arrayContaining(["Python & Data Science", "Spanish Conversational"])
    )
    expect(result.matchedTheyWant).toEqual(
      expect.arrayContaining(["React & Next.js", "Figma UI/UX"])
    )
  })

  it("Scenario 2: One-Sided Match (Asymmetric Fallback)", () => {
    // User A wants Python & Spanish, offers React
    const userA: UserMatchProfile = {
      id: "user-a",
      userType: "student",
      city: "Cambridge",
      country: "USA",
      isVerified: false,
      bio: "Learning Python",
      avatarUrl: null,
      skills: [
        { skillId: 1, skillName: "React & Next.js", categoryId: 1, direction: "offered" },
        { skillId: 2, skillName: "Python & Data Science", categoryId: 1, direction: "wanted" },
        { skillId: 21, skillName: "Spanish Conversational", categoryId: 3, direction: "wanted" },
      ],
    }

    // User B offers Python, but wants Guitar & Piano (User A does NOT offer any of these)
    const userB: UserMatchProfile = {
      id: "user-b",
      userType: "professional",
      city: "New York",
      country: "USA",
      isVerified: true,
      bio: "Software dev who wants music lessons",
      avatarUrl: "https://example.com/avatar-b.jpg",
      skills: [
        { skillId: 2, skillName: "Python & Data Science", categoryId: 1, direction: "offered" },
        { skillId: 31, skillName: "Acoustic Guitar", categoryId: 4, direction: "wanted" },
        { skillId: 32, skillName: "Piano Fundamentals", categoryId: 4, direction: "wanted" },
      ],
    }

    const result = calculateMatchScore(userA, userB)

    // Forward: A wants [2, 21], B offers [2] -> 1/2 = 0.5
    // Reverse: B wants [31, 32], A offers [1] -> 0/2 = 0.0
    // Since reverse = 0, fallback: 60 * 0.4 * max(0.5, 0) = 12.0 points
    expect(result.forwardRatio).toBe(0.5)
    expect(result.reverseRatio).toBe(0)
    expect(result.mutualScore).toBe(12)
    expect(result.matchedYouWant).toEqual(["Python & Data Science"])
    expect(result.matchedTheyWant).toHaveLength(0)

    // Different user_type gives 2 points
    expect(result.peerGroupScore).toBe(2)
    // Same country ('USA') gives 6 points
    expect(result.locationScore).toBe(6)
    // Trust score: verified (5) + bio (2) + avatar (1) + 3 skills (2) = 10
    expect(result.trustScore).toBe(10)
    // Total should be moderate (between 30 and 45)
    expect(result.score).toBeGreaterThanOrEqual(30)
    expect(result.score).toBeLessThanOrEqual(45)
  })

  it("Scenario 3: Disjoint / Zero Mutual Match (Baseline Only)", () => {
    // User A studies programming and languages
    const userA: UserMatchProfile = {
      id: "user-a",
      userType: "student",
      city: "London",
      country: "UK",
      skills: [
        { skillId: 1, skillName: "React", categoryId: 1, direction: "offered" },
        { skillId: 21, skillName: "Spanish", categoryId: 3, direction: "wanted" },
      ],
    }

    // User B studies cooking and fitness
    const userB: UserMatchProfile = {
      id: "user-b",
      userType: "community",
      city: "Tokyo",
      country: "Japan",
      skills: [
        { skillId: 71, skillName: "Baking", categoryId: 8, direction: "offered" },
        { skillId: 81, skillName: "Yoga", categoryId: 7, direction: "wanted" },
      ],
    }

    const result = calculateMatchScore(userA, userB)

    // Forward = 0, Reverse = 0 -> mutualScore = 0
    expect(result.mutualScore).toBe(0)
    expect(result.categoryScore).toBe(0)
    expect(result.matchedYouWant).toHaveLength(0)
    expect(result.matchedTheyWant).toHaveLength(0)

    // Baseline peer (2), baseline location (3), zero trust (0)
    expect(result.score).toBe(5)
  })

  it("Scenario 4: Direct Listing Boost (+10 points)", () => {
    const userA: UserMatchProfile = {
      id: "user-a",
      userType: "student",
      city: "Boston",
      country: "USA",
      skills: [
        { skillId: 1, skillName: "React & Next.js", categoryId: 1, direction: "offered" },
        { skillId: 2, skillName: "Python", categoryId: 1, direction: "wanted" },
      ],
    }

    const userB: UserMatchProfile = {
      id: "user-b",
      userType: "student",
      city: "Boston",
      country: "USA",
      skills: [
        { skillId: 2, skillName: "Python", categoryId: 1, direction: "offered" },
        { skillId: 1, skillName: "React & Next.js", categoryId: 1, direction: "wanted" },
      ],
    }

    const baseResult = calculateMatchScore(userA, userB)
    const boostedListingResult = calculateListingMatchScore(
      userA,
      userB,
      2, // listing offers skill 2 (Python, which A wants)
      1, // listing wants skill 1 (React, which A offers)
      true
    )

    // Should receive +10 boost up to 100
    expect(boostedListingResult.score).toBe(Math.min(100, baseResult.score + 10))
  })
})
