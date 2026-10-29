-- ============================================================================
-- Migration 005: Smart Matching Engine, Search Indexes, & Discovery Functions
-- ============================================================================

-- 1. Enable Trigram Extension for Fuzzy Skill & Title Search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Performance Search Indexes
-- Full-text search index on listings (title & description)
CREATE INDEX IF NOT EXISTS idx_listings_fts
  ON listings USING gin (to_tsvector('english', title || ' ' || description));

-- Trigram index on skill names for fast autocomplete & fuzzy matching
CREATE INDEX IF NOT EXISTS idx_skills_name_trgm
  ON skills USING gin (name gin_trgm_ops);

-- Trigram index on listing title
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm
  ON listings USING gin (title gin_trgm_ops);

-- 3. Core Function: calculate_match_score(user_a uuid, user_b uuid)
-- Computes the 0-100 compatibility score and lists matched skill names in each direction.
CREATE OR REPLACE FUNCTION calculate_match_score(user_a uuid, user_b uuid)
RETURNS TABLE (
  score int,
  matched_you_want text[],
  matched_they_want text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Skill counts & overlaps
  v_wanted_a_count int := 0;
  v_wanted_b_count int := 0;
  v_forward_overlap int := 0;
  v_reverse_overlap int := 0;
  v_forward_ratio numeric := 0;
  v_reverse_ratio numeric := 0;
  v_mutual_score numeric := 0;

  -- Category affinity
  v_cat_wanted_a int[];
  v_cat_offered_b int[];
  v_cat_intersection int := 0;
  v_cat_union int := 0;
  v_category_ratio numeric := 0;
  v_category_score numeric := 0;

  -- User metadata
  v_type_a user_type;
  v_city_a text;
  v_country_a text;

  v_type_b user_type;
  v_city_b text;
  v_country_b text;
  v_is_verified_b boolean := false;
  v_bio_b text;
  v_avatar_b text;
  v_skill_count_b int := 0;

  v_peer_score numeric := 2;
  v_location_score numeric := 3;
  v_trust_score numeric := 0;
  v_total_raw numeric := 0;
  v_final_score int := 0;

  v_you_want text[] := ARRAY[]::text[];
  v_they_want text[] := ARRAY[]::text[];
BEGIN
  -- If either user is null or comparing with self, return 0
  IF user_a IS NULL OR user_b IS NULL OR user_a = user_b THEN
    RETURN QUERY SELECT 0, ARRAY[]::text[], ARRAY[]::text[];
    RETURN;
  END IF;

  -- Fetch User A metadata
  SELECT user_type, city, country
  INTO v_type_a, v_city_a, v_country_a
  FROM profiles WHERE id = user_a;

  -- Fetch User B metadata
  SELECT user_type, city, country, is_verified, bio, avatar_url
  INTO v_type_b, v_city_b, v_country_b, v_is_verified_b, v_bio_b, v_avatar_b
  FROM profiles WHERE id = user_b;

  -- Count User B total configured skills
  SELECT COUNT(*) INTO v_skill_count_b FROM user_skills WHERE user_id = user_b;

  -- 1. Skills A wants that B offers (forward)
  SELECT
    COALESCE(array_agg(DISTINCT s.name), ARRAY[]::text[]),
    COUNT(DISTINCT us_a.skill_id)
  INTO v_you_want, v_forward_overlap
  FROM user_skills us_a
  JOIN user_skills us_b ON us_a.skill_id = us_b.skill_id
  JOIN skills s ON s.id = us_a.skill_id
  WHERE us_a.user_id = user_a AND us_a.direction = 'wanted'
    AND us_b.user_id = user_b AND us_b.direction = 'offered';

  -- Total skills A wants
  SELECT COUNT(*) INTO v_wanted_a_count
  FROM user_skills WHERE user_id = user_a AND direction = 'wanted';

  IF v_wanted_a_count > 0 THEN
    v_forward_ratio := v_forward_overlap::numeric / v_wanted_a_count::numeric;
  ELSE
    v_forward_ratio := 0;
  END IF;

  -- 2. Skills B wants that A offers (reverse)
  SELECT
    COALESCE(array_agg(DISTINCT s.name), ARRAY[]::text[]),
    COUNT(DISTINCT us_b.skill_id)
  INTO v_they_want, v_reverse_overlap
  FROM user_skills us_b
  JOIN user_skills us_a ON us_b.skill_id = us_a.skill_id
  JOIN skills s ON s.id = us_b.skill_id
  WHERE us_b.user_id = user_b AND us_b.direction = 'wanted'
    AND us_a.user_id = user_a AND us_a.direction = 'offered';

  -- Total skills B wants
  SELECT COUNT(*) INTO v_wanted_b_count
  FROM user_skills WHERE user_id = user_b AND direction = 'wanted';

  IF v_wanted_b_count > 0 THEN
    v_reverse_ratio := v_reverse_overlap::numeric / v_wanted_b_count::numeric;
  ELSE
    v_reverse_ratio := 0;
  END IF;

  -- Mutual Exchange Score (Weight 60)
  IF v_forward_ratio > 0 AND v_reverse_ratio > 0 THEN
    v_mutual_score := 60.0 * (2.0 * v_forward_ratio * v_reverse_ratio / (v_forward_ratio + v_reverse_ratio));
  ELSIF v_forward_ratio > 0 OR v_reverse_ratio > 0 THEN
    v_mutual_score := 60.0 * 0.4 * GREATEST(v_forward_ratio, v_reverse_ratio);
  ELSE
    v_mutual_score := 0;
  END IF;

  -- 3. Category Affinity (Weight 15)
  SELECT COALESCE(array_agg(DISTINCT s.category_id), ARRAY[]::int[])
  INTO v_cat_wanted_a
  FROM user_skills us JOIN skills s ON s.id = us.skill_id
  WHERE us.user_id = user_a AND us.direction = 'wanted';

  SELECT COALESCE(array_agg(DISTINCT s.category_id), ARRAY[]::int[])
  INTO v_cat_offered_b
  FROM user_skills us JOIN skills s ON s.id = us.skill_id
  WHERE us.user_id = user_b AND us.direction = 'offered';

  SELECT COUNT(*) INTO v_cat_intersection
  FROM (
    SELECT unnest(v_cat_wanted_a)
    INTERSECT
    SELECT unnest(v_cat_offered_b)
  ) t;

  SELECT COUNT(*) INTO v_cat_union
  FROM (
    SELECT unnest(v_cat_wanted_a)
    UNION
    SELECT unnest(v_cat_offered_b)
  ) t;

  IF v_cat_union > 0 THEN
    v_category_ratio := v_cat_intersection::numeric / v_cat_union::numeric;
    v_category_score := 15.0 * v_category_ratio;
  ELSE
    v_category_score := 0;
  END IF;

  -- 4. Peer Group Bonus (Weight 5)
  IF v_type_a IS NOT NULL AND v_type_b IS NOT NULL AND v_type_a = v_type_b THEN
    v_peer_score := 5.0;
  ELSE
    v_peer_score := 2.0;
  END IF;

  -- 5. Location Compatibility (Weight 10)
  IF v_city_a IS NOT NULL AND v_city_b IS NOT NULL AND LOWER(TRIM(v_city_a)) = LOWER(TRIM(v_city_b)) THEN
    v_location_score := 10.0;
  ELSIF v_country_a IS NOT NULL AND v_country_b IS NOT NULL AND LOWER(TRIM(v_country_a)) = LOWER(TRIM(v_country_b)) THEN
    v_location_score := 6.0;
  ELSE
    v_location_score := 3.0;
  END IF;

  -- 6. Trust & Profile Completeness Bonus (Weight 10)
  IF v_is_verified_b IS TRUE THEN
    v_trust_score := v_trust_score + 5.0;
  END IF;
  IF v_bio_b IS NOT NULL AND TRIM(v_bio_b) <> '' THEN
    v_trust_score := v_trust_score + 2.0;
  END IF;
  IF v_avatar_b IS NOT NULL AND TRIM(v_avatar_b) <> '' THEN
    v_trust_score := v_trust_score + 1.0;
  END IF;
  IF v_skill_count_b >= 3 THEN
    v_trust_score := v_trust_score + 2.0;
  END IF;

  -- Total score: Round & cap at 100
  v_total_raw := v_mutual_score + v_category_score + v_peer_score + v_location_score + v_trust_score;
  v_final_score := LEAST(100, GREATEST(0, ROUND(v_total_raw)::int));

  RETURN QUERY SELECT v_final_score, v_you_want, v_they_want;
END;
$$;

-- 4. Function: get_matches_for_user(p_user uuid, p_limit int, p_offset int)
-- Ranks potential peer matches for a user in descending order of compatibility.
CREATE OR REPLACE FUNCTION get_matches_for_user(
  p_user uuid,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  user_type user_type,
  is_verified boolean,
  city text,
  country text,
  bio text,
  score int,
  matched_you_want text[],
  matched_they_want text[],
  top_offered_skills text[],
  top_wanted_skills text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidate_users AS (
    SELECT p.id, p.username, p.full_name, p.avatar_url, p.user_type, p.is_verified, p.city, p.country, p.bio
    FROM profiles p
    WHERE p.id <> p_user
      AND (p.is_suspended IS FALSE OR p.is_suspended IS NULL)
      -- TODO (Phase 6): Exclude users where blocked or blocking
      -- AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = p_user AND b.blocked_id = p.id) OR (b.blocker_id = p.id AND b.blocked_id = p_user))
  ),
  scored AS (
    SELECT
      cu.id AS s_user_id,
      cu.username AS s_username,
      cu.full_name AS s_full_name,
      cu.avatar_url AS s_avatar_url,
      cu.user_type AS s_user_type,
      cu.is_verified AS s_is_verified,
      cu.city AS s_city,
      cu.country AS s_country,
      cu.bio AS s_bio,
      m.score AS s_score,
      m.matched_you_want AS s_matched_you_want,
      m.matched_they_want AS s_matched_they_want
    FROM candidate_users cu
    CROSS JOIN LATERAL calculate_match_score(p_user, cu.id) m
  )
  SELECT
    s.s_user_id,
    s.s_username,
    s.s_full_name,
    s.s_avatar_url,
    s.s_user_type,
    s.s_is_verified,
    s.s_city,
    s.s_country,
    s.s_bio,
    s.s_score,
    s.s_matched_you_want,
    s.s_matched_they_want,
    COALESCE((
      SELECT array_agg(sk.name)
      FROM (
        SELECT sk_inner.name
        FROM user_skills us_o
        JOIN skills sk_inner ON sk_inner.id = us_o.skill_id
        WHERE us_o.user_id = s.s_user_id AND us_o.direction = 'offered'
        LIMIT 3
      ) sk
    ), ARRAY[]::text[]) AS top_offered_skills,
    COALESCE((
      SELECT array_agg(sk.name)
      FROM (
        SELECT sk_inner.name
        FROM user_skills us_w
        JOIN skills sk_inner ON sk_inner.id = us_w.skill_id
        WHERE us_w.user_id = s.s_user_id AND us_w.direction = 'wanted'
        LIMIT 3
      ) sk
    ), ARRAY[]::text[]) AS top_wanted_skills
  FROM scored s
  ORDER BY s.s_score DESC, s.s_username ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 5. Function: explore_listings(...)
-- Discovers and ranks active listings with dynamic filtering and bilateral match scoring.
CREATE OR REPLACE FUNCTION explore_listings(
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
  offered_skill_id int,
  wanted_skill_id int,
  mode listing_mode,
  city text,
  availability text,
  duration_estimate text,
  status listing_status,
  view_count int,
  created_at timestamptz,
  updated_at timestamptz,
  -- Relations
  owner_username text,
  owner_full_name text,
  owner_avatar_url text,
  owner_user_type user_type,
  owner_is_verified boolean,
  category_name text,
  category_slug text,
  category_icon text,
  offered_skill_name text,
  wanted_skill_name text,
  -- Matching fields
  match_score int,
  matched_you_want text[],
  matched_they_want text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT
      l.id AS l_id,
      l.owner_id AS l_owner_id,
      l.type AS l_type,
      l.title AS l_title,
      l.description AS l_description,
      l.category_id AS l_category_id,
      l.offered_skill_id AS l_offered_skill_id,
      l.wanted_skill_id AS l_wanted_skill_id,
      l.mode AS l_mode,
      l.city AS l_city,
      l.availability AS l_availability,
      l.duration_estimate AS l_duration_estimate,
      l.status AS l_status,
      l.view_count AS l_view_count,
      l.created_at AS l_created_at,
      l.updated_at AS l_updated_at,
      p.username AS l_owner_username,
      p.full_name AS l_owner_full_name,
      p.avatar_url AS l_owner_avatar_url,
      p.user_type AS l_owner_user_type,
      p.is_verified AS l_owner_is_verified,
      c.name AS l_category_name,
      c.slug AS l_category_slug,
      c.icon AS l_category_icon,
      so.name AS l_offered_skill_name,
      sw.name AS l_wanted_skill_name
    FROM listings l
    JOIN profiles p ON p.id = l.owner_id
    LEFT JOIN categories c ON c.id = l.category_id
    LEFT JOIN skills so ON so.id = l.offered_skill_id
    LEFT JOIN skills sw ON sw.id = l.wanted_skill_id
    WHERE l.status = 'active'
      AND (p.is_suspended IS FALSE OR p.is_suspended IS NULL)
      AND (p_category IS NULL OR l.category_id = p_category)
      AND (p_type IS NULL OR l.type = p_type)
      AND (p_mode IS NULL OR l.mode = p_mode OR l.mode = 'both')
      AND (
        p_city IS NULL OR TRIM(p_city) = ''
        OR (l.city IS NOT NULL AND LOWER(l.city) LIKE '%' || LOWER(TRIM(p_city)) || '%')
      )
      AND (
        p_search IS NULL OR TRIM(p_search) = ''
        OR to_tsvector('english', l.title || ' ' || l.description) @@ plainto_tsquery('english', p_search)
        OR l.title ILIKE '%' || TRIM(p_search) || '%'
        OR (so.name IS NOT NULL AND so.name ILIKE '%' || TRIM(p_search) || '%')
        OR (sw.name IS NOT NULL AND sw.name ILIKE '%' || TRIM(p_search) || '%')
      )
  ),
  with_scores AS (
    SELECT
      f.*,
      CASE
        WHEN p_user IS NULL OR p_user = f.l_owner_id THEN 0
        ELSE m.score
      END AS base_score,
      CASE
        WHEN p_user IS NULL OR p_user = f.l_owner_id THEN ARRAY[]::text[]
        ELSE m.matched_you_want
      END AS s_matched_you_want,
      CASE
        WHEN p_user IS NULL OR p_user = f.l_owner_id THEN ARRAY[]::text[]
        ELSE m.matched_they_want
      END AS s_matched_they_want,
      -- Direct listing-level boost: +10 if listing offers what A wants AND seeks what A offers
      CASE
        WHEN p_user IS NOT NULL
          AND f.l_offered_skill_id IS NOT NULL
          AND f.l_wanted_skill_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM user_skills ua
            WHERE ua.user_id = p_user AND ua.direction = 'wanted' AND ua.skill_id = f.l_offered_skill_id
          )
          AND EXISTS (
            SELECT 1 FROM user_skills ua
            WHERE ua.user_id = p_user AND ua.direction = 'offered' AND ua.skill_id = f.l_wanted_skill_id
          )
        THEN 10
        ELSE 0
      END AS listing_boost
    FROM filtered f
    LEFT JOIN LATERAL (
      SELECT score, matched_you_want, matched_they_want
      FROM calculate_match_score(p_user, f.l_owner_id)
    ) m ON p_user IS NOT NULL
  )
  SELECT
    ws.l_id,
    ws.l_owner_id,
    ws.l_type,
    ws.l_title,
    ws.l_description,
    ws.l_category_id,
    ws.l_offered_skill_id,
    ws.l_wanted_skill_id,
    ws.l_mode,
    ws.l_city,
    ws.l_availability,
    ws.l_duration_estimate,
    ws.l_status,
    ws.l_view_count,
    ws.l_created_at,
    ws.l_updated_at,
    ws.l_owner_username,
    ws.l_owner_full_name,
    ws.l_owner_avatar_url,
    ws.l_owner_user_type,
    ws.l_owner_is_verified,
    ws.l_category_name,
    ws.l_category_slug,
    ws.l_category_icon,
    ws.l_offered_skill_name,
    ws.l_wanted_skill_name,
    LEAST(100, ws.base_score + ws.listing_boost) AS match_score,
    ws.s_matched_you_want,
    ws.s_matched_they_want
  FROM with_scores ws
  WHERE (p_min_match IS NULL OR p_min_match = 0 OR LEAST(100, ws.base_score + ws.listing_boost) >= p_min_match)
  ORDER BY
    CASE WHEN p_sort = 'best_match' THEN LEAST(100, ws.base_score + ws.listing_boost) END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_viewed' THEN ws.l_view_count END DESC NULLS LAST,
    ws.l_created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_match_score(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_matches_for_user(uuid, int, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION explore_listings(uuid, text, int, listing_type, listing_mode, text, int, text, int, int) TO authenticated, anon;
