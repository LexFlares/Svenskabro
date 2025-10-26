-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Call Sessions Table
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video', 'screen_share')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WebRTC Signaling Table
CREATE TABLE IF NOT EXISTS webrtc_signaling (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enhanced Group Messages Table (with media support)
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES work_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'voice', 'video')),
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_mime_type TEXT,
  reply_to UUID REFERENCES group_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Message Read Receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Traffic Incidents Table (for notification system)
CREATE TABLE IF NOT EXISTS traffic_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_type TEXT NOT NULL CHECK (incident_type IN ('accident', 'roadwork', 'congestion', 'weather', 'closure', 'hazard')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Subscriptions
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('traffic', 'emergency', 'work_group', 'chat')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_km INTEGER DEFAULT 50,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_callee ON call_sessions(callee_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_started ON call_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_call ON webrtc_signaling(call_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_to_user ON webrtc_signaling(to_user_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_created ON webrtc_signaling(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_user ON group_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_deleted ON group_messages(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_traffic_incidents_location ON traffic_incidents USING gist(point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_status ON traffic_incidents(status);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_severity ON traffic_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_created ON traffic_incidents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_subs_user ON notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_subs_enabled ON notification_subscriptions(enabled) WHERE enabled = true;

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
CREATE TRIGGER update_call_sessions_updated_at
  BEFORE UPDATE ON call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_messages_updated_at
  BEFORE UPDATE ON group_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traffic_incidents_updated_at
  BEFORE UPDATE ON traffic_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_subscriptions_updated_at
  BEFORE UPDATE ON notification_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signaling ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Call Sessions
CREATE POLICY "Users can view their own call sessions"
  ON call_sessions FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can insert their own call sessions"
  ON call_sessions FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own call sessions"
  ON call_sessions FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- RLS Policies for WebRTC Signaling
CREATE POLICY "Users can view signals directed to them"
  ON webrtc_signaling FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can insert their own signals"
  ON webrtc_signaling FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- RLS Policies for Group Messages
CREATE POLICY "Work group members can view messages"
  ON group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_group_members
      WHERE work_group_members.group_id = group_messages.group_id
      AND work_group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Work group members can insert messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_group_members
      WHERE work_group_members.group_id = group_messages.group_id
      AND work_group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON group_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for Traffic Incidents
CREATE POLICY "Anyone can view active traffic incidents"
  ON traffic_incidents FOR SELECT
  USING (status = 'active' OR status = 'resolved');

CREATE POLICY "Users can report traffic incidents"
  ON traffic_incidents FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can update their own reported incidents"
  ON traffic_incidents FOR UPDATE
  USING (auth.uid() = reported_by);

-- RLS Policies for Notification Subscriptions
CREATE POLICY "Users can manage their own subscriptions"
  ON notification_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Grant Permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for Documentation
COMMENT ON TABLE call_sessions IS 'Stores voice and video call sessions between users';
COMMENT ON TABLE webrtc_signaling IS 'Stores WebRTC signaling data for peer connection establishment';
COMMENT ON TABLE group_messages IS 'Enhanced group chat messages with media support';
COMMENT ON TABLE traffic_incidents IS 'Traffic incidents for real-time notifications';
COMMENT ON TABLE notification_subscriptions IS 'User notification preferences and geo-based subscriptions';
