-- Migration: 003_storage_and_onboarding.sql
-- Description: Create Supabase Storage bucket for avatars and setup access policies

-- 1. Insert 'avatars' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'avatars'
-- Public read access
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated upload access (users can upload their own avatar files)
CREATE POLICY "Authenticated users can upload avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (auth.uid()::text = SPLIT_PART(name, '/', 1) OR (storage.foldername(name))[1] = auth.uid()::text OR auth.uid() = owner)
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (auth.uid()::text = SPLIT_PART(name, '/', 1) OR (storage.foldername(name))[1] = auth.uid()::text OR auth.uid() = owner)
  );
