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
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Authentication Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Instagram Video Analyzer
            </h1>
            <p className="text-lg text-red-600">
              Analyze any public Instagram video using AI
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {profile?.full_name || user.email}
                  </div>
                  <div className="text-xs text-blue-600">
                    {profile?.credits || 0} credits
                  </div>
                </div>
                <button
                  onClick={() => setShowUserDashboard(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="igUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Video URL
              </label>
              <input
                id="igUrl"
                type="url"
                value={igUrl}
                onChange={(e) => setIgUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Paste the URL of any public Instagram video post or reel</p>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-md flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-lg font-medium"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  Analyzing...
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </>
              ) : (
                <>
                  Analyze Video
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Cost Approval Modal */}
        {showCostApproval && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">💰 Analysis Cost Confirmation</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Video Duration:</span>
                    <span>{estimatedDuration}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Required Credits:</span>
                    <span className="text-blue-600 font-semibold">{estimatedCredits} credits</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Rate: 1 credit per 15 seconds
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  This analysis will provide detailed scene-by-scene breakdown and strategic insights for content creation.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCostApproval(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveAnalysis}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Approve & Analyze
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🔄 Analyzing Video...</h3>
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress: {Math.round(analysisProgress)}%</span>
                <span>Estimated credits: {estimatedCredits}</span>
              </div>
              <div className="text-sm text-gray-500">
                Please wait while we download, extract frames, analyze audio, and generate strategic insights...
              </div>
            </div>
          </div>
        )}

        {analysisResults && (
          <VideoAnalysis 
            results={analysisResults} 
            onDownloadPdf={handleDownloadPdf}
            isGeneratingPdf={isGeneratingPdf}
          />
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
    </main>
  );
} 