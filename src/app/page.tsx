'use client';

import { useState, FormEvent } from 'react';
import VideoUploader from '@/components/VideoUploader';
import VideoAnalysis from '@/components/VideoAnalysis';

interface Shot {
  type: string;
  duration: string;
  description: string;
}

interface Effect {
  name: string;
  description: string;
  timestamps: string[];
}

interface Music {
  genre: string;
  bpm: number;
  energy: string;
  mood: string;
}

interface VideoAnalysis {
  contentStructure: string;
  hook: string;
  duration: string;
  shots: Shot[];
  effects: Effect[];
  music: Music;
}

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [igUrl, setIgUrl] = useState('');

  const handleAnalyze = async (url: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze video');
      }

      const data = await response.json();
      setAnalysisResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!igUrl.trim()) {
      setError('Please enter a valid Instagram video URL');
      return;
    }
    await handleAnalyze(igUrl);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Instagram Video Analyzer -development
          </h1>
          <p className="text-lg text-red-600">
            Analyze any public Instagram video using AI
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="igUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Video URL
              </label>
              <div className="flex gap-2">
                <input
                  id="igUrl"
                  type="url"
                  value={igUrl}
                  onChange={(e) => setIgUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 rounded-md flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      Analyzing...
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </>
                  ) : (
                    <>
                      Analyze
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">Paste the URL of any public Instagram video post or reel</p>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {analysisResults && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-6">Video Analysis</h2>
              
              <div className="space-y-6">
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Content Structure</h3>
                  <div className="prose max-w-none text-gray-600">
                    <p>{analysisResults.contentStructure}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium">Hook:</span> {analysisResults.hook}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium">Duration:</span> {analysisResults.duration}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Shot Composition</h3>
                  <div className="space-y-4">
                    {analysisResults.shots.map((shot: Shot, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{shot.type}</span>
                          <span className="text-sm text-gray-500">{shot.duration}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{shot.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Editing Effects</h3>
                  <div className="grid gap-4">
                    {analysisResults.effects.map((effect: Effect, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">{effect.name}</h4>
                        <p className="text-sm text-gray-600">{effect.description}</p>
                        <div className="mt-2 flex gap-2">
                          {effect.timestamps.map((timestamp: string, i: number) => (
                            <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {timestamp}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Music Analysis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="font-medium block mb-2">Genre</span>
                      <p className="text-gray-600">{analysisResults.music.genre}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="font-medium block mb-2">BPM</span>
                      <p className="text-gray-600">{analysisResults.music.bpm}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="font-medium block mb-2">Energy</span>
                      <p className="text-gray-600">{analysisResults.music.energy}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="font-medium block mb-2">Mood</span>
                      <p className="text-gray-600">{analysisResults.music.mood}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
