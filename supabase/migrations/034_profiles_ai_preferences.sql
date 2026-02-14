-- Add AI preference columns to profiles (Settings → AI Preferences persistence).
-- Run in Supabase Dashboard → SQL Editor. Safe to run multiple times.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_suggestions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_extract BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS smart_recommendations BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personalized_insights BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.ai_suggestions IS 'Enable AI suggestions in the app';
COMMENT ON COLUMN public.profiles.auto_extract IS 'Auto-extract product details when adding items';
COMMENT ON COLUMN public.profiles.smart_recommendations IS 'Show smart gift recommendations';
COMMENT ON COLUMN public.profiles.personalized_insights IS 'Show personalized gifting insights';
