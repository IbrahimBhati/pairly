# 🚀 Pairly — Vercel Free-Tier Production Deployment Guide

This comprehensive, step-by-step guide walks you through deploying **Pairly** to production using **100% free-tier resources**:
- **Vercel Hobby Plan** (Free hosting & serverless runtime)
- **Supabase Free Tier** (Free PostgreSQL, Auth, Realtime & Storage)
- **GitHub Free Repository** (Free code hosting & automated CI/CD)
- **GitHub Actions Free Minutes** (Free automated keepalive pinger)

---

## Table of Contents
1. [A. Push Code to GitHub](#a-push-to-github)
2. [B. Supabase Production Setup](#b-supabase-production-setup)
3. [C. Import Project in Vercel & Configure Environment Variables](#c-import-the-repo-in-vercel)
4. [D. First Deployment & URL Finalization](#d-first-deploy-then-update-urls)
5. [E. Optional Free Subdomain Customization](#e-optional-free-custom-domain)
6. [F. Configure GitHub Actions Keep-Alive Secret](#f-add-the-github-secret-site_url-and-test-keepalive)
7. [G. Automatic Deployments & Preview Branches](#g-automatic-deployments)
8. [H. Production Troubleshooting Table](#h-troubleshooting-table)
9. [5. Free-Tier Resource Limits (Practical Guidelines)](#5-free-tier-limits)
10. [6. Post-Deployment Smoke Test Checklist](#6-post-deploy-smoke-test-checklist)
11. [Copy-Paste Values Summary](#values-to-paste-into-dashboards)

---

## A. Push to GitHub

If you haven't yet pushed your local repository to GitHub, follow these commands in PowerShell or your terminal from the `pairly` root directory:

```bash
# 1. Initialize git if not already initialized
git init

# 2. Check git status (ensure .env.local and node_modules are ignored)
git status

# 3. Add all files to staging
git add .

# 4. Commit all changes
git commit -m "feat: complete Pairly phases 1-7 with Vercel production hardening"

# 5. Create a new GitHub repository at https://github.com/new (Public or Private)
# Name it 'pairly' (do NOT initialize with README/license as we have our own)

# 6. Set main branch and push
git branch -M main
git remote add origin https://github.com/<your-username>/pairly.git
git push -u origin main
```

---

## B. Supabase Production Setup

### 1. Execute Database Migrations (In Exact Order)
Open your Supabase project dashboard at [supabase.com/dashboard](https://supabase.com/dashboard), navigate to the **SQL Editor**, and execute each migration file from `supabase/migrations/` sequentially:

| Order | Migration File | Purpose |
|:---:|:---|:---|
| **1** | `001_init.sql` | Core schema: `profiles`, `categories`, `skills`, `user_skills`, trigger for new user profile creation |
| **2** | `002_rls_policies.sql` | Base row level security across all Phase 1 tables |
| **3** | `003_storage.sql` | Storage bucket configuration for user `avatars` |
| **4** | `004_listings.sql` | `listings` & `saved_listings` tables, status enums, indexes, and RLS policies |
| **5** | `005_matching.sql` | Smart Matching algorithm functions: `get_smart_match_score` & `get_smart_matches` RPCs |
| **6** | `006_connections_chat.sql` | `connection_requests`, `conversations`, `messages`, `notifications`, realtime publications |
| **7** | `007_reviews_gamification_safety.sql` | `reviews`, `badges`, `user_badges`, `reports`, `blocks`, `verification_requests`, scoring triggers |
| **8** | `008_admin_settings.sql` | `user_settings`, `admin_audit_log`, `is_admin()`, moderation policies, `get_admin_analytics()` RPC |

*(Optional Demo Seed Dataset)*: If presenting or testing with realistic users, also run `supabase/seed_demo.sql` in the SQL Editor to inject 15 sample student/tutor profiles, 25 listings, and initial badges.

### 2. Enable Realtime Publications
Navigate to **Database > Publications** (or **Database > Replication**) in Supabase:
Ensure the `supabase_realtime` publication includes the following tables:
- `messages`
- `notifications`
- `connection_requests`

*(Alternatively, run in the SQL Editor)*:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
```

### 3. Verify Storage Buckets & Policies
Navigate to **Storage** in Supabase and confirm two buckets exist:
1. **`avatars`**:
   - **Public**: `ON` (Public bucket)
   - Policies: Anyone can view (`SELECT`); authenticated users can upload (`INSERT`) and update (`UPDATE`) their own avatar.
2. **`verification-docs`**:
   - **Public**: `OFF` (Private bucket)
   - Policies: Users can insert their own verification documents; Admins can view documents via signed URLs.

### 4. Authentication > URL Configuration
Navigate to **Authentication > URL Configuration**:
1. **Site URL**: Enter your temporary or final Vercel URL:
   - Example: `https://pairly.vercel.app` (or `http://localhost:3000` during initial setup)
2. **Redirect URLs**: Add all of the following entries (one per line):
   - `https://pairly.vercel.app/auth/callback` *(replace `pairly` with your actual Vercel project name)*
   - `https://*-<your-vercel-team-or-username>.vercel.app/auth/callback` *(wildcard for preview PR deployments)*
   - `http://localhost:3000/auth/callback` *(for local development)*

### 5. Authentication > Providers: Google OAuth Setup (Free)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g. `Pairly`).
3. Navigate to **APIs & Services > OAuth consent screen**:
   - Select **External** user type.
   - Fill in App Name (`Pairly`), User support email, and Developer contact information.
   - In **Publishing status**, you can leave it in "Testing" and add your own Google email under **Test Users**, or click "Publish App" to make it live for any student/user.
4. Navigate to **APIs & Services > Credentials > Create Credentials > OAuth client ID**:
   - Application type: **Web application**
   - Name: `Pairly Web Client`
   - **Authorized JavaScript origins**:
     - `https://pairly.vercel.app`
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback` *(Find this in Supabase: Authentication > Providers > Google)*
5. Copy the **Client ID** and **Client Secret** into your Supabase Dashboard under **Authentication > Providers > Google**, toggle **Enable Google provider**, and click **Save**.

### 6. Email Delivery Configuration
> [!NOTE]
> Supabase's built-in email service on the Free Tier is rate-limited to 3-4 emails per hour.
- For university demonstrations, go to **Authentication > Providers > Email** and disable **"Confirm email"** so newly registered accounts can log in immediately.
- If you desire live confirmation emails in production, integrate a free transactional provider like **Resend** (3,000 free emails/month) or **Brevo** (300 free emails/day) under **Project Settings > Authentication > SMTP Settings**.

### 7. Promote Your User Account to Administrator
After signing up in the application with your email/username, run this command in the Supabase **SQL Editor**:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE username = '<your_username>'; -- Or WHERE email = 'your_email@university.edu'
```
*Verify with*:
```sql
SELECT id, username, full_name, role FROM public.profiles WHERE role = 'admin';
```

---

## C. Import the Repo in Vercel

1. Log in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New... > Project**.
3. Locate your `pairly` repository and click **Import**.
4. In the **Configure Project** screen:
   - **Project Name**: `pairly` (or `pairly-<your-initials>` if `pairly` is already taken on vercel.app)
   - **Framework Preset**: `Next.js` (detected automatically)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (leave default)
   - **Output Directory**: `.next` (leave default)
5. Expand the **Environment Variables** section and add the following 3 variables for **Production, Preview, and Development**:

| Key | Example Value | Where to find it |
|:---|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyzprojectid.supabase.co` | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` *(anon public key)* | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SITE_URL` | `https://pairly.vercel.app` | Your intended production Vercel URL |

6. Click **Deploy**.

---

## D. First Deploy, Then Update URLs

1. Once the deployment finishes (takes ~1-2 minutes), Vercel will provide your live URL (e.g., `https://pairly-xyz.vercel.app`).
2. If your actual assigned Vercel URL is different from the `NEXT_PUBLIC_SITE_URL` you entered:
   - In **Vercel**: Go to **Settings > Environment Variables**, edit `NEXT_PUBLIC_SITE_URL` to match your exact live production domain, and trigger a **Redeploy** (Deployments > ... > Redeploy).
   - In **Supabase**: Go to **Authentication > URL Configuration**, update **Site URL** and the `/auth/callback` in **Redirect URLs** to match the live URL.
   - In **Google Cloud Console**: If your domain changed, update the **Authorized JavaScript origins** with the exact domain.

---

## E. Optional Free Custom Domain

- Every Vercel deployment includes a 100% free `*.vercel.app` domain with automatic Let's Encrypt SSL.
- To change the subdomain name for a cleaner link:
  1. Go to **Settings > Domains** in your Vercel project.
  2. Click **Edit** next to the domain or add `my-university-pairly.vercel.app`.
  3. If available, Vercel will instantly generate the SSL certificate within seconds.
- *Note*: Custom `.com` or `.org` domains require purchasing from a domain registrar; the free `*.vercel.app` domain is ideal for university submissions and portfolios.

---

## F. Add the GitHub Secret `SITE_URL` and Test Keepalive

Supabase free projects automatically pause if they do not receive database queries for 7 days. Pairly includes an automated GitHub Actions keepalive workflow that pings the lightweight `/api/health` route every 3 days.

1. Go to your GitHub repository: `https://github.com/<your-username>/pairly`.
2. Navigate to **Settings > Secrets and variables > Actions**.
3. Click **New repository secret**.
4. Name: `SITE_URL`
5. Secret: `https://your-app.vercel.app` *(no trailing slash)*
6. Click **Add secret**.
7. Test the workflow:
   - Click the **Actions** tab in GitHub.
   - In the left sidebar, click **Supabase Keep-Alive Health Ping**.
   - Click the **Run workflow** dropdown button, select branch `main`, and click **Run workflow**.
   - Wait ~15 seconds and verify the green checkmark indicates a successful ping to `/api/health`!

---

## G. Automatic Deployments

- **Production**: Every `git push origin main` triggers an automatic Vercel production build and deployment.
- **Preview Environments**: Pushing to any other branch (or opening a Pull Request) automatically spins up an isolated preview deployment at a unique URL with comments on the pull request.

---

## H. Troubleshooting Table

| Issue / Error | Likely Root Cause | Solution |
|:---|:---|:---|
| **"Invalid redirect URL"** | Supabase has not whitelisted the callback URL. | In Supabase **Auth > URL Configuration**, add your exact domain + `/auth/callback`. |
| **Google `redirect_uri_mismatch`** | Google Cloud Console is missing the Supabase callback URI. | In Google Cloud Credentials, ensure `https://<project-ref>.supabase.co/auth/v1/callback` is listed under Authorized redirect URIs. |
| **"Failed to fetch / env undefined"** | Missing environment variables in Vercel. | In Vercel **Settings > Environment Variables**, confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` are set for all 3 environments, then redeploy. |
| **Images failing to load (Avatars)** | Remote hostname not recognized by Next.js Image Optimization. | Check `next.config.ts`. Both `lh3.googleusercontent.com` and `*.supabase.co` are pre-configured. |
| **Realtime chat or notifications not updating** | Supabase Realtime publication or RLS missing. | Run `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages, public.notifications, public.connection_requests;` in Supabase SQL editor. |
| **500 error on Server Action** | Missing database migration or invalid function call. | Check Vercel **Runtime Logs** (Vercel > Deployments > Functions tab) to see the exact stack trace. Confirm Migrations 001 to 008 were executed. |
| **"Database connection closed / Project Paused"** | Supabase Free paused due to >7 days of inactivity. | Open Supabase Dashboard and click **Restore Project**. Ensure GitHub Actions keepalive secret `SITE_URL` is configured. |

---

## 5. Free-Tier Limits (Practical Guidelines)

To maintain 100% free operation indefinitely without incurring charges or service interruption:

1. **Vercel Hobby Plan**:
   - **Allowed Use**: Personal, academic, and non-commercial portfolio projects (perfect for Pairly).
   - **Execution Timeout**: Server Actions and route handlers are capped at **10 seconds** per invocation (Pairly server actions execute in <250ms).
   - **Bandwidth**: 100 GB per month (more than enough for university demos).
2. **Supabase Free Plan**:
   - **Database Size**: 500 MB (stores hundreds of thousands of listings and messages).
   - **File Storage**: 1 GB limit for user avatars and verification documents.
   - **Active Users**: Up to 50,000 monthly active users.
   - **Concurrent Realtime**: 200 simultaneous active websocket connections.
   - **Inactivity Pause**: Pauses after 7 days of inactivity (prevented by our automated `.github/workflows/keepalive.yml`).

---

## 6. Post-Deploy Smoke Test Checklist

Once deployed, conduct this 10-step verification test on your live production URL:

- [ ] **1. Sign Up**: Create a new account with email & password on `/signup`.
- [ ] **2. Google OAuth**: Test "Continue with Google" to verify OAuth flow and callback.
- [ ] **3. Onboarding Wizard**: Complete the 4-step onboarding wizard, select skills offered & wanted, and upload an avatar picture.
- [ ] **4. Create Listing**: Post a new exchange listing with offered and wanted skills on `/listings/new`.
- [ ] **5. Explore & Smart Matching**: Navigate to `/explore`, verify listings load with calculated match percentages (e.g., 90% Great Match).
- [ ] **6. Connection Request**: Open a second browser profile or incognito window, send a connection proposal from a second account, and verify the bell notification appears.
- [ ] **7. Real-Time Chat**: Accept the connection and send messages back and forth on `/messages/[conversationId]`; verify instant websocket receipt without page reloads.
- [ ] **8. Exchange Completion & Review**: Mark the exchange as completed from both parties, submit a 5-star rating with feedback, and verify the user's trust score and review count update.
- [ ] **9. Admin Dashboard**: Sign in with your admin account and open `/admin` to verify analytics KPI cards, users table, listings moderation, reports queue, and audit log.
- [ ] **10. Dark Mode & Console**: Toggle dark mode using the theme switch and inspect browser DevTools Console to ensure zero runtime errors.

---

## Values to Paste into Dashboards

### 1. In Vercel Dashboard (`Settings > Environment Variables`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_SITE_URL=https://<your-project-name>.vercel.app
```

### 2. In Supabase Dashboard (`Authentication > URL Configuration`)
- **Site URL**:
  ```
  https://<your-project-name>.vercel.app
  ```
- **Redirect URLs**:
  ```
  https://<your-project-name>.vercel.app/auth/callback
  https://*-<your-vercel-team-or-username>.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

### 3. In Google Cloud Console (`Credentials > OAuth 2.0 Client IDs`)
- **Authorized JavaScript origins**:
  ```
  https://<your-project-name>.vercel.app
  http://localhost:3000
  ```
- **Authorized redirect URIs**:
  ```
  https://<your-project-id>.supabase.co/auth/v1/callback
  ```

### 4. In GitHub Repository (`Settings > Secrets and variables > Actions`)
- **Secret Name**: `SITE_URL`
- **Secret Value**: `https://<your-project-name>.vercel.app`
