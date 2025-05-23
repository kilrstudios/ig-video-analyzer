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

interface Shot {
  startTime: string;
  endTime: string;
  confidence: number;
  frameRate: number;
  duration: string;
  composition: {
    labels: string[];
    speech: string | null;
    onScreenText: string | null;
    contentWarnings: string[] | null;
  };
}

interface VideoAnalysisProps {
  labels: Label[];
  shots: Shot[];
  isLoading: boolean;
}

export default function VideoAnalysis({ labels, shots, isLoading }: VideoAnalysisProps) {
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null);
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);

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

  if (!labels?.length && !shots?.length) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Labels Section */}
      {labels.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Content Analysis</h2>
          
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
      )}

      {/* Shot Detection Section */}
      {shots?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Scene Analysis</h2>
          <div className="space-y-6">
            {/* Timeline View */}
            <div className="grid gap-4">
              {shots.map((shot, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedShot(shot)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedShot === shot
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Scene {index + 1}</span>
                      <span className="text-sm text-gray-500">
                        Duration: {shot.duration}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Start: </span>
                        {shot.startTime}
                      </div>
                      <div>
                        <span className="text-gray-600">End: </span>
                        {shot.endTime}
                      </div>
                    </div>

                    {/* Scene Content */}
                    <div className="space-y-2">
                      {/* Visual Elements */}
                      {shot.composition.labels.length > 0 && (
                        <div>
                          <span className="text-gray-600 text-sm">Visual Elements: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {shot.composition.labels.map((label, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Speech/Dialogue */}
                      {shot.composition.speech && (
                        <div>
                          <span className="text-gray-600 text-sm">Dialogue: </span>
                          <p className="mt-1 text-sm italic">"{shot.composition.speech}"</p>
                        </div>
                      )}

                      {/* On-screen Text */}
                      {shot.composition.onScreenText && (
                        <div>
                          <span className="text-gray-600 text-sm">On-screen Text: </span>
                          <p className="mt-1 text-sm">{shot.composition.onScreenText}</p>
                        </div>
                      )}

                      {/* Technical Details */}
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Frame Rate: {shot.frameRate.toFixed(2)} fps</span>
                        <span>Confidence: {(shot.confidence * 100).toFixed(1)}%</span>
                      </div>

                      {/* Content Warnings */}
                      {shot.composition.contentWarnings && (
                        <div className="mt-2">
                          <span className="text-red-600 text-xs">
                            Content Warning: {shot.composition.contentWarnings.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 