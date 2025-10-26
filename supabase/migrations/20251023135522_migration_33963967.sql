-- ============================================
-- REMOVE FOREIGN KEY CONSTRAINT
-- ============================================

-- Drop the foreign key constraint that requires auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Verify constraint is removed
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' AND constraint_type = 'FOREIGN KEY';