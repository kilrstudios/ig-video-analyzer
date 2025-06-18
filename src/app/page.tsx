'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import VideoUploader from '@/components/VideoUploader';
import VideoAnalysis from '@/components/VideoAnalysis';
import AuthModal from '@/components/AuthModal';
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
  standardizedAnalysis?: string;
  isFreeAnalysis?: boolean;
  analysisMethod?: string;
  isDemoMode?: boolean;
}

export default function Home() {
  const { user, profile, loading, refreshProfile, signOut, isSupabaseAvailable, supabaseError } = useAuth() as any;
  
  // Helper function to format time in minutes and seconds
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCredits, setEstimatedCredits] = useState<number>(0);
  const [estimatedDuration, setEstimatedDuration] = useState<string>('');
  const [showCostApproval, setShowCostApproval] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [timeEstimate, setTimeEstimate] = useState<{elapsed: number, remaining: number, total: number} | null>(null);
  const [igUrl, setIgUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{phase: string, progress: number, message: string} | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'fine' | 'standard' | 'broad'>('standard');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [inputMethod, setInputMethod] = useState<'url' | 'upload' | 'fbad'>('url');
  const [fbAdUrl, setFbAdUrl] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  
  // Refs to avoid closure issues in intervals
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (profile) {
      console.log('Loaded user profile', profile);
    }
  }, [profile]);

  // Debug: Track progress state changes
  useEffect(() => {
    console.log('📈 analysisProgress state changed to:', analysisProgress);
  }, [analysisProgress]);

  // Debug function to manually test progress API
  const testProgressAPI = async () => {
    const testRequestId = 'req_1750195467320_l7z10vcjs'; // From logs
    console.log('🧪 Testing progress API with ID:', testRequestId);
    
    try {
      const response = await fetch(`/api/progress?requestId=${testRequestId}`);
      console.log('🧪 Test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🧪 Test response data:', JSON.stringify(data, null, 2));
        
        // Manually update state to see if React updates work
        setAnalysisProgress(data.progress || 0);
        setAnalysisStatus(data.message || 'Test message');
      } else {
        console.error('🧪 Test failed:', response.status);
      }
    } catch (err) {
      console.error('🧪 Test error:', err);
    }
  };

  // Debug progress polling with extensive logging
  const startProgressPolling = (requestId: string) => {
    console.log('🚀 Starting progress polling for:', requestId);
    currentRequestIdRef.current = requestId;
    
    const pollProgress = async () => {
      const currentRequestId = currentRequestIdRef.current;
      if (!currentRequestId) {
        console.log('❌ No request ID, stopping polling');
        return;
      }
      
      console.log('🔄 Polling progress for:', currentRequestId);
      
      try {
        const url = `/api/progress?requestId=${currentRequestId}`;
        console.log('📡 Fetching:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Raw response data:', JSON.stringify(data, null, 2));
          
          // Log current vs new state
          console.log('📊 State update:', {
            currentProgress: analysisProgress,
            newProgress: data.progress || 0,
            currentStatus: analysisStatus,
            newStatus: data.message || 'Processing...',
            phase: data.phase
          });
          
          // Update state
          setProgress(data);
          setAnalysisProgress(data.progress || 0);
          setAnalysisStatus(data.message || 'Processing...');
          
          if (data.details?.timeEstimate) {
            setTimeEstimate(data.details.timeEstimate);
          }
          
          if (data.progress >= 100) {
            console.log('✅ Analysis complete, stopping polling');
            stopProgressPolling();
          }
        } else {
          console.error('❌ Bad response:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('❌ Error body:', errorText);
        }
      } catch (err) {
        console.error('❌ Polling error:', err);
        if (err instanceof Error) {
          console.error('❌ Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack
          });
        }
      }
    };
    
    // Poll immediately, then every second
    console.log('🏁 Starting initial poll...');
    pollProgress();
    
    console.log('⏰ Setting up interval polling every 1000ms...');
    progressIntervalRef.current = setInterval(() => {
      console.log('⏰ Interval tick - polling again...');
      pollProgress();
    }, 1000);
  };

  const stopProgressPolling = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    currentRequestIdRef.current = null;
  };

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

  const handleAnalyze = async (urlOrFile: string | File) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);
    setProgress(null);
    setAnalysisProgress(0); // Start at 0% - backend will control all updates
    setAnalysisStatus('Starting analysis...');
    setTimeEstimate(null);

    const newRequestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setRequestId(newRequestId);
    console.log('🔍 Starting analysis with requestId:', newRequestId);

    // Start progress polling - this will be the ONLY source of progress updates
    startProgressPolling(newRequestId);

    try {
      let response;
      
      if (typeof urlOrFile === 'string') {
        // URL analysis
        console.log('📤 Sending analysis request for URL:', urlOrFile);
        console.log('📤 Request payload:', { 
          url: urlOrFile,
          userId: user.id,
          requestId: newRequestId
        });
        
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: urlOrFile,
            userId: user.id,
            requestId: newRequestId
          })
        });
        
        console.log('📥 Analysis response status:', response.status, response.statusText);
      } else {
        // File upload analysis
        console.log('📤 Sending analysis request for file:', urlOrFile.name);
        console.log('📤 FormData includes:', { 
          video: urlOrFile.name,
          userId: user.id,
          requestId: newRequestId
        });
        
        const formData = new FormData();
        formData.append('video', urlOrFile);
        formData.append('userId', user.id);
        formData.append('requestId', newRequestId);

        response = await fetch('/api/analyze-upload', {
          method: 'POST',
          body: formData
        });
        
        console.log('📥 Upload analysis response status:', response.status, response.statusText);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResults(result);
      
      // Refresh user profile to update credits
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      stopProgressPolling();
      setIsAnalyzing(false);
      setRequestId(null);
      setProgress(null);
      setAnalysisProgress(0);
      setAnalysisStatus('');
      setTimeEstimate(null);
    }
  };

  const handleAnalyzeFbAd = async (fbAdUrl: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);
    setProgress(null);
    setAnalysisProgress(0); // Start at 0% - backend will control all updates
    setAnalysisStatus('Extracting video from Facebook ad...');
    setTimeEstimate(null);

    const newRequestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setRequestId(newRequestId);
    console.log('🔍 Starting FB ad analysis with requestId:', newRequestId);

    // Start progress polling - this will be the ONLY source of progress updates
    startProgressPolling(newRequestId);

    try {
      // First, extract the video URL from the Facebook ad
      const scrapeResponse = await fetch('/api/scrape-fb-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adLibraryUrl: fbAdUrl })
      });

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json();
        throw new Error(errorData.error || 'Failed to extract video from Facebook ad');
      }

      const { videoUrl } = await scrapeResponse.json();
      console.log('✅ Extracted video URL:', videoUrl);
      console.log('🔗 Using same request ID for analysis:', newRequestId);
      
      // No manual progress updates - backend handles all progress

      // Now analyze the extracted video URL using the same request ID
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: videoUrl,
          userId: user.id,
          requestId: newRequestId // CRITICAL: Use the same request ID for consistent progress tracking
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResults(result);
      
      // Refresh user profile to update credits
      if (refreshProfile) {
        await refreshProfile();
      }
      
    } catch (err) {
      console.error('Facebook ad analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze Facebook ad');
    } finally {
      stopProgressPolling();
      setIsAnalyzing(false);
      setRequestId(null);
      setProgress(null);
      setAnalysisProgress(0);
      setAnalysisStatus('');
      setTimeEstimate(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (inputMethod === 'url') {
      if (!igUrl.trim()) {
        setError('Please enter an Instagram video URL');
        return;
      }
      
      const durationResult = await estimateVideoDuration(igUrl);
      if (durationResult !== null) {
        setEstimatedCost(durationResult.estimatedCredits);
        setShowCostApproval(true);
      }
    } else if (inputMethod === 'upload') {
      if (!uploadedFile) {
        setError('Please select a video file to upload');
        return;
      }
      
      // Estimate credits based on file duration (simplified)
      const estimatedCredits = Math.ceil(60 / 15); // Assume 60s video = 4 credits
      setEstimatedCost(estimatedCredits);
      setShowCostApproval(true);
    } else if (inputMethod === 'fbad') {
      if (!fbAdUrl.trim()) {
        setError('Please enter a Facebook Ad Library URL');
        return;
      }
      
      // Estimate credits for Facebook ad analysis (similar to regular video)
      const estimatedCredits = 4; // Assume average ad duration
      setEstimatedCost(estimatedCredits);
      setShowCostApproval(true);
    }
  };

  const handleApproveAnalysis = async () => {
    setShowCostApproval(false);
    
    if (inputMethod === 'url') {
      await handleAnalyze(igUrl);
    } else if (inputMethod === 'upload' && uploadedFile) {
      await handleAnalyze(uploadedFile);
    } else if (inputMethod === 'fbad') {
      await handleAnalyzeFbAd(fbAdUrl);
    }
  };

  const generateRichText = (results: VideoAnalysis): string => {
    // If standardized analysis is available, use it as the primary output
    if (results.standardizedAnalysis) {
      const lines: string[] = [];
      
      // Header
      lines.push('🎯 CREATOR STRATEGY REPORT');
      lines.push('═'.repeat(50));
      lines.push('');
      lines.push(`Video Source: ${uploadedFile ? 'File Upload' : 'Instagram'}`);
      lines.push(`Video URL/File: ${igUrl || uploadedFile?.name || 'Unknown'}`);
      lines.push(`Analysis Date: ${new Date().toISOString().split('T')[0]}`);
      lines.push(`Total Duration: ${results.totalDuration}`);
      lines.push('');
      lines.push('');
      
      // Add the standardized analysis content
      lines.push(results.standardizedAnalysis);
      
      lines.push('');
      lines.push('═'.repeat(50));
      lines.push('Generated by Instagram Video Analyzer');
      lines.push(`Report created: ${new Date().toLocaleString()}`);
      
      return lines.join('\n');
    }

    // Fallback to original format for backwards compatibility
    const lines: string[] = [];
    
    // Helper function to format sections
    const addSection = (title: string, content: string | undefined | null, indent = 0) => {
      if (!content || content.trim() === '') return;
      const indentStr = '  '.repeat(indent);
      lines.push(`${indentStr}${title}: ${content}`);
    };

    const addSectionHeader = (title: string, emoji = '📊') => {
      lines.push('');
      lines.push(`${emoji} ${title.toUpperCase()}`);
      lines.push('─'.repeat(50));
    };

    // Video metadata
    const getVideoSource = () => {
      if (uploadedFile) return 'File Upload';
      return 'Instagram';
    };

    const getVideoUrl = () => {
      if (igUrl) return igUrl;
      if (uploadedFile) return uploadedFile.name;
      return 'Unknown';
    };

    // Header
    lines.push('🎬 VIDEO ANALYSIS REPORT');
    lines.push('═'.repeat(50));
    lines.push('');
    addSection('Video Source', getVideoSource());
    addSection('Video URL/File', getVideoUrl());
    addSection('Analysis Date', new Date().toISOString().split('T')[0]);
    addSection('Total Duration', results.totalDuration);

    // Overview
    addSectionHeader('VIDEO OVERVIEW', '🎯');
    addSection('Primary Hook', results.hook);
    addSection('Content Structure', results.contentStructure);
    addSection('Video Category', results.videoCategory.category.replace(/_/g, ' '));
    addSection('Category Confidence', `${(results.videoCategory.confidence * 100).toFixed(1)}%`);
    addSection('Category Reasoning', results.videoCategory.reasoning);

         // Strategic Overview
     if (results.strategicOverview) {
       addSectionHeader('STRATEGIC ANALYSIS', '🎯');
       
       if (typeof results.strategicOverview === 'string') {
         addSection('Why It Works', results.strategicOverview);
       } else {
         const strategic = results.strategicOverview as StrategicOverview;
         addSection('Why It Works', strategic.whyItWorks);
         if (strategic.successFormula) addSection('Success Formula', strategic.successFormula);
         if (strategic.universalPrinciples) addSection('Universal Principles', strategic.universalPrinciples);
         if (strategic.viralPotential) addSection('Viral Potential', strategic.viralPotential);
         if (strategic.technicalRequirements) addSection('Technical Requirements', strategic.technicalRequirements);
         
         if (strategic.narrativeArc) {
           lines.push('');
           lines.push('  📖 Narrative Arc:');
           addSection('Arc Type', strategic.narrativeArc.arcType, 1);
           addSection('Structure', strategic.narrativeArc.structure, 1);
           addSection('Key Beats', strategic.narrativeArc.keyBeats, 1);
         }
       }
     }

    // Scenes Analysis
    if (results.scenes && results.scenes.length > 0) {
      addSectionHeader('SCENE BREAKDOWN', '🎬');
      addSection('Total Scenes', results.scenes.length.toString());
      lines.push('');
      
      results.scenes.forEach((scene, index) => {
        lines.push(`  Scene ${scene.sceneNumber} (${scene.timeRange}): ${scene.title}`);
        addSection('Duration', scene.duration, 1);
        addSection('Description', scene.description, 1);
        
        if (scene.framing?.shotTypes?.length) {
          addSection('Shot Types', scene.framing.shotTypes.join(', '), 1);
        }
        if (scene.lighting?.style) {
          addSection('Lighting', scene.lighting.style, 1);
        }
        if (scene.mood?.emotional) {
          addSection('Mood', scene.mood.emotional, 1);
        }
        if (scene.settingEnvironment?.location) {
          addSection('Location', scene.settingEnvironment.location, 1);
        }
        if (scene.subjectsFocus?.main) {
          addSection('Main Subject', scene.subjectsFocus.main, 1);
        }
        
        if (scene.intentImpactAnalysis) {
          lines.push('    📊 Intent & Impact:');
          addSection('Creator Intent', scene.intentImpactAnalysis.creatorIntent, 2);
          addSection('How Executed', scene.intentImpactAnalysis.howExecuted, 2);
          addSection('Viewer Impact', scene.intentImpactAnalysis.viewerImpact, 2);
        }
        
        if (index < results.scenes.length - 1) lines.push('');
      });
    }

    // Hooks Analysis
    if (results.hooks && results.hooks.length > 0) {
      addSectionHeader('HOOKS ANALYSIS', '🎣');
      addSection('Total Hooks', results.hooks.length.toString());
      const highImpactHooks = results.hooks.filter(h => h.impact === 'high').length;
      addSection('High Impact Hooks', highImpactHooks.toString());
      lines.push('');
      
      results.hooks.forEach((hook, index) => {
        const impactEmoji = hook.impact === 'high' ? '🔥' : hook.impact === 'medium' ? '⚡' : '💡';
        lines.push(`  ${impactEmoji} ${hook.timestamp} - ${hook.type.replace(/_/g, ' ').toUpperCase()}`);
        addSection('Description', hook.description, 1);
        addSection('Element', hook.element, 1);
        if (hook.psychologicalTrigger) {
          addSection('Psychological Trigger', hook.psychologicalTrigger, 1);
        }
        if (index < results.hooks.length - 1) lines.push('');
      });
    }

    // Contextual Analysis
    if (results.contextualAnalysis) {
      addSectionHeader('CONTEXTUAL ANALYSIS', '🧠');
      const ctx = results.contextualAnalysis;
      
      addSection('Target Audience', ctx.targetAudience);
      addSection('Context Type', ctx.contextType);
      
      if (ctx.creatorIntent) {
        lines.push('');
        lines.push('  🎯 Creator Intent:');
        addSection('Primary Intent', ctx.creatorIntent.primaryIntent, 1);
        addSection('How Achieved', ctx.creatorIntent.howAchieved, 1);
        if (ctx.creatorIntent.effectivenessFactors?.length) {
          addSection('Effectiveness Factors', ctx.creatorIntent.effectivenessFactors.join(', '), 1);
        }
      }
      
      if (ctx.narrativeStructure) {
        lines.push('');
        lines.push('  📖 Narrative Structure:');
        addSection('Setup', ctx.narrativeStructure.setup, 1);
        addSection('Conflict', ctx.narrativeStructure.conflict, 1);
        addSection('Resolution', ctx.narrativeStructure.resolution, 1);
        if (ctx.narrativeStructure.storytellingDevices?.length) {
          addSection('Storytelling Devices', ctx.narrativeStructure.storytellingDevices.join(', '), 1);
        }
      }
      
      if (ctx.messageDelivery) {
        lines.push('');
        lines.push('  💬 Message Delivery:');
        addSection('Core Message', ctx.messageDelivery.coreMessage, 1);
        addSection('Delivery Method', ctx.messageDelivery.deliveryMethod, 1);
        if (ctx.messageDelivery.memorabilityFactors?.length) {
          addSection('Memorability Factors', ctx.messageDelivery.memorabilityFactors.join(', '), 1);
        }
      }
      
      if (ctx.keyInsights?.length) {
        lines.push('');
        lines.push('  💡 Key Insights:');
        ctx.keyInsights.forEach(insight => {
          lines.push(`    • ${insight}`);
        });
      }
    }

    // Transcript
    if (results.transcript?.text) {
      addSectionHeader('TRANSCRIPT', '📝');
      // Split long transcript into paragraphs for readability
      const transcript = results.transcript.text;
      const maxLineLength = 80;
      const words = transcript.split(' ');
      let currentLine = '';
      
      words.forEach(word => {
        if ((currentLine + word).length > maxLineLength) {
          if (currentLine) lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      });
      if (currentLine) lines.push(currentLine.trim());
    }

    // Metadata
    if (results.videoMetadata) {
      addSectionHeader('TECHNICAL METADATA', '⚙️');
      addSection('Total Frames', results.videoMetadata.totalFrames?.toString());
      addSection('Frame Rate', results.videoMetadata.frameRate?.toString());
      addSection('Analysis Timestamp', results.videoMetadata.analysisTimestamp);
      if (results.analysisMethod) {
        addSection('Analysis Method', results.analysisMethod);
      }
    }

    lines.push('');
    lines.push('═'.repeat(50));
    lines.push('Generated by Instagram Video Analyzer');
    lines.push(`Report created: ${new Date().toLocaleString()}`);

    return lines.join('\n');
  };

  const handleCopyRichText = async () => {
    if (!analysisResults) return;
    try {
      setIsCopying(true);
      const richText = generateRichText(analysisResults);
      await navigator.clipboard.writeText(richText);
      alert('Analysis copied as rich text to clipboard! You can paste it into any text editor, document, or messaging app.');
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy analysis to clipboard.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, WebM, MOV, AVI)');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setError('File size must be less than 100MB');
      return;
    }

    setUploadedFile(file);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎬 Instagram Video Analyzer
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Analyze Instagram videos, upload files, or extract videos from Facebook ads to get detailed analysis of content strategy, 
              hooks, storytelling techniques, and performance insights.
            </p>
            
            {/* Auth Section */}
            <div className="flex justify-center">
              {user ? (
                <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {profile?.full_name || user.email}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                      {(profile?.credits_balance ?? profile?.credits ?? 0)} credits
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await signOut();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Sign Out
                  </button>
                </div>
              ) : isSupabaseAvailable ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                  </svg>
                  Sign In to Analyze Videos
                </button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-yellow-800">Demo Mode</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Running in demo mode. Video analysis is available without authentication, but user accounts and saved history are temporarily unavailable.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-6">
                             {/* Tab Navigation */}
               <div className="border-b border-gray-200">
                 <nav className="-mb-px flex space-x-8">
                   <button
                     type="button"
                     onClick={() => setInputMethod('url')}
                     className={`py-2 px-1 border-b-2 font-medium text-sm ${
                       inputMethod === 'url'
                         ? 'border-blue-500 text-blue-600'
                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                     }`}
                   >
                     📎 Instagram URL
                   </button>
                   <button
                     type="button"
                     onClick={() => setInputMethod('upload')}
                     className={`py-2 px-1 border-b-2 font-medium text-sm ${
                       inputMethod === 'upload'
                         ? 'border-blue-500 text-blue-600'
                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                     }`}
                   >
                     📁 Upload Video
                   </button>
                   <button
                     type="button"
                     onClick={() => setInputMethod('fbad')}
                     className={`py-2 px-1 border-b-2 font-medium text-sm ${
                       inputMethod === 'fbad'
                         ? 'border-blue-500 text-blue-600'
                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                     }`}
                   >
                     📊 Facebook Ad
                   </button>
                 </nav>
               </div>

              {/* Input Form */}
              <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                                     <div className="bg-blue-50 rounded-lg p-4">
                     <div className="flex items-center justify-center space-x-8 text-sm text-blue-700">
                       <div className="flex items-center">
                         <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         {inputMethod === 'fbad' ? 'Facebook Ad Library URL' : 'Instagram URL or Video Upload'}
                       </div>
                     </div>

                    {inputMethod === 'url' ? (
                      <div className="space-y-2 mt-4">
                        <label htmlFor="igUrl" className="block text-sm font-semibold text-gray-700">
                          Instagram Video URL
                        </label>
                        <div className="relative">
                          <input
                            id="igUrl"
                            type="url"
                            value={igUrl}
                            onChange={(e) => setIgUrl(e.target.value)}
                            placeholder="https://www.instagram.com/reel/..."
                            className="input-field pl-12"
                            disabled={isAnalyzing}
                          />
                          <svg 
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                      </div>
                    ) : inputMethod === 'upload' ? (
                      <div className="space-y-2 mt-4">
                        <label htmlFor="videoFile" className="block text-sm font-semibold text-gray-700">
                          Upload Video File
                        </label>
                        <div className="relative">
                          <input
                            id="videoFile"
                            type="file"
                            accept="video/mp4,video/webm,video/mov,video/avi,video/quicktime"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isAnalyzing}
                          />
                          <label
                            htmlFor="videoFile"
                            className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                              uploadedFile 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="text-center">
                              {uploadedFile ? (
                                <>
                                  <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="mt-2 text-sm text-green-600">
                                    <span className="font-medium">{uploadedFile.name}</span>
                                  </p>
                                  <p className="text-xs text-green-500">
                                    {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                </>
                              ) : (
                                <>
                                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <p className="mt-2 text-sm text-gray-600">
                                    <span className="font-medium">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    MP4, WebM, MOV, AVI up to 100MB
                                  </p>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-4">
                        <label htmlFor="fbAdUrl" className="block text-sm font-semibold text-gray-700">
                          Facebook Ad Library URL
                        </label>
                        <div className="relative">
                          <input
                            id="fbAdUrl"
                            type="url"
                            value={fbAdUrl}
                            onChange={(e) => setFbAdUrl(e.target.value)}
                            placeholder="https://www.facebook.com/ads/library/?id=1128760052615592"
                            className="input-field pl-12"
                            disabled={isAnalyzing}
                          />
                          <svg 
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          🤖 We'll automatically extract and analyze the video from the Facebook ad
                        </p>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className={`rounded-lg p-4 ${
                      error.includes('Instagram Authentication Required') 
                        ? 'bg-amber-50 border border-amber-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex">
                        {error.includes('Instagram Authentication Required') ? (
                          <svg className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <div className="flex-1">
                          {error.includes('Instagram Authentication Required') ? (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                                🔐 Instagram Authentication Required
                              </h4>
                              <p className="text-sm text-amber-700">
                                This Instagram video requires authentication to download. This commonly happens when the video is from a private account or Instagram is rate-limiting server requests.
                              </p>
                              <div className="bg-amber-100 rounded-lg p-3 space-y-2">
                                <h5 className="text-sm font-semibold text-amber-800">✨ Alternative Solutions:</h5>
                                <div className="space-y-1 text-xs text-amber-700">
                                  <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                                    <span><strong>Upload Video:</strong> Use the "Upload Video" tab above</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                                    <span><strong>Facebook Ads:</strong> Use "Facebook Ad" tab for Meta ads</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                                    <span><strong>Try Different URL:</strong> Public posts work better</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-amber-600 italic">
                                💡 Video analysis works perfectly with uploaded files and Facebook ads!
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-red-600">{error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress display during analysis */}
                  {isAnalyzing && (
                    <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-center space-x-3">
                        <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h3 className="text-lg font-semibold text-blue-900">Analyzing Video</h3>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                      
                      {/* Status and progress info */}
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium text-blue-800">
                          {analysisStatus || 'Processing...'}
                        </p>
                        <p className="text-sm text-blue-600">
                          {analysisProgress}% complete
                        </p>
                        
                        {/* Time estimate */}
                        {timeEstimate && (
                          <div className="flex justify-center space-x-4 text-xs text-blue-600">
                            <span>Elapsed: {formatTime(timeEstimate.elapsed)}</span>
                            {timeEstimate.remaining > 0 && (
                              <span>Remaining: ~{formatTime(timeEstimate.remaining)}</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Phase details */}
                      {progress?.phase && (
                        <div className="text-center">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {progress.phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show analyze button only if there's content to analyze */}
                  {!isAnalyzing && ((inputMethod === 'url' && igUrl.trim()) || 
                    (inputMethod === 'upload' && uploadedFile) ||
                    (inputMethod === 'fbad' && fbAdUrl.trim())) && (
                    <button
                      type="submit"
                      className="btn-primary w-full text-lg"
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
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
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {analysisResults && (
            <div className="max-w-5xl mx-auto mt-8">
              <VideoAnalysis 
                results={analysisResults} 
                onCopyMarkdown={handleCopyRichText}
                isCopying={isCopying}
              />
            </div>
          )}
        </div>
      </main>

      {/* Cost Approval Modal */}
      {showCostApproval && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Confirm Analysis
              </h3>
              
                             <p className="text-sm text-gray-600 text-center mb-4">
                 This analysis will cost <strong>{estimatedCost} credits</strong>. You currently have{' '}
                 <strong>{profile?.credits_balance ?? profile?.credits ?? 0} credits</strong> available.
               </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCostApproval(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                                 <button
                   onClick={handleApproveAnalysis}
                   disabled={!profile || (profile.credits_balance ?? profile.credits ?? 0) < (estimatedCost || 0)}
                   className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {!profile || (profile.credits_balance ?? profile.credits ?? 0) < (estimatedCost || 0) 
                     ? 'Insufficient Credits' 
                     : 'Start Analysis'
                   }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </div>
  );
} 