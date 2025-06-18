'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthModal({ isOpen, onClose, defaultTab = 'signin' }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { signIn, signUp, isSupabaseAvailable, supabaseError } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if Supabase is available before proceeding
    if (!isSupabaseAvailable) {
      setError('Authentication is currently unavailable. Please try again later or contact support.')
      return
    }
    
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (activeTab === 'signin') {
        console.log('AuthModal: Attempting sign in')
        const { data, error } = await signIn(email, password)
        console.log('AuthModal: Sign in result:', { data, error })
        if (error) {
          console.log('AuthModal: Sign in error:', error.message)
          setError(error.message || 'Sign in failed. Please check your credentials.')
        } else {
          console.log('AuthModal: Sign in successful, closing modal immediately')
          // Close modal immediately, don't wait for profile loading
          onClose()
        }
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) {
          setError(error.message || 'Account creation failed. Please try again.')
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setError('')
    setMessage('')
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="-mb-px flex">
            <button
              onClick={() => switchTab('signin')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'signin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'signup'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sign Up
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Show Supabase configuration warning if not available */}
          {!isSupabaseAvailable && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="font-medium text-yellow-800">Authentication Unavailable</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    User accounts are temporarily unavailable. You can still analyze videos without an account, but features like saved history and credits won't be available.
                  </p>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!isSupabaseAvailable}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                required
                disabled={!isSupabaseAvailable}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                required
                minLength={6}
                disabled={!isSupabaseAvailable}
              />
              {activeTab === 'signup' && (
                <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseAvailable}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {activeTab === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : !isSupabaseAvailable ? (
                'Authentication Unavailable'
              ) : (
                activeTab === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {activeTab === 'signup' && isSupabaseAvailable && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🎉 Welcome Bonus!</h4>
              <p className="text-sm text-blue-700">
                New users get <strong>10 free credits</strong> to start analyzing videos immediately!
              </p>
            </div>
          )}

          {isSupabaseAvailable && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {activeTab === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => switchTab(activeTab === 'signin' ? 'signup' : 'signin')}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  {activeTab === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 