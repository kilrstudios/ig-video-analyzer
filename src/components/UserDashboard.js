'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserAnalyses } from '../lib/supabase'

export default function UserDashboard({ onClose }) {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('analyses')
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
            {[
              { key: 'analyses', label: 'Analyses' },
              { key: 'content', label: 'Content Analysis' },
              { key: 'credits', label: 'Credits' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">


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
                      <div className="text-sm text-gray-600 space-y-1">
                        {analysis.scene_analysis && analysis.scene_analysis.length > 0 && (
                          <p>{analysis.scene_analysis.length} scenes analyzed</p>
                        )}
                        {analysis.hook_analysis && analysis.hook_analysis.length > 0 && (
                          <p>{analysis.hook_analysis.length} hooks identified</p>
                        )}
                        {analysis.content_analysis?.videoCategory && (
                          <p>Category: {analysis.content_analysis.videoCategory.category || 'Unknown'}</p>
                        )}
                        {analysis.video_metadata?.totalDuration && (
                          <p>Duration: {analysis.video_metadata.totalDuration}</p>
                        )}
                        {!analysis.scene_analysis && analysis.analysis_data?.scenes && (
                          <p>{analysis.analysis_data.scenes.length} scenes analyzed (legacy)</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No analyses found</p>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Content Analysis Dashboard</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : analyses.length > 0 ? (
                <div className="space-y-6">
                  {analyses.filter(analysis => analysis.analysis_version === '2.0' || analysis.content_analysis).map((analysis) => (
                    <div key={analysis.id} className="border rounded-lg overflow-hidden">
                      {/* Analysis Header */}
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 truncate">{analysis.video_url}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(analysis.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {analysis.credits_used} credits
                          </span>
                        </div>
                      </div>

                      {/* Content Analysis Data */}
                      <div className="p-6 space-y-6">
                        {/* Scene Analysis */}
                        {analysis.scene_analysis && analysis.scene_analysis.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                              </svg>
                              Scene Analysis ({analysis.scene_analysis.length} scenes)
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {analysis.scene_analysis.slice(0, 6).map((scene, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-blue-600">Scene {index + 1}</span>
                                    <span className="text-xs text-gray-500">{scene.duration || scene.timing || `${scene.startFrame}-${scene.endFrame}`}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 line-clamp-3">
                                    {scene.description || scene.content || scene.analysis || 'No description available'}
                                  </p>
                                  {scene.shotType && (
                                    <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {scene.shotType}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {analysis.scene_analysis.length > 6 && (
                              <p className="text-sm text-gray-500 mt-2">
                                +{analysis.scene_analysis.length - 6} more scenes
                              </p>
                            )}
                          </div>
                        )}

                        {/* Hook Analysis */}
                        {analysis.hook_analysis && analysis.hook_analysis.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                              Hook Analysis ({analysis.hook_analysis.length} hooks)
                            </h5>
                            <div className="space-y-3">
                              {analysis.hook_analysis.slice(0, 3).map((hook, index) => (
                                <div key={index} className="bg-green-50 rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-green-600">
                                      {hook.type || `Hook ${index + 1}`}
                                    </span>
                                    <span className="text-xs text-gray-500">{hook.timestamp || hook.timing}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">
                                    {hook.description || hook.content || hook.analysis || 'No description available'}
                                  </p>
                                  {hook.effectiveness && (
                                    <div className="mt-2">
                                      <span className="text-xs text-green-600 font-medium">
                                        Effectiveness: {hook.effectiveness}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Transcript */}
                        {analysis.transcript_data && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                              </svg>
                              Transcript
                            </h5>
                            <div className="bg-purple-50 rounded-lg p-4">
                              <p className="text-sm text-gray-700 line-clamp-6">
                                {analysis.transcript_data.text || 'No transcript available'}
                              </p>
                              {analysis.transcript_data.segments && analysis.transcript_data.segments.length > 0 && (
                                <p className="text-xs text-purple-600 mt-2">
                                  {analysis.transcript_data.segments.length} segments detected
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Content Analysis Summary */}
                        {analysis.content_analysis && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                              </svg>
                              Strategic Overview
                            </h5>
                            <div className="bg-indigo-50 rounded-lg p-4">
                              {analysis.content_analysis.videoCategory && (
                                <div className="mb-3">
                                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                    {analysis.content_analysis.videoCategory.category || 'Category'}
                                  </span>
                                </div>
                              )}
                              <div className="text-sm text-gray-700 space-y-2">
                                {analysis.content_analysis.strategicOverview && (
                                  <div>
                                    <h6 className="font-medium text-gray-900 mb-1">Strategic Analysis</h6>
                                    <p className="line-clamp-4">{typeof analysis.content_analysis.strategicOverview === 'string' 
                                      ? analysis.content_analysis.strategicOverview 
                                      : JSON.stringify(analysis.content_analysis.strategicOverview)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Video Metadata */}
                        {analysis.video_metadata && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H4v4h9v-4z" clipRule="evenodd" />
                              </svg>
                              Video Metadata
                            </h5>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {analysis.video_metadata.totalDuration && (
                                  <div>
                                    <span className="text-gray-600">Duration:</span>
                                    <p className="font-medium">{analysis.video_metadata.totalDuration}</p>
                                  </div>
                                )}
                                {analysis.video_metadata.totalFrames && (
                                  <div>
                                    <span className="text-gray-600">Frames:</span>
                                    <p className="font-medium">{analysis.video_metadata.totalFrames}</p>
                                  </div>
                                )}
                                {analysis.video_metadata.frameRate && (
                                  <div>
                                    <span className="text-gray-600">Frame Rate:</span>
                                    <p className="font-medium">{analysis.video_metadata.frameRate} fps</p>
                                  </div>
                                )}
                                {analysis.video_metadata.analysisTimestamp && (
                                  <div>
                                    <span className="text-gray-600">Analyzed:</span>
                                    <p className="font-medium">{new Date(analysis.video_metadata.analysisTimestamp).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No content analysis available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Complete a video analysis to see detailed content breakdowns here.
                  </p>
                </div>
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