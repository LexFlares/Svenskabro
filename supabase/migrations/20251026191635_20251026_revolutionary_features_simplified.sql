-- Revolutionary Features Migration (Simplified)
-- Creates all new tables without dependencies on existing tables

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
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active geofences" ON geofences
  FOR SELECT USING (active = true);

CREATE TABLE IF NOT EXISTS geofence_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fence_id UUID REFERENCES geofences(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view geofence events" ON geofence_events
  FOR SELECT USING (true);

CREATE POLICY "System can insert geofence events" ON geofence_events
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- SAFETY CHECKLISTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS safety_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT,
  bridge_id TEXT,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  completion_percentage INTEGER DEFAULT 0,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE safety_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view checklists" ON safety_checklists
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create checklists" ON safety_checklists
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update checklists" ON safety_checklists
  FOR UPDATE USING (true);

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

CREATE POLICY "Anyone can manage equipment" ON equipment
  FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS equipment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  job_id TEXT,
  checked_out_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ,
  condition_at_checkout TEXT,
  condition_at_checkin TEXT,
  notes TEXT
);

ALTER TABLE equipment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assignments" ON equipment_assignments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage assignments" ON equipment_assignments
  FOR ALL USING (true);

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

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "System can award achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 3D MODELS AND DIGITAL TWINS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bridge_models_3d (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bridge_id TEXT,
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

CREATE POLICY "Anyone can create models" ON bridge_models_3d
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- AI ANALYSIS RESULTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bridge_id TEXT,
  job_id TEXT,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('vision', 'predictive', 'structural')),
  image_url TEXT,
  detected_issues JSONB,
  overall_condition TEXT,
  recommended_actions TEXT[],
  estimated_cost NUMERIC,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'immediate')),
  confidence NUMERIC,
  model_version TEXT,
  analyzed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view analyses" ON ai_analyses
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create analyses" ON ai_analyses
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- PREDICTIVE MAINTENANCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS predictive_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bridge_id TEXT,
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

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);

CREATE INDEX IF NOT EXISTS idx_bridge_models_bridge ON bridge_models_3d(bridge_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_bridge ON ai_analyses(bridge_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created ON ai_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_bridge ON predictive_maintenance(bridge_id);
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_risk ON predictive_maintenance(risk_score DESC);