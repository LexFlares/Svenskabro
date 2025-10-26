import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic input validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
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

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create word - no data returned' },
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
