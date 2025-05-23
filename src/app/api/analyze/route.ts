import { Storage } from '@google-cloud/storage';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: 'service-account.json',
});

const videoIntelligence = new VideoIntelligenceServiceClient({
  keyFilename: 'service-account.json',
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET || '');

async function downloadVideo(url: string): Promise<string> {
  try {
    console.log('Downloading video from:', url);
    
    // Create a temporary directory for downloads if it doesn't exist
    const downloadDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }

    // Generate a unique filename
    const outputPath = path.join(downloadDir, `${Date.now()}.mp4`);
    
    // Use yt-dlp to download the video
    const command = `yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' '${url}' -o '${outputPath}'`;
    console.log('Executing command:', command);
    
    const { stdout, stderr } = await execAsync(command);
    console.log('yt-dlp stdout:', stdout);
    if (stderr) console.error('yt-dlp stderr:', stderr);

    if (!fs.existsSync(outputPath)) {
      throw new Error('Video download failed - output file not found');
    }

    console.log('Video downloaded successfully to:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

async function cleanupFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Cleaned up file:', filePath);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
}

export async function POST(request: NextRequest) {
  let downloadedFilePath: string | null = null;
  
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'No video URL provided' },
        { status: 400 }
      );
    }

    console.log('Processing request for URL:', url);

    // Download video using yt-dlp
    downloadedFilePath = await downloadVideo(url);
    console.log('Video downloaded to:', downloadedFilePath);

    // Read the downloaded file
    const videoBuffer = fs.readFileSync(downloadedFilePath);
    console.log('Video file read into buffer');

    // Upload to GCS
    const filename = `uploads/${Date.now()}-video.mp4`;
    const file = bucket.file(filename);
    
    console.log('Uploading to GCS:', filename);
    await file.save(videoBuffer, {
      metadata: {
        contentType: 'video/mp4',
      },
    });
    console.log('Successfully uploaded to GCS');

    // Clean up the downloaded file
    await cleanupFile(downloadedFilePath);
    downloadedFilePath = null;

    // Get the GCS URI for the uploaded file
    const gcsUri = `gs://${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;
    console.log('GCS URI:', gcsUri);

    // Start video analysis
    console.log('Starting video analysis...');
    const [operation] = await videoIntelligence.annotateVideo({
      inputUri: gcsUri,
      features: [
        'LABEL_DETECTION',
        'SHOT_CHANGE_DETECTION',
        'SPEECH_TRANSCRIPTION',
        'TEXT_DETECTION',
        'EXPLICIT_CONTENT_DETECTION'
      ],
      videoContext: {
        labelDetectionConfig: {
          labelDetectionMode: 'SHOT_AND_FRAME_MODE',
          stationaryCamera: false,
        },
        speechTranscriptionConfig: {
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
        },
        textDetectionConfig: {
          languageHints: ['en'],
        },
      },
    });

    console.log('Waiting for analysis to complete...');
    const [response] = await operation.promise();
    console.log('Analysis completed');
    
    // Clean up - delete the uploaded video from GCS
    await file.delete();
    console.log('Deleted uploaded video from GCS:', filename);

    // Process and return results
    const labels = response.annotationResults?.[0]?.shotLabelAnnotations || [];
    const shots = response.annotationResults?.[0]?.shotAnnotations || [];
    const speechTranscriptions = response.annotationResults?.[0]?.speechTranscriptions || [];
    const textAnnotations = response.annotationResults?.[0]?.textAnnotations || [];
    const explicitAnnotations = response.annotationResults?.[0]?.explicitAnnotation?.frames || [];

    const processedLabels = labels.map((label: any) => ({
      description: label.entity?.description || '',
      confidence: label.segments?.[0]?.confidence || 0,
      segments: (label.segments || []).map((segment: any) => ({
        startTime: `${Math.floor(segment.segment?.startTimeOffset?.seconds || 0)}s`,
        endTime: `${Math.floor(segment.segment?.endTimeOffset?.seconds || 0)}s`,
      })),
    }));

    // Process shots with additional context
    const processedShots = shots.map((shot: any, index: number) => {
      const startTime = Math.floor(shot.startTimeOffset?.seconds || 0);
      const endTime = Math.floor(shot.endTimeOffset?.seconds || 0);
      
      // Find labels active during this shot
      const shotLabels = labels
        .filter((label: any) => {
          const labelSegments = label.segments || [];
          return labelSegments.some((segment: any) => {
            const segmentStart = Math.floor(segment.segment?.startTimeOffset?.seconds || 0);
            const segmentEnd = Math.floor(segment.segment?.endTimeOffset?.seconds || 0);
            return segmentStart <= endTime && segmentEnd >= startTime;
          });
        })
        .map((label: any) => label.entity?.description)
        .filter(Boolean);

      // Find speech during this shot
      const shotSpeech = speechTranscriptions
        .flatMap((transcription: any) => transcription.alternatives?.[0]?.words || [])
        .filter((word: any) => {
          const wordStart = Math.floor(word.startTime?.seconds || 0);
          const wordEnd = Math.floor(word.endTime?.seconds || 0);
          return wordStart >= startTime && wordEnd <= endTime;
        })
        .map((word: any) => word.word)
        .join(' ');

      // Find text annotations during this shot
      const shotText = textAnnotations
        .filter((text: any) => {
          const textStart = Math.floor(text.segments?.[0]?.segment?.startTimeOffset?.seconds || 0);
          const textEnd = Math.floor(text.segments?.[0]?.segment?.endTimeOffset?.seconds || 0);
          return textStart >= startTime && textEnd <= endTime;
        })
        .map((text: any) => text.text)
        .join(' ');

      // Find explicit content during this shot
      const shotExplicitContent = explicitAnnotations
        .filter((frame: any) => {
          const frameTime = Math.floor(frame.timeOffset?.seconds || 0);
          return frameTime >= startTime && frameTime <= endTime;
        })
        .map((frame: any) => frame.pornographyLikelihood)
        .filter((likelihood: string) => likelihood !== 'UNLIKELY' && likelihood !== 'VERY_UNLIKELY');

      return {
        startTime: `${startTime}s`,
        endTime: `${endTime}s`,
        confidence: shot.confidence || 0,
        frameRate: shot.frameRate || 0,
        duration: `${endTime - startTime}s`,
        composition: {
          labels: shotLabels,
          speech: shotSpeech || null,
          onScreenText: shotText || null,
          contentWarnings: shotExplicitContent.length > 0 ? shotExplicitContent : null
        }
      };
    });

    return NextResponse.json({
      labels: processedLabels,
      shots: processedShots
    });
  } catch (error) {
    console.error('Full error details:', error);
    
    // Clean up downloaded file if it exists
    if (downloadedFilePath) {
      await cleanupFile(downloadedFilePath);
    }
    
    return NextResponse.json(
      { error: `Failed to analyze video: ${error.message}` },
      { status: 500 }
    );
  }
} 