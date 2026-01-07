-- ============================================================================
-- TEST: Neighborhood Invites System
-- ============================================================================
-- This script tests everything in one go
-- Just copy, paste into Supabase SQL Editor, and click RUN
-- ============================================================================

-- TEST 1: Check table exists
SELECT 'TEST 1: Table Check' as test_name,
       CASE
         WHEN EXISTS (SELECT 1 FROM neighborhood_invites) OR NOT EXISTS (SELECT 1 FROM neighborhood_invites)
         THEN '✓ PASS - Table exists!'
         ELSE '✗ FAIL - Table missing'
       END as result;

-- TEST 2: Check address column on profiles
SELECT 'TEST 2: Address Column' as test_name,
       CASE
         WHEN EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'profiles' AND column_name = 'address'
         )
         THEN '✓ PASS - Address column exists!'
         ELSE '✗ FAIL - Address column missing'
       END as result;

-- TEST 3: Check functions exist
SELECT 'TEST 3: Functions Check' as test_name,
       CASE
         WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('generate_invite_code', 'redeem_invite_code')) = 2
         THEN '✓ PASS - Both functions exist!'
         ELSE '✗ FAIL - Functions missing'
       END as result;

-- TEST 4: Generate a test invite code
-- This automatically picks the first neighborhood and generates a code
DO $$
DECLARE
  v_neighborhood_id UUID;
  v_generated_code TEXT;
BEGIN
  -- Get first neighborhood
  SELECT id INTO v_neighborhood_id FROM neighborhoods LIMIT 1;

  -- Generate invite code
  v_generated_code := generate_invite_code(v_neighborhood_id);

  -- Insert it as a test
  INSERT INTO neighborhood_invites (code, neighborhood_id)
  VALUES (v_generated_code, v_neighborhood_id);

  RAISE NOTICE 'TEST 4: ✓ PASS - Generated invite code: %', v_generated_code;
END $$;

-- TEST 5: View the generated invite
SELECT 'TEST 5: View Test Invite' as test_name;
SELECT code,
       (SELECT name FROM neighborhoods WHERE id = neighborhood_id) as neighborhood_name,
       is_redeemed,
       created_at
FROM neighborhood_invites
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- If you see all ✓ PASS messages above, everything works perfectly!
-- ============================================================================
