'use client';

import { useState } from 'react';

interface Label {
  description: string;
  confidence: number;
  segments: {
    startTime: string;
    endTime: string;
  }[];
}

interface VideoAnalysisProps {
  labels: Label[];
  isLoading: boolean;
}

export default function VideoAnalysis({ labels, isLoading }: VideoAnalysisProps) {
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!labels?.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Video Analysis Results</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Detected Labels</h3>
          <div className="space-y-2">
            {labels.map((label, index) => (
              <button
                key={index}
                onClick={() => setSelectedLabel(label)}
                className={`w-full text-left p-3 rounded-lg transition-colors
                  ${selectedLabel === label 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span>{label.description}</span>
                  <span className="text-sm text-gray-500">
                    {(label.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Timestamps</h3>
          {selectedLabel ? (
            <div className="space-y-2">
              {selectedLabel.segments.map((segment, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between text-sm">
                    <span>Start: {segment.startTime}</span>
                    <span>End: {segment.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              Select a label to view its timestamps
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 