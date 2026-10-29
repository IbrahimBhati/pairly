# Pairly Security Architecture & Audit Report

**Platform Tagline:** Share Skills. Help Others. Grow Together.  
**Version:** Phase 7 Final Production Polish  
**Date:** October 2026  
**Scope:** Full-Stack Security Review (Supabase Postgres, Next.js Server Actions, Storage, Auth, and Moderation)

---

## 1. Executive Summary

Pairly is built from the ground up on a defense-in-depth security model. Peer-to-peer interactions, private direct messaging, reputation reviews, identity documents, and administration panels are isolated using cryptographic session verification, Row Level Security (RLS) policies, and server-side authorization guards.

---

## 2. Row Level Security (RLS) Audit

Every public table in the PostgreSQL database has Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). No data is accessible without passing an explicit database policy.

| Table Name | RLS Enabled | Read Access | Write / Insert Access | Admin Override |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | **YES** | Public / Members | Owner only (`auth.uid() = id`) | Update/Suspend (`is_admin()`) |
| `categories` | **YES** | Public | Read-only to users | Full CRUD (`is_admin()`) |
| `skills` | **YES** | Public | Read-only to users | Full CRUD with safety check |
| `user_skills` | **YES** | Public (for matching) | Owner only (`auth.uid() = user_id`) | Cascade on profile |
| `listings` | **YES** | Public (excluding blocked) | Owner only | Close/Remove (`is_admin()`) |
| `saved_listings` | **YES** | Owner only | Owner only | Owner only |
| `connection_requests` | **YES** | Sender & Receiver only | Sender (if not blocked) | Read/Audit |
| `conversations` | **YES** | Participants only | System generated on accept | Read/Audit |
| `messages` | **YES** | Conversation participants | Participant (if not blocked) | Audit |
| `notifications` | **YES** | Recipient only | System triggers only | Recipient only |
| `reviews` | **YES** | Public | Participant only if completed | Delete & Recalc (`is_admin()`) |
| `badges` | **YES** | Public | System seeded | Read/Audit |
| `user_badges` | **YES** | Public | Trigger automation only | Trigger automation |
| `blocks` | **YES** | Blocker only | Blocker only | Read/Audit |
| `reports` | **YES** | Reporter & Admins | Authenticated users | Full status update (`is_admin()`) |
| `verification_requests` | **YES** | Requester & Admins | Authenticated users | Approve/Reject (`is_admin()`) |
| `user_settings` | **YES** | Owner & Admins | Owner only | Read (`is_admin()`) |
| `admin_audit_log` | **YES** | Admins only | Admins only | Strict admin restriction |

---

## 3. Storage Security & Verification Documents

1. **Avatars Bucket (`avatars`)**:
   - Status: Public read, authenticated owner upload.
   - Limit: 2MB max file size.
   - MIME Types: `image/jpeg`, `image/png`, `image/webp`.
2. **Verification Bucket (`verification-docs`)**:
   - Status: **Strictly Private (`public = false`)**.
   - Read Access: Only accessible by elevated administrators via `is_admin()` or temporary signed URLs generated server-side.
   - Write Access: Only authenticated applicants can upload their own verification documents.
   - Limit: 5MB max file size.
   - MIME Types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

---

## 4. Key Management & Client Exposure

- **Service-Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` is never referenced in client-side code, never prefixed with `NEXT_PUBLIC_`, and never bundled into client JavaScript.
- **Anon Key**: The public anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is safe to expose in the browser because all database operations are guarded by Row Level Security policies evaluated against `auth.uid()`.

---

## 5. Input Validation & Content Safety

1. **Zod Validation**: All Server Actions rigorously validate inputs (`zod` schemas or strict sanitizers) for lengths, nullables, and valid types before querying the database.
2. **Content Safety Filter (`src/lib/safety.ts`)**:
   - Prohibits banned keywords, harassment, and abuse terms.
   - Blocks phone numbers and external emails during first contact messages to prevent off-platform scams and protect student privacy.
3. **Bilateral Blocking**:
   - If User A blocks User B, neither party can view each other in Smart Matching, Explore search, direct messages, or connection requests.

---

## 6. Administrative Privilege Guarding

1. **Database Level**:
   - `public.is_admin()` helper function is `SECURITY DEFINER` and checks `profiles.role = 'admin'` for `auth.uid()`.
2. **Middleware Level (`src/lib/supabase/middleware.ts`)**:
   - Blocks any non-admin authenticated user hitting `/admin` and redirects them to `/dashboard`.
3. **Server Action Level (`src/lib/actions/admin.ts`)**:
   - `requireAdmin()` explicitly verifies the session and database role prior to executing any administrative mutation.
4. **Audit Logging**:
   - All admin actions (suspensions, reinstatements, role changes, verification decisions, listing removals, review deletions) write an immutable row to `admin_audit_log`.

---

## 7. Residual Risks & Future Roadmap

- **Rate Limiting**: Currently relies on Supabase Auth default rate limits. For enterprise scale, deploy Upstash Redis rate limiting on connection requests.
- **Virus Scanning on Uploads**: Verification documents are currently restricted by MIME type and file size. A production release should attach a ClamAV or Google Cloud Virus Scanning webhook to storage triggers.
