-- ============================================================================
-- FIX: Add Missing Functions and Policies
-- ============================================================================
-- This adds only the missing pieces (functions, policies, address column)
-- Safe to run even if some parts already exist
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Add address column to profiles (safe if already exists)
-- ----------------------------------------------------------------------------
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- ----------------------------------------------------------------------------
-- Create function to generate invite codes
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
    -- Generate random 4-character suffix
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

-- ----------------------------------------------------------------------------
-- Create function to redeem invite codes
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

-- ----------------------------------------------------------------------------
-- Enable RLS and add policies (safe to run if already exists)
-- ----------------------------------------------------------------------------
ALTER TABLE neighborhood_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Anyone can view unredeemed invites by code" ON neighborhood_invites;
CREATE POLICY "Anyone can view unredeemed invites by code"
  ON neighborhood_invites
  FOR SELECT
  USING (is_redeemed = false OR auth.uid() = redeemed_by);

DROP POLICY IF EXISTS "Authenticated users can update their own invite redemption" ON neighborhood_invites;
CREATE POLICY "Authenticated users can update their own invite redemption"
  ON neighborhood_invites
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND is_redeemed = false)
  WITH CHECK (redeemed_by = auth.uid());

-- ============================================================================
-- DONE! Now run the TEST file to verify everything works
-- ============================================================================
