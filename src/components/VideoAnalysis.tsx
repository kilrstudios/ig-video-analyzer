'use client';

import { useState } from 'react';
import StandardizedAnalysis from './StandardizedAnalysis';

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

interface VideoAnalysisProps {
  results: VideoAnalysis;
  onCopyMarkdown: () => Promise<void>;
  isCopying: boolean;
}

export default function VideoAnalysis({ results, onCopyMarkdown, isCopying }: VideoAnalysisProps) {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [activeTab, setActiveTab] = useState<'standardized' | 'overview' | 'scenes' | 'hooks' | 'transcript'>(results.standardizedAnalysis ? 'standardized' : 'overview');

  return (
    <div className="space-y-8">
      {/* Strategic Overview Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">📊 Video Analysis Overview</h2>
          <button
            onClick={onCopyMarkdown}
            disabled={isCopying}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isCopying ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Copying Rich Text...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6 16.5c.66 0 1.2-.54 1.2-1.2V9.375a.6.6 0 00-.6-.6H9.375A.6.6 0 009 9.375v7.875c0 .66.54 1.2 1.2 1.2h1.425z" clipRule="evenodd" />
                </svg>
                Copy Rich Text
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            ...(results.standardizedAnalysis ? [{ id: 'standardized', label: '🎯 Creator Strategy', icon: '🎯' }] : []),
            { id: 'overview', label: '📋 Overview', icon: '📋' },
            { id: 'scenes', label: '🎬 Scenes', icon: '🎬' },
            { id: 'hooks', label: '🔗 Hooks', icon: '🔗' },
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
        {activeTab === 'standardized' && results.standardizedAnalysis && (
          <StandardizedAnalysis 
            analysis={results.standardizedAnalysis}
            onCopyMarkdown={onCopyMarkdown}
            isCopying={isCopying}
          />
        )}

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
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Strategic Analysis
                </h3>
                {typeof results.strategicOverview === 'string' ? (
                  <div className="strategic-analysis-content">
                    {(() => {
                      const lines = results.strategicOverview.split('\n');
                      const sections: JSX.Element[] = [];
                      
                      // Process sections with a simpler approach
                      const processedSections: Array<{
                        title: string;
                        content: string[];
                        bgColor: string;
                        textColor: string;
                        borderColor: string;
                      }> = [];
                      
                      let currentSection: {
                        title: string;
                        content: string[];
                        bgColor: string;
                        textColor: string;
                        borderColor: string;
                      } | null = null;

                      lines.forEach((line, index) => {
                        // Handle main headings (##)
                        if (line.startsWith('## ')) {
                          // Close previous section if exists
                          if (currentSection) {
                            processedSections.push(currentSection);
                            currentSection = null;
                          }

                          const mainHeading = line.replace('## ', '');
                          sections.push(
                            <h2 key={`heading-${index}`} className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-blue-200 flex items-center">
                              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {mainHeading}
                              </span>
                            </h2>
                          );
                          return;
                        }
                        
                        // Handle sub-headings (###)
                        if (line.startsWith('### ')) {
                          // Close previous section if exists
                          if (currentSection) {
                            processedSections.push(currentSection);
                          }

                          const title = line.replace('### ', '');
                          let bgColor = 'bg-blue-50';
                          let textColor = 'text-blue-900';
                          let borderColor = 'border-l-blue-500';
                          
                          // Color code different sections
                          if (title.includes('Why It Works')) {
                            bgColor = 'bg-green-50';
                            textColor = 'text-green-900';
                            borderColor = 'border-l-green-500';
                          } else if (title.includes('Success Formula')) {
                            bgColor = 'bg-purple-50';
                            textColor = 'text-purple-900';
                            borderColor = 'border-l-purple-500';
                          } else if (title.includes('Universal Principles')) {
                            bgColor = 'bg-orange-50';
                            textColor = 'text-orange-900';
                            borderColor = 'border-l-orange-500';
                          } else if (title.includes('Technical Requirements')) {
                            bgColor = 'bg-gray-50';
                            textColor = 'text-gray-900';
                            borderColor = 'border-l-gray-500';
                          } else if (title.includes('Implementation')) {
                            bgColor = 'bg-indigo-50';
                            textColor = 'text-indigo-900';
                            borderColor = 'border-l-indigo-500';
                          } else if (title.includes('Adaptability')) {
                            bgColor = 'bg-pink-50';
                            textColor = 'text-pink-900';
                            borderColor = 'border-l-pink-500';
                          } else if (title.includes('Resource')) {
                            bgColor = 'bg-yellow-50';
                            textColor = 'text-yellow-900';
                            borderColor = 'border-l-yellow-500';
                          }
                          
                          currentSection = { title, content: [], bgColor, textColor, borderColor };
                          return;
                        }
                        
                        // Add content to current section
                        if (currentSection && line.trim()) {
                          let formattedLine = line;
                          
                          // Handle bullet points
                          if (line.trim().startsWith('- ')) {
                            formattedLine = `<div class="ml-4 mb-2 flex items-start"><span class="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span><span class="text-gray-700 leading-relaxed">${line.replace('- ', '')}</span></div>`;
                          }
                          // Handle numbered lists
                          else if (line.trim().match(/^\d+\./)) {
                            const number = line.trim().match(/^(\d+)/)?.[1];
                            formattedLine = `<div class="ml-4 mb-2 flex items-start"><span class="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full mr-3 flex-shrink-0 mt-0.5">${number}</span><span class="text-gray-700 leading-relaxed">${line.replace(/^\d+\.\s*/, '')}</span></div>`;
                          }
                          // Handle bold text (**text**)
                          else if (line.includes('**')) {
                            formattedLine = `<p class="text-gray-700 leading-relaxed mb-3">${line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')}</p>`;
                          }
                          // Handle regular paragraphs
                          else {
                            formattedLine = `<p class="text-gray-700 leading-relaxed mb-3">${line}</p>`;
                          }
                          
                          currentSection.content.push(formattedLine);
                        }
                      });

                      // Close final section if exists
                      if (currentSection) {
                        processedSections.push(currentSection);
                      }

                      // Render all processed sections
                      processedSections.forEach((section, index) => {
                        sections.push(
                          <div key={`section-${index}`} className={`${section.bgColor} rounded-lg p-4 mt-6 mb-4 border-l-4 ${section.borderColor} section-card`}>
                            <h3 className={`font-semibold ${section.textColor} mb-3 text-lg`}>
                              {section.title}
                            </h3>
                            <div className="section-content">
                              {section.content.map((contentLine: string, contentIndex: number) => (
                                <div key={contentIndex} dangerouslySetInnerHTML={{ __html: contentLine }} />
                              ))}
                            </div>
                          </div>
                        );
                      });

                      return sections;
                    })()}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.strategicOverview.videoOverview && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Video Overview</h4>
                      <p className="text-blue-800">{results.strategicOverview.videoOverview}</p>
                    </div>
                    )}
                    
                    {results.strategicOverview.narrativeArc && (
                      <div className="bg-teal-50 rounded-lg p-4">
                        <h4 className="font-semibold text-teal-900 mb-2">📖 Narrative Arc Analysis</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="inline-block px-2 py-1 bg-teal-100 text-teal-800 rounded text-sm font-medium mb-2">
                              {results.strategicOverview.narrativeArc.arcType?.toUpperCase()} STRUCTURE
                            </span>
                          </div>
                          <div>
                            <h5 className="font-medium text-teal-900 mb-1">Story Progression:</h5>
                            <p className="text-teal-800 text-sm">{results.strategicOverview.narrativeArc.structure}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-teal-900 mb-1">Key Story Beats:</h5>
                            <p className="text-teal-800 text-sm">{results.strategicOverview.narrativeArc.keyBeats}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {results.strategicOverview.whyItWorks && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Why It Works</h4>
                      <p className="text-green-800">{results.strategicOverview.whyItWorks}</p>
                    </div>
                    )}
                    
                    {results.strategicOverview.successFormula && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">Success Formula</h4>
                      <p className="text-purple-800">{results.strategicOverview.successFormula}</p>
                    </div>
                    )}
                    
                    {results.strategicOverview.universalPrinciples && (
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-900 mb-2">Universal Principles</h4>
                      <p className="text-orange-800">{results.strategicOverview.universalPrinciples}</p>
                    </div>
                    )}
                    
                    {results.strategicOverview.technicalRequirements && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Technical Requirements</h4>
                      <p className="text-gray-800">{results.strategicOverview.technicalRequirements}</p>
                    </div>
                    )}
                    
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-900 mb-2">🎬 Implementation Framework</h4>
                      <div className="space-y-3">
                        {results.strategicOverview.implementationFramework ? (
                          <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-indigo-100 rounded-lg p-3">
                            <h5 className="font-medium text-indigo-900 mb-1 text-sm">📋 Pre-Production</h5>
                            <p className="text-indigo-800 text-xs">{results.strategicOverview.implementationFramework.preProduction}</p>
                          </div>
                          <div className="bg-indigo-100 rounded-lg p-3">
                            <h5 className="font-medium text-indigo-900 mb-1 text-sm">🎥 Production</h5>
                            <p className="text-indigo-800 text-xs">{results.strategicOverview.implementationFramework.production}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-indigo-100 rounded-lg p-3">
                            <h5 className="font-medium text-indigo-900 mb-1 text-sm">✂️ Post-Production</h5>
                            <p className="text-indigo-800 text-xs">{results.strategicOverview.implementationFramework.postProduction}</p>
                          </div>
                          <div className="bg-indigo-100 rounded-lg p-3">
                            <h5 className="font-medium text-indigo-900 mb-1 text-sm">📊 Success Metrics</h5>
                            <p className="text-indigo-800 text-xs">{results.strategicOverview.implementationFramework.successMetrics}</p>
                          </div>
                        </div>
                          </>
                        ) : (
                          <div className="bg-gray-100 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Implementation framework details are being generated...</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {results.strategicOverview.adaptabilityGuidelines && (
                    <div className="bg-pink-50 rounded-lg p-4">
                      <h4 className="font-semibold text-pink-900 mb-2">Adaptability Guidelines</h4>
                      <p className="text-pink-800">{results.strategicOverview.adaptabilityGuidelines}</p>
                    </div>
                    )}
                    
                    {results.strategicOverview.viralPotential && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">Viral Potential</h4>
                      <p className="text-red-800">{results.strategicOverview.viralPotential}</p>
                    </div>
                    )}
                    
                    {results.strategicOverview.resourceScaling && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Resource Scaling</h4>
                        <p className="text-yellow-800">{results.strategicOverview.resourceScaling}</p>
                      </div>
                    )}
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
            <h3 className="font-semibold text-gray-900">Scene by Scene Analysis</h3>
            <div className="grid gap-6">
              {results.scenes.map((scene, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  {/* Scene Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-1">
                        Scene {scene.sceneNumber}
                      </h4>
                      <h5 className="text-lg font-medium text-blue-600 mb-2">
                        {scene.title}
                      </h5>
                      <p className="text-gray-600 mb-3">{scene.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{scene.duration}</div>
                      <div className="text-xs text-gray-500">{scene.timeRange}</div>
                    </div>
                  </div>

                  {/* Technical Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {/* Framing & Composition */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h6 className="font-semibold text-blue-900 mb-2 text-sm">📹 Framing & Composition</h6>
                      <div className="space-y-1 text-xs">
                        <div><strong>Shot Types:</strong> {scene.framing?.shotTypes?.join(', ') || 'N/A'}</div>
                        <div><strong>Camera Movement:</strong> {scene.framing?.cameraMovement || 'N/A'}</div>
                        <div><strong>Composition:</strong> {scene.framing?.composition || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Lighting */}
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <h6 className="font-semibold text-yellow-900 mb-2 text-sm">💡 Lighting</h6>
                      <div className="space-y-1 text-xs">
                        <div><strong>Style:</strong> {scene.lighting?.style || 'N/A'}</div>
                        <div><strong>Mood:</strong> {scene.lighting?.mood || 'N/A'}</div>
                        <div><strong>Direction:</strong> {scene.lighting?.direction || 'N/A'}</div>
                        <div><strong>Quality:</strong> {scene.lighting?.quality || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Mood & Atmosphere */}
                    <div className="bg-purple-50 rounded-lg p-3">
                      <h6 className="font-semibold text-purple-900 mb-2 text-sm">🎭 Mood & Atmosphere</h6>
                      <div className="space-y-1 text-xs">
                        <div><strong>Emotional:</strong> {scene.mood?.emotional || 'N/A'}</div>
                        <div><strong>Atmosphere:</strong> {scene.mood?.atmosphere || 'N/A'}</div>
                        <div><strong>Tone:</strong> {scene.mood?.tone || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Action & Movement */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <h6 className="font-semibold text-green-900 mb-2 text-sm">🎬 Action & Movement</h6>
                      <div className="space-y-1 text-xs">
                        <div><strong>Movement:</strong> {scene.actionMovement?.movement || 'N/A'}</div>
                        <div><strong>Direction:</strong> {scene.actionMovement?.direction || 'N/A'}</div>
                        <div><strong>Pace:</strong> {scene.actionMovement?.pace || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Audio */}
                    <div className="bg-red-50 rounded-lg p-3">
                      <h6 className="font-semibold text-red-900 mb-2 text-sm">🎵 Audio</h6>
                      <div className="space-y-1 text-xs">
                        <div><strong>Music:</strong> {scene.audio?.music || 'N/A'}</div>
                        <div><strong>Sound Design:</strong> {scene.audio?.soundDesign || 'N/A'}</div>
                        <div><strong>Dialogue:</strong> {scene.audio?.dialogue || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Visual Effects */}
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <h6 className="font-semibold text-indigo-900 mb-2 text-sm">✨ Visual Effects</h6>
                      <div className="space-y-1 text-xs">
                        <div><strong>Transitions:</strong> {scene.visualEffects?.transitions || 'N/A'}</div>
                        <div><strong>Effects:</strong> {scene.visualEffects?.effects || 'N/A'}</div>
                        <div><strong>Graphics:</strong> {scene.visualEffects?.graphics || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Setting & Subjects */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h6 className="font-semibold text-gray-900 mb-2 text-sm">🏞️ Setting & Environment</h6>
                      <div className="space-y-1 text-xs">
                        <div><strong>Location:</strong> {scene.settingEnvironment?.location || 'N/A'}</div>
                        <div><strong>Environment:</strong> {scene.settingEnvironment?.environment || 'N/A'}</div>
                        <div><strong>Background:</strong> {scene.settingEnvironment?.background || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3">
                      <h6 className="font-semibold text-orange-900 mb-2 text-sm">👥 Subjects & Focus</h6>
                      <div className="space-y-1 text-xs">
                        <div><strong>Main:</strong> {scene.subjectsFocus?.main || 'N/A'}</div>
                        <div><strong>Secondary:</strong> {scene.subjectsFocus?.secondary || 'N/A'}</div>
                        <div><strong>Focus:</strong> {scene.subjectsFocus?.focus || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Intent & Impact Analysis */}
                  <div className="bg-teal-50 rounded-lg p-4 mb-4">
                    <h6 className="font-semibold text-teal-900 mb-3 text-sm">🧠 Intent & Impact Analysis</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="mb-2">
                          <strong>Creator Intent</strong>
                          <p className="text-teal-800 mt-1">{scene.intentImpactAnalysis?.creatorIntent || 'N/A'}</p>
                        </div>
                        <div>
                          <strong>How It's Executed</strong>
                          <p className="text-teal-800 mt-1">{scene.intentImpactAnalysis?.howExecuted || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <div className="mb-2">
                          <strong>Viewer Impact</strong>
                          <p className="text-teal-800 mt-1">{scene.intentImpactAnalysis?.viewerImpact || 'N/A'}</p>
                        </div>
                        <div>
                          <strong>Narrative Significance</strong>
                          <p className="text-teal-800 mt-1">{scene.intentImpactAnalysis?.narrativeSignificance || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text & Dialogue */}
                  {scene.textDialogue?.content && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <h6 className="font-semibold text-pink-900 mb-2 text-sm">💬 Text & Dialogue</h6>
                      <div className="text-xs">
                        <div><strong>Content:</strong> {scene.textDialogue.content}</div>
                        <div><strong>Style:</strong> {scene.textDialogue.style || 'N/A'}</div>
                      </div>
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