-- Create Broar (Bridges) table
CREATE TABLE IF NOT EXISTS broar (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  description TEXT,
  ta_plan_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Jobb (Jobs) table with foreign key to Broar
CREATE TABLE IF NOT EXISTS jobb (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bro_id TEXT NOT NULL REFERENCES broar(id) ON DELETE CASCADE,
  start_tid TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  slut_tid TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pågående' CHECK (status IN ('pågående', 'färdigt', 'rapporterat')),
  ansvarig_anvandare TEXT NOT NULL,
  anteckningar TEXT,
  material TEXT,
  tidsatgang FLOAT,
  bilder JSONB DEFAULT '[]'::jsonb,
  gps JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE broar ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobb ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Broar (public read, authenticated write)
CREATE POLICY "Anyone can view bridges" ON broar FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert bridges" ON broar FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update bridges" ON broar FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete bridges" ON broar FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for Jobb (users can only see/edit their own jobs, admins can see all)
CREATE POLICY "Users can view their own jobs" ON jobb FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own jobs" ON jobb FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON jobb FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own jobs" ON jobb FOR DELETE USING (auth.uid() = user_id);

-- Insert sample bridge data
INSERT INTO broar (id, name, x, y, description) VALUES
  ('12-451-1', 'Bro 12-451-1', 13.015378, 55.48004, 'Bro över allmän väg vid Vellinge n.'),
  ('25-471-1', 'Bro 25-471-1', 22.739592, 68.352244, 'Bro över Lainattajärvis utlopp.'),
  ('16-784-1', 'Bro 16-784-1', 13.508381, 58.239111, 'Bro över Utterbäcken i Ugglum.'),
  ('6-695-1', 'Bro 6-695-1', 14.156968, 57.758285, 'Bro vid Ljungarum, Jönköping.')
ON CONFLICT (id) DO NOTHING;