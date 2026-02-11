-- =============================================================================
-- Add contributor_impact_emails_sent for Contributor Impact Email
-- Migration: 025_gifts_contributor_impact_sent.sql
-- Prevents duplicate contributor wrap-up emails after settlement
-- =============================================================================

ALTER TABLE gifts
ADD COLUMN IF NOT EXISTS contributor_impact_emails_sent BOOLEAN DEFAULT false;

COMMENT ON COLUMN gifts.contributor_impact_emails_sent IS 'True after contributor impact wrap-up emails sent (once per event).';
