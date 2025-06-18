import { createClient } from '@supabase/supabase-js'
import { validateEnvironment } from './env-check'

// Multiple fallback strategies for getting environment variables
const getEnvVar = (varName, fallback = null) => {
  // Try process.env first (works on both server and client in Next.js)
  if (process.env[varName] && process.env[varName] !== 'undefined') {
    console.log(`✅ Found ${varName} in process.env`)
    return process.env[varName]
  }
  
  // Try window.env if available (for client-side)
  if (typeof window !== 'undefined' && window.env && window.env[varName]) {
    console.log(`✅ Found ${varName} in window.env`)
    return window.env[varName]
  }
  
  // Production fallback values (works for both Railway and local development)
  const productionFallbacks = {
    'NEXT_PUBLIC_SUPABASE_URL': 'https://ndegjkqkerrltuemgydk.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDU0NTYsImV4cCI6MjA2NTM4MTQ1Nn0.nryVTYXw0gOVjJQMMCfUW6pcVlRgMiLzJYQ2gBkZAHA'
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    console.log(`🔍 Current hostname: ${hostname}`)
    
    // Check if we're on Railway domain or localhost without env vars
    const isRailway = hostname.includes('railway.app') || hostname.includes('up.railway.app')
    const isLocalhost = hostname === 'localhost'
    
    console.log(`🚂 Is Railway deployment: ${isRailway}`)
    console.log(`🏠 Is localhost: ${isLocalhost}`)
    
    if ((isRailway || isLocalhost) && productionFallbacks[varName]) {
      console.log(`🔧 Using production fallback for ${varName} (${isRailway ? 'Railway' : 'localhost'})`)
      return productionFallbacks[varName]
    }
  }
  
  console.log(`❌ Could not find ${varName} anywhere`)
  return fallback
}

// Get environment variables with enhanced detection
let supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
let supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Final fallback - if running on Railway and still no vars, use hardcoded values
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  const hostname = window.location.hostname
  if (hostname.includes('railway.app') || hostname.includes('up.railway.app')) {
    console.log('🚂 Final Railway fallback activated')
    supabaseUrl = supabaseUrl || 'https://ndegjkqkerrltuemgydk.supabase.co'
    supabaseAnonKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDU0NTYsImV4cCI6MjA2NTM4MTQ1Nn0.nryVTYXw0gOVjJQMMCfUW6pcVlRgMiLzJYQ2gBkZAHA'
  }
}

// Create a function to get the Supabase client
const getSupabaseClient = () => {
  // Enhanced logging for debugging
  console.log('🔍 Supabase Environment Check:')
  console.log('  URL available:', !!supabaseUrl)
  console.log('  Key available:', !!supabaseAnonKey)
  console.log('  URL value:', supabaseUrl || 'undefined')
  console.log('  Key length:', supabaseAnonKey?.length || 0)
  console.log('  Is Railway:', typeof window !== 'undefined' && window.location.hostname.includes('railway.app'))
  
  // Use validation utility
  const envCheck = validateEnvironment()
  console.log('  Environment validation:', envCheck)
  
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
    console.warn('⚠️  Supabase environment variables not found. Some features may not work.')
    console.warn('  Missing variables:', envCheck.missing)
    return null
  }
  
  console.log('✅ Creating Supabase client...')
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = getSupabaseClient()

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabase !== null
}

// Helper function to get the current user's profile
export const getUserProfile = async (userId) => {
  console.log('getUserProfile called with userId:', userId)
  console.log('Supabase client available:', !!supabase)
  
  if (!supabase) {
    console.error('Supabase client not initialized!')
    throw new Error('Supabase client not initialized. Please check your environment variables.')
  }
  
  console.log('Querying user_profiles table...')
  
  try {
    // Try with 'id' field first
    let { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    // If not found, try with 'user_id' field
    if (!data && !error) {
      console.log('Trying with user_id field...')
      const result = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      data = result.data
      error = result.error
    }
    
    console.log('getUserProfile result:', { data, error })
    
    if (error && error.code !== 'PGRST116') {
      console.error('getUserProfile error:', error)
      throw error
    }
    
    return data
  } catch (err) {
    console.error('getUserProfile caught error:', err)
    throw err
  }
}

// Helper function to update user's credit balance
export const updateUserCredits = async (userId, creditsUsed) => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables.')
  }
  
  const { data, error } = await supabase.rpc('deduct_credits', {
    user_id: userId,
    credits_to_deduct: creditsUsed
  })
  
  if (error) {
    throw error
  }
  
  return data
}

// Helper function to save analysis
export const saveAnalysis = async (userId, analysisData) => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables.')
  }
  
  const { data, error } = await supabase
    .from('video_analyses')
    .insert({
      user_id: userId,
      video_url: analysisData.videoUrl,
      analysis_data: analysisData.results,
      credits_used: analysisData.creditsUsed,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

// Helper function to get user's analysis history
export const getUserAnalyses = async (userId, limit = 10) => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables.')
  }
  
  const { data, error } = await supabase
    .from('video_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    throw error
  }
  
  return data
} 