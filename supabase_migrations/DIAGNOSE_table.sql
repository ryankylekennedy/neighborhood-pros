-- ============================================================================
-- DIAGNOSE: Check what's actually in the neighborhood_invites table
-- ============================================================================

-- Show all columns that currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'neighborhood_invites'
ORDER BY ordinal_position;

-- ============================================================================
-- Copy the results and show them to me so we can fix it properly
-- ============================================================================
