# Pairly Smart Matching Algorithm Specification

> **Platform:** Pairly — Peer-to-Peer Skill Exchange  
> **Tagline:** Share Skills. Help Others. Grow Together.  
> **Core Differentiator:** Reciprocal Bilateral Skill Compatibility Engine  

---

## 1. Overview & Theoretical Foundations

Traditional search engines and marketplace algorithms rank items by keyword relevance or unidirectional popularity. However, **peer-to-peer non-monetary skill exchange** requires a **bilateral double-coincidence of wants**:
- **Person A** offers skill $X$ and wants to learn skill $Y$.
- **Person B** offers skill $Y$ and wants to learn skill $X$.

If Person B offers what Person A wants, but Person A has nothing of interest to Person B, an exchange cannot comfortably materialize without currency. The **Pairly Smart Matching Algorithm** calculates a normalized compatibility score $S \in [0, 100]$ evaluating the mutual viability of a learning partnership.

---

## 2. Mathematical Formulation & Weight Distribution

The match score is composed of 5 weighted dimensions plus an optional listing-level boost:

$$\text{Raw Score} = S_{\text{mutual}} + S_{\text{category}} + S_{\text{peer}} + S_{\text{location}} + S_{\text{trust}}$$

$$\text{Final Score} = \min(100, \max(0, \operatorname{round}(\text{Raw Score})))$$

| Dimension | Weight | Purpose & Metric |
| :--- | :---: | :--- |
| **Mutual Exchange** | **60%** | Bidirectional harmonic mean of skill overlap ratios |
| **Category Affinity** | **15%** | Jaccard similarity index across knowledge categories |
| **Peer Group Compatibility** | **5%** | Learning dynamics bonus for same user type |
| **Location & Mode** | **10%** | Proximity bonus for in-person or remote flexibility |
| **Trust & Verification** | **10%** | Profile verification, bio, avatar, and active engagement |
| **Listing Boost** | **+10%** | Direct listing pair boost (capped at 100) |

---

## 3. Dimension Details

### 3.1. Mutual Exchange Score ($S_{\text{mutual}}$, Weight: 60)

Let:
- $W_A$ = Set of skills User A wants to learn.
- $O_A$ = Set of skills User A offers to teach.
- $W_B$ = Set of skills User B wants to learn.
- $O_B$ = Set of skills User B offers to teach.

We compute directional coverage ratios:

$$\text{forward} = \frac{|W_A \cap O_B|}{|W_A|} \quad (\text{portion of A's wants satisfied by B})$$

$$\text{reverse} = \frac{|W_B \cap O_A|}{|W_B|} \quad (\text{portion of B's wants satisfied by A})$$

To penalize asymmetric, one-sided exchanges, we use the **Harmonic Mean**:

$$S_{\text{mutual}} = 60 \times \frac{2 \times \text{forward} \times \text{reverse}}{\text{forward} + \text{reverse}} \quad \text{if } \text{forward} > 0 \text{ and } \text{reverse} > 0$$

**Asymmetric Fallback:** If either $\text{forward} = 0$ or $\text{reverse} = 0$:

$$S_{\text{mutual}} = 60 \times 0.4 \times \max(\text{forward}, \text{reverse})$$

*(If both sides are zero, $S_{\text{mutual}} = 0$.)*

---

### 3.2. Category Affinity Score ($S_{\text{category}}$, Weight: 15)

Even if specific skills do not strictly match (e.g., Python vs Rust), users interested in related disciplines (Programming, UI/UX, Languages) share pedagogical common ground. We apply the **Jaccard Similarity Index** over the category sets:

Let $C(W_A)$ be the set of category IDs of A's wanted skills, and $C(O_B)$ be the set of category IDs of B's offered skills:

$$J = \frac{|C(W_A) \cap C(O_B)|}{|C(W_A) \cup C(O_B)|}$$

$$S_{\text{category}} = 15 \times J$$

---

### 3.3. Peer Group Compatibility ($S_{\text{peer}}$, Weight: 5)

Pairly connects four distinct peer tracks (`student`, `teacher`, `professional`, `community`):
- If $\operatorname{lower}(A.\text{user\_type}) = \operatorname{lower}(B.\text{user\_type})$: **5 points**
- Cross-track exchange: **2 points**

---

### 3.4. Location & Delivery Mode ($S_{\text{location}}$, Weight: 10)

- **Same City** (e.g. both in Boston): **10 points**
- **Same Country** (e.g. both in USA): **6 points**
- **Disjoint / Remote baseline**: **3 points**
- *Remote guarantee:* Online listings always receive at least **6 points** because physical proximity is not a barrier.

---

### 3.5. Trust, Verification & Completeness ($S_{\text{trust}}$, Weight: 10)

- **Verified Scholar Badge** (`is_verified`): **+5 points**
- **Bio Present** (non-empty bio): **+2 points**
- **Avatar Present** (uploaded image): **+1 point**
- **Active Skills Matrix** (3+ skills configured): **+2 points**

---

### 3.6. Direct Listing Boost (+10 points)

When exploring listings, if a specific listing satisfies both criteria:
1. $\text{listing.offered\_skill\_id} \in W_A$
2. $\text{listing.wanted\_skill\_id} \in O_A$

The listing receives an additional **+10 point boost** (capped at 100), ensuring exact reciprocal listings appear prominently at the top.

---

## 4. Benchmark Verification Examples

### Scenario 1: Perfect Reciprocal Match (Alex Chen & Sofia Martinez)
- **Alex Chen:** Offers React & TypeScript, Wants Spanish & Python.
- **Sofia Martinez:** Offers Spanish & Python, Wants React & TypeScript.
- **Both:** Students, Boston, MA, Verified, complete profiles.
- **Calculation:**
  - Forward: $2/2 = 1.0$
  - Reverse: $2/2 = 1.0$
  - $S_{\text{mutual}} = 60 \times (2 \times 1.0 \times 1.0) / (2.0) = 60.0$
  - $S_{\text{category}} = 15 \times (2 / 2) = 15.0$
  - $S_{\text{peer}} = 5.0$
  - $S_{\text{location}} = 10.0$
  - $S_{\text{trust}} = 5 + 2 + 1 + 2 = 10.0$
  - **Score:** $60 + 15 + 5 + 10 + 10 = \mathbf{100\%}$

### Scenario 2: One-Sided Match
- **User A:** Wants Python & Spanish (2 skills), Offers React.
- **User B:** Offers Python, Wants Guitar & Piano.
- **Calculation:**
  - Forward: $1 / 2 = 0.5$
  - Reverse: $0 / 2 = 0.0$
  - $S_{\text{mutual}} = 60 \times 0.4 \times \max(0.5, 0) = \mathbf{12.0}$
  - Jaccard category: $0.0$
  - Peer: $2.0$
  - Location: $6.0$
  - Trust: $10.0$
  - **Score:** $\operatorname{round}(12 + 0 + 2 + 6 + 10) = \mathbf{30\%}$

---

## 5. Architectural Implementation

1. **Database Functions ([`supabase/migrations/005_matching.sql`](file:///f:/pairly/supabase/migrations/005_matching.sql))**:
   - `calculate_match_score(user_a uuid, user_b uuid)`: PostgreSQL `SECURITY DEFINER` function computing score and returning `matched_you_want` and `matched_they_want` arrays.
   - `get_matches_for_user(p_user uuid, p_limit int, p_offset int)`: High-performance set-returning function ranking candidate peers.
   - `explore_listings(...)`: Full-text search and trigram-indexed search query with filters and bilateral match score calculation.
2. **TypeScript Engine ([`src/lib/matching.ts`](file:///f:/pairly/src/lib/matching.ts))**:
   - Mirror implementation enabling client-side prediction, offline resilience, and unit testing.
3. **Automated Unit Tests ([`src/lib/matching.test.ts`](file:///f:/pairly/src/lib/matching.test.ts))**:
   - Verified via Vitest across 4 key scenarios (perfect mutual, asymmetric, disjoint, and listing boost).
