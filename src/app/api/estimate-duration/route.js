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

    // Use yt-dlp to get video info without downloading
    const { stdout } = await execAsync(`yt-dlp --get-duration "${url}"`);
    const duration = stdout.trim();

    console.log('Video duration:', duration);

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