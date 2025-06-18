import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { isSupabaseAvailable, getUserProfile, updateUserCredits, supabase } from '@/lib/supabase';

// Import the existing analysis logic
import { analyzeVideo } from '../analyze/route.js';

const execAsync = promisify(exec);

// Helper function to ensure upload directory exists
function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'temp', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// Helper function to get video duration using ffprobe
async function getVideoDuration(filePath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    throw new Error(`Failed to get video duration: ${error.message}`);
  }
}

export async function POST(request) {
  console.log('📁 Video upload analysis request received');
  
  try {
    const formData = await request.formData();
    const file = formData.get('video');
    const userId = formData.get('userId');
    const requestId = formData.get('requestId') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

    // Check user credits if Supabase is available
    if (isSupabaseAvailable()) {
      try {
        const profile = await getUserProfile(userId);
        
        if (!profile) {
          return NextResponse.json(
            { error: 'User profile not found' },
            { status: 404 }
          );
        }

        // Save uploaded file temporarily to get duration for credit calculation
        const uploadDir = ensureUploadDir();
        const fileId = uuidv4();
        const fileExtension = path.extname(file.name) || '.mp4';
        const tempFilePath = path.join(uploadDir, `${fileId}${fileExtension}`);

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

          // Use the existing video analysis function directly
          console.log(`🎬 Starting analysis of uploaded video: ${file.name}`);
          
          const analysisResult = await analyzeVideo(tempFilePath, userId, creditsNeeded, requestId, 'standard');

          // Clean up temp file
          fs.unlinkSync(tempFilePath);

          return NextResponse.json({
            ...analysisResult,
            requestId,
            videoSource: 'upload',
            originalFilename: file.name
          });

        } catch (error) {
          // Clean up temp file on error
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
          throw error;
        }
      } catch (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to verify user credits' },
          { status: 500 }
        );
      }
    } else {
      // Supabase not available - proceed without credit check (demo mode)
      console.log('⚠️ Supabase not available - proceeding without credit validation');
      
      const uploadDir = ensureUploadDir();
      const fileId = uuidv4();
      const fileExtension = path.extname(file.name) || '.mp4';
      const tempFilePath = path.join(uploadDir, `${fileId}${fileExtension}`);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(tempFilePath, buffer);

      try {
        console.log(`🎬 Starting analysis of uploaded video (demo mode): ${file.name}`);
        
        const analysisResult = await analyzeVideo(tempFilePath, null, null, requestId, 'standard');

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        return NextResponse.json({
          ...analysisResult,
          requestId,
          videoSource: 'upload',
          originalFilename: file.name,
          isDemoMode: true
        });

      } catch (error) {
        // Clean up temp file on error
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw error;
      }
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