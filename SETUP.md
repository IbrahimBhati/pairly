# Pairly — Project Setup & Database Guide

> **Tagline:** Share Skills. Help Others. Grow Together.  
> **Type:** Peer-to-Peer Skill Exchange Platform (University Major Project)  
> **Status:** Phase 1 (Foundation), Phase 2 (Authentication & Onboarding), Phase 3 (User Profiles & Listings), Phase 4 (Explore & Smart Matching), and Phase 5 (Connections & Real-Time Chat) Complete

---

## 1. Prerequisites

- **Node.js**: v18.17+ or v20+ (tested on Node v24)
- **npm**: v9+ (or pnpm/yarn)
- **Supabase Account**: [https://supabase.com](https://supabase.com) (Free tier)

---

## 2. Project Architecture & Technologies

- **Framework**: Next.js 16 (App Router, Turbopack, TypeScript, `src/` directory)
- **Styling**: Tailwind CSS v4, Shadcn UI (`@base-ui/react`), Lucide React icons
- **Theming**: `next-themes` (Dark/Light/System) with customized Deep Purple (`#4B3F72`), Soft Lavender (`#A78BFA`), and Mint Green (`#A7F3D0`) tokens
- **Typography**: Google Fonts via `next/font` — *Plus Jakarta Sans* (Headings) and *Inter* (Body)
- **State & Forms**: `zod`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `sonner`
- **Testing**: `vitest` unit test suite for matching algorithms
- **Backend & Auth**: Supabase SSR (`@supabase/supabase-js`, `@supabase/ssr`), Row Level Security, Supabase Storage

---

## 3. Supabase Database & Storage Migrations

Execute the following migrations in your Supabase project via the **SQL Editor**:

### Migration 1: Schema & Security (`supabase/migrations/001_init.sql`)
1. In the Supabase Dashboard, open the **SQL Editor**.
2. Copy and paste the contents of [`supabase/migrations/001_init.sql`](file:///f:/pairly/supabase/migrations/001_init.sql).
3. Click **Run**.
4. Creates:
   - ENUMs: `user_type` ('student', 'teacher', 'professional', 'community'), `user_role` ('user', 'admin'), `skill_direction` ('offered', 'wanted')
   - Tables: `profiles`, `categories`, `skills`, `user_skills`
   - Trigger: `handle_new_user()` auto-populating `profiles` upon signup
   - Trigger: `set_updated_at()` maintaining `updated_at` timestamps
   - Strict Row Level Security (RLS) policies on all tables

### Migration 2: Catalog Seed Data (`supabase/migrations/002_seed.sql`)
1. In the **SQL Editor**, paste the contents of [`supabase/migrations/002_seed.sql`](file:///f:/pairly/supabase/migrations/002_seed.sql).
2. Click **Run**.
3. Seeds:
   - **10 Core Categories**: Programming, Design, Languages, Music, Academics and Tutoring, Business and Career, Fitness and Wellness, Cooking, Arts and Crafts, Community Help.
   - **100 Realistic Skills**: 10 skills per category with unique category constraints.

### Migration 3: Storage & Avatars (`supabase/migrations/003_storage_and_onboarding.sql`)
1. In the **SQL Editor**, paste the contents of [`supabase/migrations/003_storage_and_onboarding.sql`](file:///f:/pairly/supabase/migrations/003_storage_and_onboarding.sql).
2. Click **Run**.
3. Creates:
   - Supabase Storage bucket **`avatars`** (public read, 2MB size limit, allowed MIME types: JPG, PNG, WebP).
   - Storage RLS policies enabling authenticated users to upload and manage their avatars.

### Migration 4: Listings & Saved Listings (`supabase/migrations/004_listings.sql`)
1. In the **SQL Editor**, paste the contents of [`supabase/migrations/004_listings.sql`](file:///f:/pairly/supabase/migrations/004_listings.sql).
2. Click **Run**.
3. Creates:
   - ENUMs: `listing_type` ('exchange', 'help_request', 'help_offer'), `listing_mode` ('online', 'in_person', 'both'), `listing_status` ('active', 'paused', 'completed', 'closed')
   - Table `listings` with CHECK constraints enforcing skill requirements per listing type.
   - Table `saved_listings` with composite PK `(user_id, listing_id)`.
   - Security function & RPC: `increment_listing_view_count(target_listing_id)`.
   - Optimized indexes and comprehensive Row Level Security policies.

### Migration 5: Smart Matching Engine (`supabase/migrations/005_matching.sql`)
1. In the **SQL Editor**, paste the contents of [`supabase/migrations/005_matching.sql`](file:///f:/pairly/supabase/migrations/005_matching.sql).
2. Click **Run**.
3. Creates:
   - PostgreSQL extension `pg_trgm` for fuzzy similarity matching.
   - Full-text search index (`tsvector` on `listings.title` and `listings.description`).
   - Trigram index on `skills.name` and `listings.title`.
   - `calculate_match_score(user_a, user_b)` returning `(score, matched_you_want, matched_they_want)` based on 5 weighted dimensions (Mutual Exchange 60, Category Affinity 15, Peer Group 5, Location 10, Trust & Completeness 10).
   - `get_matches_for_user(p_user, p_limit, p_offset)` for ranking peers.
   - `explore_listings(p_user, p_search, p_category, p_type, p_mode, p_city, p_min_match, p_sort, p_limit, p_offset)` providing listing search with bilateral score +10 boost.

### Migration 6: Connection Request Lifecycle, Chat & Notifications (`supabase/migrations/006_connections_chat.sql`)
1. In the **SQL Editor**, paste the contents of [`supabase/migrations/006_connections_chat.sql`](file:///f:/pairly/supabase/migrations/006_connections_chat.sql).
2. Click **Run**.
3. Creates:
   - ENUM `connection_status`: `'pending'`, `'accepted'`, `'declined'`, `'cancelled'`, `'completed'`.
   - Table `connection_requests` with lifecycle tracking, intro message, match score, and dual-confirmation `completion_requested_by`.
   - Table `conversations` with automatic creation trigger upon connection acceptance.
   - Table `messages` with automatic `last_message_at` updating trigger and `read_at` receipt tracking.
   - Table `notifications` with automated triggers for connection requests, status changes, and new chat messages.
   - Row Level Security (RLS) guaranteeing that only participants can read/send messages and only while connection is `'accepted'`.
   - Enables Supabase Realtime publication on `messages`, `notifications`, and `connection_requests`.

### Optional Dev-Only Seed: Demo Matching Users (`supabase/seed_dev_users.sql`)
To test the Smart Matching algorithm and Explore page locally with 10 pre-configured profiles and varied skills:
1. In the **SQL Editor**, paste the contents of [`supabase/seed_dev_users.sql`](file:///f:/pairly/supabase/seed_dev_users.sql).
2. Click **Run**.
*(Note: Foreign keys to `auth.users` may require test auth accounts or local testing mode; the TypeScript engine in `src/lib/matching.ts` also mirrors this exact formula with 100% test coverage via Vitest).*

---

## 4. Manual Supabase Dashboard Configuration

### 4.1. Disable Email Confirmations for Local Development (Recommended)
By default, Supabase requires users to verify their email before a session is issued. For fast local testing:
1. In Supabase Dashboard, go to **Authentication** &rarr; **Providers** &rarr; **Email**.
2. Toggle **OFF** "Confirm email".
3. Click **Save**.
*(Now new signups on `/signup` will immediately sign in and redirect directly to `/onboarding` without waiting for an email link).*

### 4.2. Set URL Configuration & Redirect URLs
To ensure OAuth and password recovery redirects work smoothly:
1. In Supabase Dashboard, go to **Authentication** &rarr; **URL Configuration**.
2. Set **Site URL** to: `http://localhost:3000`
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/callback`
4. Click **Save**.

### 4.3. Google OAuth Provider Setup (Optional)
To enable the "Continue with Google" button:
1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create OAuth 2.0 Client Credentials:
   - **Application Type**: Web application
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://<YOUR-PROJECT-ID>.supabase.co`
   - **Authorized redirect URI**:
     - `https://<YOUR-PROJECT-ID>.supabase.co/auth/v1/callback`
2. In Supabase Dashboard, navigate to **Authentication** &rarr; **Providers** &rarr; **Google**.
3. Toggle Google **ON**, paste your **Client ID** and **Client Secret**, and click **Save**.

---

## 5. Environment Configuration

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Retrieve your project API credentials from **Project Settings** &rarr; **API**:
   - `NEXT_PUBLIC_SUPABASE_URL`: e.g. `https://xyzprojectid.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 6. Running and Verifying Phase 2

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:

---

## 7. Running and Verifying Phase 3 & Phase 4

### 7.1. Run Algorithm Unit Tests
Execute the Vitest test suite to verify the mathematical formula and edge cases of the Smart Matching algorithm:
```bash
npm test
```
This tests:
- **Scenario A**: Perfect mutual skill exchange (100% match).
- **Scenario B**: One-sided match (A wants B's skills, B wants none of A's).
- **Scenario C**: Zero skill overlap with disjoint categories.
- **Scenario D**: Listing-level boost (+10 points for exchange compatibility).

### 7.2. Explore Page Verification (`/explore`)
1. **Search**:
   - Use the debounced 300ms search bar to search listings and people by keyword or skill name.
2. **Filters & URL Synchronization**:
   - Filter by Category, Listing Type (`exchange`, `help_request`, `help_offer`), Mode (`online`, `in_person`, `both`), City, and Minimum Match % slider.
   - Observe that filter states reflect in query params (`?q=...&category=...&minMatch=60&sort=best_match`), making URLs shareable and refresh-resilient.
   - Use "Clear all" to reset the filters.
3. **Tabs**:
   - **Listings Tab**: Displays `ListingCard` with `MatchBadge` (e.g., `87% match`). Hover/click badge to view breakdown: *"They offer: [skills you want]"* & *"They want: [skills you offer]"*.
   - **People Tab**: Displays `PersonCard` with user avatar, name, verification badge, top skills offered/wanted, and match score badge.
4. **"Recommended for you" Carousel**:
   - Displays the top 6 matching peers in a horizontal carousel at the top of the Explore page.
5. **Pagination**:
   - Smooth "Load more" button with loading skeletons and empty states when filters produce no matches.

### 7.3. Dashboard & Profile Match Integration
1. **Dashboard (`/dashboard`)**:
   - **Real Match Count**: Displays the actual count of compatible users scoring 60% or higher.
   - **Top Matches Card**: Shows the top 5 compatible users with direct link to their profiles and match badges.
2. **Profile & Listing Match Badges**:
   - Viewing `/u/[username]` shows a prominent `MatchBadge` comparing your profile to theirs.
   - Viewing `/listings/[id]` displays the match score in both the header badge row and the owner mini-profile sidebar.

---

## 8. Running and Verifying Phase 5: Connection Requests & Real-Time Chat

### 8.1. Manual Supabase Dashboard Configuration for Realtime
Although Migration 6 includes `ALTER PUBLICATION supabase_realtime ADD TABLE ...`, verify that Realtime is enabled in your Supabase Dashboard:
1. In the Supabase Dashboard, go to **Database** &rarr; **Publications**.
2. Click on **`supabase_realtime`**.
3. Verify that the following 3 tables have Realtime toggled **ON**:
   - `messages`
   - `notifications`
   - `connection_requests`
4. If not toggled on, click **Edit** and enable them, then click **Save**.

---

### 8.2. Two-Browser Testing Script (Step-by-Step)

Follow this testing procedure with two different browser windows (e.g., standard Chrome and an Incognito window, or Firefox) to test connection requests, live notifications, real-time messaging, and exchange completion:

#### Step 1: Sign up User A and User B
1. **Browser 1 (User A)**:
   - Visit [http://localhost:3000/signup](http://localhost:3000/signup).
   - Sign up as `alex@pairly.dev` (Password: `Password123!`, Name: `Alex Chen`, Role: `Student`, Username: `alexchen`).
   - Complete Onboarding: Offers `Python` & `TypeScript`, Wants `React` & `Spanish`.
   - Publish an active Skill Exchange listing: *"Learn Python & FastAPI"* offering `Python`, wanting `React`.
2. **Browser 2 (User B)**:
   - In an Incognito window, visit [http://localhost:3000/signup](http://localhost:3000/signup).
   - Sign up as `sofia@pairly.dev` (Password: `Password123!`, Name: `Sofia Martinez`, Role: `Student`, Username: `sofiamartinez`).
   - Complete Onboarding: Offers `React` & `Spanish`, Wants `Python`.

#### Step 2: Propose Skill Exchange Connection
1. In **Browser 2 (Sofia)**, visit `/explore` or `/u/alexchen`.
2. Notice the **MatchBadge** displays `100% match` (perfect mutual fit!).
3. Click the **Connect** button.
4. The **Connect with Peer** dialog opens displaying:
   - Sofia & Alex match breakdown (`100%`).
   - Pre-populated friendly intro template:
     *"Hi Alex Chen, I saw your profile on Pairly and would love to connect! I'm really keen to learn Python and would be delighted to exchange with React..."*
5. Click **Send Request**.
6. Observe that:
   - A success toast appears: *"Connection request sent!"*.
   - The button dynamically changes to disabled **"Request sent"** with a checkmark.
   - Sofia's `/connections?tab=sent` now displays the pending request card with a Soft Lavender `Pending` badge.

#### Step 3: Real-Time Notification & Request Acceptance
1. Switch to **Browser 1 (Alex)**.
2. Notice:
   - The topbar bell icon displays a red/purple unread badge (`1 new`).
   - A live sonner toast appears: *"New Connection Request — Sofia Martinez sent you a skill exchange request."*.
   - The Sidebar **Connections** item shows a live badge with count `1`.
3. In **Browser 1 (Alex)**, navigate to `/connections` (or click notification link):
   - Under the **Received** tab, Alex sees Sofia's card with her message, match score (`100%`), and buttons: **Decline** and **Accept Request**.
4. Click **Accept Request**:
   - The connection request status updates to `accepted`.
   - A conversation room is automatically created.
   - Alex is redirected immediately to the chat interface at `/messages/[conversationId]`.

#### Step 4: Real-Time Chat & Read Receipts
1. In **Browser 2 (Sofia)**:
   - A live toast announces: *"Connection Accepted! — Alex Chen accepted your request. Start chatting now!"*.
   - Click the toast or navigate to `/messages`.
   - Alex's conversation appears at the top of the conversation list.
   - Sofia enters `/messages/[conversationId]`.
2. **Send Real-Time Messages**:
   - In **Browser 2**, Sofia types: *"Hey Alex! Super excited to swap Python for React. Are weekends good for you?"* and presses `Enter`.
   - In **Browser 1**, Alex's chat window updates instantly in real time via Supabase Realtime without any page refresh!
   - While Alex is typing a reply, observe Sofia's window display: *"Alex Chen is typing..."* with animated pulsing dots.
   - In **Browser 1**, Alex presses Enter: *"Weekends are perfect! Saturday 10 AM works great."*.
   - In **Browser 1**, once Sofia reads the message, a **"Seen"** receipt indicator appears under Alex's last message.

#### Step 5: Dual-Confirmation Exchange Completion
1. When learning sessions are finished, navigate to `/connections?tab=active`:
   - Both Alex and Sofia see their active exchange card with status `Accepted & Active` in Mint Green.
2. In **Browser 1 (Alex)**, click **Mark as Completed**:
   - Confirmation dialog opens: *"Confirm Skill Exchange Completion"*.
   - Click **Yes, Confirm Completed**.
   - Alex's card status displays: *"Waiting for partner to confirm completion"*.
   - In **Browser 2 (Sofia)**, a notification arrives: *"Exchange Completion Requested — Alex Chen requested to mark your exchange as completed. Please confirm!"*.
   - Sofia's button turns into green **Confirm Completion**.
3. In **Browser 2 (Sofia)**, click **Confirm Completion**:
   - Both users receive a celebratory toast: *"Exchange Completed! 🎉"*.
   - Status updates to `Completed` (Deep Purple badge).
   - The exchange moves to the **Completed** tab, ready for the upcoming Phase 6 review prompt.

---

### Phase 6: Post-Exchange Reviews, Gamification, and Trust & Safety

#### 1. Apply Database Migration 007
Apply the Phase 6 migration to Supabase:
```bash
npx supabase db push
# Or copy and execute supabase/migrations/007_reviews_gamification_safety.sql in Supabase SQL Editor
```

This migration provisions:
- `reviews` table with 1-5 star ratings, optional skill/communication/punctuality sub-ratings, and mutual constraints.
- `badges` & `user_badges` tables seeded with 8 campus badges.
- `reports` table for reporting users or listings with reason categories.
- `blocks` table with bilateral exclusion filters on Explore matching and chat.
- `verification_requests` table with `verification-docs` private storage bucket.
- Triggers: `trg_exchange_completed` and `trg_review_insert`, plus `award_badges()` procedure.

---

### Phase 6 Trigger Test Checklist

Run through this test sequence to verify each database trigger, gamification rule, and safety feature:

#### 1. Trigger Test: `trg_exchange_completed` (Exchange Completion)
- [ ] **Step 1.1**: Complete an exchange between User A (Alex) and User B (Sofia) via `/connections` (both confirm).
- [ ] **Step 1.2**: Inspect `profiles` table for Alex and Sofia:
  - `completed_exchanges` incremented by `1`.
  - `points` increased by `+20`.
- [ ] **Step 1.3**: Check `user_badges` table:
  - Both Alex and Sofia are automatically awarded the `"First Exchange"` badge (slug: `first_exchange`).
- [ ] **Step 1.4**: Check `notifications` table:
  - A notification of type `badge_earned` is created for both users: *"Badge Earned! You unlocked the 'First Exchange' badge."*.

#### 2. Trigger Test: `trg_review_insert` (Reviews & Rating Calculation)
- [ ] **Step 2.1**: Navigate to `/connections?tab=completed`.
  - Notice the **Completed Exchanges & Trust Reviews** banner.
  - Click **Leave Review** on the completed trade.
- [ ] **Step 2.2**: The interactive `ReviewDialog` opens:
  - Select 5 stars.
  - Expand and rate sub-ratings: Skill Quality (5★), Communication (5★), Punctuality (5★).
  - Write a comment: *"Sofia was brilliant at explaining state management and async Python!"*.
  - Submit the review.
- [ ] **Step 2.3**: Verify Reviewer rewards:
  - Reviewer (Alex) receives `+5 points` (displayed in the celebration pulse modal).
- [ ] **Step 2.4**: Verify Reviewee rewards & trigger recomputation:
  - Reviewee (Sofia)'s `avg_rating` recomputed to `5.0`.
  - `review_count` incremented to `1`.
  - Since rating was 5 stars, Sofia receives an additional `+10 points`.
  - A notification of type `review_received` is sent to Sofia.
- [ ] **Step 2.5**: Test duplicate review prevention:
  - Attempting to review the same completed connection again throws a unique constraint error (`UNIQUE(connection_id, reviewer_id)`).

#### 3. Trigger Test: `award_badges()` Milestones
- [ ] **Step 3.1**: Five-Star Badge:
  - When a user achieves `avg_rating >= 4.8` with at least 5 reviews, `award_badges()` unlocks `"Five Star"` (`five_star`).
- [ ] **Step 3.2**: Skill Sharer / Community Pillar:
  - At 5 completed exchanges: `"Skill Sharer"` unlocks.
  - At 15 completed exchanges: `"Community Pillar"` unlocks.
- [ ] **Step 3.3**: Verified Member:
  - When `is_verified` becomes `true`, `"Verified Member"` unlocks and `+50 points` is awarded.

#### 4. Level & Gamification UI Verification
- [ ] **Step 4.1**: Visit `/achievements`:
  - Verify Level Card renders with the user's current level (e.g. `Level 1 Newcomer` or `Level 2 Explorer`).
  - Progress bar renders with Deep Purple to Lavender gradient (`bg-gradient-to-r from-[#4B3F72] to-[#A78BFA]`).
  - Earned badges render with colored icons and green "Unlocked" status with date earned.
  - Locked badges render in grayscale with dynamic progress hints (e.g. *"1 of 5 exchanges completed"*).
- [ ] **Step 4.2**: Visit `/leaderboard`:
  - Observe Top 20 users ranked by points with Crown/Medal icons.
  - Filter tabs toggle between `All Time` and `This Month`.
  - Current user's rank is highlighted in a distinct card banner.
- [ ] **Step 4.3**: Visit `/dashboard`:
  - Verify the **"Your Progress"** card displays level, points, progress bar, and the next badge to unlock.
  - Stat 3 displays real average rating and review count.
- [ ] **Step 4.4**: Visit `/u/[username]`:
  - Profile header displays up to 3 top earned badges with BadgeTile.
  - "Reviews" tab renders the rating summary card (large average, lavender star breakdown bars, count) and verified review cards.
  - `ListingCard` and `PersonCard` display compact star ratings.

#### 5. Trust & Safety Tests (Reporting, Blocking, Verification)
- [ ] **Step 5.1**: Content Safety Filter:
  - In a chat or connection intro, attempt to send a banned phrase (`"cashapp me"`) or phone number (`"555-123-4567"`).
  - Verify message is blocked with a friendly warning toast: *"Message Blocked by Safety Filters"*.
  - Regular messages without contact sharing send smoothly.
- [ ] **Step 5.2**: Reporting:
  - Click the **Report** action (flag icon) in user profile, listing detail page, or chat header.
  - Select reason (e.g. `Spam or Advertising`) and enter context details.
  - Submit and verify report record is inserted into `reports` table with status `open`.
  - Duplicate open reports on the same target are blocked.
- [ ] **Step 5.3**: Blocking:
  - Click **Block User** in profile dropdown or chat header.
  - Confirm blocking in the confirmation dialog.
  - Verify both users are excluded in `explore_listings` and `get_matches_for_user`.
  - Verify neither user can send messages or connection requests.
  - Navigate to `/settings` and verify the user appears in **Privacy & Blocked Accounts** with an **Unblock** action.
- [ ] **Step 5.4**: Identity Verification:
  - Visit `/settings/verification` (or `/verify`).
  - Choose a method (e.g. Student ID, Institution Email, Professional Profile).
  - Submit proof document/link.
  - Status immediately reflects **Pending in Lavender** (*"Your Credentials Are Being Reviewed"*).

---

## 8. Phase 7: Admin Dashboard, Settings & Final Demo Polish

### 8.1 Apply Migration 008 (`supabase/migrations/008_admin_settings.sql`)
Execute migration 008 in your Supabase SQL editor or CLI:
```bash
npx supabase db push
```
Migration 008 establishes:
- `user_settings` table and auto-creation triggers on profile registration.
- `admin_audit_log` table tracking all administrative mutations.
- `public.is_admin()` helper function with `SECURITY DEFINER`.
- Elevated RLS policies across profiles, listings, reports, verifications, reviews, categories, and skills.
- Automatic rating recomputation trigger on review deletion (`trg_review_deleted`).
- Real-time `get_admin_analytics()` RPC aggregation function.

### 8.2 Promote Your Account to Administrator
To grant an account full administrator privileges, execute the following SQL command in your Supabase SQL Editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE username = 'YOUR_USERNAME';
-- Or by email:
-- UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@campus.edu');
```
Once promoted:
- The **Admin Panel** link will appear in your user avatar menu in the top bar.
- Direct navigation to `/admin` will be authorized.
- Non-admin attempts to access `/admin` will be redirected to `/dashboard`.

### 8.3 Populate the Presentation Demo Dataset (`supabase/seed_demo.sql`)
Run `supabase/seed_demo.sql` in the Supabase SQL editor. It populates:
- **15 Diverse Academic Users** across Student, Teacher, Professional, and Community helper personas.
- **25 Academic Listings** (15 bilateral exchanges, 5 free help offers, 5 urgent help requests).
- **Reciprocal Skills Mappings** yielding 90-95% Smart Matching scores.
- **Completed Exchanges & Real Peer Reviews** with sub-ratings.
- **Pre-Awarded Badges** (First Exchange, Skill Sharer, Five Star, Verified Member).
- **Moderation Queues**: 2 Incident Reports and 2 Verification Requests.

---

### Phase 7 Verification Checklist

#### 1. Admin Overview & Analytics (`/admin`)
- [ ] Log in as an admin user and navigate to `/admin`.
- [ ] Verify KPI metric cards render: Total Members, Active Listings, Completed Exchanges, Open Reports, Pending Verifications, Monthly Growth.
- [ ] Verify Recharts visualizations render:
  - 30-Day Daily Signups Line Chart with theme-aware tooltip.
  - Active Listings by Category Bar Chart.
  - Member Composition by Type Donut/Pie Chart.
  - Top In-Demand Skills (Offered vs Wanted tabs).

#### 2. User Administration (`/admin/users`)
- [ ] Search by member name or city. Filter by Persona (Student/Teacher/Professional), Verification, or Suspension status.
- [ ] Click **Verify** on an unverified user &rarr; verifies user, awards +50 points and badge.
- [ ] Click **Suspend** &rarr; open suspension dialog, enter administrative reason, confirm suspension. Verify suspended user is redirected to `/suspended` if logged in.
- [ ] Click **Promote / Demote** to toggle administrator access.

#### 3. Listing Moderation (`/admin/listings`)
- [ ] Filter listings by status (Active, Paused, Closed) and Category.
- [ ] Click **Close** &rarr; listing marked closed. Click **Restore** &rarr; listing returned to active.
- [ ] Click **Remove** &rarr; open reason dialog and confirm permanent deletion with author notification.

#### 4. Reports Queue (`/admin/reports`)
- [ ] Switch between status tabs: `Open`, `Reviewing`, `Resolved`, `Dismissed`.
- [ ] Click **Review** on an open report &rarr; detail Sheet slides open showing alleged violation, reporter, reported subject, target prior report count, and report narrative.
- [ ] Execute an action: Click **Suspend User**, **Remove Listing**, or **Resolve (No Action)**. Enter admin notes.
- [ ] Verify report status updates and reporter receives a resolution notification.

#### 5. Verification Examination (`/admin/verifications`)
- [ ] Filter by `Pending`, `Approved`, `Rejected`.
- [ ] Click **Examine** &rarr; modal opens with applicant details and document preview link.
- [ ] Click **Approve & Verify** &rarr; applicant profile is marked `is_verified = true`, awarded +50 points and Verified Member badge.
- [ ] Click **Reject** &rarr; enter required explanation note and confirm rejection.

#### 6. Reviews Moderation (`/admin/reviews`)
- [ ] Search reviews by comment text.
- [ ] Click **Delete** &rarr; confirm review deletion.
- [ ] Verify the review is removed and the reviewee's average rating and trust score are automatically recalculated.

#### 7. Categories & Skills Catalog (`/admin/categories-skills`)
- [ ] Click **Add New Category** &rarr; enter name, slug, and Lucide icon.
- [ ] Click **Add Skill** under a category &rarr; adds skill to catalog.
- [ ] Attempt to delete an active skill &rarr; safety guard prevents deletion and displays how many users/listings rely on it.

#### 8. Audit Trail (`/admin/audit-log`)
- [ ] Verify all moderation actions performed above (suspensions, verifications, report resolutions, review deletions) are recorded with timestamps, admin ID, and metadata.

#### 9. User Settings (`/settings`)
- [ ] **Account Tab**: Update display name and username. Test password update. Test danger zone confirmation validation (`DELETE MY ACCOUNT`).
- [ ] **Appearance Tab**: Select Light, Dark, or System mode using the 3 visual preview cards. Verify theme switches immediately and persists.
- [ ] **Notifications Tab**: Toggle email and exchange notification switches.
- [ ] **Privacy & Safety Tab**: Toggle city visibility and members-only mode. Verify Blocked Accounts list with Unblock action.


