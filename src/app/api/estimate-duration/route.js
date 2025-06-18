import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(require('child_process').exec);

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Estimating duration for URL:', url);

    // Check if this is an Instagram URL
    const igUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/;
    const isInstagramUrl = igUrlPattern.test(url);

    let duration = null;
    let lastError = null;

    if (isInstagramUrl) {
      // Check if cookies file has actual content (not just comments)
      const hasCookies = () => {
        try {
          const fs = require('fs');
          const cookiesContent = fs.readFileSync('./instagram_cookies.txt', 'utf8');
          const lines = cookiesContent.split('\n');
          // Look for lines that don't start with # and contain actual cookie data
          const activeCookieLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed && 
                   !trimmed.startsWith('#') && 
                   !trimmed.startsWith('//') &&
                   trimmed.includes('\t') &&
                   trimmed.split('\t').length >= 6; // Netscape format has at least 6 tab-separated fields
          });
          console.log('🍪 Cookies file check', { 
            totalLines: lines.length,
            activeCookieLines: activeCookieLines.length,
            hasCookies: activeCookieLines.length > 0
          });
          return activeCookieLines.length > 0;
        } catch (error) {
          console.log('⚠️ Failed to read cookies file', { error: error.message });
          return false;
        }
      };

      // For Instagram URLs, try multiple strategies
      const strategies = [
        ...(hasCookies() ? [{
          name: 'cookies_file',
          command: `yt-dlp --get-duration "${url}" --cookies ./instagram_cookies.txt`
        }] : []),
        {
          name: 'no_cookies',
          command: `yt-dlp --get-duration "${url}"`
        },
        {
          name: 'embed_only',
          command: `yt-dlp --get-duration "${url}" --no-check-certificate`
        }
      ];

      for (const strategy of strategies) {
        try {
          console.log(`Trying duration estimation strategy: ${strategy.name}`);
          const { stdout } = await execAsync(strategy.command);
          duration = stdout.trim();
          console.log(`Duration estimation successful with ${strategy.name}:`, duration);
          break;
        } catch (error) {
          lastError = error;
          console.log(`Strategy ${strategy.name} failed:`, error.message);
          
          // If this is a login/authentication error, try next strategy
          if (error.message.includes('login required') || error.message.includes('rate-limit') || error.message.includes('Requested content is not available')) {
            console.log(`Authentication issue with ${strategy.name}, trying next strategy`);
            continue;
          }
        }
      }
    } else {
      // For non-Instagram URLs, use standard approach
      try {
        const { stdout } = await execAsync(`yt-dlp --get-duration "${url}"`);
        duration = stdout.trim();
        console.log('Video duration:', duration);
      } catch (error) {
        lastError = error;
        console.log('Duration estimation failed:', error.message);
      }
    }

    if (!duration) {
      console.log('All duration estimation strategies failed, using fallback');
      
      // Check if this is an authentication issue
      if (lastError?.message.includes('login required') || lastError?.message.includes('rate-limit')) {
        return NextResponse.json({
          duration: "15s",
          durationInSeconds: 15,
          estimatedCredits: 1,
          isEstimate: true,
          note: "Instagram requires authentication - using default estimate. The video analysis may still work with different methods."
        });
      } else {
        return NextResponse.json({
          duration: "15s",
          durationInSeconds: 15,
          estimatedCredits: 1,
          isEstimate: true,
          note: "Could not determine exact duration - using default estimate"
        });
      }
    }

    // Convert duration to seconds if it's in format like "0:15" or "1:30"
    let durationInSeconds;
    if (duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length === 2) {
        // Format: M:SS
        durationInSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        // Format: H:MM:SS
        durationInSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
    } else {
      // Assume it's already in seconds
      durationInSeconds = parseInt(duration);
    }

    return NextResponse.json({
      duration: duration,
      durationInSeconds: durationInSeconds,
      estimatedCredits: Math.ceil(durationInSeconds / 15)
    });

  } catch (error) {
    console.error('Error estimating duration:', error);
    
    // Return a default estimation for demo purposes
    return NextResponse.json({
      duration: "15s",
      durationInSeconds: 15,
      estimatedCredits: 1,
      isEstimate: true,
      note: "Could not determine exact duration - using default estimate"
    });
  }
} 