-- =============================================================================
-- Allow gifts.status = 'settled' (set only after Tremendous + charity both succeed)
-- Migration: 028_gifts_settled_status.sql
-- =============================================================================

ALTER TABLE gifts DROP CONSTRAINT IF EXISTS gifts_status_check;
ALTER TABLE gifts ADD CONSTRAINT gifts_status_check
  CHECK (status IN ('active', 'completed', 'cancelled', 'settled'));

COMMENT ON COLUMN gifts.status IS 'active | completed | cancelled | settled (settled = Tremendous + charity flow both done)';
