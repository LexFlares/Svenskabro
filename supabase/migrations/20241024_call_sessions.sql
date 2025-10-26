-- Call Sessions Table
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_id UUID REFERENCES profiles(id),
  callee_id UUID REFERENCES profiles(id),
  call_type TEXT CHECK (call_type IN ('voice', 'video')),
  status TEXT CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_callee ON call_sessions(callee_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);

-- Row Level Security
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY `Users can view their own calls`
  ON call_sessions FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY `Users can create call sessions`
  ON call_sessions FOR INSERT
  WITH CHECK (auth.uid() = caller_id);