import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndegjkqkerrltuemgydk.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDU0NTYsImV4cCI6MjA2NTM4MTQ1Nn0.nryVTYXw0gOVjJQMMCfUW6pcVlRgMiLzJYQ2gBkZAHA'
  
  if (supabaseUrl && supabaseKey) {
    return createClient(supabaseUrl, supabaseKey)
  }
  return null
}

export async function POST(request) {
  try {
    const supabase = getSupabaseClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not available' },
        { status: 503 }
      )
    }

    console.log('🔧 Manually running create_missing_user_profiles function...')
    
    const { data: functionResult, error: functionError } = await supabase.rpc('create_missing_user_profiles')
    
    if (functionError) {
      console.error('❌ Database function failed:', functionError)
      return NextResponse.json(
        { error: 'Database function failed', details: functionError },
        { status: 500 }
      )
    }

    console.log('✅ Database function completed:', functionResult)
    
    return NextResponse.json({ 
      success: true, 
      profilesCreated: functionResult,
      message: `Created ${functionResult} missing user profiles`
    })

  } catch (error) {
    console.error('💥 Error running profile creation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 