-- ============================================================================
-- Fix: Add INSERT policy for neighborhood_invites
-- ============================================================================
-- This allows INSERT operations on neighborhood_invites table
-- For production, this should be restricted to admin users only
-- For testing, we allow authenticated users to insert invites
-- ============================================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can insert invites for testing" ON neighborhood_invites;

-- Create policy to allow INSERT (for testing - in production, restrict to admins)
CREATE POLICY "Anyone can insert invites for testing"
  ON neighborhood_invites
  FOR INSERT
  WITH CHECK (true);

-- Comment explaining this is a temporary testing policy
COMMENT ON POLICY "Anyone can insert invites for testing" ON neighborhood_invites
IS 'Temporary policy for testing - in production, restrict to admin users only';
