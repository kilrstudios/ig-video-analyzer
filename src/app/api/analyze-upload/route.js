import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Import the existing analysis logic
import { analyzeVideo } from '../analyze/route.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to ensure upload directory exists
function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'temp', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// Helper function to get video duration
function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration);
    });
  });
}

export async function POST(request) {
  console.log('📁 Video upload analysis request received');
  
  try {
    const formData = await request.formData();
    const file = formData.get('video');
    const userId = formData.get('userId');
    const requestId = formData.get('requestId');

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP4, WebM, MOV, or AVI files.' },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    console.log(`📁 Processing uploaded file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('credits_balance')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user credits' },
        { status: 500 }
      );
    }

    // Estimate credits needed based on duration
    const uploadDir = ensureUploadDir();
    const fileId = uuidv4();
    const fileExtension = path.extname(file.name) || '.mp4';
    const tempFilePath = path.join(uploadDir, `${fileId}${fileExtension}`);

    // Save uploaded file temporarily
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // Get video duration for credit calculation
      const duration = await getVideoDuration(tempFilePath);
      const creditsNeeded = Math.ceil(duration / 15); // 1 credit per 15 seconds

      console.log(`⏱️ Video duration: ${duration}s, Credits needed: ${creditsNeeded}`);

      if (profile.credits_balance < creditsNeeded) {
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        return NextResponse.json(
          { error: `Insufficient credits. Need ${creditsNeeded}, have ${profile.credits_balance}` },
          { status: 402 }
        );
      }

      // Create a temporary URL for the uploaded file
      const tempUrl = `file://${tempFilePath}`;
      
      // Use the existing video analysis logic
      const analysisResult = await analyzeUploadedVideo(tempFilePath, {
        userId,
        requestId,
        creditsNeeded,
        originalFilename: file.name
      });

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      return NextResponse.json(analysisResult);

    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Upload analysis error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to analyze uploaded video',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Modified analysis function for uploaded videos
async function analyzeUploadedVideo(filePath, options) {
  const { userId, requestId, creditsNeeded, originalFilename } = options;
  
  console.log(`🎬 Starting analysis of uploaded video: ${originalFilename}`);
  
  try {
    // Extract frames from the uploaded video
    const frameExtractDir = path.join(process.cwd(), 'temp', 'frames', requestId);
    if (!fs.existsSync(frameExtractDir)) {
      fs.mkdirSync(frameExtractDir, { recursive: true });
    }

    // Extract frames at 2fps (standard analysis)
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions([
          '-vf', 'fps=2', // 2 frames per second
          '-q:v', '2'     // High quality
        ])
        .output(path.join(frameExtractDir, 'frame_%04d.jpg'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Extract audio for transcription
    const audioPath = path.join(frameExtractDir, 'audio.wav');
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions([
          '-vn',           // No video
          '-acodec', 'pcm_s16le', // PCM format
          '-ar', '16000',  // 16kHz sample rate
          '-ac', '1'       // Mono
        ])
        .output(audioPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Get list of extracted frames
    const frameFiles = fs.readdirSync(frameExtractDir)
      .filter(file => file.startsWith('frame_') && file.endsWith('.jpg'))
      .sort()
      .map((file, index) => ({
        index,
        path: path.join(frameExtractDir, file),
        timestamp: index * 0.5 // 2fps = 0.5s intervals
      }));

    console.log(`🖼️ Extracted ${frameFiles.length} frames for analysis`);

    // Use the existing analysis logic with the extracted frames and audio
    const result = await performVideoAnalysis({
      frames: frameFiles,
      audioPath,
      userId,
      requestId,
      creditsNeeded,
      videoSource: 'upload',
      originalFilename
    });

    // Clean up extracted frames and audio
    fs.rmSync(frameExtractDir, { recursive: true, force: true });

    return result;

  } catch (error) {
    console.error('❌ Error analyzing uploaded video:', error);
    
    // Clean up on error
    const frameExtractDir = path.join(process.cwd(), 'temp', 'frames', requestId);
    if (fs.existsSync(frameExtractDir)) {
      fs.rmSync(frameExtractDir, { recursive: true, force: true });
    }
    
    throw error;
  }
}

// Import the core analysis logic from the main analyze route
// This would need to be refactored to share code properly
async function performVideoAnalysis(options) {
  // This is a placeholder - in a real implementation, you'd refactor
  // the analysis logic from route.js to be importable and reusable
  
  // For now, return a basic structure that matches the expected format
  return {
    totalDuration: `${Math.ceil(options.frames.length * 0.5)}s`,
    hook: "Analysis of uploaded video content",
    videoCategory: {
      category: "uploaded_content",
      confidence: 0.8,
      reasoning: "Uploaded video file analysis"
    },
    scenes: options.frames.map((frame, index) => ({
      sceneNumber: index + 1,
      title: `Scene ${index + 1}`,
      timeRange: `${frame.timestamp}s - ${frame.timestamp + 0.5}s`,
      duration: '0.5s',
      description: 'Uploaded video scene analysis',
      framing: { shotTypes: ['unknown'], cameraMovement: 'unknown', composition: 'unknown' },
      lighting: { style: 'unknown', mood: 'unknown' },
      mood: { emotional: 'unknown', atmosphere: 'unknown' },
      actionMovement: { movement: 'unknown' },
      audio: { music: 'unknown', dialogue: 'Processing...' },
      visualEffects: { effects: 'unknown' },
      settingEnvironment: { location: 'unknown', environment: 'unknown' },
      subjectsFocus: { main: 'unknown' },
      intentImpactAnalysis: {
        creatorIntent: 'Analysis in progress',
        viewerImpact: 'Determining impact...'
      }
    })),
    hooks: [{
      timestamp: '0s',
      type: 'opening_hook',
      impact: 'medium',
      description: 'Video opening analysis',
      element: 'Initial frame analysis'
    }],
    transcript: {
      text: 'Audio transcription in progress...',
      segments: []
    },
    strategicOverview: 'Strategic analysis of uploaded video content',
    contentStructure: 'Analyzing uploaded video structure...',
    contextualAnalysis: {
      creatorIntent: { primaryIntent: 'Content creation' },
      targetAudience: 'General audience'
    }
  };
} 