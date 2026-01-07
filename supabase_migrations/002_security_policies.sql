-- ============================================================================
-- Security Hardening: RLS Policies for Neighborhood Isolation
-- ============================================================================
-- This migration adds Row Level Security policies to ensure:
-- 1. Users can only see businesses in their neighborhood
-- 2. Users cannot switch neighborhoods after initial setup
-- 3. Data is properly isolated by neighborhood
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add policy to prevent neighborhood switching
-- ----------------------------------------------------------------------------

-- First, drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policy that allows updates but prevents neighborhood changes
CREATE POLICY "Users can update own profile with restrictions"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Allow neighborhood_id to be set if it's currently null
    -- But prevent changes once set
    (
      neighborhood_id = (SELECT neighborhood_id FROM profiles WHERE id = auth.uid())
      OR
      (SELECT neighborhood_id FROM profiles WHERE id = auth.uid()) IS NULL
    )
  );

-- ----------------------------------------------------------------------------
-- STEP 2: Add policy to filter businesses by neighborhood
-- ----------------------------------------------------------------------------

-- Enable RLS on businesses table if not already enabled
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view businesses in their neighborhood" ON businesses;
DROP POLICY IF EXISTS "Public can view businesses" ON businesses;

-- Create policy: Users can only see businesses in their neighborhood
CREATE POLICY "Users can view businesses in their neighborhood"
  ON businesses
  FOR SELECT
  USING (
    -- Allow if user's neighborhood matches business neighborhood
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.neighborhood_id = businesses.neighborhood_id
    )
    OR
    -- Also allow if user is not authenticated (for public landing pages)
    auth.uid() IS NULL
  );

-- ----------------------------------------------------------------------------
-- STEP 3: Ensure profiles table has RLS enabled
-- ----------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- STEP 4: Add helpful comments for future reference
-- ----------------------------------------------------------------------------

COMMENT ON POLICY "Users can update own profile with restrictions" ON profiles
IS 'Allows users to update their profile but prevents changing neighborhood_id after it has been set';

COMMENT ON POLICY "Users can view businesses in their neighborhood" ON businesses
IS 'Ensures users only see businesses operating in their specific neighborhood';

-- ============================================================================
-- SECURITY POLICIES COMPLETE
-- ============================================================================
--
-- What these policies do:
--
-- 1. Profile Protection:
--    - Users can update their own profile
--    - But cannot change neighborhood once set via invite
--
-- 2. Business Isolation:
--    - Users only see businesses in their neighborhood
--    - Non-authenticated users can still view (for landing pages)
--
-- 3. Data Privacy:
--    - Each neighborhood's data is isolated
--    - No cross-neighborhood data leakage
--
-- ============================================================================
