-- ============================================================================
-- PAIRLY DEMO SEED DATASET: supabase/seed_demo.sql
-- Description: Generates ~15 realistic academic users, 25 listings, user skills
--              for reciprocal matching, completed exchanges, peer reviews,
--              reputation badges, reports, and verification queues.
-- ============================================================================

DO $$
DECLARE
  -- 15 Demo User UUIDs
  u_admin uuid := '11111111-1111-4111-8111-111111111111';
  u_alex uuid := '22222222-2222-4222-8222-222222222222';
  u_sofia uuid := '33333333-3333-4333-8333-333333333333';
  u_marcus uuid := '44444444-4444-4444-8444-444444444444';
  u_elena uuid := '55555555-5555-4555-8555-555555555555';
  u_liam uuid := '66666666-6666-4666-8666-666666666666';
  u_priya uuid := '77777777-7777-4777-8777-777777777777';
  u_david uuid := '88888888-8888-4888-8888-888888888888';
  u_maya uuid := '99999999-9999-4999-8999-999999999999';
  u_carlos uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  u_chloe uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  u_kai uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  u_zara uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  u_sam uuid := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  u_olivia uuid := 'ffffffff-ffff-4fff-8fff-ffffffffffff';

  -- Listing UUIDs
  l_py_es uuid := gen_random_uuid();
  l_es_py uuid := gen_random_uuid();
  l_react_fig uuid := gen_random_uuid();
  l_fig_react uuid := gen_random_uuid();
  l_calc_chem uuid := gen_random_uuid();

  -- Connection UUIDs
  c_alex_sofia uuid := gen_random_uuid();
  c_marcus_elena uuid := gen_random_uuid();

  -- Category IDs (seeded in 002_seed.sql)
  cat_prog int;
  cat_design int;
  cat_lang int;
  cat_acad int;
  cat_music int;

  -- Skill IDs
  s_python int;
  s_spanish int;
  s_react int;
  s_figma int;
  s_calculus int;
  s_chemistry int;
  s_guitar int;
  s_french int;
  s_stats int;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_prog FROM public.categories WHERE slug = 'programming' LIMIT 1;
  SELECT id INTO cat_design FROM public.categories WHERE slug = 'design' LIMIT 1;
  SELECT id INTO cat_lang FROM public.categories WHERE slug = 'languages' LIMIT 1;
  SELECT id INTO cat_acad FROM public.categories WHERE slug = 'academics' LIMIT 1;
  SELECT id INTO cat_music FROM public.categories WHERE slug = 'music' LIMIT 1;

  -- Get skill IDs
  SELECT id INTO s_python FROM public.skills WHERE name ILIKE '%python%' LIMIT 1;
  SELECT id INTO s_spanish FROM public.skills WHERE name ILIKE '%spanish%' LIMIT 1;
  SELECT id INTO s_react FROM public.skills WHERE name ILIKE '%react%' LIMIT 1;
  SELECT id INTO s_figma FROM public.skills WHERE name ILIKE '%figma%' LIMIT 1;
  SELECT id INTO s_calculus FROM public.skills WHERE name ILIKE '%calculus%' LIMIT 1;
  SELECT id INTO s_chemistry FROM public.skills WHERE name ILIKE '%chemistry%' LIMIT 1;
  SELECT id INTO s_guitar FROM public.skills WHERE name ILIKE '%guitar%' LIMIT 1;
  SELECT id INTO s_french FROM public.skills WHERE name ILIKE '%french%' LIMIT 1;
  SELECT id INTO s_stats FROM public.skills WHERE name ILIKE '%statistics%' LIMIT 1;

  -- 1. INSERT OR UPDATE 15 PROFILES
  INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, user_type, role, city, country, is_verified, onboarding_completed, avg_rating, review_count, completed_exchanges, points, trust_score)
  VALUES
    (u_admin, 'pairlyadmin', 'Admin Moderator', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Pairly campus integrity administrator and academic coordinator.', 'professional', 'admin', 'Boston', 'USA', true, true, 5.0, 12, 18, 620, 100),
    (u_alex, 'alexrivera', 'Alex Rivera', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'Computer Science Junior. Passionate about machine learning and open-source software.', 'student', 'user', 'Boston', 'USA', true, true, 4.95, 6, 7, 280, 95),
    (u_sofia, 'sofiamartinez', 'Sofia Martinez', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Linguistics major & bilingual tutor. Loves teaching conversational Spanish and Latin American literature.', 'student', 'user', 'Boston', 'USA', true, true, 5.0, 8, 9, 340, 100),
    (u_marcus, 'marcuschen', 'Marcus Chen', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Full-stack React engineer & teaching assistant. Looking for UI/UX design mentorship.', 'teacher', 'user', 'Cambridge', 'USA', true, true, 4.85, 5, 5, 210, 90),
    (u_elena, 'elenarostova', 'Elena Rostova', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Product designer & Figma specialist. Excited to learn modern web frontend frameworks.', 'professional', 'user', 'Cambridge', 'USA', false, true, 4.9, 4, 4, 180, 88),
    (u_liam, 'liamo_connor', 'Liam O Connor', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Applied Mathematics graduate student. Helping with calculus, linear algebra, and differential equations.', 'student', 'user', 'Boston', 'USA', true, true, 4.8, 5, 6, 230, 92),
    (u_priya, 'priyasharma', 'Priya Sharma', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Biochemistry researcher. Offering organic chemistry tutoring in exchange for calculus exam prep.', 'student', 'user', 'Boston', 'USA', false, true, 4.75, 3, 3, 140, 85),
    (u_david, 'davidkim', 'David Kim', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', 'Classical guitarist & audio engineer. Offering guitar and music theory lessons.', 'community', 'user', 'Somerville', 'USA', false, true, 5.0, 3, 3, 150, 90),
    (u_maya, 'mayajohnson', 'Maya Johnson', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', 'Pre-law senior. Offering essay editing, debate coaching, and LSAT preparation.', 'student', 'user', 'Boston', 'USA', true, true, 4.9, 7, 8, 310, 96),
    (u_carlos, 'carlosmendez', 'Carlos Mendez', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 'Data Analyst & Python instructor. Passionate about helping beginners learn Pandas and SQL.', 'professional', 'user', 'Boston', 'USA', true, true, 4.9, 4, 5, 200, 92),
    (u_chloe, 'chloedupond', 'Chloe Dupont', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'Native Parisian & French literature scholar. Offering French conversation and grammar.', 'teacher', 'user', 'Boston', 'USA', true, true, 5.0, 5, 6, 250, 98),
    (u_kai, 'kaitakahashi', 'Kai Takahashi', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', 'Mechanical engineering student. Seeking German technical translation practice.', 'student', 'user', 'Cambridge', 'USA', false, true, 4.6, 2, 2, 90, 75),
    (u_zara, 'zaraalmansoor', 'Zara Al-Mansoor', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'Economics & statistics tutor. Helping scholars with R, Stata, and econometrics.', 'student', 'user', 'Boston', 'USA', true, true, 4.85, 4, 4, 190, 90),
    (u_sam, 'sambrown', 'Sam Brown', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', 'High school physics teacher. Freely offering STEM guidance to high school and college freshmen.', 'community', 'user', 'Brookline', 'USA', false, true, 5.0, 2, 2, 100, 85),
    (u_olivia, 'oliviawhite', 'Olivia White', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', 'Digital marketing specialist. Offering SEO and content strategy for portfolio design.', 'professional', 'user', 'Boston', 'USA', false, true, 4.7, 3, 3, 130, 82)
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    role = EXCLUDED.role,
    avg_rating = EXCLUDED.avg_rating,
    review_count = EXCLUDED.review_count,
    completed_exchanges = EXCLUDED.completed_exchanges,
    points = EXCLUDED.points,
    trust_score = EXCLUDED.trust_score;

  -- 2. USER SKILLS (Crafted for mutual high match scores)
  -- Alex offers Python (adv), wants Spanish (beginner)
  IF s_python IS NOT NULL AND s_spanish IS NOT NULL THEN
    INSERT INTO public.user_skills (user_id, skill_id, direction, proficiency) VALUES
      (u_alex, s_python, 'offered', 'advanced'),
      (u_alex, s_spanish, 'wanted', NULL),
      (u_sofia, s_spanish, 'offered', 'expert'),
      (u_sofia, s_python, 'wanted', NULL)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Marcus offers React, wants Figma. Elena offers Figma, wants React.
  IF s_react IS NOT NULL AND s_figma IS NOT NULL THEN
    INSERT INTO public.user_skills (user_id, skill_id, direction, proficiency) VALUES
      (u_marcus, s_react, 'offered', 'advanced'),
      (u_marcus, s_figma, 'wanted', NULL),
      (u_elena, s_figma, 'offered', 'expert'),
      (u_elena, s_react, 'wanted', NULL)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Liam offers Calculus, wants Chemistry. Priya offers Chemistry, wants Calculus.
  IF s_calculus IS NOT NULL AND s_chemistry IS NOT NULL THEN
    INSERT INTO public.user_skills (user_id, skill_id, direction, proficiency) VALUES
      (u_liam, s_calculus, 'offered', 'expert'),
      (u_liam, s_chemistry, 'wanted', NULL),
      (u_priya, s_chemistry, 'offered', 'advanced'),
      (u_priya, s_calculus, 'wanted', NULL)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. INSERT 25 ACADEMIC LISTINGS
  -- 15 Exchange Listings
  INSERT INTO public.listings (id, owner_id, type, title, description, category_id, offered_skill_id, wanted_skill_id, mode, status, view_count)
  VALUES
    (l_py_es, u_alex, 'exchange', 'Python Data Scripts & Automation for Spanish Conversation', 'Offering hands-on Python scripts, Pandas tutorials, and debugging in exchange for weekly conversational Spanish practice.', cat_prog, s_python, s_spanish, 'both', 'active', 48),
    (l_es_py, u_sofia, 'exchange', 'Conversational Spanish & Grammar Practice for Python Basics', 'Native Spanish speaker offering grammar and vocabulary practice in exchange for beginner Python programming assistance.', cat_lang, s_spanish, s_python, 'both', 'active', 54),
    (l_react_fig, u_marcus, 'exchange', 'React & Next.js App Architecture for Figma Design Systems', 'Experienced React TA offering component architecture guidance in exchange for Figma auto-layout and prototyping coaching.', cat_prog, s_react, s_figma, 'online', 'active', 39),
    (l_fig_react, u_elena, 'exchange', 'Figma Prototyping & UX Wireframing for React Fundamentals', 'Senior product designer teaching design systems and interactive prototypes in exchange for React frontend help.', cat_design, s_figma, s_react, 'online', 'active', 42),
    (l_calc_chem, u_liam, 'exchange', 'Multivariable Calculus & Linear Algebra for Organic Chem', 'Offering clear explanations of derivatives, integrals, and vector spaces for help in Organic Chemistry I/II.', cat_acad, s_calculus, s_chemistry, 'in_person', 'active', 31),
    (gen_random_uuid(), u_priya, 'exchange', 'Organic Chemistry Mechanisms for College Calculus Prep', 'Detailed reaction mechanisms and synthesis pathways in exchange for calculus homework troubleshooting.', cat_acad, s_chemistry, s_calculus, 'in_person', 'active', 29),
    (gen_random_uuid(), u_david, 'exchange', 'Acoustic Guitar Fingerpicking for French Conversation', 'Learn guitar chords, rhythm, and fingerstyle in exchange for practicing conversational French.', cat_music, s_guitar, s_french, 'both', 'active', 22),
    (gen_random_uuid(), u_chloe, 'exchange', 'Native French Fluency & Pronunciation for Guitar Chords', 'Parisian scholar offering authentic French accent and dialogue coaching for beginner acoustic guitar lessons.', cat_lang, s_french, s_guitar, 'both', 'active', 35),
    (gen_random_uuid(), u_carlos, 'exchange', 'SQL & Database Optimization for Data Storytelling', 'Learn PostgreSQL query optimization, indexes, and schema design for presentation and storytelling mentorship.', cat_prog, s_python, s_stats, 'online', 'active', 19),
    (gen_random_uuid(), u_maya, 'exchange', 'LSAT Logic Games & Essay Editing for Web Development', 'Offering proven LSAT logic strategies and academic editing in exchange for personal portfolio website building.', cat_acad, s_stats, s_react, 'both', 'active', 27),
    (gen_random_uuid(), u_zara, 'exchange', 'Applied Econometrics & R for Machine Learning Foundations', 'Statistical inference, regressions, and R coding in exchange for supervised ML algorithms practice.', cat_acad, s_stats, s_python, 'online', 'active', 24),
    (gen_random_uuid(), u_kai, 'exchange', 'CAD Modeling & 3D Printing for Linear Algebra Practice', 'CAD mechanical modeling tutorials in exchange for linear algebra matrix calculations.', cat_acad, s_calculus, s_stats, 'in_person', 'active', 18),
    (gen_random_uuid(), u_olivia, 'exchange', 'Search Engine Optimization & Digital Strategy for Figma', 'Learn keyword research and SEO content architecture in exchange for UI/UX design mentorship.', cat_design, s_figma, s_react, 'online', 'active', 16),
    (gen_random_uuid(), u_sam, 'exchange', 'Classical Mechanics & Physics Foundations for Spanish', 'Hands-on physics problem sets and intuitive intuition in exchange for introductory conversational Spanish.', cat_acad, s_calculus, s_spanish, 'both', 'active', 21),
    (gen_random_uuid(), u_alex, 'exchange', 'Git Version Control & Workflow Coaching for Essay Review', 'Master rebasing, branching, and pull requests in exchange for thesis paper editing.', cat_prog, s_python, s_stats, 'both', 'active', 17)
  ON CONFLICT (id) DO NOTHING;

  -- 5 Help Offers (freely offered without requiring return)
  INSERT INTO public.listings (id, owner_id, type, title, description, category_id, offered_skill_id, mode, status, view_count)
  VALUES
    (gen_random_uuid(), u_alex, 'help_offer', 'Free Office Hours: Python Debugging & Setup Help', 'Open office hours for freshmen struggling with virtualenv, pip, or syntax errors. Happy to help peers get started!', cat_prog, s_python, 'online', 'active', 63),
    (gen_random_uuid(), u_sofia, 'help_offer', 'Spanish Pronunciation Drop-in Clinic', 'Drop in for 20 minutes to practice conversational Spanish pronunciation before your oral exams.', cat_lang, s_spanish, 'both', 'active', 72),
    (gen_random_uuid(), u_liam, 'help_offer', 'Calculus Midterm Review Session', 'Free group walkthrough of derivative optimization and integral calculus problems.', cat_acad, s_calculus, 'in_person', 'active', 58),
    (gen_random_uuid(), u_marcus, 'help_offer', 'Code Review for Student Web Projects', 'Submit your GitHub repo for constructive code review on component structure and performance.', cat_prog, s_react, 'online', 'active', 45),
    (gen_random_uuid(), u_sam, 'help_offer', 'Freshman STEM Mentorship & Problem Solving', 'Open support for high school seniors and college freshmen transitioning to rigorous university STEM courses.', cat_acad, s_calculus, 'both', 'active', 38)
  ON CONFLICT (id) DO NOTHING;

  -- 5 Help Requests
  INSERT INTO public.listings (id, owner_id, type, title, description, category_id, wanted_skill_id, mode, status, view_count)
  VALUES
    (gen_random_uuid(), u_kai, 'help_request', 'Urgent: Need help understanding Taylor Series expansions', 'Struggling with convergence tests and Taylor polynomial approximations before next Thursday.', cat_acad, s_calculus, 'both', 'active', 15),
    (gen_random_uuid(), u_priya, 'help_request', 'Looking for beginner Docker tutorial for lab computing', 'Need guidance containerizing our computational biology pipeline so other researchers can run it.', cat_prog, s_python, 'online', 'active', 22),
    (gen_random_uuid(), u_david, 'help_request', 'Seeking conversational French partner for Paris study trip', 'Traveling to France next semester and need basic conversational practice for navigating daily life.', cat_lang, s_french, 'both', 'active', 19),
    (gen_random_uuid(), u_olivia, 'help_request', 'Feedback wanted on mobile app onboarding flow', 'Need a UX peer to critique my Figma wireframes for an accessible mobile app.', cat_design, s_figma, 'online', 'active', 17),
    (gen_random_uuid(), u_zara, 'help_request', 'Help with advanced R ggplot2 custom visualizations', 'Building complex facets and multi-layer economic charts for thesis submission.', cat_acad, s_stats, 'online', 'active', 26)
  ON CONFLICT (id) DO NOTHING;

  -- 4. COMPLETED CONNECTIONS & REVIEWS (Alex <-> Sofia)
  INSERT INTO public.connection_requests (id, sender_id, receiver_id, listing_id, message, match_score, status, completed_at)
  VALUES
    (c_alex_sofia, u_alex, u_sofia, l_es_py, 'Hey Sofia! Would love to practice conversational Spanish in exchange for Python data tutoring.', 95, 'completed', now() - interval '2 days')
  ON CONFLICT (id) DO NOTHING;

  -- Reviews between Alex and Sofia
  INSERT INTO public.reviews (connection_id, reviewer_id, reviewee_id, rating, comment, skills_rating, communication_rating, punctuality_rating)
  VALUES
    (c_alex_sofia, u_alex, u_sofia, 5, 'Sofia is an extraordinary tutor! She patiently walked me through Spanish verb conjugations and provided helpful cultural context.', 5, 5, 5),
    (c_alex_sofia, u_sofia, u_alex, 5, 'Alex made Python scripting so accessible! He helped me automate my data collection spreadsheet in less than an hour.', 5, 5, 5)
  ON CONFLICT (connection_id, reviewer_id) DO NOTHING;

  -- 5. BADGES SEEDING FOR DEMO SCHOLARS
  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  SELECT u_alex, b.id, now() - interval '3 days'
  FROM public.badges b WHERE b.slug IN ('first-exchange', 'skill-sharer', 'verified-member')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  SELECT u_sofia, b.id, now() - interval '5 days'
  FROM public.badges b WHERE b.slug IN ('first-exchange', 'skill-sharer', 'five-star', 'verified-member')
  ON CONFLICT DO NOTHING;

  -- 6. MODERATION REPORTS FOR ADMIN DEMO
  INSERT INTO public.reports (reporter_id, reported_user_id, reason, details, status)
  VALUES
    (u_sofia, u_kai, 'spam', 'User repeatedly sent copy-pasted cryptocurrency advertisements in intro messages.', 'open')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.reports (reporter_id, reported_listing_id, reason, details, status)
  VALUES
    (u_marcus, l_calc_chem, 'other', 'Listing location was marked in-person but owner requested unverified Zoom links.', 'reviewing')
  ON CONFLICT DO NOTHING;

  -- 7. VERIFICATION REQUESTS FOR ADMIN DEMO
  INSERT INTO public.verification_requests (user_id, method, document_url, note, status)
  VALUES
    (u_elena, 'student_id', 'verification-docs/demo_student_id.pdf', 'Official Cambridge university student identification card with valid 2026 semester sticker.', 'pending'),
    (u_alex, 'institution_email', NULL, 'Verified through institutional email validation (alex@campus.edu).', 'approved')
  ON CONFLICT DO NOTHING;

  -- 8. USER SETTINGS DEFAULT SEED
  INSERT INTO public.user_settings (user_id, theme, profile_visibility, show_city)
  SELECT id, 'system', 'public', true FROM public.profiles
  ON CONFLICT (user_id) DO NOTHING;

END;
$$;
