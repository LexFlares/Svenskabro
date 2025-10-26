-- Create user_presence table for online status
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can view presence, only owner can update
CREATE POLICY "Anyone can view presence" ON user_presence 
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON user_presence 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their presence" ON user_presence 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create webrtc_calls table for call signaling
CREATE TABLE webrtc_calls (
  id TEXT PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer JSONB,
  answer JSONB,
  status TEXT NOT NULL DEFAULT 'ringing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_webrtc_calls_users ON webrtc_calls(from_user_id, to_user_id);
CREATE INDEX idx_webrtc_calls_status ON webrtc_calls(status);

-- Enable RLS
ALTER TABLE webrtc_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see calls they're part of
CREATE POLICY "Users can view their calls" ON webrtc_calls 
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "Users can create calls" ON webrtc_calls 
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their calls" ON webrtc_calls 
  FOR UPDATE USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "Users can delete their calls" ON webrtc_calls 
  FOR DELETE USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

-- Create ice_candidates table for WebRTC ICE candidates
CREATE TABLE ice_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id TEXT NOT NULL,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_ice_candidates_call_id ON ice_candidates(call_id);

-- Enable RLS
ALTER TABLE ice_candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view candidates for their calls" ON ice_candidates 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM webrtc_calls 
      WHERE webrtc_calls.id = ice_candidates.call_id 
      AND (webrtc_calls.from_user_id = auth.uid() OR webrtc_calls.to_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert candidates" ON ice_candidates 
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);