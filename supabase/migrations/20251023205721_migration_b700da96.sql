-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS ice_candidates CASCADE;
DROP TABLE IF EXISTS webrtc_calls CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Create chat_messages table for Supabase-based realtime chat
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_name TEXT NOT NULL,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  encryption_key TEXT,
  read BOOLEAN DEFAULT false,
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_chat_messages_users ON chat_messages(from_user_id, to_user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see messages they're part of
CREATE POLICY "Users can view their own messages" ON chat_messages 
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "Users can insert messages" ON chat_messages 
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their messages" ON chat_messages 
  FOR UPDATE USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "Users can delete their own messages" ON chat_messages 
  FOR DELETE USING (auth.uid() = from_user_id);