-- Migration: 004_listings.sql
-- Description: Listings and Saved Listings schema with enums, constraints, indexes, view counter RPC, and RLS

-- 1. ENUMS
CREATE TYPE listing_type AS ENUM ('exchange', 'help_request', 'help_offer');
CREATE TYPE listing_mode AS ENUM ('online', 'in_person', 'both');
CREATE TYPE listing_status AS ENUM ('active', 'paused', 'completed', 'closed');

-- 2. LISTINGS TABLE
CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type listing_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category_id int REFERENCES categories(id) ON DELETE SET NULL,
  offered_skill_id int REFERENCES skills(id) ON DELETE SET NULL,
  wanted_skill_id int REFERENCES skills(id) ON DELETE SET NULL,
  mode listing_mode DEFAULT 'online'::listing_mode NOT NULL,
  city text,
  availability text,
  duration_estimate text,
  status listing_status DEFAULT 'active'::listing_status NOT NULL,
  view_count int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- CHECK constraints matching business logic
  CONSTRAINT check_listing_type_skills CHECK (
    (type = 'exchange' AND offered_skill_id IS NOT NULL AND wanted_skill_id IS NOT NULL) OR
    (type = 'help_offer' AND offered_skill_id IS NOT NULL) OR
    (type = 'help_request' AND wanted_skill_id IS NOT NULL)
  )
);

-- 3. SAVED_LISTINGS TABLE
CREATE TABLE saved_listings (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, listing_id)
);

-- 4. INDEXES
CREATE INDEX idx_listings_owner_id ON listings(owner_id);
CREATE INDEX idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX idx_listings_offered_skill ON listings(offered_skill_id);
CREATE INDEX idx_listings_wanted_skill ON listings(wanted_skill_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_saved_listings_user ON saved_listings(user_id);
CREATE INDEX idx_saved_listings_listing ON saved_listings(listing_id);

-- 5. TRIGGER: updated_at for listings
CREATE TRIGGER trg_listings_updated_at
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 6. RPC: Increment View Count Safely
CREATE OR REPLACE FUNCTION increment_listing_view_count(target_listing_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET view_count = view_count + 1
  WHERE id = target_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- Listings Policies:
-- Anyone authenticated can read active listings and their own listings of any status
CREATE POLICY "Active listings are viewable by authenticated users"
  ON listings FOR SELECT
  TO authenticated
  USING (status = 'active' OR auth.uid() = owner_id);

-- Allow public read of active listings (for public profile cards and marketing discovery)
CREATE POLICY "Active listings are viewable by anon"
  ON listings FOR SELECT
  TO anon
  USING (status = 'active');

-- Owners can insert, update, delete their own listings
CREATE POLICY "Users can insert own listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Saved Listings Policies:
-- Saved listings are private to the owner
CREATE POLICY "Users can view own saved listings"
  ON saved_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save listings"
  ON saved_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved listings"
  ON saved_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
