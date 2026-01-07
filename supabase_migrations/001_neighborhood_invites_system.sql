-- ============================================================================
-- Neighborhood Invites System Migration
-- ============================================================================
-- This migration creates the invite system for neighborhood-based onboarding
--
-- What this does:
-- 1. Creates neighborhood_invites table for storing invite codes
-- 2. Adds address column to profiles table
-- 3. Creates functions to generate and redeem invite codes
-- 4. Sets up Row Level Security (RLS) policies
--
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Create neighborhood_invites table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS neighborhood_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255),
  recipient_address TEXT,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',

  -- Ensure code is always uppercase for consistency
  CONSTRAINT code_format CHECK (code = UPPER(code))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_code ON neighborhood_invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_neighborhood ON neighborhood_invites(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_invites_redeemed ON neighborhood_invites(is_redeemed);
CREATE INDEX IF NOT EXISTS idx_invites_created_at ON neighborhood_invites(created_at DESC);

-- ----------------------------------------------------------------------------
-- STEP 2: Add address column to profiles table
-- ----------------------------------------------------------------------------

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- ----------------------------------------------------------------------------
-- STEP 3: Enable Row Level Security
-- ----------------------------------------------------------------------------

ALTER TABLE neighborhood_invites ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view unredeemed invites (needed for validation before signup)
CREATE POLICY "Anyone can view unredeemed invites by code"
  ON neighborhood_invites
  FOR SELECT
  USING (is_redeemed = false OR auth.uid() = redeemed_by);

-- Policy 2: Authenticated users can update invites to redeem them
CREATE POLICY "Authenticated users can update their own invite redemption"
  ON neighborhood_invites
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND is_redeemed = false)
  WITH CHECK (redeemed_by = auth.uid());

-- ----------------------------------------------------------------------------
-- STEP 4: Create helper function to generate invite codes
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_invite_code(p_neighborhood_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_neighborhood_name TEXT;
  v_code_prefix TEXT;
  v_random_suffix TEXT;
  v_final_code TEXT;
  v_attempt INTEGER := 0;
BEGIN
  -- Get neighborhood name
  SELECT name INTO v_neighborhood_name
  FROM neighborhoods
  WHERE id = p_neighborhood_id;

  IF v_neighborhood_name IS NULL THEN
    RAISE EXCEPTION 'Neighborhood not found for id: %', p_neighborhood_id;
  END IF;

  -- Create prefix from neighborhood name
  -- Example: "Sunset Hills" -> "SUNSET-HILLS"
  v_code_prefix := UPPER(
    REPLACE(
      REGEXP_REPLACE(v_neighborhood_name, '[^a-zA-Z0-9\s]', '', 'g'),
      ' ',
      '-'
    )
  );

  -- Try to generate unique code
  LOOP
    -- Generate random 4-character alphanumeric suffix
    v_random_suffix := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT)
        FROM 1 FOR 4
      )
    );

    -- Combine to create final code: NEIGHBORHOOD-NAME-A1B2
    v_final_code := v_code_prefix || '-' || v_random_suffix;

    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM neighborhood_invites WHERE code = v_final_code) THEN
      RETURN v_final_code;
    END IF;

    v_attempt := v_attempt + 1;

    -- Safety: prevent infinite loop
    IF v_attempt > 100 THEN
      RAISE EXCEPTION 'Could not generate unique invite code after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- STEP 5: Create function to redeem invite codes
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION redeem_invite_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_invite_record RECORD;
BEGIN
  -- Lock the invite row for update (prevents race conditions)
  SELECT * INTO v_invite_record
  FROM neighborhood_invites
  WHERE code = UPPER(p_code)
  FOR UPDATE;

  -- Validate invite exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid invite code'
    );
  END IF;

  -- Validate not already redeemed
  IF v_invite_record.is_redeemed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This invite has already been used'
    );
  END IF;

  -- Mark as redeemed
  UPDATE neighborhood_invites
  SET
    is_redeemed = true,
    redeemed_by = p_user_id,
    redeemed_at = now()
  WHERE id = v_invite_record.id;

  -- Return success with neighborhood info
  RETURN jsonb_build_object(
    'success', true,
    'neighborhood_id', v_invite_record.neighborhood_id,
    'invite_id', v_invite_record.id
  );
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
--
-- Next steps:
-- 1. Test by generating an invite code:
--    SELECT generate_invite_code('your-neighborhood-uuid-here');
--
-- 2. View the generated invite:
--    SELECT * FROM neighborhood_invites ORDER BY created_at DESC LIMIT 1;
--
-- 3. Test redemption (replace with actual user ID):
--    SELECT redeem_invite_code('THE-CODE-GENERATED', 'user-uuid-here');
--
-- ============================================================================
