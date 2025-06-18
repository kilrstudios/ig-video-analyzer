'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserAnalyses } from '../lib/supabase'

export default function UserDashboard({ onClose }) {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    if (user) {
      loadAnalyses()
    }
  }, [user])

  const loadAnalyses = async () => {
    try {
      const data = await getUserAnalyses(user.id, 5)
      setAnalyses(data)
    } catch (error) {
      console.error('Error loading analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const handlePurchase = async (packType) => {
    try {
      setPurchasing(true)

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packType,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      await stripe.redirectToCheckout({ sessionId })

    } catch (error) {
      console.error('Purchase error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
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
          <nav className="-mb-px flex space-x-8 px-6">
            {['overview', 'analyses', 'credits'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      profile.plan_type === 'pro' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profile.plan_type.charAt(0).toUpperCase() + profile.plan_type.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Available Credits</p>
                      <p className="text-2xl font-bold text-blue-600">{profile.credits_balance}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Total Analyses</p>
                      <p className="text-2xl font-bold text-green-600">{analyses.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Credits Used</p>
                      <p className="text-2xl font-bold text-purple-600">{profile.total_credits_used}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Analyses Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Analyses</h3>
                {analyses.length > 0 ? (
                  <div className="space-y-3">
                    {analyses.slice(0, 3).map((analysis) => (
                      <div key={analysis.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {analysis.video_url}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(analysis.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {analysis.credits_used} credits
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No analyses yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analyses' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Analysis History</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{analysis.video_url}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(analysis.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {analysis.credits_used} credits
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{analysis.status}</p>
                        </div>
                      </div>
                      {analysis.analysis_data?.scenes && (
                        <p className="text-sm text-gray-600">
                          {analysis.analysis_data.scenes.length} scenes analyzed
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No analyses found</p>
              )}
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Credit Balance</h3>
                <p className="text-3xl font-bold">{profile.credits_balance} Credits</p>
                <p className="text-blue-100 mt-2">
                  {profile.total_credits_used} credits used total
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Starter Pack - 10 Credits */}
                <div className="border rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-gray-900">Starter Pack</h4>
                  <p className="text-2xl font-bold text-blue-600 my-2">10 Credits</p>
                  <p className="text-sm text-gray-600 mb-2">$2.50</p>
                  <p className="text-xs text-gray-500 mb-4">$0.25 per credit</p>
                  <button 
                    onClick={() => handlePurchase('pack_10')}
                    disabled={purchasing}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {purchasing ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
                
                {/* Value Pack - 50 Credits */}
                <div className="border rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-gray-900">Value Pack</h4>
                  <p className="text-2xl font-bold text-blue-600 my-2">50 Credits</p>
                  <p className="text-sm text-gray-600 mb-1">$11.50</p>
                  <p className="text-xs text-green-600 font-medium mb-1">Save 8%!</p>
                  <p className="text-xs text-gray-500 mb-4">$0.23 per credit</p>
                  <button 
                    onClick={() => handlePurchase('pack_50')}
                    disabled={purchasing}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {purchasing ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
                
                {/* Popular Pack - 100 Credits */}
                <div className="border-2 border-blue-500 rounded-lg p-4 text-center relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">Best Value</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">Popular Pack</h4>
                  <p className="text-2xl font-bold text-blue-600 my-2">100 Credits</p>
                  <p className="text-sm text-gray-600 mb-1">$22.00</p>
                  <p className="text-xs text-green-600 font-medium mb-1">Save 12%!</p>
                  <p className="text-xs text-gray-500 mb-4">$0.22 per credit</p>
                  <button 
                    onClick={() => handlePurchase('pack_100')}
                    disabled={purchasing}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {purchasing ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
                
                {/* Enterprise Pack - 500 Credits */}
                <div className="border rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-gray-900">Enterprise Pack</h4>
                  <p className="text-2xl font-bold text-blue-600 my-2">500 Credits</p>
                  <p className="text-sm text-gray-600 mb-1">$100.00</p>
                  <p className="text-xs text-green-600 font-medium mb-1">Save 20%!</p>
                  <p className="text-xs text-gray-500 mb-4">$0.20 per credit</p>
                  <button 
                    onClick={() => handlePurchase('pack_500')}
                    disabled={purchasing}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {purchasing ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 Credit Usage</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 1 credit = 15 seconds of video analysis</li>
                  <li>• Example: 30-second video = 2 credits</li>
                  <li>• New users get 10 free credits to start</li>
                  <li>• Credits never expire</li>
                  <li>• Secure payments powered by Stripe</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-between items-center">
          <button
            onClick={handleSignOut}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Sign Out
          </button>
          <button
            onClick={refreshProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
} 