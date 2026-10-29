-- ============================================================================
-- PAIRLY DATABASE MIGRATION: 008_admin_settings.sql
-- Description: User Settings, Admin Audit Log, Admin Role-Based Access Controls,
--              Analytics RPCs, Moderation Policies, and Trigger Automations
-- ============================================================================

-- 1. HELPER FUNCTION: is_admin()
-- Checks if current authenticated user has role = 'admin' in profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. TABLE: user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme text DEFAULT 'system' NOT NULL CHECK (theme IN ('light', 'dark', 'system')),
  email_notifications boolean DEFAULT true NOT NULL,
  notify_new_request boolean DEFAULT true NOT NULL,
  notify_messages boolean DEFAULT true NOT NULL,
  notify_reviews boolean DEFAULT true NOT NULL,
  profile_visibility text DEFAULT 'public' NOT NULL CHECK (profile_visibility IN ('public', 'members_only')),
  show_city boolean DEFAULT true NOT NULL,
  language text DEFAULT 'en' NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON public.user_settings(theme);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings or admin"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own settings or admin"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own settings or admin"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Trigger to auto-create user_settings on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_user_settings ON public.profiles;
CREATE TRIGGER trg_create_user_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();

-- Backfill existing profiles
INSERT INTO public.user_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;


-- 3. TABLE: admin_audit_log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON public.admin_audit_log(admin_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert audit log"
  ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());


-- 4. REVIEWS DELETION TRIGGER (Recalculate ratings when an admin removes a review)
CREATE OR REPLACE FUNCTION public.handle_review_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_avg numeric(3,2);
  v_count int;
BEGIN
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0.00),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE reviewee_id = OLD.reviewee_id;

  UPDATE public.profiles
  SET 
    avg_rating = v_avg,
    review_count = v_count,
    trust_score = LEAST(100, 50 + (v_avg * 10)::int)
  WHERE id = OLD.reviewee_id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_deleted ON public.reviews;
CREATE TRIGGER trg_review_deleted
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_deleted();


-- 5. ADMIN RLS POLICIES FOR EXISTING TABLES

-- 5.1 Profiles: Admins can update any profile (suspend, role, verify)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5.2 Listings: Admins can update or delete any listing
DROP POLICY IF EXISTS "Admins can update any listing" ON public.listings;
CREATE POLICY "Admins can update any listing"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any listing" ON public.listings;
CREATE POLICY "Admins can delete any listing"
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5.3 Reports: Admins can read all reports and update status/notes
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any report" ON public.reports;
CREATE POLICY "Admins can update any report"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5.4 Verification Requests: Admins can view and update
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;
CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any verification request" ON public.verification_requests;
CREATE POLICY "Admins can update any verification request"
  ON public.verification_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5.5 Reviews: Admins can delete reviews
DROP POLICY IF EXISTS "Admins can delete any review" ON public.reviews;
CREATE POLICY "Admins can delete any review"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5.6 Categories: Admins can insert, update, and delete
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5.7 Skills: Admins can insert, update, and delete
DROP POLICY IF EXISTS "Admins can insert skills" ON public.skills;
CREATE POLICY "Admins can insert skills"
  ON public.skills
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update skills" ON public.skills;
CREATE POLICY "Admins can update skills"
  ON public.skills
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete skills" ON public.skills;
CREATE POLICY "Admins can delete skills"
  ON public.skills
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5.8 Storage verification-docs bucket: Admins can read documents
DROP POLICY IF EXISTS "Admins can view verification documents" ON storage.objects;
CREATE POLICY "Admins can view verification documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND public.is_admin()
  );


-- 6. ADMIN ANALYTICS RPC FUNCTION
-- Aggregates real-time platform statistics for the Admin Overview Dashboard
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_users int;
  v_active_listings int;
  v_completed_exchanges int;
  v_open_reports int;
  v_pending_verifications int;
  v_new_this_month int;
  v_users_by_type jsonb;
  v_listings_by_category jsonb;
  v_daily_users jsonb;
  v_top_offered jsonb;
  v_top_wanted jsonb;
BEGIN
  -- Check admin authorization
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  -- KPI Counts
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_active_listings FROM public.listings WHERE status = 'active';
  SELECT COUNT(*) INTO v_completed_exchanges FROM public.connection_requests WHERE status = 'completed';
  SELECT COUNT(*) INTO v_open_reports FROM public.reports WHERE status IN ('open', 'reviewing');
  SELECT COUNT(*) INTO v_pending_verifications FROM public.verification_requests WHERE status = 'pending';
  SELECT COUNT(*) INTO v_new_this_month FROM public.profiles WHERE created_at >= (now() - interval '30 days');

  -- Users by User Type
  SELECT jsonb_agg(row_to_json(t))
  INTO v_users_by_type
  FROM (
    SELECT 
      user_type::text AS type,
      COUNT(*)::int AS count
    FROM public.profiles
    GROUP BY user_type
    ORDER BY count DESC
  ) t;

  -- Listings by Category
  SELECT jsonb_agg(row_to_json(c))
  INTO v_listings_by_category
  FROM (
    SELECT 
      cat.name AS category,
      COUNT(l.id)::int AS count
    FROM public.categories cat
    LEFT JOIN public.listings l ON l.category_id = cat.id AND l.status = 'active'
    GROUP BY cat.id, cat.name
    ORDER BY count DESC
    LIMIT 10
  ) c;

  -- 30-Day Daily User Signups Series
  SELECT jsonb_agg(row_to_json(d))
  INTO v_daily_users
  FROM (
    SELECT 
      to_char(day::date, 'Mon DD') AS date,
      COUNT(p.id)::int AS count
    FROM generate_series(
      (CURRENT_DATE - interval '29 days')::date,
      CURRENT_DATE::date,
      interval '1 day'
    ) AS day
    LEFT JOIN public.profiles p ON date_trunc('day', p.created_at) = day
    GROUP BY day
    ORDER BY day ASC
  ) d;

  -- Top 10 Offered Skills
  SELECT jsonb_agg(row_to_json(o))
  INTO v_top_offered
  FROM (
    SELECT 
      s.name AS skill,
      COUNT(*)::int AS count
    FROM public.user_skills us
    JOIN public.skills s ON s.id = us.skill_id
    WHERE us.direction = 'offered'
    GROUP BY s.name
    ORDER BY count DESC
    LIMIT 10
  ) o;

  -- Top 10 Wanted Skills
  SELECT jsonb_agg(row_to_json(w))
  INTO v_top_wanted
  FROM (
    SELECT 
      s.name AS skill,
      COUNT(*)::int AS count
    FROM public.user_skills us
    JOIN public.skills s ON s.id = us.skill_id
    WHERE us.direction = 'wanted'
    GROUP BY s.name
    ORDER BY count DESC
    LIMIT 10
  ) w;

  RETURN jsonb_build_object(
    'total_users', COALESCE(v_total_users, 0),
    'new_this_month', COALESCE(v_new_this_month, 0),
    'active_listings', COALESCE(v_active_listings, 0),
    'completed_exchanges', COALESCE(v_completed_exchanges, 0),
    'open_reports', COALESCE(v_open_reports, 0),
    'pending_verifications', COALESCE(v_pending_verifications, 0),
    'users_by_type', COALESCE(v_users_by_type, '[]'::jsonb),
    'listings_by_category', COALESCE(v_listings_by_category, '[]'::jsonb),
    'new_users_daily', COALESCE(v_daily_users, '[]'::jsonb),
    'top_offered_skills', COALESCE(v_top_offered, '[]'::jsonb),
    'top_wanted_skills', COALESCE(v_top_wanted, '[]'::jsonb)
  );
END;
$$;
