import { supabase } from '../lib/supabase';

export async function getWords() {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching words:', error);
    return [];
  }

  return data || [];
}
