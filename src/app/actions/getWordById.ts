import { supabase } from '../lib/supabase';

export async function getWordById(id: string) {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching word by id:', error);
    return null;
  }

  return data;
}
