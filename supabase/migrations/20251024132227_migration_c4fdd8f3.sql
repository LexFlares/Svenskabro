-- Create user_traffic_filters table to store user filter preferences
CREATE TABLE IF NOT EXISTS user_traffic_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  counties TEXT[] DEFAULT '{}',
  municipalities TEXT[] DEFAULT '{}',
  road_numbers TEXT[] DEFAULT '{}',
  event_types TEXT[] DEFAULT '{}',
  severity_filter TEXT[] DEFAULT '{}',
  notifications_enabled BOOLEAN DEFAULT true,
  sound_alerts BOOLEAN DEFAULT true,
  high_priority_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_traffic_filters ENABLE ROW LEVEL SECURITY;

-- Create policies for user_traffic_filters
CREATE POLICY "Users can view their own filters" ON user_traffic_filters 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own filters" ON user_traffic_filters 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filters" ON user_traffic_filters 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filters" ON user_traffic_filters 
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_traffic_filters_user_id ON user_traffic_filters(user_id);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_traffic_filters_updated_at ON user_traffic_filters;

CREATE TRIGGER update_user_traffic_filters_updated_at
  BEFORE UPDATE ON user_traffic_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();