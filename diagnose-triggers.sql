-- Run this in Supabase Dashboard > SQL Editor to diagnose the issue

-- 1. Check for triggers on auth.users
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 2. Check profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check for functions related to user creation
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%user%' OR routine_name LIKE '%profile%';

-- 4. Test creating a profile manually to see what's required
SELECT
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND is_nullable = 'NO'
  AND column_default IS NULL;
