-- Migration: 002_seed.sql
-- Description: Seed data with 10 categories and realistic skill sets for Pairly

-- 1. Insert Categories
INSERT INTO categories (id, name, slug, icon, description) VALUES
(1, 'Programming', 'programming', 'Code', 'Software engineering, web development, algorithms, and systems engineering.'),
(2, 'Design', 'design', 'Palette', 'UI/UX design, visual branding, prototyping, and digital illustrations.'),
(3, 'Languages', 'languages', 'Languages', 'Natural language conversation practice, grammar, and international exchange.'),
(4, 'Music', 'music', 'Music', 'Instrument performance, vocal training, songwriting, and digital music production.'),
(5, 'Academics and Tutoring', 'academics-and-tutoring', 'GraduationCap', 'University coursework, mathematics, sciences, and research tutoring.'),
(6, 'Business and Career', 'business-and-career', 'Briefcase', 'Career advancement, resume reviews, startup mentoring, and marketing.'),
(7, 'Fitness and Wellness', 'fitness-and-wellness', 'Activity', 'Physical training, yoga, meditation, nutrition, and healthy habits.'),
(8, 'Cooking', 'cooking', 'Utensils', 'Culinary fundamentals, baking, global cuisine, and meal prep.'),
(9, 'Arts and Crafts', 'arts-and-crafts', 'Brush', 'Painting, ceramics, textile work, digital art, and artisan crafts.'),
(10, 'Community Help', 'community-help', 'HeartHandshake', 'Peer guidance, digital literacy, campus transition, and civic support.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;

-- Reset sequence for categories
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- 2. Insert Skills for Programming (Category 1)
INSERT INTO skills (category_id, name) VALUES
(1, 'React & Next.js'),
(1, 'Python & Data Science'),
(1, 'TypeScript & Modern JavaScript'),
(1, 'Full-Stack Web Development'),
(1, 'Mobile App Dev (React Native/Flutter)'),
(1, 'SQL & Database Architecture'),
(1, 'Git & Collaborative Version Control'),
(1, 'Data Structures & Algorithms'),
(1, 'Cloud Deployment & Docker'),
(1, 'REST & GraphQL API Engineering')
ON CONFLICT (name, category_id) DO NOTHING;

-- 3. Insert Skills for Design (Category 2)
INSERT INTO skills (category_id, name) VALUES
(2, 'Figma UI/UX Design & Prototyping'),
(2, 'User Research & Journey Mapping'),
(2, 'Graphic Design (Photoshop & Illustrator)'),
(2, 'Design Systems & Component Libraries'),
(2, 'Brand Identity & Logo Crafting'),
(2, '3D Modeling & Blender'),
(2, 'Motion Graphics & After Effects'),
(2, 'Typography & Editorial Layout'),
(2, 'Mobile App Interface Design'),
(2, 'Webflow & Framer Site Building')
ON CONFLICT (name, category_id) DO NOTHING;

-- 4. Insert Skills for Languages (Category 3)
INSERT INTO skills (category_id, name) VALUES
(3, 'Spanish Conversational Fluency'),
(3, 'English Academic & Professional Writing'),
(3, 'French for Beginners & Travelers'),
(3, 'German Grammar & Conversation'),
(3, 'Mandarin Chinese Pronunciation & Pinyin'),
(3, 'Japanese Speaking & Kana Basics'),
(3, 'Arabic Language & Script Fundamentals'),
(3, 'Italian Everyday Conversation'),
(3, 'IELTS & TOEFL Test Preparation'),
(3, 'Korean Language & Hangul Basics')
ON CONFLICT (name, category_id) DO NOTHING;

-- 5. Insert Skills for Music (Category 4)
INSERT INTO skills (category_id, name) VALUES
(4, 'Acoustic & Electric Guitar'),
(4, 'Piano & Keyboard Fundamentals'),
(4, 'Music Theory & Ear Training'),
(4, 'Vocal Technique & Range Expansion'),
(4, 'DAW Production (Ableton & Logic Pro)'),
(4, 'Songwriting & Melody Composition'),
(4, 'Bass Guitar Grooves & Walking Bass'),
(4, 'Drums & Percussion Rhythmics'),
(4, 'Audio Mixing & Mastering Basics'),
(4, 'Violin & Bowing Technique')
ON CONFLICT (name, category_id) DO NOTHING;

-- 6. Insert Skills for Academics and Tutoring (Category 5)
INSERT INTO skills (category_id, name) VALUES
(5, 'Calculus & Linear Algebra'),
(5, 'General & Organic Chemistry'),
(5, 'Classical Mechanics & Physics'),
(5, 'Academic Research & Literature Review'),
(5, 'Probability & Applied Statistics'),
(5, 'Cell Biology & Genetics'),
(5, 'Micro & Macroeconomics'),
(5, 'Scientific Essay & Thesis Writing'),
(5, 'Standardized Testing (GRE/GMAT/SAT)'),
(5, 'Philosophy & Critical Logic')
ON CONFLICT (name, category_id) DO NOTHING;

-- 7. Insert Skills for Business and Career (Category 6)
INSERT INTO skills (category_id, name) VALUES
(6, 'Resume & LinkedIn Optimization'),
(6, 'Technical & Behavioral Interview Prep'),
(6, 'Digital Marketing & Content Strategy'),
(6, 'Product Management Foundations'),
(6, 'Public Speaking & Presentation Skills'),
(6, 'Financial Modeling & Advanced Excel'),
(6, 'Startup Pitching & Venture Strategy'),
(6, 'Agile & Scrum Project Management'),
(6, 'Sales Prospecting & Client Relations'),
(6, 'Freelancing & Contract Negotiation')
ON CONFLICT (name, category_id) DO NOTHING;

-- 8. Insert Skills for Fitness and Wellness (Category 7)
INSERT INTO skills (category_id, name) VALUES
(7, 'Strength & Resistance Training'),
(7, 'Vinyasa Yoga & Breathwork'),
(7, 'Mindfulness & Guided Meditation'),
(7, 'Marathon & Distance Running Form'),
(7, 'Nutritional Planning & Macronutrients'),
(7, 'High-Intensity Interval Training (HIIT)'),
(7, 'Calisthenics & Bodyweight Control'),
(7, 'Desk Ergonomics & Posture Alignment'),
(7, 'Stress Reduction & Sleep Hygiene'),
(7, 'Mat Pilates Core Conditioning')
ON CONFLICT (name, category_id) DO NOTHING;

-- 9. Insert Skills for Cooking (Category 8)
INSERT INTO skills (category_id, name) VALUES
(8, 'Handmade Pasta & Classic Sauces'),
(8, 'Artisan Sourdough Bread Baking'),
(8, 'Knife Technique & Mise en Place'),
(8, 'Plant-Based & Vegan Cooking'),
(8, 'Pastry Doughs & French Desserts'),
(8, 'Traditional Indian Spices & Curries'),
(8, 'Japanese Home Meals & Bento Prep'),
(8, 'Time-Saving Weekly Batch Cooking'),
(8, 'Specialty Coffee Brewing & Espresso'),
(8, 'Asian Stir-Frying & Wok Essentials')
ON CONFLICT (name, category_id) DO NOTHING;

-- 10. Insert Skills for Arts and Crafts (Category 9)
INSERT INTO skills (category_id, name) VALUES
(9, 'Watercolor Landscape & Botanicals'),
(9, 'Pencil Portrait Sketching & Shading'),
(9, 'Ceramics & Handbuilding with Clay'),
(9, 'Sewing Machine & Garment Alterations'),
(9, 'Procreate Digital Illustration'),
(9, 'Knitting Sweaters & Cozy Scarves'),
(9, 'Modern Calligraphy & Brush Lettering'),
(9, 'Acrylic Abstract Canvas Painting'),
(9, 'Leather Crafting & Saddle Stitching'),
(9, 'Embroidery & Hand Needlework')
ON CONFLICT (name, category_id) DO NOTHING;

-- 11. Insert Skills for Community Help (Category 10)
INSERT INTO skills (category_id, name) VALUES
(10, 'Peer Academic Tutoring & Guidance'),
(10, 'Campus & Local City Transition Guide'),
(10, 'Senior Citizen Digital Literacy'),
(10, 'Bicycle Maintenance & Roadside Repair'),
(10, 'Volunteer Coordination & Outreach'),
(10, 'Zero-Waste Living & Composting Basics'),
(10, 'Active Listening & Peer Support'),
(10, 'Budgeting for College Students'),
(10, 'First Aid & CPR Basics'),
(10, 'English as a Second Language Conversation')
ON CONFLICT (name, category_id) DO NOTHING;
