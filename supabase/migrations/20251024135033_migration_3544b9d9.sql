-- Add ta_plan_url to bridges table
ALTER TABLE "public"."bridges" ADD COLUMN "ta_plan_url" TEXT NULL;

-- Add type and uploaded_at to documents table
ALTER TABLE "public"."documents" ADD COLUMN "type" TEXT NULL;
ALTER TABLE "public"."documents" ADD COLUMN "uploaded_at" TIMESTAMPTZ NULL;

-- Add synced to deviations table
ALTER TABLE "public"."deviations" ADD COLUMN "synced" BOOLEAN DEFAULT FALSE;

-- Add synced and weather_data to jobb table
ALTER TABLE "public"."jobb" ADD COLUMN "synced" BOOLEAN DEFAULT FALSE;
ALTER TABLE "public"."jobb" ADD COLUMN "weather_data" JSONB NULL;

-- Create table for user traffic filters
CREATE TABLE IF NOT EXISTS public.user_traffic_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    counties TEXT[] DEFAULT ARRAY[]::TEXT[],
    municipalities TEXT[] DEFAULT ARRAY[]::TEXT[],
    road_numbers TEXT[] DEFAULT ARRAY[]::TEXT[],
    event_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    severity_filter TEXT[] DEFAULT ARRAY[]::TEXT[],
    notifications_enabled BOOLEAN DEFAULT true,
    sound_alerts BOOLEAN DEFAULT false,
    high_priority_only BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_traffic_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own filters" ON public.user_traffic_filters FOR ALL USING (auth.uid() = user_id);

-- Create table for notification history
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id VARCHAR(255),
    event_type VARCHAR(100),
    message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notification history" ON public.notification_history FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_filters_user_id ON public.user_traffic_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON public.notification_history(user_id);