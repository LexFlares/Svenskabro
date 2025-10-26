-- PHASE 1: CRITICAL SECURITY FIXES
-- Fix RLS policies for all tables

-- 1. PROFILES - Secure but allow viewing
DROP POLICY IF EXISTS "Allow all for profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Anyone can view profiles" ON profiles 
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Only admins can delete profiles" ON profiles 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. WORK_GROUPS - Only members can access
DROP POLICY IF EXISTS "Allow all for work_groups" ON work_groups;

CREATE POLICY "Anyone can view work groups" ON work_groups 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups" ON work_groups 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups" ON work_groups 
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" ON work_groups 
  FOR DELETE USING (auth.uid() = created_by);

-- 3. WORK_GROUP_MEMBERS - Secure membership
DROP POLICY IF EXISTS "Allow all for work_group_members" ON work_group_members;

CREATE POLICY "Members can view group membership" ON work_group_members 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM work_group_members wgm 
      WHERE wgm.group_id = work_group_members.group_id 
      AND wgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups" ON work_group_members 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON work_group_members 
  FOR DELETE USING (auth.uid() = user_id);

-- 4. DEVIATIONS - Secure deviation access
DROP POLICY IF EXISTS "Allow all for deviations" ON deviations;

CREATE POLICY "Anyone can view deviations" ON deviations 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create deviations" ON deviations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deviations" ON deviations 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deviations" ON deviations 
  FOR DELETE USING (auth.uid() = user_id);

-- 5. DOCUMENTS - Secure document access
DROP POLICY IF EXISTS "Allow all for documents" ON documents;

CREATE POLICY "Anyone can view documents" ON documents 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create documents" ON documents 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Document creators can update" ON documents 
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Document creators can delete" ON documents 
  FOR DELETE USING (auth.uid() = created_by);

-- 6. BRIDGES - Keep existing good policies but ensure consistency
DROP POLICY IF EXISTS "Allow all for bridges" ON bridges;

CREATE POLICY "Anyone can view bridges" ON bridges 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert bridges" ON bridges 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update bridges" ON bridges 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete bridges" ON bridges 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. CHAT_MESSAGES - Secure chat (keep existing good structure)
DROP POLICY IF EXISTS "Allow all for chat_messages" ON chat_messages;

CREATE POLICY "Users can view their own chats" ON chat_messages 
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON chat_messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update message status" ON chat_messages 
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Senders can delete their messages" ON chat_messages 
  FOR DELETE USING (auth.uid() = sender_id);