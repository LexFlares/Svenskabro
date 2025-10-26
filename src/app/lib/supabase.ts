import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vxndfvbuqpexitphkece.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4bmRmdmJ1cXBleGl0cGhrZWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDIzNzgsImV4cCI6MjA3NjExODM3OH0.FRi7kz7SuTJcHlHdsx3DjwKUhZy7Obd8NByWl4lYa-k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
