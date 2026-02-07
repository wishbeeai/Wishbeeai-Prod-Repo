-- Add contributor email to gift_contributions for display.
-- Run in Supabase SQL Editor.

ALTER TABLE gift_contributions
  ADD COLUMN IF NOT EXISTS contributor_email TEXT;

COMMENT ON COLUMN gift_contributions.contributor_email IS 'Contributor email for display (optional).';
