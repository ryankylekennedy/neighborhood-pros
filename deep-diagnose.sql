-- Deep Diagnostic - Run this in Supabase SQL Editor
-- This will show us EXACTLY what's blocking user creation

-- 1. Check ALL triggers on auth.users (not just our custom ones)
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  proname AS function_name,
  prosrc AS function_source
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- 2. Check if the profiles table exists and its structure
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check for any constraints on profiles that might be failing
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'profiles'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 4. Try to manually create a test user to see the exact error
-- This will show us what's actually failing
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Try to insert a test profile directly
  INSERT INTO public.profiles (id, full_name)
  VALUES (gen_random_uuid(), 'Manual Test User')
  RETURNING id INTO test_user_id;

  RAISE NOTICE 'Successfully created test profile with ID: %', test_user_id;

  -- Clean up
  DELETE FROM public.profiles WHERE id = test_user_id;
  RAISE NOTICE 'Cleaned up test profile';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating test profile: %', SQLERRM;
END $$;
