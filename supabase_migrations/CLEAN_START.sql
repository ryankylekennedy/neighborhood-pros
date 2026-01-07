-- ============================================================================
-- CLEAN START: Drop everything and recreate from scratch
-- ============================================================================
-- This is the safest option - we'll start completely fresh
-- ============================================================================

-- Drop the broken table and functions
DROP TABLE IF EXISTS neighborhood_invites CASCADE;
DROP FUNCTION IF EXISTS generate_invite_code(UUID);
DROP FUNCTION IF EXISTS redeem_invite_code(TEXT, UUID);

-- Now create everything fresh and complete

-- ----------------------------------------------------------------------------
-- Step 1: Add address column to profiles
-- ----------------------------------------------------------------------------
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- ----------------------------------------------------------------------------
-- Step 2: Create neighborhood_invites table (complete this time!)
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

  CONSTRAINT code_format CHECK (code = UPPER(code))
);

-- Create indexes
CREATE INDEX idx_invites_code ON neighborhood_invites(code);
CREATE INDEX idx_invites_neighborhood ON neighborhood_invites(neighborhood_id);
CREATE INDEX idx_invites_redeemed ON neighborhood_invites(is_redeemed);
CREATE INDEX idx_invites_created_at ON neighborhood_invites(created_at DESC);

-- ----------------------------------------------------------------------------
-- Step 3: Enable RLS and policies
-- ----------------------------------------------------------------------------
ALTER TABLE neighborhood_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view unredeemed invites by code"
  ON neighborhood_invites
  FOR SELECT
  USING (is_redeemed = false OR auth.uid() = redeemed_by);

CREATE POLICY "Authenticated users can update their own invite redemption"
  ON neighborhood_invites
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND is_redeemed = false)
  WITH CHECK (redeemed_by = auth.uid());

-- Allow INSERT for testing (in production, restrict to admin users only)
CREATE POLICY "Anyone can insert invites for testing"
  ON neighborhood_invites
  FOR INSERT
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Step 4: Create generate_invite_code function
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
  SELECT name INTO v_neighborhood_name
  FROM neighborhoods
  WHERE id = p_neighborhood_id;

  IF v_neighborhood_name IS NULL THEN
    RAISE EXCEPTION 'Neighborhood not found for id: %', p_neighborhood_id;
  END IF;

  v_code_prefix := UPPER(
    REPLACE(
      REGEXP_REPLACE(v_neighborhood_name, '[^a-zA-Z0-9\s]', '', 'g'),
      ' ',
      '-'
    )
  );

  LOOP
    v_random_suffix := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT)
        FROM 1 FOR 4
      )
    );

    v_final_code := v_code_prefix || '-' || v_random_suffix;

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

-- ----------------------------------------------------------------------------
-- Step 5: Create redeem_invite_code function
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
  SELECT * INTO v_invite_record
  FROM neighborhood_invites
  WHERE code = UPPER(p_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid invite code'
    );
  END IF;

  IF v_invite_record.is_redeemed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This invite has already been used'
    );
  END IF;

  UPDATE neighborhood_invites
  SET
    is_redeemed = true,
    redeemed_by = p_user_id,
    redeemed_at = now()
  WHERE id = v_invite_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'neighborhood_id', v_invite_record.neighborhood_id,
    'invite_id', v_invite_record.id
  );
END;
$$;

-- ============================================================================
-- SUCCESS! Everything created from scratch
-- Now run TEST_invites_system.sql to verify it works
-- ============================================================================
