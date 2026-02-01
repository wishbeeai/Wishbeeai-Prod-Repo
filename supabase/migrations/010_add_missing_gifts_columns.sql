-- =============================================================================
-- Add missing columns to gifts table (fix PGRST204: column not in schema cache)
-- Run this if you get: Could not find the 'banner_image' column of 'gifts'
-- =============================================================================

-- Add any columns that may be missing (safe to run multiple times)
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS banner_image TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS product_link TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS store_name TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS price DECIMAL(12, 2);
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2);
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS review_count INTEGER;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS specifications JSONB;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS preference_options JSONB;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS occasion TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS evite_settings JSONB;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
