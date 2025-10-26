-- Fix messages table structure and RLS policies

-- 1. Drop existing messages table (we'll recreate it properly)
DROP TABLE IF EXISTS messages CASCADE;

-- 2. Create messages table with correct UUID foreign keys
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  group_id text,
  content text NOT NULL,
  encrypted boolean DEFAULT true,
  delivered boolean DEFAULT false,
  read boolean DEFAULT false,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Create correct RLS policies using auth.uid()
CREATE POLICY "Users can insert their own messages" 
ON messages FOR INSERT 
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view their own messages" 
ON messages FOR SELECT 
USING (
  sender_id = auth.uid() 
  OR receiver_id = auth.uid()
  OR (group_id IS NOT NULL AND group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
  ))
);

CREATE POLICY "Users can update their received messages" 
ON messages FOR UPDATE 
USING (
  receiver_id = auth.uid()
  OR (group_id IS NOT NULL AND group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
  ))
);

-- 5. Create indexes for performance
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- 6. Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;