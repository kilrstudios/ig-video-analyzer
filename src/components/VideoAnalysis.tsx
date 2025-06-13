'use client';

import { useState } from 'react';

interface SceneFraming {
  shotTypes: string[];
  cameraMovement: string;
  composition: string;
}

interface SceneLighting {
  style: string;
  mood: string;
  direction: string;
  quality: string;
}

interface SceneMood {
  emotional: string;
  atmosphere: string;
  tone: string;
}

interface SceneAction {
  movement: string;
  direction: string;
  pace: string;
}

interface SceneDialogue {
  hasText: boolean;
  textContent: string;
  textStyle: string;
}

interface SceneAudio {
  music: string;
  soundDesign: string;
  dialogue: string;
}

interface SceneVisualEffects {
  transitions: string;
  effects: string;
  graphics: string;
}

interface SceneSetting {
  location: string;
  environment: string;
  background: string;
}

interface SceneSubjects {
  main: string;
  secondary: string;
  focus: string;
}

interface SceneContextualMeaning {
  intent: string;
  execution: string;
  impact: string;
  significance: string;
}

interface Scene {
  sceneNumber: number;
  duration: string;
  timeRange: string;
  title: string;
  description: string;
  framing: SceneFraming;
  lighting: SceneLighting;
  mood: SceneMood;
  action: SceneAction;
  dialogue: SceneDialogue;
  audio: SceneAudio;
  visualEffects: SceneVisualEffects;
  setting: SceneSetting;
  subjects: SceneSubjects;
  contextualMeaning: SceneContextualMeaning;
}

interface VideoMetadata {
  totalFrames: number;
  frameRate: number;
  analysisTimestamp: string;
}

interface Hook {
  timestamp: string;
  type: 'visual_disrupter' | 'question' | 'positive_statement' | 'negative_statement';
  description: string;
  impact: 'high' | 'medium' | 'low';
  element: string;
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

interface StrategicOverview {
  videoOverview: string;
  whyItWorks: string;
  successFormula: string;
  universalPrinciples: string;
  technicalRequirements: string;
  implementationFramework: string;
  adaptabilityGuidelines: string;
  viralPotential: string;
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

interface VideoAnalysisProps {
  results: VideoAnalysis;
  onDownloadPdf: () => Promise<void>;
  isGeneratingPdf: boolean;
}

export default function VideoAnalysis({ results, onDownloadPdf, isGeneratingPdf }: VideoAnalysisProps) {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenes' | 'hooks' | 'transcript'>('overview');

  return (
    <div className="space-y-8">
      {/* Strategic Overview Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">📊 Video Analysis Overview</h2>
          <button
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6 16.5c.66 0 1.2-.54 1.2-1.2V9.375a.6.6 0 00-.6-.6H9.375A.6.6 0 009 9.375v7.875c0 .66.54 1.2 1.2 1.2h1.425z" clipRule="evenodd" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: '📋 Overview', icon: '📋' },
            { id: 'scenes', label: '🎬 Scenes', icon: '🎬' },
            { id: 'hooks', label: '🎯 Hooks', icon: '🎯' },
            { id: 'transcript', label: '📝 Transcript', icon: '📝' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Video Category */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Video Category</h3>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {results.videoCategory.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="text-sm text-blue-600">
                  {(results.videoCategory.confidence * 100).toFixed(1)}% confidence
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-2">{results.videoCategory.reasoning}</p>
            </div>

            {/* Strategic Overview */}
            {results.strategicOverview && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Strategic Analysis</h3>
                {typeof results.strategicOverview === 'string' ? (
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {results.strategicOverview}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Video Overview</h4>
                      <p className="text-blue-800">{results.strategicOverview.videoOverview}</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Why It Works</h4>
                      <p className="text-green-800">{results.strategicOverview.whyItWorks}</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">Success Formula</h4>
                      <p className="text-purple-800">{results.strategicOverview.successFormula}</p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-900 mb-2">Universal Principles</h4>
                      <p className="text-orange-800">{results.strategicOverview.universalPrinciples}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Technical Requirements</h4>
                      <p className="text-gray-800">{results.strategicOverview.technicalRequirements}</p>
                    </div>
                    
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-900 mb-2">Implementation Framework</h4>
                      <p className="text-indigo-800">{results.strategicOverview.implementationFramework}</p>
                    </div>
                    
                    <div className="bg-pink-50 rounded-lg p-4">
                      <h4 className="font-semibold text-pink-900 mb-2">Adaptability Guidelines</h4>
                      <p className="text-pink-800">{results.strategicOverview.adaptabilityGuidelines}</p>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">Viral Potential</h4>
                      <p className="text-red-800">{results.strategicOverview.viralPotential}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Duration</h4>
                <p className="text-2xl font-bold text-blue-600">{results.totalDuration}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Scenes</h4>
                <p className="text-2xl font-bold text-green-600">{results.scenes.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Hooks</h4>
                <p className="text-2xl font-bold text-purple-600">{results.hooks.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scenes' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Scene-by-Scene Analysis</h3>
            <div className="grid gap-4">
              {results.scenes.map((scene, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedScene(selectedScene === scene ? null : scene)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">
                      Scene {scene.sceneNumber}: {scene.title}
                    </h4>
                    <span className="text-sm text-gray-500">{scene.duration}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{scene.description}</p>
                  
                  {selectedScene === scene && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Framing:</strong> {scene.framing.shotTypes.join(', ')}
                        </div>
                        <div>
                          <strong>Lighting:</strong> {scene.lighting.style}
                        </div>
                        <div>
                          <strong>Mood:</strong> {scene.mood.emotional}
                        </div>
                        <div>
                          <strong>Setting:</strong> {scene.setting.location}
                        </div>
                      </div>
                      {scene.dialogue.hasText && (
                        <div>
                          <strong>Dialogue:</strong> {scene.dialogue.textContent}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'hooks' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Engagement Hooks</h3>
            <div className="grid gap-3">
              {results.hooks.map((hook, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      hook.impact === 'high' ? 'bg-red-100 text-red-800' :
                      hook.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {hook.impact.toUpperCase()} IMPACT
                    </span>
                    <span className="text-sm text-gray-500">{hook.timestamp}</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {hook.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  <p className="text-sm text-gray-600">{hook.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Audio Transcript</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {results.transcript.segments && results.transcript.segments.length > 0 ? (
                <div className="space-y-3">
                  {results.transcript.segments.map((segment, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="text-xs text-gray-500 font-mono min-w-[60px]">
                        {Math.floor(segment.start)}s
                      </span>
                      <p className="text-sm text-gray-700">{segment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">{results.transcript.text || 'No transcript available'}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 