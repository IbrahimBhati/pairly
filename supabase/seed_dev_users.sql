-- ============================================================================
-- DEV-ONLY SEED USERS & SKILLS FOR PAIRLY SMART MATCHING DEMONSTRATION
-- File: supabase/seed_dev_users.sql
-- ============================================================================
-- NOTE FOR DEVELOPERS & EVALUATORS:
-- In a production environment, rows in `public.profiles` reference `auth.users(id)`
-- through a foreign key. To run this seed script in Supabase SQL Editor:
-- 1) If auth FK is enforced, temporarily disable the constraint or create test
--    auth records, OR run:
--    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
--    (You can re-add it afterwards if desired)
-- 2) Execute this script to populate 10 varied profiles and their skills matrix.
-- ============================================================================

-- 1. Insert 10 Varied Demo Profiles
INSERT INTO profiles (id, username, full_name, avatar_url, bio, user_type, role, city, country, is_verified, onboarding_completed, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'alex_chen',
    'Alex Chen',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'CS & Cognitive Science senior at MIT. Building AI tools, love teaching React and looking to practice conversational Spanish.',
    'student',
    'user',
    'Boston',
    'United States',
    true,
    true,
    NOW() - INTERVAL '40 days',
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'sofia_martinez',
    'Sofia Martinez',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'Native Spanish speaker from Madrid, studying Data Science. Happy to practice conversational Spanish in exchange for Next.js and React mentoring.',
    'student',
    'user',
    'Boston',
    'United States',
    true,
    true,
    NOW() - INTERVAL '35 days',
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'marcus_vance',
    'Marcus Vance',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'Senior Product Designer at a fintech startup. I build Design Systems in Figma and want to learn Python for quantitative finance.',
    'professional',
    'user',
    'New York',
    'United States',
    true,
    true,
    NOW() - INTERVAL '30 days',
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'dr_elena_rostova',
    'Dr. Elena Rostova',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    'Adjunct Lecturer in Mathematics. Passionate about teaching Linear Algebra & Calculus; looking for digital illustration and Figma skills.',
    'teacher',
    'user',
    'Boston',
    'United States',
    true,
    true,
    NOW() - INTERVAL '25 days',
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'liam_smith',
    'Liam Smith',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    'Guitarist & audio engineer. Offering acoustic guitar & Ableton Live production lessons in return for web development mentoring.',
    'community',
    'user',
    'London',
    'United Kingdom',
    false,
    true,
    NOW() - INTERVAL '20 days',
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'priya_patel',
    'Priya Patel',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    'Biomedical engineering student. Offering Organic Chemistry and Applied Statistics; looking to learn Python & SQL.',
    'student',
    'user',
    'Cambridge',
    'United States',
    true,
    true,
    NOW() - INTERVAL '18 days',
    NOW()
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'kenji_sato',
    'Kenji Sato',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    'Full-stack engineer & native Japanese speaker. Can help with Japanese basics & Docker; seeking French conversation practice.',
    'professional',
    'user',
    'San Francisco',
    'United States',
    true,
    true,
    NOW() - INTERVAL '15 days',
    NOW()
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'clara_dubois',
    'Clara Dubois',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    'Sorbonne graduate, native French tutor. Excited to exchange French conversation for conversational Japanese & cultural immersion.',
    'teacher',
    'user',
    'San Francisco',
    'United States',
    true,
    true,
    NOW() - INTERVAL '12 days',
    NOW()
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'david_kim',
    'David Kim',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    'Venture fellow & MBA student. Happy to help with resume reviews & behavioral interviews in exchange for Calculus tutoring.',
    'student',
    'user',
    'Cambridge',
    'United States',
    false,
    true,
    NOW() - INTERVAL '8 days',
    NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aisha_almansoori',
    'Aisha Al-Mansoori',
    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
    'Arabic linguist and calligrapher. Offering Modern Standard Arabic lessons, eager to learn Figma UI/UX fundamentals.',
    'community',
    'user',
    'New York',
    'United States',
    true,
    true,
    NOW() - INTERVAL '5 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  user_type = EXCLUDED.user_type,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  is_verified = EXCLUDED.is_verified,
  onboarding_completed = EXCLUDED.onboarding_completed;

-- 2. Insert User Skills Matrix (Offered & Wanted)
-- Delete previous demo user skills to ensure clean idempotency
DELETE FROM user_skills WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

INSERT INTO user_skills (user_id, skill_id, direction, proficiency) VALUES
  -- 1. Alex Chen (Offers React & TypeScript; Wants Spanish & Python)
  ('11111111-1111-1111-1111-111111111111', 1, 'offered', 'expert'),
  ('11111111-1111-1111-1111-111111111111', 3, 'offered', 'advanced'),
  ('11111111-1111-1111-1111-111111111111', 21, 'wanted', NULL),
  ('11111111-1111-1111-1111-111111111111', 2, 'wanted', NULL),

  -- 2. Sofia Martinez (Offers Spanish & Python; Wants React & TypeScript) -> [PERFECT MATCH WITH ALEX]
  ('22222222-2222-2222-2222-222222222222', 21, 'offered', 'expert'),
  ('22222222-2222-2222-2222-222222222222', 2, 'offered', 'advanced'),
  ('22222222-2222-2222-2222-222222222222', 1, 'wanted', NULL),
  ('22222222-2222-2222-2222-222222222222', 3, 'wanted', NULL),

  -- 3. Marcus Vance (Offers Figma & Design Systems; Wants Python & SQL)
  ('33333333-3333-3333-3333-333333333333', 11, 'offered', 'expert'),
  ('33333333-3333-3333-3333-333333333333', 14, 'offered', 'expert'),
  ('33333333-3333-3333-3333-333333333333', 2, 'wanted', NULL),
  ('33333333-3333-3333-3333-333333333333', 6, 'wanted', NULL),

  -- 4. Dr. Elena Rostova (Offers Calculus & Linear Algebra; Wants Figma & Graphic Design)
  ('44444444-4444-4444-4444-444444444444', 41, 'offered', 'expert'),
  ('44444444-4444-4444-4444-444444444444', 11, 'wanted', NULL),
  ('44444444-4444-4444-4444-444444444444', 13, 'wanted', NULL),

  -- 5. Liam Smith (Offers Acoustic Guitar & Piano; Wants React & Full-Stack)
  ('55555555-5555-5555-5555-555555555555', 31, 'offered', 'expert'),
  ('55555555-5555-5555-5555-555555555555', 32, 'offered', 'intermediate'),
  ('55555555-5555-5555-5555-555555555555', 1, 'wanted', NULL),
  ('55555555-5555-5555-5555-555555555555', 4, 'wanted', NULL),

  -- 6. Priya Patel (Offers Chemistry & Statistics; Wants Python & React)
  ('66666666-6666-6666-6666-666666666666', 42, 'offered', 'advanced'),
  ('66666666-6666-6666-6666-666666666666', 45, 'offered', 'expert'),
  ('66666666-6666-6666-6666-666666666666', 2, 'wanted', NULL),
  ('66666666-6666-6666-6666-666666666666', 1, 'wanted', NULL),

  -- 7. Kenji Sato (Offers Japanese & Docker; Wants French & Guitar) -> [HIGH MATCH WITH CLARA]
  ('77777777-7777-7777-7777-777777777777', 26, 'offered', 'expert'),
  ('77777777-7777-7777-7777-777777777777', 9, 'offered', 'advanced'),
  ('77777777-7777-7777-7777-777777777777', 23, 'wanted', NULL),
  ('77777777-7777-7777-7777-777777777777', 31, 'wanted', NULL),

  -- 8. Clara Dubois (Offers French; Wants Japanese) -> [RECIPROCAL MATCH WITH KENJI]
  ('88888888-8888-8888-8888-888888888888', 23, 'offered', 'expert'),
  ('88888888-8888-8888-8888-888888888888', 26, 'wanted', NULL),

  -- 9. David Kim (Offers Resume & Behavioral Interviews; Wants Calculus)
  ('99999999-9999-9999-9999-999999999999', 51, 'offered', 'advanced'),
  ('99999999-9999-9999-9999-999999999999', 52, 'offered', 'intermediate'),
  ('99999999-9999-9999-9999-999999999999', 41, 'wanted', NULL),

  -- 10. Aisha Al-Mansoori (Offers Arabic; Wants Figma)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 27, 'offered', 'expert'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 11, 'wanted', NULL);

-- ============================================================================
-- ALGORITHM VERIFICATION & SAMPLE PAIR WALKTHROUGH
-- ============================================================================
/*
SAMPLE PAIR 1: Alex Chen ('11111111-...') & Sofia Martinez ('22222222-...')
------------------------------------------------------------------------------
- Mutual Exchange (Weight 60):
  - A wants: Spanish (21) and Python (2). B offers: Spanish (21) and Python (2).
    forward = 2 / 2 = 1.0 (100% of A's wanted skills are offered by B).
  - B wants: React (1) and TypeScript (3). A offers: React (1) and TypeScript (3).
    reverse = 2 / 2 = 1.0 (100% of B's wanted skills are offered by A).
  - mutual = 60 * (2 * 1.0 * 1.0) / (1.0 + 1.0) = 60.0 points.
- Category Affinity (Weight 15):
  - A wanted categories: Programming (1), Languages (3).
  - B offered categories: Languages (3), Programming (1).
  - Jaccard = |{1, 3} ∩ {1, 3}| / |{1, 3} ∪ {1, 3}| = 2 / 2 = 1.0.
  - Category score = 15.0 * 1.0 = 15.0 points.
- Peer Group Compatibility (Weight 5):
  - Both are 'student' -> 5.0 points.
- Location Compatibility (Weight 10):
  - Both are located in 'Boston' -> 10.0 points.
- Trust & Activity Bonus (Weight 10):
  - B is verified: +5.0
  - B bio present: +2.0
  - B avatar present: +1.0
  - B has 4 skills (>= 3): +2.0
  - Total Trust = 10.0 points.
------------------------------------------------------------------------------
EXPECTED TOTAL SCORE = 60 + 15 + 5 + 10 + 10 = 100% (PERFECT RECIPROCAL MATCH)
Run query: SELECT * FROM calculate_match_score('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');


SAMPLE PAIR 2: Alex Chen ('11111111-...') & Liam Smith ('55555555-...')
------------------------------------------------------------------------------
- Mutual Exchange (Weight 60):
  - A wants: Spanish (21) and Python (2). Liam offers: Guitar (31) and Piano (32).
    forward = 0 / 2 = 0.0 (Liam offers none of what Alex wants).
  - Liam wants: React (1) and Full-Stack (4). Alex offers: React (1) and TS (3).
    reverse = 1 / 2 = 0.5 (Alex offers React, 50% of Liam's wanted skills).
  - Asymmetric Fallback (since forward = 0):
    mutual = 60 * 0.4 * max(0.0, 0.5) = 12.0 points.
- Category Affinity (Weight 15):
  - A wanted categories: Programming (1), Languages (3).
  - Liam offered categories: Music (4).
  - Jaccard = 0 / 3 = 0.0 points.
- Peer Group Compatibility (Weight 5):
  - Alex is 'student', Liam is 'community' -> 2.0 points.
- Location Compatibility (Weight 10):
  - Boston, USA vs London, UK -> 3.0 points.
- Trust & Activity Bonus (Weight 10):
  - Liam is unverified: 0
  - Liam bio present: +2.0
  - Liam avatar present: +1.0
  - Liam has 4 skills: +2.0
  - Total Trust = 5.0 points.
------------------------------------------------------------------------------
EXPECTED TOTAL SCORE = round(12.0 + 0 + 2.0 + 3.0 + 5.0) = 22% (LOW / ONE-SIDED)
Run query: SELECT * FROM calculate_match_score('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555');
*/
