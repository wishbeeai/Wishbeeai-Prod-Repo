-- =============================================================================
-- Add impact_token and recipient_notification_sent for RecipientNotificationService
-- Migration: 024_gifts_impact_token.sql
-- Used by RecipientNotificationService for /impact/[eventHash]
-- =============================================================================

ALTER TABLE gifts
ADD COLUMN IF NOT EXISTS impact_token TEXT UNIQUE;

ALTER TABLE gifts
ADD COLUMN IF NOT EXISTS recipient_notification_sent BOOLEAN DEFAULT false;

-- Index for fast lookup by impact_token (used when resolving /impact/[eventHash])
CREATE UNIQUE INDEX IF NOT EXISTS idx_gifts_impact_token ON gifts(impact_token) WHERE impact_token IS NOT NULL;
