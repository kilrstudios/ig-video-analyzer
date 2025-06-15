'use client';

import { useState, FormEvent } from 'react';
import VideoUploader from '@/components/VideoUploader';
import VideoAnalysis from '@/components/VideoAnalysis';
import AuthModal from '@/components/AuthModal';
import UserDashboard from '@/components/UserDashboard';
import { useAuth } from '@/contexts/AuthContext';

// ... existing interfaces ...
interface Scene {
  sceneNumber: number;
  timeRange: string;
  title: string;
  description: string;
  duration: string;
  framing: {
    shotTypes: string[];
    cameraMovement: string;
    composition: string;
  };
  lighting: {
    style: string;
    mood: string;
    direction: string;
    quality: string;
  };
  mood: {
    emotional: string;
    atmosphere: string;
    tone: string;
  };
  actionMovement: {
    movement: string;
    direction: string;
    pace: string;
  };
  audio: {
    music: string;
    soundDesign: string;
    dialogue: string;
  };
  visualEffects: {
    transitions: string;
    effects: string;
    graphics: string;
  };
  settingEnvironment: {
    location: string;
    environment: string;
    background: string;
  };
  subjectsFocus: {
    main: string;
    secondary: string;
    focus: string;
  };
  intentImpactAnalysis: {
    creatorIntent: string;
    howExecuted: string;
    viewerImpact: string;
    narrativeSignificance: string;
  };
  textDialogue: {
    content: string;
    style: string;
  };
}

interface VideoMetadata {
  totalFrames: number;
  frameRate: number;
  analysisTimestamp: string;
}

interface Hook {
  timestamp: string;
  type: 'visual_disrupter' | 'question' | 'positive_statement' | 'negative_statement' | 'action_statement' | 'contrast' | 'irony';
  description: string;
  impact: 'high' | 'medium' | 'low';
  element: string;
  psychologicalTrigger?: string;
}

interface VideoCategory {
  category: 'delightful_messaging' | 'engaging_education' | 'dynamic_broll' | 'situational_creative' | 'narrated_narrative' | 'bts_interview' | 'tutorial';
  confidence: number;
  reasoning: string;
  keyIndicators: string[];
}

interface Transcript {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface CreatorIntent {
  primaryIntent: string;
  howAchieved: string;
  effectivenessFactors: string[];
}

interface HumorMechanics {
  isHumorous: boolean;
  humorType: string;
  specificTechniques: string[];
  setupAndPayoff: string;
  timingElements: string;
}

interface NarrativeStructure {
  setup: string;
  conflict: string;
  resolution: string;
  storytellingDevices: string[];
}

interface VisualTechniques {
  textElements: string;
  visualEffects: string;
  facialExpressions: string;
  visualContrasts: string;
}

interface Character {
  description: string;
  represents: string;
  narrative_function: string;
  key_moments: string;
}

interface MessageDelivery {
  coreMessage: string;
  deliveryMethod: string;
  memorabilityFactors: string[];
  audienceAssumptions: string[];
}

interface ContextualAnalysis {
  creatorIntent: CreatorIntent;
  humorMechanics: HumorMechanics;
  narrativeStructure: NarrativeStructure;
  visualTechniques: VisualTechniques;
  characters: Character[];
  messageDelivery: MessageDelivery;
  contextType: string;
  targetAudience: string;
  keyInsights: string[];
}

interface NarrativeArc {
  arcType: string;
  structure: string;
  keyBeats: string;
  examples?: {
    comedy?: string;
    educational?: string;
    story?: string;
    transformation?: string;
    comparison?: string;
  };
}

interface ImplementationFramework {
  preProduction: string;
  production: string;
  postProduction: string;
  successMetrics: string;
}

interface StrategicOverview {
  videoOverview: string;
  narrativeArc: NarrativeArc;
  whyItWorks: string;
  successFormula: string;
  universalPrinciples: string;
  technicalRequirements: string;
  implementationFramework: ImplementationFramework;
  adaptabilityGuidelines: string;
  viralPotential: string;
  resourceScaling?: string;
}

interface VideoAnalysis {
  contentStructure: string;
  hook: string;
  totalDuration: string;
  scenes: Scene[];
  transcript: Transcript;
  hooks: Hook[];
  videoCategory: VideoCategory;
  contextualAnalysis: ContextualAnalysis;
  videoMetadata: VideoMetadata;
  strategicOverview?: string | StrategicOverview;
  isFreeAnalysis?: boolean;
  analysisMethod?: string;
  isDemoMode?: boolean;
}

export default function Home() {
  const { user, profile, loading } = useAuth() as any;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCredits, setEstimatedCredits] = useState<number>(0);
  const [estimatedDuration, setEstimatedDuration] = useState<string>('');
  const [showCostApproval, setShowCostApproval] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [igUrl, setIgUrl] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);

  const estimateVideoDuration = async (url: string) => {
    const response = await fetch('/api/estimate-duration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Failed to estimate video duration');
    }

    return await response.json();
  };

  const handleAnalyze = async (url: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisProgress(0);

      // Simulate progress updates during analysis
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev < 90) return prev + Math.random() * 10;
          return prev;
        });
      }, 3000);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          userId: user?.id // Include user ID if logged in
        }),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze video');
      }

      const data = await response.json();
      console.log('Analysis results received:', data);
      console.log('Video category:', data.videoCategory);
      console.log('Hooks:', data.hooks);
      console.log('Contextual analysis:', data.contextualAnalysis);
      setAnalysisResults(data);
      
      // Refresh user profile to update credits if user is logged in
      if (user) {
        const { refreshProfile } = useAuth() as any;
        refreshProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!igUrl.trim()) {
      setError('Please enter a valid Instagram video URL');
      return;
    }
    setError(null);
    
    try {
      // First estimate the duration and cost
      const estimation = await estimateVideoDuration(igUrl);
      setEstimatedDuration(estimation.duration);
      setEstimatedCredits(estimation.estimatedCredits);
      setShowCostApproval(true);
    } catch (error) {
      setError('Failed to estimate video duration. Please check the URL and try again.');
    }
  };

  const handleApproveAnalysis = async () => {
    setShowCostApproval(false);
    await handleAnalyze(igUrl);
  };

  const handleDownloadPdf = async () => {
    if (!analysisResults) return;
    
    try {
      setIsGeneratingPdf(true);
      
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisData: analysisResults,
          videoUrl: igUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `instagram-analysis-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <main className="relative z-10 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <header className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-display font-bold text-white mb-4 animate-float">
                Instagram Video
                <span className="block gradient-text bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                  Analyzer
                </span>
              </h1>
              <p className="text-body text-blue-100 max-w-2xl">
                Transform your content strategy with AI-powered video analysis. 
                Get detailed insights, scene breakdowns, and strategic recommendations.
              </p>
            </div>
            
            {/* Auth Section */}
            <div className="flex items-center gap-4">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="loading-skeleton h-12 w-32 rounded-xl"></div>
                </div>
              ) : user ? (
                <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      {profile?.full_name || user.email}
                    </div>
                    <div className="text-xs text-blue-200 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                      {profile?.credits || 0} credits
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUserDashboard(true)}
                    className="btn-secondary text-sm"
                  >
                    Dashboard
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Main Form Card */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-title text-gray-900 mb-2">
                    Analyze Your Video
                  </h2>
                  <p className="text-caption">
                    Paste any public Instagram video URL to get started
                  </p>
                </div>
                
                <div className="card-body">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="igUrl" className="block text-sm font-semibold text-gray-700">
                        Instagram Video URL
                      </label>
                      <div className="relative">
                        <input
                          id="igUrl"
                          type="url"
                          value={igUrl}
                          onChange={(e) => setIgUrl(e.target.value)}
                          placeholder="https://www.instagram.com/p/..."
                          className="input-field pl-12"
                          required
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-caption">
                        We support posts, reels, and IGTV videos from public accounts
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary w-full text-lg"
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing Video...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Analyze Video
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Features Sidebar */}
            <div className="space-y-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="text-title text-gray-900 mb-4">✨ What You Get</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-gray-900">Scene Analysis</p>
                        <p className="text-caption">Frame-by-frame breakdown with timing</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-gray-900">Hook Identification</p>
                        <p className="text-caption">Find what grabs viewer attention</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-gray-900">Strategic Insights</p>
                        <p className="text-caption">Actionable content recommendations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-gray-900">PDF Report</p>
                        <p className="text-caption">Downloadable analysis document</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h3 className="text-title text-gray-900 mb-4">💡 Pro Tips</h3>
                  <div className="space-y-3 text-caption">
                    <p>• Use videos with clear audio for better transcript analysis</p>
                    <p>• Longer videos provide more detailed insights</p>
                    <p>• Public accounts only - private videos can't be analyzed</p>
                    <p>• Best results with videos under 5 minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="card mb-8">
              <div className="card-body">
                <div className="flex items-center gap-3 text-red-600">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Section */}
          {isAnalyzing && (
            <div className="card mb-8">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse-slow">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-title text-gray-900">Analyzing Your Video</h3>
                    <p className="text-caption">This may take a few minutes depending on video length</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                      style={{ width: `${analysisProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Progress: {Math.round(analysisProgress)}%</span>
                    <span className="badge badge-primary">
                      {estimatedCredits} credits
                    </span>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      🔄 Processing video frames, extracting audio, analyzing content patterns, and generating strategic insights...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {analysisResults && (
            <VideoAnalysis 
              results={analysisResults} 
              onDownloadPdf={handleDownloadPdf}
              isGeneratingPdf={isGeneratingPdf}
            />
          )}
        </div>
      </main>

      {/* Cost Approval Modal */}
      {showCostApproval && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-title text-gray-900">Analysis Cost</h3>
              </div>
            </div>
            
            <div className="card-body space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Video Duration:</span>
                  <span className="font-semibold text-gray-900">{estimatedDuration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Required Credits:</span>
                  <span className="badge badge-primary text-lg font-bold">{estimatedCredits} credits</span>
                </div>
                <div className="text-caption border-t border-gray-200 pt-2">
                  Rate: 1 credit per 15 seconds of video
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-green-800">
                  ✨ You'll receive detailed scene analysis, hook identification, strategic insights, and a downloadable PDF report.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCostApproval(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveAnalysis}
                  className="btn-primary flex-1"
                >
                  Approve & Analyze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* User Dashboard Modal */}
      {showUserDashboard && (
        <UserDashboard 
          onClose={() => setShowUserDashboard(false)}
        />
      )}
    </div>
  );
} 