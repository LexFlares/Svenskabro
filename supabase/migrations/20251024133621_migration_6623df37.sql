-- Check if tables already exist by attempting to create them
-- If they exist, we'll get an error which is fine

-- Create user_traffic_filters table
CREATE TABLE IF NOT EXISTS user_traffic_filters (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    counties TEXT[] DEFAULT '{}',
    municipalities TEXT[] DEFAULT '{}',
    road_numbers TEXT[] DEFAULT '{}',
    event_types TEXT[] DEFAULT '{}',
    severity_filter TEXT[] DEFAULT '{}',
    notifications_enabled BOOLEAN DEFAULT true,
    sound_alerts BOOLEAN DEFAULT false,
    high_priority_only BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create notification_history table
CREATE TABLE IF NOT EXISTS notification_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100),
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_traffic_filters_user_id ON user_traffic_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_sent ON notification_history(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_event ON notification_history(event_id);

-- Enable RLS on both tables
ALTER TABLE user_traffic_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own filters" ON user_traffic_filters;
DROP POLICY IF EXISTS "Users can insert their own filters" ON user_traffic_filters;
DROP POLICY IF EXISTS "Users can update their own filters" ON user_traffic_filters;
DROP POLICY IF EXISTS "Users can delete their own filters" ON user_traffic_filters;

DROP POLICY IF EXISTS "Users can view their own notification history" ON notification_history;
DROP POLICY IF EXISTS "Users can insert their own notification history" ON notification_history;
DROP POLICY IF EXISTS "Users can update their own notification history" ON notification_history;
DROP POLICY IF EXISTS "Users can delete their own notification history" ON notification_history;

-- Create RLS policies for user_traffic_filters
CREATE POLICY "Users can view their own filters" 
ON user_traffic_filters FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own filters" 
ON user_traffic_filters FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filters" 
ON user_traffic_filters FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filters" 
ON user_traffic_filters FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for notification_history
CREATE POLICY "Users can view their own notification history" 
ON notification_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification history" 
ON notification_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification history" 
ON notification_history FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification history" 
ON notification_history FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_traffic_filters
DROP TRIGGER IF EXISTS update_user_traffic_filters_updated_at ON user_traffic_filters;
CREATE TRIGGER update_user_traffic_filters_updated_at 
BEFORE UPDATE ON user_traffic_filters 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE user_traffic_filters IS 'Stores user-specific traffic monitoring filters and notification preferences';
COMMENT ON TABLE notification_history IS 'Tracks all traffic notifications sent to users for history and analytics';