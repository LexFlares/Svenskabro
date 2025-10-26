-- First, drop the table if it exists to start fresh
DROP TABLE IF EXISTS jobb CASCADE;

-- Create the jobb table with correct structure
CREATE TABLE jobb (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bro_id TEXT,
  start_tid TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  slut_tid TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'completed',
  anteckningar TEXT,
  material TEXT,
  ansvarig_anvandare UUID,
  gps JSONB,
  bilder JSONB,
  tidsatgang DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to profiles
ALTER TABLE jobb
  ADD CONSTRAINT jobb_ansvarig_anvandare_fkey
  FOREIGN KEY (ansvarig_anvandare)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE jobb ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with correct type casting
CREATE POLICY "Users can view all jobs" 
  ON jobb FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own jobs" 
  ON jobb FOR INSERT 
  WITH CHECK (auth.uid() = ansvarig_anvandare);

CREATE POLICY "Users can update their own jobs" 
  ON jobb FOR UPDATE 
  USING (auth.uid() = ansvarig_anvandare);

CREATE POLICY "Users can delete their own jobs" 
  ON jobb FOR DELETE 
  USING (auth.uid() = ansvarig_anvandare);

-- Create indexes for performance
CREATE INDEX idx_jobb_ansvarig ON jobb(ansvarig_anvandare);
CREATE INDEX idx_jobb_bro_id ON jobb(bro_id);
CREATE INDEX idx_jobb_created_at ON jobb(created_at DESC);