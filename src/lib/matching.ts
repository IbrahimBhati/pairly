/**
 * Pairly Smart Matching Algorithm
 * ============================================================================
 * Peer-to-Peer Reciprocal Compatibility Engine
 *
 * Designed for university-level research & development in peer-to-peer learning.
 * Evaluates bidirectional skill complementarity between User A (searching user)
 * and User B (candidate peer or listing owner).
 *
 * SCORE BREAKDOWN (0 - 100 Total Points):
 * ----------------------------------------------------------------------------
 * 1. Mutual Exchange Score (Weight: 60 points)
 *    - forward = (Skills A wants that B offers) / (Total skills A wants)
 *    - reverse = (Skills B wants that A offers) / (Total skills B wants)
 *    - Harmonic Mean = 60 * (2 * forward * reverse) / (forward + reverse)
 *    - Asymmetric Fallback (if either side is 0): 60 * 0.4 * max(forward, reverse)
 *
 * 2. Category Affinity Score (Weight: 15 points)
 *    - Jaccard similarity between categories of A's wanted skills and B's offered skills:
 *      Jaccard = |Categories(A_wanted) ∩ Categories(B_offered)| / |Categories(A_wanted) ∪ Categories(B_offered)|
 *    - Category Score = 15 * Jaccard
 *
 * 3. Peer Group Compatibility Bonus (Weight: 5 points)
 *    - Same user_type (e.g. Student <-> Student, Teacher <-> Teacher): 5 points
 *    - Cross-category exchange: 2 points
 *
 * 4. Location & Delivery Mode Compatibility (Weight: 10 points)
 *    - Same City: 10 points
 *    - Same Country: 6 points
 *    - Different / Remote baseline: 3 points (or minimum 6 points for online mode)
 *
 * 5. Trust, Verification & Completeness Bonus (Weight: 10 points)
 *    - Verified Scholar badge (is_verified): +5 points
 *    - Bio present: +2 points
 *    - Profile Avatar present: +1 point
 *    - Active Skills Matrix (3+ skills configured): +2 points
 *
 * Total Score = min(100, round(Mutual + Category + Peer + Location + Trust))
 *
 * Listing-Level Boost:
 *    - If a specific listing offers a skill in A's wanted AND seeks a skill in A's offered:
 *      Direct listing boost of +10 points (capped at 100).
 * ============================================================================
 */

export interface SkillItem {
  skillId: number
  skillName: string
  categoryId: number
  direction: "offered" | "wanted"
}

export interface UserMatchProfile {
  id: string
  userType: string
  city?: string | null
  country?: string | null
  isVerified?: boolean
  bio?: string | null
  avatarUrl?: string | null
  skills: SkillItem[]
}

export interface MatchScoreResult {
  score: number // 0 to 100
  mutualScore: number // 0 to 60
  categoryScore: number // 0 to 15
  peerGroupScore: number // 2 or 5
  locationScore: number // 3 to 10
  trustScore: number // 0 to 10
  matchedYouWant: string[] // Skills user A wants that candidate B offers
  matchedTheyWant: string[] // Skills candidate B wants that user A offers
  forwardRatio: number
  reverseRatio: number
  categoryRatio: number
}

/**
 * Calculates the bilateral compatibility score between User A and User B.
 *
 * @param userA The active user evaluating matches
 * @param userB The candidate peer being evaluated
 * @param isOnlineListing Optional flag if evaluating an online-mode listing
 */
export function calculateMatchScore(
  userA: UserMatchProfile,
  userB: UserMatchProfile,
  isOnlineListing: boolean = false
): MatchScoreResult {
  // A's skill sets
  const wantedA = userA.skills.filter((s) => s.direction === "wanted")
  const offeredA = userA.skills.filter((s) => s.direction === "offered")

  // B's skill sets
  const wantedB = userB.skills.filter((s) => s.direction === "wanted")
  const offeredB = userB.skills.filter((s) => s.direction === "offered")

  // 1. Skill Overlaps
  // Forward: What A wants that B offers
  const matchedYouWantItems = wantedA.filter((wa) =>
    offeredB.some((ob) => ob.skillId === wa.skillId)
  )
  const matchedYouWant = Array.from(new Set(matchedYouWantItems.map((s) => s.skillName)))
  const forward = wantedA.length > 0 ? matchedYouWantItems.length / wantedA.length : 0

  // Reverse: What B wants that A offers
  const matchedTheyWantItems = wantedB.filter((wb) =>
    offeredA.some((oa) => oa.skillId === wb.skillId)
  )
  const matchedTheyWant = Array.from(new Set(matchedTheyWantItems.map((s) => s.skillName)))
  const reverse = wantedB.length > 0 ? matchedTheyWantItems.length / wantedB.length : 0

  // Mutual exchange score (harmonic mean)
  let mutualScore = 0
  if (forward > 0 && reverse > 0) {
    mutualScore = 60 * ((2 * forward * reverse) / (forward + reverse))
  } else if (forward > 0 || reverse > 0) {
    mutualScore = 60 * 0.4 * Math.max(forward, reverse)
  }

  // 2. Category Affinity Score (Jaccard similarity on A's wanted & B's offered categories)
  const categoriesAWanted = new Set(wantedA.map((s) => s.categoryId))
  const categoriesBOffered = new Set(offeredB.map((s) => s.categoryId))

  let categoryRatio = 0
  const unionCategories = new Set([...categoriesAWanted, ...categoriesBOffered])
  if (unionCategories.size > 0) {
    let intersectionCount = 0
    categoriesAWanted.forEach((catId) => {
      if (categoriesBOffered.has(catId)) {
        intersectionCount++
      }
    })
    categoryRatio = intersectionCount / unionCategories.size
  }
  const categoryScore = 15 * categoryRatio

  // 3. Peer Group Bonus (weight 5)
  const sameUserType =
    userA.userType &&
    userB.userType &&
    userA.userType.trim().toLowerCase() === userB.userType.trim().toLowerCase()
  const peerGroupScore = sameUserType ? 5 : 2

  // 4. Location & Mode Compatibility (weight 10)
  let locationScore = 3
  const cityA = userA.city?.trim().toLowerCase()
  const cityB = userB.city?.trim().toLowerCase()
  const countryA = userA.country?.trim().toLowerCase()
  const countryB = userB.country?.trim().toLowerCase()

  if (cityA && cityB && cityA === cityB) {
    locationScore = 10
  } else if (countryA && countryB && countryA === countryB) {
    locationScore = 6
  }

  // If online mode is supported, guarantee minimum 6 points for remote accessibility
  if (isOnlineListing) {
    locationScore = Math.max(locationScore, 6)
  }

  // 5. Trust, Verification & Completeness Bonus (weight 10)
  let trustScore = 0
  if (userB.isVerified) {
    trustScore += 5
  }
  if (userB.bio && userB.bio.trim().length > 0) {
    trustScore += 2
  }
  if (userB.avatarUrl && userB.avatarUrl.trim().length > 0) {
    trustScore += 1
  }
  if (userB.skills.length >= 3) {
    trustScore += 2
  }

  // Total Aggregation
  const rawScore = mutualScore + categoryScore + peerGroupScore + locationScore + trustScore
  const score = Math.min(100, Math.max(0, Math.round(rawScore)))

  return {
    score,
    mutualScore: Math.round(mutualScore * 10) / 10,
    categoryScore: Math.round(categoryScore * 10) / 10,
    peerGroupScore,
    locationScore,
    trustScore,
    matchedYouWant,
    matchedTheyWant,
    forwardRatio: Math.round(forward * 100) / 100,
    reverseRatio: Math.round(reverse * 100) / 100,
    categoryRatio: Math.round(categoryRatio * 100) / 100,
  }
}

/**
 * Calculates listing match score with direct skill pairing boost.
 *
 * @param userA The active searching user
 * @param listingOwner The owner profile of the listing
 * @param listingOfferedSkillId The skill ID offered in the listing
 * @param listingWantedSkillId The skill ID requested in the listing
 * @param isOnline Whether listing is online or flexible
 */
export function calculateListingMatchScore(
  userA: UserMatchProfile,
  listingOwner: UserMatchProfile,
  listingOfferedSkillId?: number | null,
  listingWantedSkillId?: number | null,
  isOnline: boolean = false
): MatchScoreResult {
  const baseResult = calculateMatchScore(userA, listingOwner, isOnline)

  // Direct Listing Boost: +10 if listing offers what A wants AND seeks what A offers
  const userAWantsListingOffer = listingOfferedSkillId
    ? userA.skills.some(
        (s) => s.direction === "wanted" && s.skillId === listingOfferedSkillId
      )
    : false

  const userAOffersListingWant = listingWantedSkillId
    ? userA.skills.some(
        (s) => s.direction === "offered" && s.skillId === listingWantedSkillId
      )
    : false

  if (userAWantsListingOffer && userAOffersListingWant) {
    const boostedScore = Math.min(100, baseResult.score + 10)
    return {
      ...baseResult,
      score: boostedScore,
    }
  }

  return baseResult
}
