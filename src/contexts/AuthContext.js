'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getUserProfile, isSupabaseAvailable } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState(null)

  useEffect(() => {
    // Check if Supabase is available
    if (!isSupabaseAvailable()) {
      setSupabaseError('Supabase is not configured. Authentication features are disabled.')
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id, session.user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setSupabaseError('Failed to initialize authentication')
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        try {
          if (session?.user) {
            console.log('Setting user from auth state change:', session.user.email)
            setUser(session.user)
            // Load profile in background, don't block UI
            loadUserProfile(session.user.id, session.user).catch(err => {
              console.error('Profile loading failed, using default:', err)
              setProfile({ id: session.user.id, credits_balance: 10 })
            })
          } else {
            console.log('Clearing user from auth state change')
            setUser(null)
            setProfile(null)
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId, userObj = null) => {
    try {
      console.log('🔄 AuthContext loadUserProfile v2.0 for:', userId)
      
      // Add timeout to prevent hanging
      const profilePromise = getUserProfile(userId)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile loading timeout')), 5000)
      )
      
      let profileData = await Promise.race([profilePromise, timeoutPromise])
      console.log('📊 Profile data from getUserProfile v2.0:', profileData)
      
      if (!profileData) {
        console.log('🆕 No profile found, creating new profile with 10 credits')
        // Use current user object or passed userObj
        const currentUser = userObj || user
        
        // Enhanced profile creation with better error handling and retry logic
        profileData = await createUserProfileWithRetry(userId, currentUser)
      }
      
      console.log('✅ Setting profile v2.0:', profileData)
      setProfile(profileData)
    } catch (error) {
      console.error('❌ Error loading user profile v2.0:', error)
      // Set a default profile if everything fails
      setProfile({ id: userId, credits_balance: 10 })
    }
  }

  // Enhanced profile creation function with retry logic
  const createUserProfileWithRetry = async (userId, userObj, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to create user profile (attempt ${attempt}/${maxRetries})`)
        
        const profileData = {
          id: userId,
          email: userObj?.email || 'unknown@example.com',
          full_name: userObj?.user_metadata?.full_name || userObj?.email?.split('@')[0] || 'User',
          credits_balance: 10  // Always 10 credits for new users
        }
        
        console.log('Creating profile with data:', profileData)
        
        // Try to insert the profile
        const { data: newProfile, error: insertErr } = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single()
          
        if (insertErr) {
          console.error(`Profile creation attempt ${attempt} failed:`, insertErr)
          
          // If it's a duplicate key error, the profile might already exist
          if (insertErr.code === '23505' || insertErr.message?.includes('duplicate')) {
            console.log('Profile might already exist, trying to fetch it...')
            const { data: existingProfile, error: fetchErr } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', userId)
              .single()
              
            if (!fetchErr && existingProfile) {
              console.log('Found existing profile:', existingProfile)
              return existingProfile
            }
          }
          
          // If this is the last attempt, throw the error
          if (attempt === maxRetries) {
            throw insertErr
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        
        console.log('Profile created successfully:', newProfile)
        
        // Also try to create welcome bonus transaction (but don't fail if it doesn't work)
        try {
          const { error: transactionErr } = await supabase
            .from('credit_transactions')
            .insert({
              user_id: userId,
              transaction_type: 'bonus',
              credits_amount: 10,
              description: 'Welcome bonus - 10 free credits'
            })
          
          if (transactionErr) {
            console.warn('Failed to create welcome transaction (non-critical):', transactionErr)
          } else {
            console.log('Welcome bonus transaction created')
          }
        } catch (transErr) {
          console.warn('Welcome transaction creation failed (non-critical):', transErr)
        }
        
        return newProfile
        
      } catch (error) {
        console.error(`Profile creation attempt ${attempt} failed:`, error)
        
        if (attempt === maxRetries) {
          console.error('All profile creation attempts failed, returning fallback profile')
          return { 
            id: userId, 
            email: userObj?.email || 'unknown@example.com',
            full_name: userObj?.user_metadata?.full_name || 'User',
            credits_balance: 10 
          }
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  const signIn = async (email, password) => {
    if (!isSupabaseAvailable()) {
      return { error: 'Supabase not configured' }
    }
    
    console.log('Attempting sign in with:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('Sign in response:', { data, error })
    
    if (data?.user) {
      console.log('User signed in successfully:', data.user.email)
    }
    
    if (error) {
      console.log('Sign in error:', error)
    }
    
    return { data, error }
  }

  const signUp = async (email, password, fullName) => {
    if (!isSupabaseAvailable()) {
      return { error: 'Supabase not configured' }
    }
    
    // Always use production URL for email confirmations to avoid localhost redirects
    const getRedirectUrl = () => {
      // Always prefer production URL for email confirmations
      // This ensures email links work regardless of where signup originated
      const productionUrl = 'https://ig-video-analyzer-production-8760.up.railway.app'
      
      // Only use localhost if we're in development AND explicitly want local redirects
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        // For development, you can uncomment the line below if you want local redirects:
        // return `${window.location.protocol}//${window.location.host}`
        
        // But for now, always use production for email confirmations:
        return productionUrl
      }
      
      return productionUrl
    }
    
    const redirectUrl = getRedirectUrl()
    console.log('Using redirect URL for signup:', redirectUrl)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: redirectUrl
        }
      })
      
      console.log('Signup response:', { data, error })
      
      // If signup was successful but user needs email confirmation, 
      // we'll handle profile creation when they confirm and sign in
      if (data?.user && !error) {
        console.log('User signed up successfully:', data.user.email)
        
        // If the user is immediately confirmed (some setups do this), create profile
        if (data.user.email_confirmed_at) {
          console.log('User is immediately confirmed, creating profile...')
          await createUserProfileWithRetry(data.user.id, data.user)
        } else {
          console.log('User needs email confirmation, profile will be created on first signin')
        }
      }
      
      return { data, error }
    } catch (signupError) {
      console.error('Signup error:', signupError)
      return { error: signupError }
    }
  }

  const signOut = async () => {
    if (!isSupabaseAvailable()) {
      return { error: 'Supabase not configured' }
    }
    
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
    return { error }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' }
    if (!isSupabaseAvailable()) return { error: 'Supabase not configured' }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    
    if (!error && data) {
      setProfile(data)
    }
    
    return { data, error }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    supabaseError,
    isSupabaseAvailable: isSupabaseAvailable(),
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 