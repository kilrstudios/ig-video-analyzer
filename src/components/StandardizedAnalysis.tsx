import React, { useState } from 'react';

interface StandardizedAnalysisProps {
  analysis: string;
  onCopyMarkdown: () => void;
  isCopying: boolean;
}

export default function StandardizedAnalysis({ analysis, onCopyMarkdown, isCopying }: StandardizedAnalysisProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['video-summary', 'why-it-works']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Parse the markdown analysis into sections
  const parseAnalysis = (text: string) => {
    const sections: Array<{ id: string; title: string; content: string; emoji: string }> = [];
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];
    
    const sectionEmojis = {
      'video-summary': '🎯',
      'why-it-works': '📈',
      'success-formula': '⭐',
      'adaptation-framework': '👥',
      'execution-blueprint': '⚙️',
      'success-metrics': '📊'
    };

    for (const line of lines) {
      if (line.startsWith('# ')) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          const sectionId = currentSection.toLowerCase().replace(/\s+/g, '-');
          sections.push({
            id: sectionId,
            title: currentSection,
            content: currentContent.join('\n'),
            emoji: sectionEmojis[sectionId as keyof typeof sectionEmojis] || '▶️'
          });
        }
        
        // Start new section
        currentSection = line.replace('# ', '');
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    
    // Add final section
    if (currentSection && currentContent.length > 0) {
      const sectionId = currentSection.toLowerCase().replace(/\s+/g, '-');
      sections.push({
        id: sectionId,
        title: currentSection,
        content: currentContent.join('\n'),
        emoji: sectionEmojis[sectionId as keyof typeof sectionEmojis] || '▶️'
      });
    }
    
    return sections;
  };

  const formatContent = (content: string) => {
    // Convert markdown-like formatting to JSX
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      
      // Handle headers
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            {line.replace('## ', '')}
          </h3>
        );
      }
      
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="text-md font-medium text-gray-800 mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      
      // Handle bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start gap-2 ml-4 mb-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span className="text-gray-700">{line.replace(/^[•-]\s*/, '')}</span>
          </div>
        );
      }
      
      // Handle bold text
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(line)) {
        const parts = line.split(boldRegex);
        return (
          <p key={index} className="text-gray-700 mb-2">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? 
                <strong key={partIndex} className="font-semibold text-gray-900">{part}</strong> : 
                part
            )}
          </p>
        );
      }
      
      // Regular paragraph
      if (line.trim()) {
        return (
          <p key={index} className="text-gray-700 mb-2">
            {line}
          </p>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  const sections = parseAnalysis(analysis);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Creator Strategy Report</h1>
          <div className="flex gap-2">
            <button
              onClick={onCopyMarkdown}
              disabled={isCopying}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <span>📋</span>
              {isCopying ? 'Copying...' : 'Copy Report'}
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          Actionable insights and replication framework for content creators
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{section.emoji}</span>
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                </div>
                <span className="text-gray-500 text-xl">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>
              
              {isExpanded && (
                <div className="p-6 bg-white">
                  <div className="prose prose-gray max-w-none">
                    {formatContent(section.content)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Access Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 text-lg">⚡</span>
            <h3 className="font-semibold text-blue-900">Quick Start</h3>
          </div>
          <p className="text-sm text-blue-700">
            Jump to Execution Blueprint for immediate implementation steps
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 text-lg">👥</span>
            <h3 className="font-semibold text-green-900">Adaptation</h3>
          </div>
          <p className="text-sm text-green-700">
            Check Adaptation Framework for industry-specific versions
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-600 text-lg">📊</span>
            <h3 className="font-semibold text-purple-900">Metrics</h3>
          </div>
          <p className="text-sm text-purple-700">
            Review Success Metrics for difficulty and platform fit
          </p>
        </div>
      </div>
    </div>
  );
} 