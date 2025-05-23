'use client';

import { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

interface VideoUploaderProps {
  onUpload: (url: string) => Promise<void>;
}

export default function VideoUploader({ onUpload }: VideoUploaderProps) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      alert('Please enter an Instagram video URL');
      return;
    }

    // Basic Instagram URL validation
    const igUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/;
    if (!igUrlPattern.test(url)) {
      alert('Please enter a valid Instagram video URL');
      return;
    }

    try {
      setIsProcessing(true);
      await onUpload(url);
    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process video');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="igUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Instagram Video URL
          </label>
          <div className="flex gap-2">
            <input
              id="igUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing}
              className={`px-6 py-2 rounded-md flex items-center gap-2 ${
                isProcessing
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  Analyze
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Paste the URL of any public Instagram video post or reel
        </p>
      </form>
    </div>
  );
} 