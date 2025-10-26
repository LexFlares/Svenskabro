/*
  # Revolutionary Features Migration

  ## Overview
  This migration adds comprehensive support for next-generation features including:
  - Geofencing and safety zones
  - Safety checklists
  - Equipment management
  - Gamification and achievements
  - Predictive maintenance data
  - 3D model metadata
  - AI analysis results

  ## New Tables

  ### geofences
  - Geographical safety zones with automated alerts
  - Supports danger, restricted, work, and safety types
  - Real-time monitoring and alerting

  ### geofence_events
  - Logs when users enter/exit geofences
  - Enables safety compliance tracking

  ### safety_checklists
  - Mandatory pre-job safety checks
  - Photo documentation support
  - Category-based organization

  ### equipment
  - Tools, vehicles, and machinery tracking
  - QR code/RFID integration ready
  - Maintenance scheduling

  ### equipment_assignments
  - Track who has what equipment
  - Check-in/check-out workflow

  ### achievements
  - Gamification system
  - Rewards for quality, safety, and efficiency

  ### user_achievements
  - Track earned achievements per user
  - Progress tracking for skill development

  ### bridge_models_3d
  - Metadata for 3D bridge reconstructions
  - Links to photogrammetry data
  - Digital twin sensor integration

  ### ai_analyses
  - Store AI vision analysis results
  - Track detected issues and recommendations
  - Historical trend analysis

  ### predictive_maintenance
  - ML-based predictions for bridge health
  - Risk scoring and scheduling recommendations

  ## Security
  All tables have RLS enabled with appropriate policies
*/

-- ==============================================================================
-- GEOFENCING AND SAFETY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lon NUMERIC NOT NULL,
  radius NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('danger', 'restricted', 'work', 'safety')),
  alert_message TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active geofences" ON geofences
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage geofences" ON geofences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TABLE IF NOT EXISTS geofence_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fence_id UUID REFERENCES geofences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own geofence events" ON geofence_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert geofence events" ON geofence_events
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- SAFETY CHECKLISTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS safety_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobb(id) ON DELETE CASCADE,
  bridge_id TEXT REFERENCES bridges(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  completion_percentage INTEGER DEFAULT 0,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE safety_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklists" ON safety_checklists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create checklists" ON safety_checklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklists" ON safety_checklists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all checklists" ON safety_checklists
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ==============================================================================
-- EQUIPMENT MANAGEMENT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tool', 'vehicle', 'machinery', 'safety')),
  serial_number TEXT UNIQUE,
  qr_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  last_maintenance DATE,
  next_maintenance DATE,
  purchase_date DATE,
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view equipment" ON equipment
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can use equipment" ON equipment
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage equipment" ON equipment
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TABLE IF NOT EXISTS equipment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobb(id) ON DELETE SET NULL,
  checked_out_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ,
  condition_at_checkout TEXT,
  condition_at_checkin TEXT,
  notes TEXT
);

ALTER TABLE equipment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments" ON equipment_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create assignments" ON equipment_assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments" ON equipment_assignments
  FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================================================
-- GAMIFICATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('quality', 'safety', 'efficiency', 'teamwork', 'innovation')),
  icon TEXT,
  points INTEGER DEFAULT 10,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" ON achievements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can award achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view public achievements" ON user_achievements
  FOR SELECT USING (completed = true);

-- ==============================================================================
-- 3D MODELS AND DIGITAL TWINS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bridge_models_3d (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bridge_id TEXT REFERENCES bridges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vertex_count INTEGER,
  face_count INTEGER,
  file_url TEXT,
  format TEXT CHECK (format IN ('obj', 'stl', 'gltf')),
  health_score INTEGER DEFAULT 100,
  last_analysis TIMESTAMPTZ,
  sensor_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bridge_models_3d ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view 3D models" ON bridge_models_3d
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create models" ON bridge_models_3d
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage models" ON bridge_models_3d
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ==============================================================================
-- AI ANALYSIS RESULTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bridge_id TEXT REFERENCES bridges(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobb(id) ON DELETE SET NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('vision', 'predictive', 'structural')),
  image_url TEXT,
  detected_issues JSONB,
  overall_condition TEXT,
  recommended_actions TEXT[],
  estimated_cost NUMERIC,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'immediate')),
  confidence NUMERIC,
  model_version TEXT,
  analyzed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view analyses" ON ai_analyses
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create analyses" ON ai_analyses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ==============================================================================
-- PREDICTIVE MAINTENANCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS predictive_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bridge_id TEXT REFERENCES bridges(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL,
  predicted_issues JSONB,
  recommended_inspection_date DATE,
  estimated_cost_min NUMERIC,
  estimated_cost_max NUMERIC,
  factors_influencing TEXT[],
  prediction_confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE predictive_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view predictions" ON predictive_maintenance
  FOR SELECT USING (true);

CREATE POLICY "System can create predictions" ON predictive_maintenance
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_geofences_location ON geofences(lat, lon);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(active);
CREATE INDEX IF NOT EXISTS idx_geofence_events_user ON geofence_events(user_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_timestamp ON geofence_events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_safety_checklists_job ON safety_checklists(job_id);
CREATE INDEX IF NOT EXISTS idx_safety_checklists_user ON safety_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_checklists_status ON safety_checklists(status);

CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_user ON equipment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_active ON equipment_assignments(checked_in_at) WHERE checked_in_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);

CREATE INDEX IF NOT EXISTS idx_bridge_models_bridge ON bridge_models_3d(bridge_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_bridge ON ai_analyses(bridge_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created ON ai_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_bridge ON predictive_maintenance(bridge_id);
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_risk ON predictive_maintenance(risk_score DESC);

-- ==============================================================================
-- INITIAL DATA
-- ==============================================================================

-- Insert default achievements
INSERT INTO achievements (name, description, category, icon, points, rarity, requirement_type, requirement_value) VALUES
  ('First Job', 'Slutför ditt första jobb', 'efficiency', '🎯', 10, 'common', 'jobs_completed', 1),
  ('Safety Champion', 'Genomför 10 säkerhetscheck listor', 'safety', '🛡️', 50, 'rare', 'checklists_completed', 10),
  ('Bridge Inspector', 'Inspektera 50 broar', 'quality', '🌉', 100, 'epic', 'bridges_inspected', 50),
  ('Team Player', 'Samarbeta i 20 arbetsgrupper', 'teamwork', '🤝', 75, 'rare', 'team_collaborations', 20),
  ('Innovation Leader', 'Använd AI-analys 25 gånger', 'innovation', '🚀', 150, 'legendary', 'ai_analyses_used', 25),
  ('Early Bird', 'Starta 5 jobb före kl 07:00', 'efficiency', '🌅', 30, 'common', 'early_starts', 5),
  ('Perfectionist', 'Få 100% på 5 säkerhetschecklistor', 'quality', '✨', 100, 'epic', 'perfect_checklists', 5),
  ('Marathon Runner', 'Arbeta 30 dagar i rad', 'efficiency', '🏃', 200, 'legendary', 'consecutive_days', 30)
ON CONFLICT (name) DO NOTHING;

-- Insert sample equipment
INSERT INTO equipment (name, category, serial_number, status, condition) VALUES
  ('Kompressor Atlas Copco', 'machinery', 'AC-2024-001', 'available', 'excellent'),
  ('Hjullastare Volvo L60H', 'vehicle', 'VLV-2023-042', 'available', 'good'),
  ('Betongfräs Husqvarna', 'tool', 'HSQ-2024-015', 'available', 'excellent'),
  ('Säkerhetssele 5-punkt', 'safety', 'SAFE-2024-100', 'available', 'excellent'),
  ('Laser-avståndsmätare', 'tool', 'LAS-2024-033', 'available', 'good')
ON CONFLICT (serial_number) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_checklists_updated_at BEFORE UPDATE ON safety_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bridge_models_3d_updated_at BEFORE UPDATE ON bridge_models_3d
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
