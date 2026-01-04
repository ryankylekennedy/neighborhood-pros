-- Add foreign key relationship from recommendations to profiles
-- This allows us to join recommendations with user profile data

-- First, ensure profiles table has the right primary key
-- (it should already reference auth.users(id))

-- Add a foreign key constraint for the profile join
-- Note: We keep the existing auth.users foreign key for authentication
-- and add this one for the profile data join
ALTER TABLE recommendations
  DROP CONSTRAINT IF EXISTS recommendations_user_id_fkey;

-- Re-add the constraint to auth.users
ALTER TABLE recommendations
  ADD CONSTRAINT recommendations_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Note: In Supabase, profiles.id typically matches auth.users.id
-- So we can use the user_id to join with profiles directly in queries
