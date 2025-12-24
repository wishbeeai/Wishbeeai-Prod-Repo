-- Migration: Contributions Security & Constraints
-- Description: Adds check constraints, RLS policies, and triggers for secure contributions

-- ============================================================================
-- 1. CHECK CONSTRAINT: Prevent Negative Contributions
-- ============================================================================
-- This ensures no one can send a negative amount (preventing theft or negative pooling)

-- If contributions table doesn't exist, create it first
-- (Adjust column names/types based on your actual schema)
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  message TEXT,
  contributor_name VARCHAR(255),
  contributor_email VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- CHECK CONSTRAINT: Amount must be positive
  CONSTRAINT contributions_amount_positive CHECK (amount > 0)
);

-- ============================================================================
-- 2. RLS POLICIES: Invite-Only Wishlists
-- ============================================================================
-- Only the owner or invited friends can see gift details

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own contributions
CREATE POLICY "Users can view their own contributions"
  ON contributions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can view contributions to wishlists they own or are invited to
CREATE POLICY "Users can view contributions to their wishlists"
  ON contributions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wishlists w
      WHERE w.id = contributions.wishlist_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM wishlist_invitations wi
          WHERE wi.wishlist_id = w.id
          AND wi.user_id = auth.uid()
          AND wi.status = 'accepted'
        )
      )
    )
  );

-- Policy: Authenticated users can create contributions
CREATE POLICY "Authenticated users can create contributions"
  ON contributions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Only the contribution owner can update their contribution
CREATE POLICY "Users can update their own contributions"
  ON contributions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. DATABASE TRIGGER: Automated Wishlist Totals
-- ============================================================================
-- Automatically updates current_amount on wishlist when contribution status changes

-- Function to update wishlist current_amount
CREATE OR REPLACE FUNCTION update_wishlist_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if contribution status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE wishlists
    SET current_amount = COALESCE(current_amount, 0) + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.wishlist_id;
  END IF;

  -- Handle refunds/cancellations: subtract amount if status changed from 'completed'
  IF OLD.status = 'completed' AND NEW.status IN ('failed', 'refunded', 'canceled') THEN
    UPDATE wishlists
    SET current_amount = GREATEST(COALESCE(current_amount, 0) - OLD.amount, 0),
        updated_at = NOW()
    WHERE id = OLD.wishlist_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on contributions table
DROP TRIGGER IF EXISTS trigger_update_wishlist_amount ON contributions;
CREATE TRIGGER trigger_update_wishlist_amount
  AFTER INSERT OR UPDATE OF status ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_current_amount();

-- ============================================================================
-- 4. INDEXES: Performance Optimization
-- ============================================================================

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);

-- Index for faster lookups by wishlist
CREATE INDEX IF NOT EXISTS idx_contributions_wishlist_id ON contributions(wishlist_id);

-- Index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);

-- Index for Stripe payment intent lookups
CREATE INDEX IF NOT EXISTS idx_contributions_stripe_payment_intent_id 
  ON contributions(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================================
-- 5. HELPER FUNCTION: Get Contribution Total for Wishlist
-- ============================================================================

CREATE OR REPLACE FUNCTION get_wishlist_contribution_total(wishlist_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) 
     FROM contributions 
     WHERE wishlist_id = wishlist_uuid 
     AND status = 'completed'),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_wishlist_contribution_total IS 
  'Returns the total of completed contributions for a wishlist';

