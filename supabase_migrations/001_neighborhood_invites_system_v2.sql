-- ============================================================================
-- Neighborhood Invites System Migration (Safe Version)
-- ============================================================================
-- This migration safely creates the invite system
-- Run each section separately to identify any issues
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CLEANUP (if needed): Run this ONLY if you need to start fresh
-- ----------------------------------------------------------------------------
-- Uncomment these lines if you need to drop everything and start over:
-- DROP TABLE IF EXISTS neighborhood_invites CASCADE;
-- DROP FUNCTION IF EXISTS generate_invite_code(UUID);
-- DROP FUNCTION IF EXISTS redeem_invite_code(TEXT, UUID);

-- ----------------------------------------------------------------------------
-- STEP 1: Add address column to profiles table (do this first)
-- ----------------------------------------------------------------------------

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- Verify: SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';

-- ----------------------------------------------------------------------------
-- STEP 2: Create neighborhood_invites table
-- ----------------------------------------------------------------------------

CREATE TABLE neighborhood_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255),
  recipient_address TEXT,
  is_redeemed BOOLEAN DEFAULT false NOT NULL,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,

  -- Ensure code is always uppercase for consistency
  CONSTRAINT code_format CHECK (code = UPPER(code))
);

-- Verify: SELECT * FROM neighborhood_invites LIMIT 1;

-- ----------------------------------------------------------------------------
-- STEP 3: Create indexes
-- ----------------------------------------------------------------------------

CREATE INDEX idx_invites_code ON neighborhood_invites(code);
CREATE INDEX idx_invites_neighborhood ON neighborhood_invites(neighborhood_id);
CREATE INDEX idx_invites_redeemed ON neighborhood_invites(is_redeemed);
CREATE INDEX idx_invites_created_at ON neighborhood_invites(created_at DESC);

-- Verify: SELECT indexname FROM pg_indexes WHERE tablename = 'neighborhood_invites';

-- ----------------------------------------------------------------------------
-- STEP 4: Enable Row Level Security
-- ----------------------------------------------------------------------------

ALTER TABLE neighborhood_invites ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view unredeemed invites
DROP POLICY IF EXISTS "Anyone can view unredeemed invites by code" ON neighborhood_invites;
CREATE POLICY "Anyone can view unredeemed invites by code"
  ON neighborhood_invites
  FOR SELECT
  USING (is_redeemed = false OR auth.uid() = redeemed_by);

-- Policy 2: Authenticated users can redeem invites
DROP POLICY IF EXISTS "Authenticated users can update their own invite redemption" ON neighborhood_invites;
CREATE POLICY "Authenticated users can update their own invite redemption"
  ON neighborhood_invites
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND is_redeemed = false)
  WITH CHECK (redeemed_by = auth.uid());

-- Verify: SELECT policyname FROM pg_policies WHERE tablename = 'neighborhood_invites';

-- ----------------------------------------------------------------------------
-- STEP 5: Create helper function to generate invite codes
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

    -- Combine to create final code
    v_final_code := v_code_prefix || '-' || v_random_suffix;

    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM neighborhood_invites WHERE code = v_final_code) THEN
      RETURN v_final_code;
    END IF;

    v_attempt := v_attempt + 1;

    IF v_attempt > 100 THEN
      RAISE EXCEPTION 'Could not generate unique invite code after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- Verify: SELECT generate_invite_code((SELECT id FROM neighborhoods LIMIT 1));

-- ----------------------------------------------------------------------------
-- STEP 6: Create function to redeem invite codes
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
  -- Lock the invite row for update
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

  -- Return success
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
