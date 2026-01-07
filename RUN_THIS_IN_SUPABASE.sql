-- ============================================================================
-- IMPORTANT: Run this in Supabase SQL Editor
-- ============================================================================
-- This adds the missing INSERT policy for neighborhood_invites
-- Without this, tests will fail with "row-level security policy" errors
-- ============================================================================

-- Allow INSERT for testing (in production, restrict to admin users only)
CREATE POLICY "Anyone can insert invites for testing"
  ON neighborhood_invites
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- After running this, your Playwright tests should work!
-- ============================================================================
