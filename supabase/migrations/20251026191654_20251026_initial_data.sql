-- Insert default achievements
INSERT INTO achievements (name, description, category, icon, points, rarity, requirement_type, requirement_value) VALUES
  ('First Job', 'Slutför ditt första jobb', 'efficiency', '🎯', 10, 'common', 'jobs_completed', 1),
  ('Safety Champion', 'Genomför 10 säkerhetschecklistor', 'safety', '🛡️', 50, 'rare', 'checklists_completed', 10),
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