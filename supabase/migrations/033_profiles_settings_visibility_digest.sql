-- Add profile visibility and weekly digest to profiles (for Settings persistence).
-- Run in Supabase Dashboard → SQL Editor. Safe to run multiple times.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'friends';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN NOT NULL DEFAULT false;

-- Optional: notification/preference columns so settings page can persist all toggles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gift_reminders BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contribution_updates BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS group_invites BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_contributions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_wishlist BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.profile_visibility IS 'public | friends | private';
COMMENT ON COLUMN public.profiles.weekly_digest IS 'Send weekly activity digest email when true';
