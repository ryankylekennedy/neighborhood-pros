-- ============================================================================
-- FIX: Update RLS policy to allow viewing unredeemed invites without auth
-- ============================================================================
-- This allows the redeem function to work during signup when the user
-- isn't authenticated yet
-- ============================================================================

-- Drop the old policy
DROP POLICY IF EXISTS "Anyone can view unredeemed invites by code" ON neighborhood_invites;

-- Create new policy that allows viewing unredeemed invites OR your own redeemed invites
CREATE POLICY "Anyone can view unredeemed invites"
  ON neighborhood_invites
  FOR SELECT
  USING (
    is_redeemed = false
    OR auth.uid() = redeemed_by
  );

-- Note: Unredeemed invites are viewable by anyone (even non-authenticated users)
-- Redeemed invites are only viewable by the person who redeemed them
