'use client';

import { useState } from 'react';
import VideoUploader from '@/components/VideoUploader';
import VideoAnalysis from '@/components/VideoAnalysis';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Instagram Video Analyzer
          </h1>
          <p className="text-lg text-red-600">
            Analyze any public Instagram video using AI
          </p>
        </div>

        <VideoUploader onUpload={handleAnalyze} />

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        <VideoAnalysis
          labels={analysisResults?.labels || []}
          shots={analysisResults?.shots || []}
          isLoading={isAnalyzing}
        />
      </div>
    </main>
  );
}
