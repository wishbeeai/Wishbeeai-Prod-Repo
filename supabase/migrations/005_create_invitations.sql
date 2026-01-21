-- =============================================================================
-- AI INVITATION SYSTEM - Database Schema
-- Migration: 005_create_invitations.sql
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE occasion_type AS ENUM (
    'birthday', 'wedding', 'baby_shower', 'holiday', 'corporate',
    'graduation', 'anniversary', 'housewarming', 'retirement', 'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE theme_style AS ENUM (
    'elegant', 'fun', 'modern', 'minimal', 'luxury',
    'vintage', 'playful', 'romantic', 'professional'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tone_type AS ENUM (
    'playful', 'formal', 'warm', 'celebratory', 'heartfelt', 'professional'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE generation_source AS ENUM ('openai', 'fal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE generation_status AS ENUM (
    'pending', 'generating', 'completed', 'failed', 'moderated'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_variation_type AS ENUM ('hero', 'variation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_tier AS ENUM ('free', 'premium', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- INVITATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event details
  event_title VARCHAR(255) NOT NULL,
  event_date DATE,
  event_time TIME,
  event_location VARCHAR(500),
  host_name VARCHAR(255),
  custom_message TEXT,
  
  -- Generation parameters
  occasion occasion_type NOT NULL,
  theme theme_style NOT NULL,
  tone tone_type NOT NULL,
  color_palette JSONB NOT NULL DEFAULT '{}',
  product_reference JSONB,
  
  -- Status
  status generation_status NOT NULL DEFAULT 'pending',
  selected_image_id UUID,
  
  -- Sharing
  share_token VARCHAR(32) UNIQUE,
  view_count INTEGER NOT NULL DEFAULT 0,
  
  -- Cost tracking
  openai_calls INTEGER NOT NULL DEFAULT 0,
  openai_cost DECIMAL(10,4) NOT NULL DEFAULT 0,
  fal_calls INTEGER NOT NULL DEFAULT 0,
  fal_cost DECIMAL(10,4) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,4) NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_color_palette CHECK (jsonb_typeof(color_palette) = 'object')
);

-- =============================================================================
-- INVITATION IMAGES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS invitation_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  
  -- Image data
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  type invitation_variation_type NOT NULL,
  source generation_source NOT NULL,
  
  -- Generation details
  prompt TEXT NOT NULL,
  style_modifiers TEXT,
  metadata JSONB,
  
  -- Selection
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- USER GENERATION LIMITS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_generation_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Limits
  tier user_tier NOT NULL DEFAULT 'free',
  daily_limit INTEGER NOT NULL DEFAULT 5,
  daily_used INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 50,
  monthly_used INTEGER NOT NULL DEFAULT 0,
  
  -- Reset tracking
  last_daily_reset DATE NOT NULL DEFAULT CURRENT_DATE,
  last_monthly_reset DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- GENERATION COST LOG TABLE (for analytics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS generation_cost_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  
  source generation_source NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  prompt_tokens INTEGER,
  cost DECIMAL(10,6) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Invitations indexes
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_share_token ON invitations(share_token);
CREATE INDEX IF NOT EXISTS idx_invitations_created_at ON invitations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_occasion ON invitations(occasion);

-- Invitation images indexes
CREATE INDEX IF NOT EXISTS idx_invitation_images_invitation_id ON invitation_images(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_images_type ON invitation_images(type);
CREATE INDEX IF NOT EXISTS idx_invitation_images_is_selected ON invitation_images(is_selected) WHERE is_selected = TRUE;

-- User limits indexes
CREATE INDEX IF NOT EXISTS idx_user_generation_limits_user_id ON user_generation_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_generation_limits_tier ON user_generation_limits(tier);

-- Cost log indexes
CREATE INDEX IF NOT EXISTS idx_generation_cost_log_user_id ON generation_cost_log(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_cost_log_created_at ON generation_cost_log(created_at DESC);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_invitation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_invitation_updated_at ON invitations;
CREATE TRIGGER trigger_update_invitation_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_invitation_updated_at();

-- Reset daily limits function
CREATE OR REPLACE FUNCTION reset_daily_generation_limits()
RETURNS void AS $$
BEGIN
  UPDATE user_generation_limits
  SET 
    daily_used = 0,
    last_daily_reset = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Reset monthly limits function
CREATE OR REPLACE FUNCTION reset_monthly_generation_limits()
RETURNS void AS $$
BEGIN
  UPDATE user_generation_limits
  SET 
    monthly_used = 0,
    last_monthly_reset = DATE_TRUNC('month', CURRENT_DATE)::DATE,
    updated_at = NOW()
  WHERE last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql;

-- Increment view count function
CREATE OR REPLACE FUNCTION increment_invitation_views(token VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET view_count = view_count + 1
  WHERE share_token = token;
END;
$$ LANGUAGE plpgsql;

-- Check and increment user generation limits
CREATE OR REPLACE FUNCTION check_and_increment_generation_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_limits user_generation_limits%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Reset limits if needed
  PERFORM reset_daily_generation_limits();
  PERFORM reset_monthly_generation_limits();
  
  -- Get or create user limits
  INSERT INTO user_generation_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_limits
  FROM user_generation_limits
  WHERE user_id = p_user_id;
  
  -- Check limits
  IF v_limits.daily_used >= v_limits.daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit_reached',
      'daily_remaining', 0,
      'monthly_remaining', v_limits.monthly_limit - v_limits.monthly_used
    );
  END IF;
  
  IF v_limits.monthly_used >= v_limits.monthly_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'monthly_limit_reached',
      'daily_remaining', v_limits.daily_limit - v_limits.daily_used,
      'monthly_remaining', 0
    );
  END IF;
  
  -- Increment usage
  UPDATE user_generation_limits
  SET 
    daily_used = daily_used + 1,
    monthly_used = monthly_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'daily_remaining', v_limits.daily_limit - v_limits.daily_used - 1,
    'monthly_remaining', v_limits.monthly_limit - v_limits.monthly_used - 1
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_generation_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_cost_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can create own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can update own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can delete own invitations" ON invitations;
DROP POLICY IF EXISTS "Public can view shared invitations" ON invitations;

DROP POLICY IF EXISTS "Users can view own invitation images" ON invitation_images;
DROP POLICY IF EXISTS "Users can create invitation images" ON invitation_images;
DROP POLICY IF EXISTS "Public can view shared invitation images" ON invitation_images;

DROP POLICY IF EXISTS "Users can view own limits" ON user_generation_limits;
DROP POLICY IF EXISTS "Users can view own cost logs" ON generation_cost_log;

-- Invitations policies
CREATE POLICY "Users can view own invitations" ON invitations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invitations" ON invitations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invitations" ON invitations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view shared invitations" ON invitations
  FOR SELECT USING (share_token IS NOT NULL);

-- Invitation images policies
CREATE POLICY "Users can view own invitation images" ON invitation_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invitations 
      WHERE invitations.id = invitation_images.invitation_id 
      AND invitations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invitation images" ON invitation_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invitations 
      WHERE invitations.id = invitation_images.invitation_id 
      AND invitations.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view shared invitation images" ON invitation_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invitations 
      WHERE invitations.id = invitation_images.invitation_id 
      AND invitations.share_token IS NOT NULL
    )
  );

-- User limits policies
CREATE POLICY "Users can view own limits" ON user_generation_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Cost log policies
CREATE POLICY "Users can view own cost logs" ON generation_cost_log
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON invitations TO anon;
GRANT ALL ON invitations TO authenticated;
GRANT SELECT ON invitation_images TO anon;
GRANT ALL ON invitation_images TO authenticated;
GRANT SELECT, UPDATE ON user_generation_limits TO authenticated;
GRANT SELECT ON generation_cost_log TO authenticated;
