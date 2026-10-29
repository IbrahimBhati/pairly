-- ============================================================================
-- PAIRLY DATABASE MIGRATION: 007_reviews_gamification_safety.sql
-- Description: Post-Exchange Reviews, Gamification & Badges, Reporting,
--              User Blocking, and Identity Verification
-- ============================================================================

-- 1. UPDATE PROFILES WITH GAMIFICATION & STATS
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_exchanges int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score int DEFAULT 0;

-- 2. TABLE: reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.connection_requests(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text CHECK (char_length(comment) <= 500),
  skills_rating int CHECK (skills_rating IS NULL OR (skills_rating >= 1 AND skills_rating <= 5)),
  communication_rating int CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)),
  punctuality_rating int CHECK (punctuality_rating IS NULL OR (punctuality_rating >= 1 AND punctuality_rating <= 5)),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_connection_reviewer UNIQUE (connection_id, reviewer_id),
  CONSTRAINT check_not_self_review CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);

-- 3. GAMIFICATION: badges & user_badges
CREATE TABLE IF NOT EXISTS public.badges (
  id serial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  criteria jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id int NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- Seed Badges
INSERT INTO public.badges (slug, name, description, icon, tier, criteria)
VALUES
  ('first-exchange', 'First Exchange', 'Successfully completed your first peer skill exchange on Pairly.', 'Award', 'bronze', '{"type": "completed_exchanges", "threshold": 1}'::jsonb),
  ('skill-sharer', 'Skill Sharer', 'Completed 5 skill exchange partnerships.', 'Sparkles', 'silver', '{"type": "completed_exchanges", "threshold": 5}'::jsonb),
  ('community-pillar', 'Community Pillar', 'A dedicated pillar with 15 or more completed exchanges.', 'Crown', 'gold', '{"type": "completed_exchanges", "threshold": 15}'::jsonb),
  ('five-star', 'Five Star Peer', 'Maintained a stellar 4.8+ rating across at least 5 reviews.', 'Star', 'gold', '{"type": "rating", "min_rating": 4.8, "min_reviews": 5}'::jsonb),
  ('quick-responder', 'Quick Responder', 'Known for prompt replies and reliable communication.', 'Zap', 'bronze', '{"type": "communication", "score": 5}'::jsonb),
  ('verified-member', 'Verified Member', 'Completed identity or academic affiliation verification.', 'ShieldCheck', 'silver', '{"type": "verified"}'::jsonb),
  ('profile-pro', 'Profile Pro', '100% profile completeness with bio, photo, and 3+ skills.', 'UserCheck', 'bronze', '{"type": "completeness"}'::jsonb),
  ('helping-hand', 'Helping Hand', 'Freely shared skills across 3 community help sessions.', 'HandHelping', 'silver', '{"type": "help_completed", "threshold": 3}'::jsonb)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, tier = EXCLUDED.tier, criteria = EXCLUDED.criteria;

-- Function: Award Badges for a given user
CREATE OR REPLACE FUNCTION public.award_badges(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user public.profiles%ROWTYPE;
  v_badge RECORD;
  v_already_has boolean;
  v_earned boolean;
  v_help_count int;
  v_skills_count int;
BEGIN
  SELECT * INTO v_user FROM public.profiles WHERE id = p_user;
  IF NOT FOUND THEN RETURN; END IF;

  FOR v_badge IN SELECT * FROM public.badges LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = p_user AND badge_id = v_badge.id
    ) INTO v_already_has;

    IF NOT v_already_has THEN
      v_earned := false;

      -- Check criteria
      IF v_badge.slug = 'first-exchange' AND v_user.completed_exchanges >= 1 THEN
        v_earned := true;
      ELSIF v_badge.slug = 'skill-sharer' AND v_user.completed_exchanges >= 5 THEN
        v_earned := true;
      ELSIF v_badge.slug = 'community-pillar' AND v_user.completed_exchanges >= 15 THEN
        v_earned := true;
      ELSIF v_badge.slug = 'five-star' AND v_user.review_count >= 5 AND v_user.avg_rating >= 4.8 THEN
        v_earned := true;
      ELSIF v_badge.slug = 'verified-member' AND v_user.is_verified = true THEN
        v_earned := true;
      ELSIF v_badge.slug = 'quick-responder' AND v_user.completed_exchanges >= 2 THEN
        v_earned := true;
      ELSIF v_badge.slug = 'profile-pro' THEN
        SELECT COUNT(*) INTO v_skills_count FROM public.user_skills WHERE user_id = p_user;
        IF v_user.bio IS NOT NULL AND v_user.avatar_url IS NOT NULL AND v_skills_count >= 3 THEN
          v_earned := true;
        END IF;
      ELSIF v_badge.slug = 'helping-hand' THEN
        SELECT COUNT(*) INTO v_help_count 
        FROM public.connection_requests cr
        JOIN public.listings l ON l.id = cr.listing_id
        WHERE (cr.sender_id = p_user OR cr.receiver_id = p_user)
          AND cr.status = 'completed'
          AND l.type = 'help_offer';
        IF v_help_count >= 3 THEN
          v_earned := true;
        END IF;
      END IF;

      -- If earned, insert and notify!
      IF v_earned THEN
        INSERT INTO public.user_badges (user_id, badge_id, earned_at)
        VALUES (p_user, v_badge.id, now())
        ON CONFLICT DO NOTHING;

        -- Create badge notification
        INSERT INTO public.notifications (user_id, type, title, body, link)
        VALUES (
          p_user,
          'badge_earned',
          'Badge Unlocked: ' || v_badge.name || '! 🏅',
          v_badge.description,
          '/achievements'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 4. TRIGGERS: REVIEWS & EXCHANGE COMPLETION
CREATE OR REPLACE FUNCTION public.handle_review_inserted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_avg numeric(3,2);
  v_count int;
  v_reviewer_name text;
BEGIN
  -- 1. Recompute reviewee's stats
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0.00),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE reviewee_id = NEW.reviewee_id;

  -- 2. Award points:
  -- Reviewer gets +5 points for contributing feedback
  UPDATE public.profiles
  SET points = points + 5
  WHERE id = NEW.reviewer_id;

  -- Reviewee updates rating stats & gets +10 points if 5-star rating!
  UPDATE public.profiles
  SET 
    avg_rating = v_avg,
    review_count = v_count,
    points = points + (CASE WHEN NEW.rating = 5 THEN 10 ELSE 0 END),
    trust_score = LEAST(100, 50 + (v_avg * 10)::int)
  WHERE id = NEW.reviewee_id;

  -- 3. Notify Reviewee
  SELECT COALESCE(full_name, username, 'A peer') INTO v_reviewer_name
  FROM public.profiles WHERE id = NEW.reviewer_id;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.reviewee_id,
    'review_received',
    'New Review Received (★ ' || NEW.rating || '/5)',
    v_reviewer_name || ' left you a review: "' || substring(COALESCE(NEW.comment, 'Great skill exchange!') from 1 for 80) || '"',
    '/profile?tab=reviews'
  );

  -- 4. Check badges for both users
  PERFORM public.award_badges(NEW.reviewee_id);
  PERFORM public.award_badges(NEW.reviewer_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_inserted ON public.reviews;
CREATE TRIGGER trg_review_inserted
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_inserted();

-- Trigger on connection_requests status change to 'completed'
CREATE OR REPLACE FUNCTION public.handle_connection_completed_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    -- Increment completed_exchanges and award +20 points to both users
    UPDATE public.profiles
    SET 
      completed_exchanges = completed_exchanges + 1,
      points = points + 20,
      trust_score = LEAST(100, trust_score + 5)
    WHERE id IN (NEW.sender_id, NEW.receiver_id);

    -- Check badges for both users
    PERFORM public.award_badges(NEW.sender_id);
    PERFORM public.award_badges(NEW.receiver_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_connection_completed_gamification ON public.connection_requests;
CREATE TRIGGER trg_connection_completed_gamification
  AFTER UPDATE OF status ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_connection_completed_gamification();

-- 5. TRUST & SAFETY: blocks & reports
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT check_not_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam','harassment','inappropriate_content','scam','fake_profile','other')),
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  admin_notes text,
  resolved_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT check_report_target CHECK (reported_user_id IS NOT NULL OR reported_listing_id IS NOT NULL)
);

-- Prevent duplicate open reports on same target from same reporter
CREATE UNIQUE INDEX IF NOT EXISTS unique_open_report_user 
ON public.reports (reporter_id, reported_user_id) 
WHERE status = 'open' AND reported_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_open_report_listing 
ON public.reports (reporter_id, reported_listing_id) 
WHERE status = 'open' AND reported_listing_id IS NOT NULL;

-- 6. VERIFICATION: verification_requests & bucket
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('student_id','institution_email','professional_link','government_id')),
  document_url text,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_user ON public.verification_requests(user_id, status);

-- Trigger: When verification request is approved -> update profile
CREATE OR REPLACE FUNCTION public.handle_verification_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    NEW.reviewed_at = now();

    UPDATE public.profiles
    SET 
      is_verified = true,
      points = points + 50,
      trust_score = LEAST(100, trust_score + 25)
    WHERE id = NEW.user_id;

    -- Award badges
    PERFORM public.award_badges(NEW.user_id);

    -- Notify user
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'badge_earned',
      'Identity Verified! 🛡️',
      'Congratulations! Your profile is officially verified on Pairly.',
      '/profile'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verification_approved ON public.verification_requests;
CREATE TRIGGER trg_verification_approved
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_verification_approved();

-- Create verification storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-docs',
  'verification-docs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = false, file_size_limit = 5242880;

-- 7. UPDATE MATCHING FUNCTIONS TO EXCLUDE BLOCKED USERS
CREATE OR REPLACE FUNCTION public.get_matches_for_user(
  p_user uuid,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  matched_user_id uuid,
  full_name text,
  username text,
  avatar_url text,
  user_type user_type,
  city text,
  country text,
  is_verified boolean,
  bio text,
  score int,
  matched_you_want text[],
  matched_they_want text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS matched_user_id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.user_type,
    p.city,
    p.country,
    p.is_verified,
    p.bio,
    m.score,
    m.matched_you_want,
    m.matched_they_want
  FROM public.profiles p
  CROSS JOIN LATERAL public.calculate_match_score(p_user, p.id) m
  WHERE p.id <> p_user
    AND p.is_suspended = false
    -- EXCLUDE BLOCKED USERS IN BOTH DIRECTIONS
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE (b.blocker_id = p_user AND b.blocked_id = p.id)
         OR (b.blocker_id = p.id AND b.blocked_id = p_user)
    )
  ORDER BY m.score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.explore_listings(
  p_user uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_category int DEFAULT NULL,
  p_type listing_type DEFAULT NULL,
  p_mode listing_mode DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_min_match int DEFAULT 0,
  p_sort text DEFAULT 'best_match',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  type listing_type,
  title text,
  description text,
  category_id int,
  category_name text,
  offered_skill_id int,
  offered_skill_name text,
  wanted_skill_id int,
  wanted_skill_name text,
  mode listing_mode,
  city text,
  availability text,
  duration_estimate text,
  status listing_status,
  view_count int,
  created_at timestamptz,
  owner_username text,
  owner_full_name text,
  owner_avatar_url text,
  owner_user_type user_type,
  owner_is_verified boolean,
  owner_city text,
  match_score int,
  matched_you_want text[],
  matched_they_want text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.owner_id,
    l.type,
    l.title,
    l.description,
    l.category_id,
    c.name AS category_name,
    l.offered_skill_id,
    os.name AS offered_skill_name,
    l.wanted_skill_id,
    ws.name AS wanted_skill_name,
    l.mode,
    l.city,
    l.availability,
    l.duration_estimate,
    l.status,
    l.view_count,
    l.created_at,
    p.username AS owner_username,
    p.full_name AS owner_full_name,
    p.avatar_url AS owner_avatar_url,
    p.user_type AS owner_user_type,
    p.is_verified AS owner_is_verified,
    p.city AS owner_city,
    -- Compute final listing-level score with +10 exchange boost
    CASE 
      WHEN p_user IS NULL OR p_user = l.owner_id THEN 0
      ELSE LEAST(100, m.score + 
        CASE 
          WHEN l.type = 'exchange' AND l.offered_skill_id IS NOT NULL AND l.wanted_skill_id IS NOT NULL
            AND EXISTS (SELECT 1 FROM public.user_skills WHERE user_id = p_user AND skill_id = l.offered_skill_id AND direction = 'wanted')
            AND EXISTS (SELECT 1 FROM public.user_skills WHERE user_id = p_user AND skill_id = l.wanted_skill_id AND direction = 'offered')
          THEN 10
          ELSE 0
        END
      )
    END AS match_score,
    COALESCE(m.matched_you_want, ARRAY[]::text[]) AS matched_you_want,
    COALESCE(m.matched_they_want, ARRAY[]::text[]) AS matched_they_want
  FROM public.listings l
  JOIN public.profiles p ON p.id = l.owner_id
  LEFT JOIN public.categories c ON c.id = l.category_id
  LEFT JOIN public.skills os ON os.id = l.offered_skill_id
  LEFT JOIN public.skills ws ON ws.id = l.wanted_skill_id
  LEFT JOIN LATERAL (
    SELECT score, matched_you_want, matched_they_want 
    FROM public.calculate_match_score(p_user, l.owner_id)
  ) m ON p_user IS NOT NULL AND p_user <> l.owner_id
  WHERE l.status = 'active'
    AND p.is_suspended = false
    -- EXCLUDE BLOCKED USERS
    AND (
      p_user IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = p_user AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = p_user)
      )
    )
    -- Filters
    AND (p_category IS NULL OR l.category_id = p_category)
    AND (p_type IS NULL OR l.type = p_type)
    AND (p_mode IS NULL OR l.mode = p_mode OR l.mode = 'both')
    AND (p_city IS NULL OR l.city ILIKE '%' || p_city || '%')
    AND (p_search IS NULL OR (
      to_tsvector('english', l.title || ' ' || l.description) @@ plainto_tsquery('english', p_search)
      OR l.title ILIKE '%' || p_search || '%'
      OR os.name ILIKE '%' || p_search || '%'
      OR ws.name ILIKE '%' || p_search || '%'
    ))
    AND (p_user IS NULL OR p_min_match <= 0 OR COALESCE(m.score, 0) >= p_min_match)
  ORDER BY
    CASE WHEN p_sort = 'best_match' AND p_user IS NOT NULL THEN COALESCE(m.score, 0) END DESC,
    CASE WHEN p_sort = 'most_viewed' THEN l.view_count END DESC,
    l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 8. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- 8.1. reviews
DROP POLICY IF EXISTS "Anyone authenticated can view reviews" ON public.reviews;
CREATE POLICY "Anyone authenticated can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Participants of completed exchanges can insert reviews" ON public.reviews;
CREATE POLICY "Participants of completed exchanges can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND auth.uid() <> reviewee_id
    AND EXISTS (
      SELECT 1 FROM public.connection_requests cr
      WHERE cr.id = connection_id
        AND cr.status = 'completed'
        AND (cr.sender_id = auth.uid() OR cr.receiver_id = auth.uid())
        AND (cr.sender_id = reviewee_id OR cr.receiver_id = reviewee_id)
    )
  );

-- 8.2. badges & user_badges
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view user_badges" ON public.user_badges;
CREATE POLICY "Anyone can view user_badges" ON public.user_badges FOR SELECT USING (true);

-- 8.3. blocks
DROP POLICY IF EXISTS "Users can view their blocks" ON public.blocks;
CREATE POLICY "Users can view their blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can create blocks" ON public.blocks;
CREATE POLICY "Users can create blocks" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id AND auth.uid() <> blocked_id);

DROP POLICY IF EXISTS "Users can remove their blocks" ON public.blocks;
CREATE POLICY "Users can remove their blocks" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- 8.4. reports
DROP POLICY IF EXISTS "Users can view their submitted reports" ON public.reports;
CREATE POLICY "Users can view their submitted reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can submit reports" ON public.reports;
CREATE POLICY "Users can submit reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 8.5. verification_requests
DROP POLICY IF EXISTS "Users can view their verification requests" ON public.verification_requests;
CREATE POLICY "Users can view their verification requests" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit verification requests" ON public.verification_requests;
CREATE POLICY "Users can submit verification requests" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8.6. Storage bucket verification-docs policies
DROP POLICY IF EXISTS "Users can upload their verification docs" ON storage.objects;
CREATE POLICY "Users can upload their verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-docs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view their own verification docs" ON storage.objects;
CREATE POLICY "Users can view their own verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
