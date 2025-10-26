-- ============================================
-- FIX ID COLUMN TO AUTO-GENERATE UUIDs
-- ============================================

-- Add default UUID generation to id column
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the change
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'id';