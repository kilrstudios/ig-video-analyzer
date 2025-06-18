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
      console.log('Loading user profile for:', userId)
      
      // Add timeout to prevent hanging
      const profilePromise = getUserProfile(userId)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile loading timeout')), 5000)
      )
      
      let profileData = await Promise.race([profilePromise, timeoutPromise])
      console.log('Profile data from getUserProfile:', profileData)
      
      if (!profileData) {
        console.log('No profile found, creating new profile with 10 credits')
        // Use current user object or passed userObj
        const currentUser = userObj || user
        
        // Auto-create profile with starter credits if not found
        const { data: newProfile, error: insertErr } = await supabase
          .from('user_profiles')
          .insert({ 
            id: userId, 
            email: currentUser?.email || 'unknown@example.com',
            full_name: currentUser?.user_metadata?.full_name || currentUser?.email || 'User',
            credits_balance: 10 
          })
          .select()
          .single()
        if (insertErr) {
          console.error('Failed to auto-create profile', insertErr)
          // Set a default profile if creation fails
          profileData = { id: userId, credits_balance: 10 }
        } else {
          console.log('Created new profile:', newProfile)
          profileData = newProfile
        }
      }
      
      console.log('Setting profile:', profileData)
      setProfile(profileData)
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Set a default profile if everything fails
      setProfile({ id: userId, credits_balance: 10 })
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
    return { data, error }
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