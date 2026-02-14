-- Add payment settings columns to profiles (Settings → Payment Settings persistence).
-- Run in Supabase Dashboard → SQL Editor. Safe to run multiple times.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_payment_method TEXT NOT NULL DEFAULT 'credit-card';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS save_payment_info BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

COMMENT ON COLUMN public.profiles.default_payment_method IS 'credit-card | paypal | apple-pay | google-pay | venmo | cash-app';
COMMENT ON COLUMN public.profiles.save_payment_info IS 'Whether to save payment info for future use';
COMMENT ON COLUMN public.profiles.currency IS 'Preferred currency: USD | EUR | GBP | CAD';
