import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('words')
      .insert([body])
      .select();

    if (error) {
      console.error('Error inserting word:', error);
      return NextResponse.json(
        { error: 'Failed to create word' },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (err) {
    console.error('Error processing request:', err);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
