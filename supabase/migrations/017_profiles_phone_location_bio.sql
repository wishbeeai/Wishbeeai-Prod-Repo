-- Add phone, location, bio, birthday, profile_image to profiles if missing (e.g. for Profile page save).
-- Safe to run if columns already exist (PostgreSQL 11+ ADD COLUMN IF NOT EXISTS).

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS birthday text,
  ADD COLUMN IF NOT EXISTS profile_image text;
