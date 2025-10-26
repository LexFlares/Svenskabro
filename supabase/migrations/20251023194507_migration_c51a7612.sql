-- ============================================================================
-- LEXHUB DATABASE SCHEMA FIX - COMPLETE SOLUTION
-- ============================================================================
-- This fixes the TEXT/UUID mismatch and creates proper auto-profile trigger
-- ============================================================================

-- STEP 1: Drop policies that depend on group_members.user_id
-- ============================================================================

DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;

-- STEP 2: Clear existing data (development only)
-- ============================================================================

TRUNCATE TABLE group_members CASCADE;

-- STEP 3: Drop old user_id column and create new UUID column
-- ============================================================================

ALTER TABLE group_members DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE group_members ADD COLUMN user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE;

-- STEP 4: Recreate constraints and indexes
-- ============================================================================

-- Unique constraint: one user per group
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_user_id_key;
ALTER TABLE group_members ADD CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id);

-- Indexes for performance
DROP INDEX IF EXISTS idx_group_members_user;
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- STEP 5: Recreate RLS policies for group_members
-- ============================================================================

-- Users can join groups (insert their own membership)
CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can view all group members
CREATE POLICY "Users can view group members" ON group_members
  FOR SELECT
  USING (true);

-- STEP 6: Recreate RLS policies for messages (with proper UUID logic)
-- ============================================================================

-- Users can view their own messages or group messages they're part of
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT
  USING (
    sender_id = auth.uid() 
    OR receiver_id = auth.uid() 
    OR (
      group_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_members.group_id = messages.group_id 
        AND group_members.user_id = auth.uid()
      )
    )
  );

-- Users can update messages they received or group messages they're part of
CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE
  USING (
    receiver_id = auth.uid()
    OR (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = messages.group_id
        AND group_members.user_id = auth.uid()
      )
    )
  );

-- STEP 7: Create automatic profile creation trigger
-- ============================================================================

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 8: Grant necessary permissions
-- ============================================================================

-- Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify group_members schema is correct
DO $$
DECLARE
  user_id_type TEXT;
BEGIN
  SELECT data_type INTO user_id_type
  FROM information_schema.columns
  WHERE table_name = 'group_members' AND column_name = 'user_id';
  
  IF user_id_type = 'uuid' THEN
    RAISE NOTICE '✅ group_members.user_id is now UUID';
  ELSE
    RAISE WARNING '❌ group_members.user_id is still %', user_id_type;
  END IF;
END $$;

-- Verify trigger exists
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Auto-profile trigger created successfully';
  ELSE
    RAISE WARNING '❌ Auto-profile trigger not found';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'LexHub Database Schema Fix Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ group_members.user_id → UUID';
  RAISE NOTICE '✅ RLS policies recreated';
  RAISE NOTICE '✅ Auto-profile trigger created';
  RAISE NOTICE '✅ Chat system ready for testing';
  RAISE NOTICE '========================================';
END $$;