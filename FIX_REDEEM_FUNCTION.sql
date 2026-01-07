-- ============================================================================
-- FIX: Update redeem_invite_code function to use SECURITY INVOKER
-- ============================================================================
-- This ensures the function runs with the caller's permissions,
-- allowing it to see unredeemed invites through the RLS policy
-- ============================================================================

CREATE OR REPLACE FUNCTION redeem_invite_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER  -- This is the key change!
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
