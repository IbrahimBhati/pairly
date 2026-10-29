# Pairly 5-Minute University Presentation & Demo Walkthrough

**Title:** Pairly — Peer-to-Peer Academic Skill Exchange Platform  
**Tagline:** "Share Skills. Help Others. Grow Together."  
**Target Duration:** Exactly 5 Minutes  
**Audience:** University Evaluation Committee & Peer Scholars

---

## Presentation Storyline Overview

| Time | Scene / Feature | Key Value Prop Demonstrated |
| :--- | :--- | :--- |
| **0:00 - 0:40** | Introduction & Problem Statement | Non-monetary peer skill exchange, academic reciprocity |
| **0:40 - 1:20** | Onboarding & Skill Catalog Setup | Defining Offered vs Wanted skills with proficiency levels |
| **1:20 - 2:05** | Explore & Smart Matching Engine | Bilateral harmonic mean matching algorithm (0-100% scores) |
| **2:05 - 2:50** | Connection Lifecycle & Real-Time Chat | Live messaging, online presence indicators, safety tips |
| **2:50 - 3:40** | Exchange Completion & Reviews | Mutual confirmation, rating breakdown, CSS celebration |
| **3:40 - 4:25** | Gamification, Badges & Achievements | Automatic badge trigger, points accrual, leveling up |
| **4:25 - 5:00** | Admin Moderation & Dark Mode Audit | Real-time analytics, report handling, verification approval |

---

## Detailed Step-by-Step Script

### Act 1: The Vision & Onboarding (0:00 – 1:20)

> **Speaker Script:**  
> *"Good morning committee members and peers. University students often face a dual challenge: they have valuable skills in programming, languages, or design, but lack the budget to hire commercial tutors for subjects they struggle with.  
> We built **Pairly**, a platform whose core mission is: 'Share Skills. Help Others. Grow Together.' Pairly operates without currency, relying on reciprocal peer exchange powered by our custom Smart Matching algorithm."*

1. **Sign Up Demo**:
   - Navigate to `/signup`.
   - Enter: Full Name (`Alex Rivera`), University Email (`alex@campus.edu`), Password (`Campus2026!`).
2. **Onboarding Flow**:
   - **Step 1 (Persona)**: Select "Student" and campus city (`Boston, MA`).
   - **Step 2 (Offered Skills)**: Add `Python` (Advanced) and `Machine Learning` (Intermediate).
   - **Step 3 (Wanted Skills)**: Add `Spanish Conversation` and `Figma UI Design`.
   - Click **Complete Setup** &rarr; Transition to Dashboard.
   - Point out the first-time **Product Tour Modal** welcoming the scholar to Pairly!

---

### Act 2: Smart Matching in Action (1:20 – 2:05)

> **Speaker Script:**  
> *"Now let's explore Pairly's core differentiator: our bilateral Smart Matching engine. Most platforms only search in one direction. Pairly calculates the harmonic mean of mutual need: do they offer what I want, AND do I offer what they need?"*

1. Navigate to `/explore`.
2. Observe the match scores:
   - Point to a top match card with **95% Match Badge**:
     - *You want:* Spanish Conversation (Offered by Sofia)
     - *They want:* Python (Offered by you)
   - Highlight the breakdown chips displaying matched reciprocal skills in mint and lavender.
3. Apply filters: filter by "Online Only" and "Computer Science". Show instant URL synchronization.

---

### Act 3: Connection Requests & Real-Time Chat (2:05 – 2:50)

> **Speaker Script:**  
> *"When Alex finds a great match, he initiates a partnership. Let's see the connection lifecycle and real-time communication."*

1. Click **Connect** on Sofia's listing.
2. Enter message: *"Hi Sofia! I'd love to help you with Python data scripts in exchange for practicing conversational Spanish."* Click **Send Request**.
3. Switch browser window / tab to Sofia's account:
   - Notice the in-app notification bell badge increment in real time via Supabase Realtime!
   - Navigate to `/connections` &rarr; Click **Accept Request**.
4. Open the chat window at `/messages`:
   - Point out the **Safety Tips Card** at the top (dismissible, advising scholars to meet in campus public areas).
   - Send live messages back and forth. Point out typing and read receipts.

---

### Act 4: Exchange Completion & Peer Review (2:50 – 3:40)

> **Speaker Script:**  
> *"After completing their tutoring session, both peers confirm the exchange. This prevents fraudulent reviews and ensures accountability."*

1. In the chat or connections header, click **Request Completion**.
2. Both parties confirm completion &rarr; status updates to `Completed`.
3. The **"Leave a Review" Banner** appears on `/connections`:
   - Click **Leave Review**.
   - Interactive star rating: Select 5 Stars (colored in brand Soft Lavender).
   - Rate sub-skills: Skill Quality (5★), Communication (5★), Punctuality (5★).
   - Comment: *"Incredible Spanish session! Sofia explained conjugations clearly."*
4. Click **Submit Review**:
   - Observe the **CSS pulse points celebration animation** (+5 points for giving feedback, +10 points to Sofia for receiving a 5-star review)!

---

### Act 5: Gamification & Badges (3:40 – 4:25)

> **Speaker Script:**  
> *"Pairly rewards positive community contribution through an automated gamification engine."*

1. Click the notification bell:
   - Notification appears: *"Badge Unlocked: First Exchange! 🏅"*
2. Navigate to `/achievements`:
   - Show the **Level Progress Bar** with gradient from Deep Purple to Lavender (Level 1 Newcomer &rarr; Explorer).
   - Show the **Badge Grid**:
     - Earned badge: Colored with mint ring and timestamp.
     - Locked badges: Grayscale with progress hints (*"1 of 5 exchanges"*).
3. Navigate to `/leaderboard`:
   - Show top 20 community scholars ranked by points, with current user rank highlighted in lavender.

---

### Act 6: Admin Dashboard & Dark Mode (4:25 – 5:00)

> **Speaker Script:**  
> *"Finally, platform integrity is guarded by our comprehensive Administrator Console and dark-mode design system."*

1. Switch to the Admin account and navigate to `/admin`:
   - Highlight real-time **KPI cards**: Total Users, Active Listings, Completed Exchanges, Open Reports.
   - Show the **Recharts suite**: 30-day user growth line chart, category bar chart, and member composition donut chart.
2. Walk through moderation queues:
   - `/admin/reports`: Demonstrate the incident detail sheet and report resolution.
   - `/admin/verifications`: Show document preview with signed private storage URLs and one-click student ID verification.
   - `/admin/audit-log`: Show the immutable audit trail recording every action.
3. **Dark Mode Showcase**:
   - Toggle theme using the `ThemeToggle` in the top bar.
   - Show how contrast, charts, dialogs, and cards smoothly transition to deep purple-navy (`#0F0B1A`) with WCAG AA compliance.

> **Closing:**  
> *"Thank you! Pairly is ready to foster collaborative learning across our campus."*
