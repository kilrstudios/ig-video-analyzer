import { NextResponse } from 'next/server';
import { supabase, isSupabaseAvailable } from '../../../lib/supabase';

export async function GET() {
  try {
    console.log('=== SUPABASE TEST API ===');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('isSupabaseAvailable():', isSupabaseAvailable());
    console.log('supabase client:', !!supabase);

    if (!isSupabaseAvailable()) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase not available',
        details: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined',
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
        }
      });
    }

    // Test a simple Supabase query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    return NextResponse.json({
      status: 'success',
      message: 'Supabase is working',
      details: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        querySuccess: !error,
        error: error?.message || null
      }
    });

  } catch (err) {
    console.error('Supabase test error:', err);
    return NextResponse.json({
      status: 'error',
      message: 'Test failed',
      error: err.message
    });
  }
} 