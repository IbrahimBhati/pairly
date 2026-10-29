-- Migration: 001_init.sql
-- Description: Foundational schema for Pairly peer-to-peer skill exchange platform
-- Includes enums, profiles, categories, skills, user_skills, triggers, indexes, and RLS policies

-- 1. ENUMS
CREATE TYPE user_type AS ENUM ('student', 'teacher', 'professional', 'community');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE skill_direction AS ENUM ('offered', 'wanted');

-- 2. PROFILES TABLE
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  user_type user_type DEFAULT 'student'::user_type NOT NULL,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  city text,
  country text,
  timezone text,
  languages text[] DEFAULT '{}'::text[],
  is_verified boolean DEFAULT false NOT NULL,
  onboarding_completed boolean DEFAULT false NOT NULL,
  is_suspended boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. CATEGORIES TABLE
CREATE TABLE categories (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL, -- Lucide icon name, e.g., 'Code', 'Palette', 'Languages'
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. SKILLS TABLE
CREATE TABLE skills (
  id serial PRIMARY KEY,
  name text NOT NULL,
  category_id int REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_skill_per_category UNIQUE(name, category_id)
);

-- 5. USER_SKILLS TABLE
CREATE TABLE user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id int REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  direction skill_direction NOT NULL,
  proficiency text CHECK (
    (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert'))
    OR (direction = 'wanted' AND proficiency IS NULL)
  ),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_skill_direction UNIQUE(user_id, skill_id, direction)
);

-- 6. INDEXES
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_direction ON user_skills(skill_id, direction);
CREATE INDEX idx_skills_category_id ON skills(category_id);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_username ON profiles(username);

-- 7. TRIGGER: updated_at for profiles
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 8. TRIGGER: handle_new_user() on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_username text;
  meta_fullname text;
  meta_avatar text;
BEGIN
  meta_fullname := NEW.raw_user_meta_data->>'full_name';
  meta_avatar := NEW.raw_user_meta_data->>'avatar_url';
  
  -- Create username candidate from email prefix or metadata or ID
  extracted_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::text, 1, 4)
  );

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    user_type,
    role,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    extracted_username,
    COALESCE(meta_fullname, SPLIT_PART(NEW.email, '@', 1)),
    meta_avatar,
    'student'::user_type,
    'user'::user_role,
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- Profiles Policies:
-- Readable by any authenticated user
CREATE POLICY "Profiles are readable by authenticated users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow public read of non-suspended profiles (needed for public discovery / marketing showcase if desired)
CREATE POLICY "Public profiles are readable by anon for discovery"
  ON profiles
  FOR SELECT
  TO anon
  USING (is_suspended = false);

-- Updatable only by the profile owner
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insertable by the owner (fallback if trigger bypassed)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories Policies:
-- Readable by everyone
CREATE POLICY "Categories are readable by everyone"
  ON categories
  FOR SELECT
  USING (true);

-- Skills Policies:
-- Readable by everyone
CREATE POLICY "Skills are readable by everyone"
  ON skills
  FOR SELECT
  USING (true);

-- User Skills Policies:
-- Readable by authenticated users
CREATE POLICY "User skills are readable by authenticated users"
  ON user_skills
  FOR SELECT
  TO authenticated
  USING (true);

-- Also readable by anon for matching preview
CREATE POLICY "User skills are readable by anon"
  ON user_skills
  FOR SELECT
  TO anon
  USING (true);

-- Insertable only by the owner
CREATE POLICY "Users can insert own skills"
  ON user_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Updatable only by the owner
CREATE POLICY "Users can update own skills"
  ON user_skills
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deletable only by the owner
CREATE POLICY "Users can delete own skills"
  ON user_skills
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
