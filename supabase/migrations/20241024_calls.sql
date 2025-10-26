CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_id UUID REFERENCES profiles(id),
  callee_id UUID REFERENCES profiles(id),
  call_type TEXT DEFAULT 'voice',
  status TEXT DEFAULT 'ringing',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_calls_caller ON call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON call_sessions(callee_id);

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS calls_policy ON call_sessions
  FOR ALL USING (auth.uid() IN (caller_id, callee_id));
