'use client'

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthRedirectHandler() {
  const { user } = useAuth()

  useEffect(() => {
    // Check for auth tokens in URL hash (from email confirmations)
    const handleAuthRedirect = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')
        
        if (accessToken && type === 'signup') {
          console.log('🎉 Email confirmation detected! Tokens found in URL')
          
          // Clear the URL hash for security
          window.history.replaceState(null, null, window.location.pathname)
          
          // Show success message
          console.log('✅ Account confirmed successfully!')
          
          // The Supabase client should automatically handle the tokens
          // and trigger the auth state change
        }
      }
    }

    handleAuthRedirect()
  }, [])

  // This component doesn't render anything visible
  return null
} 