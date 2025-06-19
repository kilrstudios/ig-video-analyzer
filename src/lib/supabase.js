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

// Lazy initialization to avoid build-time issues
let supabaseClient = null;
let isInitialized = false;

function initializeSupabase() {
  if (!isInitialized) {
    supabaseClient = getSupabaseClient();
    isInitialized = true;
  }
  return supabaseClient;
}

export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = initializeSupabase();
    if (!client) return undefined;
    return typeof client[prop] === 'function' ? client[prop].bind(client) : client[prop];
  }
});

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  try {
    const client = initializeSupabase();
    return client !== null;
  } catch (error) {
    console.warn('Supabase initialization check failed:', error.message);
    return false;
  }
}

// Helper function to get the current user's profile
export const getUserProfile = async (userId) => {
  console.log('🔍 getUserProfile v2.0 called with userId:', userId)
  console.log('📊 Supabase client available:', !!supabase)
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized!')
    throw new Error('Supabase client not initialized. Please check your environment variables.')
  }
  
  console.log('🔍 Querying user_profiles table with id column...')
  
  try {
    // Query by 'id' field ONLY (user_profiles.id = auth.users.id)
    // This is the ONLY correct way to query user profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)  // ALWAYS use 'id', never 'user_id'
      .maybeSingle()
    
    console.log('✅ getUserProfile result:', { 
      hasData: !!data, 
      dataKeys: data ? Object.keys(data) : null,
      error: error?.message || null 
    })
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ getUserProfile error:', error)
      throw error
    }
    
    if (data) {
      console.log('✅ Profile found:', { 
        id: data.id, 
        email: data.email, 
        credits: data.credits_balance 
      })
    } else {
      console.log('⚠️ No profile found for user:', userId)
    }
    
    return data
  } catch (err) {
    console.error('💥 getUserProfile caught error:', err)
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

// Helper function to save analysis with structured format
export const saveAnalysis = async (userId, analysisData) => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables.')
  }
  
  const results = analysisData.results;
  
  // Structure the analysis data into separate columns
  const contentAnalysis = {
    strategicOverview: results.strategicOverview,
    contextualAnalysis: results.contextualAnalysis,
    contentStructure: results.contentStructure,
    videoCategory: results.videoCategory,
    standardizedAnalysis: results.standardizedAnalysis
  };
  
  const sceneAnalysis = results.scenes || [];
  const hookAnalysis = results.hooks || [];
  const transcriptData = results.transcript || { text: 'No transcript available', segments: [] };
  const videoMetadata = {
    ...results.videoMetadata,
    totalDuration: results.totalDuration,
    hook: results.hook
  };
  
  const { data, error } = await supabase
    .from('video_analyses')
    .insert({
      user_id: userId,
      video_url: analysisData.videoUrl,
      content_analysis: contentAnalysis,
      scene_analysis: sceneAnalysis,
      hook_analysis: hookAnalysis,
      transcript_data: transcriptData,
      video_metadata: videoMetadata,
      analysis_data: results, // Keep for backward compatibility
      credits_used: analysisData.creditsUsed,
      analysis_version: '2.0',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

// Legacy function for backward compatibility
export const saveAnalysisLegacy = async (userId, analysisData) => {
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
      analysis_version: '1.0',
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