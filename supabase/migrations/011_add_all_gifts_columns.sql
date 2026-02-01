-- =============================================================================
-- Add ALL columns expected by POST /api/gifts (fix PGRST204 for any missing column)
-- Run this if you get: Could not find the 'collection_title' (or any) column of 'gifts'
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS).
-- =============================================================================

-- Core (NOT NULL columns need DEFAULT for existing rows)
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS collection_title TEXT NOT NULL DEFAULT '';
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS gift_name TEXT NOT NULL DEFAULT '';
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS target_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS contributors INTEGER NOT NULL DEFAULT 0;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Display & product
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

-- Event / recipient
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS occasion TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS evite_settings JSONB;

-- Timestamps
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
