-- Add Stripe customer ID to profiles (for saved payment methods).
-- Run in Supabase Dashboard → SQL Editor. Safe to run multiple times.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for saved payment methods (cus_...)';
