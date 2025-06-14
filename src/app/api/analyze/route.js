import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const execAsync = promisify(exec);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting configuration
const RATE_LIMIT_DELAY = 3000; // 3 seconds between requests
const MAX_RETRIES = 2; // Reduced retries to avoid long waits

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to log with timestamp
function logWithTimestamp(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper function to handle rate limits
async function handleRateLimit(fn, retries = MAX_RETRIES) {
  const startTime = Date.now();
  try {
    logWithTimestamp(`🔄 Executing OpenAI API call with ${retries} retries left`);
    const result = await fn();
    const duration = Date.now() - startTime;
    logWithTimestamp(`✅ OpenAI API call successful`, { duration: `${duration}ms` });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp(`❌ OpenAI API call failed`, { 
      duration: `${duration}ms`,
      error: error.message,
      code: error.code,
      status: error.status,
      headers: error.headers
    });
    
    if ((error.code === 'rate_limit_exceeded' || error.status === 429) && retries > 0) {
      // Extract retry-after from headers if available, otherwise use default delay
      const retryAfterMs = error.headers?.['retry-after-ms'];
      const retryAfterSec = error.headers?.['retry-after'];
      let waitTime = RATE_LIMIT_DELAY;
      
      if (retryAfterMs) {
        waitTime = parseInt(retryAfterMs) + 1000; // Add 1 second buffer
      } else if (retryAfterSec) {
        waitTime = parseInt(retryAfterSec) * 1000 + 1000; // Convert to ms and add buffer
      }
      
      logWithTimestamp(`⏳ Rate limit hit, waiting ${waitTime}ms before retry. Retries left: ${retries - 1}`);
      await wait(waitTime);
      return handleRateLimit(fn, retries - 1);
    }
    throw error;
  }
}

async function downloadVideo(url) {
  const startTime = Date.now();
  logWithTimestamp('🎥 Starting video download', { url });
  
  try {
    // Validate URL format
    const igUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/;
    if (!igUrlPattern.test(url)) {
      throw new Error(`Invalid Instagram URL format: ${url}`);
    }
    logWithTimestamp('✅ URL validation passed');
    
    // Create a temporary directory for downloads if it doesn't exist
    const downloadDir = path.join(process.cwd(), 'temp');
    logWithTimestamp('📁 Checking temp directory', { downloadDir });
    
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
      logWithTimestamp('📁 Created temp directory');
    } else {
      logWithTimestamp('📁 Temp directory already exists');
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const outputPath = path.join(downloadDir, `video_${timestamp}.mp4`);
    logWithTimestamp('📝 Generated output path', { outputPath });
    
    // Use yt-dlp to download the video - force merge to single file
    const command = `yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' '${url}' -o '${outputPath}' --merge-output-format mp4 --verbose`;
    logWithTimestamp('🔧 Executing yt-dlp command', { command });
    
    const execStartTime = Date.now();
    const { stdout, stderr } = await execAsync(command, { timeout: 120000 }); // 2 minute timeout
    const execDuration = Date.now() - execStartTime;
    
    logWithTimestamp('📊 yt-dlp execution completed', { 
      duration: `${execDuration}ms`,
      stdoutLength: stdout?.length || 0,
      stderrLength: stderr?.length || 0
    });
    
    if (stdout) logWithTimestamp('📋 yt-dlp stdout', { stdout: stdout.substring(0, 1000) + (stdout.length > 1000 ? '...[truncated]' : '') });
    if (stderr) logWithTimestamp('⚠️ yt-dlp stderr', { stderr: stderr.substring(0, 1000) + (stderr.length > 1000 ? '...[truncated]' : '') });

    // Check if file was created - yt-dlp might modify the filename
    let actualVideoPath = outputPath;

    if (!fs.existsSync(outputPath)) {
      logWithTimestamp('⚠️ Expected video file not found, searching for actual downloaded file', { outputPath });
      
      // List all files in the download directory for debugging
      const downloadDir = path.dirname(outputPath);
      const allFiles = fs.readdirSync(downloadDir);
      logWithTimestamp('📂 All files in temp directory', { 
        downloadDir,
        allFiles
      });
      
      // Look for any video files that match our timestamp pattern
      const baseFilename = path.basename(outputPath, '.mp4');
      const videoFiles = fs.readdirSync(downloadDir)
        .filter(file => file.startsWith(baseFilename) && (file.endsWith('.mp4') || file.endsWith('.webm')))
        .map(file => path.join(downloadDir, file));
      
      logWithTimestamp('🔍 Found potential video files', { 
        videoFiles,
        searchPattern: `${baseFilename}*.(mp4|webm)`
      });
      
      if (videoFiles.length === 0) {
        logWithTimestamp('❌ No video files found after download', { 
          outputPath,
          downloadDir,
          baseFilename
        });
        throw new Error('Video download failed - no output files found');
      }
      
      // Use the first (and hopefully only) video file found
      actualVideoPath = videoFiles[0];
      logWithTimestamp('✅ Found actual video file', { 
        expectedPath: outputPath,
        actualPath: actualVideoPath
      });
    }

    // Get file stats
    const stats = fs.statSync(actualVideoPath);
    const duration = Date.now() - startTime;
    logWithTimestamp('✅ Video download successful', { 
      outputPath: actualVideoPath,
      fileSize: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      totalDuration: `${duration}ms`
    });
    
    return actualVideoPath;
  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp('❌ Video download failed', { 
      error: error.message,
      duration: `${duration}ms`,
      url
    });
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

async function extractFrames(videoPath) {
  const startTime = Date.now();
  logWithTimestamp('🖼️ Starting frame extraction', { videoPath });

  try {
    // Validate video file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file does not exist: ${videoPath}`);
    }

    const stats = fs.statSync(videoPath);
    logWithTimestamp('📊 Video file stats', { 
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      path: videoPath
    });

  const framesDir = path.join(process.cwd(), 'temp', 'frames');
    logWithTimestamp('📁 Setting up frames directory', { framesDir });
    
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
      logWithTimestamp('📁 Created frames directory');
    } else {
      // Clean existing frames
      const existingFrames = fs.readdirSync(framesDir);
      logWithTimestamp('🧹 Cleaning existing frames', { count: existingFrames.length });
      existingFrames.forEach(file => fs.unlinkSync(path.join(framesDir, file)));
  }

  // Get video duration
    logWithTimestamp('⏱️ Getting video duration');
    const durationStartTime = Date.now();
  const { stdout: durationOutput } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
  );
    const durationQueryTime = Date.now() - durationStartTime;
  const duration = parseFloat(durationOutput);

    logWithTimestamp('✅ Video duration obtained', { 
      duration: `${duration}s`,
      queryTime: `${durationQueryTime}ms`
    });

    // Extract two frames every second to catch fast movements
  const outputPattern = path.join(framesDir, 'frame-%d.jpg');
    logWithTimestamp('🎞️ Extracting frames', { 
      outputPattern,
      expectedFrames: Math.floor(duration * 2), // 2fps = 2 frames per second
      frameRate: '2fps (improved for fast movements)'
    });
    
    const extractStartTime = Date.now();
    const { stdout: extractStdout, stderr: extractStderr } = await execAsync(
      `ffmpeg -i "${videoPath}" -vf fps=2 "${outputPattern}" -y`
    );
    const extractDuration = Date.now() - extractStartTime;
    
    logWithTimestamp('📊 Frame extraction completed', { 
      duration: `${extractDuration}ms`,
      stdout: extractStdout?.substring(0, 500),
      stderr: extractStderr?.substring(0, 500)
    });

  // Get list of extracted frames
    const frameFiles = fs.readdirSync(framesDir)
      .filter(file => file.startsWith('frame-') && file.endsWith('.jpg'));
      
    logWithTimestamp('📋 Frame files found', { 
      count: frameFiles.length,
      files: frameFiles.slice(0, 10) // Log first 10 frames
    });

    const frames = frameFiles
    .map(file => path.join(framesDir, file))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/frame-(\d+)\.jpg/)?.[1] || '0');
      const bNum = parseInt(b.match(/frame-(\d+)\.jpg/)?.[1] || '0');
      return aNum - bNum;
      });

    // Validate frames
    const frameStats = frames.map(frame => {
      const stats = fs.statSync(frame);
      return { path: frame, size: stats.size };
    });

    const totalDuration = Date.now() - startTime;
    logWithTimestamp('✅ Frame extraction successful', { 
      totalFrames: frames.length,
      totalDuration: `${totalDuration}ms`,
      avgFrameSize: `${(frameStats.reduce((sum, f) => sum + f.size, 0) / frameStats.length / 1024).toFixed(2)} KB`
    });

  return frames;
  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp('❌ Frame extraction failed', { 
      error: error.message,
      duration: `${duration}ms`,
      videoPath
    });
    throw new Error(`Failed to extract frames: ${error.message}`);
  }
}

async function extractAudio(videoPath) {
  const startTime = Date.now();
  logWithTimestamp('🔊 Starting audio extraction', { videoPath });

  try {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file does not exist: ${videoPath}`);
    }

    const audioPath = path.join(process.cwd(), 'temp', `audio_${Date.now()}.mp3`);
    logWithTimestamp('🎵 Extracting audio', { audioPath });
    
    const extractStartTime = Date.now();
    const { stdout, stderr } = await execAsync(`ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}" -y`);
    const extractDuration = Date.now() - extractStartTime;
    
    if (!fs.existsSync(audioPath)) {
      throw new Error('Audio extraction failed - output file not found');
    }

    const stats = fs.statSync(audioPath);
    const totalDuration = Date.now() - startTime;
    
    logWithTimestamp('✅ Audio extraction successful', { 
      audioPath,
      fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
      extractDuration: `${extractDuration}ms`,
      totalDuration: `${totalDuration}ms`,
      stdout: stdout?.substring(0, 300),
      stderr: stderr?.substring(0, 300)
    });

  return audioPath;
  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp('❌ Audio extraction failed', { 
      error: error.message,
      duration: `${duration}ms`,
      videoPath
    });
    throw new Error(`Failed to extract audio: ${error.message}`);
  }
}

async function analyzeFramesInBatches(frames) {
  const startTime = Date.now();
  logWithTimestamp('🎯 Starting smart frame batching', { totalFrames: frames.length });

  try {
    // Analyze ALL frames (every 0.5 seconds at 2fps) but batch them efficiently
    const allFrames = frames.map((framePath, index) => ({ path: framePath, index }));
    logWithTimestamp('📊 Preparing all frames for analysis', { 
      totalFrames: allFrames.length,
      strategy: 'Every 0.5 seconds at 2fps (enhanced coverage for fast movements)'
    });

    // Process in batches of 4 frames per API call for efficiency
    const batchSize = 4;
    const batches = [];
    for (let i = 0; i < allFrames.length; i += batchSize) {
      batches.push(allFrames.slice(i, i + batchSize));
    }

    logWithTimestamp('📦 Created batches', { 
      batchCount: batches.length,
      batchSize,
      avgFramesPerBatch: (allFrames.length / batches.length).toFixed(1)
    });

    const allAnalyses = [];
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      logWithTimestamp(`🔄 Processing batch ${batchIndex + 1}/${batches.length}`, {
        frameCount: batch.length,
        frameIndices: batch.map(f => f.index)
      });

      try {
        const batchAnalyses = await analyzeBatch(batch, batchIndex);
        allAnalyses.push(...batchAnalyses);
        
        // Add delay between batches
        if (batchIndex < batches.length - 1) {
          await wait(3000); // 3 second delay between batches
        }
      } catch (error) {
        logWithTimestamp(`⚠️ Batch ${batchIndex + 1} failed, creating placeholders`, {
          error: error.message,
          frameCount: batch.length
        });
        
        // Create placeholders for failed batch
        const placeholders = batch.map(frame => ({
          frameIndex: frame.index,
          timestamp: `${frame.index}s`,
          analysis: `Batch analysis failed: ${error.message}`
        }));
        allAnalyses.push(...placeholders);
      }
    }

    // All frames analyzed - no interpolation needed
    const duration = Date.now() - startTime;
    logWithTimestamp('✅ Batch analysis complete', {
      totalDuration: `${duration}ms`,
      processedFrames: allAnalyses.length,
      finalFrameCount: allAnalyses.length,
      coverage: '100% frames analyzed (every 1 second)'
    });

    return allAnalyses;
  } catch (error) {
    logWithTimestamp('❌ Batch analysis failed', { error: error.message });
    throw error;
  }
}

function selectKeyFrames(frames) {
  const keyFrames = [];
  const totalFrames = frames.length;
  
  // Always include first and last frame
  keyFrames.push({ path: frames[0], index: 0 });
  if (totalFrames > 1) {
    keyFrames.push({ path: frames[totalFrames - 1], index: totalFrames - 1 });
  }
  
  // For videos longer than 10 seconds, sample every 3rd frame
  // For shorter videos, sample every 2nd frame
  const interval = totalFrames > 10 ? 3 : 2;
  
  for (let i = interval; i < totalFrames - 1; i += interval) {
    keyFrames.push({ path: frames[i], index: i });
  }
  
  // Sort by index to maintain order
  return keyFrames.sort((a, b) => a.index - b.index);
}

async function analyzeBatch(batch, batchIndex) {
  logWithTimestamp(`🖼️ Analyzing batch ${batchIndex + 1}`, { frameCount: batch.length });

  try {
    // Read all images in the batch
    const imageData = [];
    for (const frame of batch) {
      if (!fs.existsSync(frame.path)) {
        throw new Error(`Frame file does not exist: ${frame.path}`);
      }
      
      const image = fs.readFileSync(frame.path);
      const base64Image = Buffer.from(image).toString('base64');
      imageData.push({
        index: frame.index,
        base64: base64Image
      });
    }

    logWithTimestamp(`📤 Sending batch to OpenAI`, { 
      frameCount: batch.length,
      totalImageSize: `${(imageData.reduce((sum, img) => sum + img.base64.length, 0) / 1024).toFixed(0)}KB`
    });

    const result = await handleRateLimit(async () => {
      // Create content array with text prompt and all images
      const content = [
        {
          type: "text",
          text: `Analyze these ${batch.length} video frames with deep contextual understanding. Pay special attention to ON-SCREEN TEXT as it often provides the most important context clues.

CRITICAL ANALYSIS PRIORITIES:
1. ON-SCREEN TEXT: Read and analyze ALL visible text, captions, overlays, graphics, UI elements
2. CONTEXTUAL MEANING: What story/message is being communicated?
3. VISUAL STORYTELLING: How do visual choices support the narrative?
4. EMOTIONAL IMPACT: What reactions are designed to be evoked?
5. TECHNICAL PURPOSE: Why specific techniques are used and their effect

TEXT ANALYSIS FOCUS:
- Read ALL visible text accurately (captions, overlays, UI text, signs, graphics)
- Analyze HOW text timing relates to visuals (setup/payoff, irony, contrast)
- Identify if text contradicts or supports what's shown visually
- Determine the narrative function of text (exposition, humor, emphasis)

TECHNIQUE IMPACT ANALYSIS:
- Speed ramps: WHY used? (emphasis, drama, comedy timing)
- Color shifts: WHY used? (mood change, irony, contrast)
- Text overlays: WHY positioned here? What's the intended impact?
- Facial expressions: What emotion/reaction are they designed to create?
- Composition: How does framing support the message?

Provide analysis for each frame in this exact format:

${batch.map((frame, i) => `FRAME_${frame.index}:
FRAMING: [shot type] - WHY: [reason for this choice and its impact]
LIGHTING: [style/mood] - IMPACT: [how this affects viewer emotion]
MOOD: [emotional tone] - PURPOSE: [why this emotion is needed here]
ACTION: [what's happening] - SIGNIFICANCE: [why this moment matters]
ON_SCREEN_TEXT: [ALL visible text/captions/graphics] - CONTEXT: [what this text reveals about the story/message/irony]
VISUAL_EFFECTS: [effects used] - INTENT: [why this effect was chosen and its purpose]
SETTING: [location/environment] - ROLE: [how setting supports the story]
SUBJECTS: [main focus] - NARRATIVE_FUNCTION: [their role in the story/message]
CONTEXTUAL_MEANING: [what this frame communicates to the audience and why it works]`).join('\n\n')}

CRITICAL: Always read and transcribe any visible text accurately. Text on screen is often the key to understanding the video's context and message.`
        }
      ];

      // Add all images to the content
      imageData.forEach(img => {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${img.base64}`
          }
        });
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        max_tokens: 2000 // Increased for better quality analysis
      });

      return response.choices[0].message.content;
    });

    // Parse the batch response into individual frame analyses
    const analyses = parseBatchResponse(result, batch);
    
    logWithTimestamp(`✅ Batch analysis successful`, { 
      frameCount: batch.length,
      responseLength: result?.length || 0
    });

    return analyses;
  } catch (error) {
    logWithTimestamp(`❌ Batch analysis failed`, { 
      error: error.message,
      batchIndex,
      frameCount: batch.length
    });
    throw error;
  }
}

function parseBatchResponse(response, batch) {
  const analyses = [];
  
  try {
    // Split response by frame markers
    const frameBlocks = response.split(/FRAME_\d+:/);
    
    // Skip the first empty element and process each frame block
    for (let i = 1; i < frameBlocks.length && i <= batch.length; i++) {
      const frameIndex = batch[i - 1].index;
      const analysis = frameBlocks[i].trim();
      
      // Parse the structured analysis to extract contextual meaning
      const contextualMeaning = extractContextualMeaning(analysis);
      
      analyses.push({
        frameIndex,
        timestamp: `${(frameIndex * 0.5).toFixed(1)}s`, // Updated for 2fps
        analysis,
        contextualMeaning
      });
    }
    
    // If parsing failed or we don't have enough analyses, create fallbacks
    while (analyses.length < batch.length) {
      const missingIndex = batch[analyses.length].index;
      analyses.push({
        frameIndex: missingIndex,
        timestamp: `${(missingIndex * 0.5).toFixed(1)}s`,
        analysis: `Analysis parsing incomplete for frame ${missingIndex}`,
        contextualMeaning: 'Context analysis unavailable'
      });
    }
    
  } catch (error) {
    logWithTimestamp('⚠️ Failed to parse batch response, creating fallbacks', { error: error.message });
    
    // Create fallback analyses for all frames in batch
    batch.forEach(frame => {
      analyses.push({
        frameIndex: frame.index,
        timestamp: `${(frame.index * 0.5).toFixed(1)}s`,
        analysis: `Failed to parse batch response: ${error.message}`,
        contextualMeaning: 'Context analysis failed'
      });
    });
  }
  
  return analyses;
}

// Extract contextual meaning from frame analysis
function extractContextualMeaning(analysis) {
  const contextMatch = analysis.match(/CONTEXTUAL_MEANING:\s*(.+?)(?:\n|$)/i);
  if (contextMatch) {
    return contextMatch[1].trim();
  }
  
  // Fallback: look for any line that explains WHY or IMPACT
  const lines = analysis.split('\n');
  const impactLine = lines.find(line => 
    line.includes('WHY:') || 
    line.includes('IMPACT:') || 
    line.includes('PURPOSE:') || 
    line.includes('CONTEXT:')
  );
  
  if (impactLine) {
    const parts = impactLine.split(/(?:WHY:|IMPACT:|PURPOSE:|CONTEXT:)/);
    return parts[1]?.trim() || 'Context analysis available in detailed view';
  }
  
  return 'Context analysis available in detailed view';
}

function interpolateMissingFrames(keyFrameAnalyses, totalFrames) {
  const completeAnalyses = new Array(totalFrames);
  
  // Place key frame analyses in their correct positions
  keyFrameAnalyses.forEach(analysis => {
    completeAnalyses[analysis.frameIndex] = analysis;
  });
  
  // Fill in missing frames with interpolated data
  for (let i = 0; i < totalFrames; i++) {
    if (!completeAnalyses[i]) {
      // Find the nearest analyzed frames
      const prevAnalyzed = findPreviousAnalyzedFrame(completeAnalyses, i);
      const nextAnalyzed = findNextAnalyzedFrame(completeAnalyses, i);
      
      let interpolatedAnalysis;
      if (prevAnalyzed && nextAnalyzed) {
        // Interpolate between two frames
        interpolatedAnalysis = `Similar to frames ${prevAnalyzed.frameIndex}-${nextAnalyzed.frameIndex}: ${prevAnalyzed.analysis.split('\n')[0]}`;
      } else if (prevAnalyzed) {
        // Use previous frame
        interpolatedAnalysis = `Continuation of frame ${prevAnalyzed.frameIndex}: ${prevAnalyzed.analysis.split('\n')[0]}`;
      } else if (nextAnalyzed) {
        // Use next frame
        interpolatedAnalysis = `Leading to frame ${nextAnalyzed.frameIndex}: ${nextAnalyzed.analysis.split('\n')[0]}`;
      } else {
        // Fallback
        interpolatedAnalysis = `Frame ${i}: Analysis not available`;
      }
      
      completeAnalyses[i] = {
        frameIndex: i,
        timestamp: `${i}s`,
        analysis: interpolatedAnalysis
      };
    }
  }
  
  return completeAnalyses;
}

function findPreviousAnalyzedFrame(analyses, index) {
  for (let i = index - 1; i >= 0; i--) {
    if (analyses[i]) return analyses[i];
  }
  return null;
}

function findNextAnalyzedFrame(analyses, index) {
  for (let i = index + 1; i < analyses.length; i++) {
    if (analyses[i]) return analyses[i];
  }
  return null;
}

async function analyzeFrame(framePath, frameIndex) {
  const startTime = Date.now();
  logWithTimestamp(`🖼️ Analyzing frame ${frameIndex + 1}`, { framePath });

  try {
    if (!fs.existsSync(framePath)) {
      throw new Error(`Frame file does not exist: ${framePath}`);
    }

    const stats = fs.statSync(framePath);
    logWithTimestamp(`📊 Frame ${frameIndex + 1} stats`, { 
      size: `${(stats.size / 1024).toFixed(2)} KB`
    });

  const image = fs.readFileSync(framePath);
  const base64Image = Buffer.from(image).toString('base64');

    logWithTimestamp(`🔍 Sending frame ${frameIndex + 1} to OpenAI Vision`, { 
      base64Length: base64Image.length 
    });

    const result = await handleRateLimit(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
                text: `Analyze frame ${frameIndex + 1} concisely:

FRAMING: [shot type]
LIGHTING: [style/mood]
MOOD: [emotional tone]
ACTION: [what's happening]
DIALOGUE: [visible text/overlays]
VISUAL_EFFECTS: [effects/filters]
SETTING: [location/environment]
SUBJECTS: [main focus]

Keep each response brief and specific.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
        max_tokens: 300
    });

    return response.choices[0].message.content;
  });

    const totalDuration = Date.now() - startTime;
    logWithTimestamp(`✅ Frame ${frameIndex + 1} analysis complete`, { 
      duration: `${totalDuration}ms`,
      resultLength: result?.length || 0
    });

    return {
      frameIndex,
      timestamp: `${frameIndex}s`,
      analysis: result
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp(`❌ Frame ${frameIndex + 1} analysis failed`, { 
      error: error.message,
      duration: `${duration}ms`,
      framePath
    });
    throw new Error(`Failed to analyze frame ${frameIndex + 1}: ${error.message}`);
  }
}

async function analyzeAudio(audioPath) {
  const startTime = Date.now();
  logWithTimestamp('🎵 Starting audio analysis', { audioPath });

  try {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file does not exist: ${audioPath}`);
    }

    const stats = fs.statSync(audioPath);
    logWithTimestamp('📊 Audio file stats', { 
      size: `${(stats.size / 1024).toFixed(2)} KB`
    });

  const audioFile = fs.createReadStream(audioPath);
  
  // First, transcribe the audio
    logWithTimestamp('🗣️ Starting audio transcription');
    const transcriptionStartTime = Date.now();
    
  const transcription = await handleRateLimit(async () => {
    return await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    });
  });

    const transcriptionDuration = Date.now() - transcriptionStartTime;
    logWithTimestamp('✅ Audio transcription complete', { 
      duration: `${transcriptionDuration}ms`,
      textLength: transcription.text?.length || 0,
      segmentCount: transcription.segments?.length || 0
    });

  // Then, analyze and separate dialogue from music/lyrics
    logWithTimestamp('🎼 Starting audio separation and analysis');
    const analysisStartTime = Date.now();
    
  const separationAnalysis = await handleRateLimit(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Analyze this audio transcript and separate DIALOGUE from MUSIC LYRICS. Dialogue provides the highest context for understanding the video.

FULL TRANSCRIPT: "${transcription.text}"

TIMESTAMPED SEGMENTS:
${transcription.segments?.map(seg => `${seg.start.toFixed(1)}s-${seg.end.toFixed(1)}s: "${seg.text}"`).join('\n') || 'No segments available'}

Provide analysis in this JSON format:
{
  "dialogue": {
    "content": "[all spoken dialogue/narration/speech - prioritize this]",
    "segments": [{"start": 0, "end": 5, "text": "dialogue text", "contextualMeaning": "what this reveals about the video"}],
    "primaryContext": "[main message/story revealed through dialogue]"
  },
  "musicLyrics": {
    "content": "[any sung lyrics or background vocals]",
    "mood": "[musical genre/mood]",
    "role": "[how music supports the narrative]"
  },
  "soundDesign": {
    "effects": "[sound effects, ambient sounds, UI sounds]",
    "purpose": "[how sound design enhances the experience]"
  },
  "contextPriority": "[dialogue/music/effects - which provides most story context]",
  "audioSummary": "[brief summary of what the audio tells us about the video's message]"
}

CRITICAL: Distinguish between spoken words (dialogue) and sung words (music). If someone is clearly speaking/narrating, that's dialogue. If it's melodic/rhythmic, that's music lyrics.`
        }
      ],
      max_tokens: 1200
    });
    return response.choices[0].message.content;
  });

  // Parse the separation analysis
  let separatedAudio = null;
  try {
    separatedAudio = JSON.parse(separationAnalysis);
    logWithTimestamp('✅ Audio separation successful', {
      hasDialogue: !!separatedAudio.dialogue?.content,
      hasMusicLyrics: !!separatedAudio.musicLyrics?.content,
      contextPriority: separatedAudio.contextPriority
    });
  } catch (parseError) {
    logWithTimestamp('⚠️ Failed to parse audio separation, using fallback');
    separatedAudio = {
      dialogue: { 
        content: transcription.text, 
        primaryContext: 'Audio separation failed - full transcript available' 
      },
      musicLyrics: { content: '', mood: 'Unknown' },
      soundDesign: { effects: 'Unknown', purpose: 'Unknown' },
      contextPriority: 'dialogue',
      audioSummary: 'Full transcript: ' + transcription.text
    };
  }

  // Generate comprehensive audio analysis
  const analysis = `AUDIO CONTEXT ANALYSIS:

PRIMARY DIALOGUE: ${separatedAudio.dialogue?.content || 'None detected'}
Context Priority: ${separatedAudio.contextPriority || 'Unknown'}
Key Message: ${separatedAudio.dialogue?.primaryContext || 'Not available'}

MUSIC/LYRICS: ${separatedAudio.musicLyrics?.content || 'None detected'}
Musical Mood: ${separatedAudio.musicLyrics?.mood || 'Not detected'}

SOUND DESIGN: ${separatedAudio.soundDesign?.effects || 'Standard audio'}

OVERALL CONTEXT: ${separatedAudio.audioSummary || 'Audio provides context through transcript'}`;

    const analysisDuration = Date.now() - analysisStartTime;
    const totalDuration = Date.now() - startTime;
    
    logWithTimestamp('✅ Audio analysis complete', { 
      transcriptionDuration: `${transcriptionDuration}ms`,
      analysisDuration: `${analysisDuration}ms`,
      totalDuration: `${totalDuration}ms`,
      analysisLength: analysis?.length || 0
  });

  return {
    transcription,
    separatedAudio,
    analysis
  };
  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp('❌ Audio analysis failed', { 
      error: error.message,
      duration: `${duration}ms`,
      audioPath
    });
    throw new Error(`Failed to analyze audio: ${error.message}`);
  }
}

async function generateComprehensiveAnalysis(frameAnalyses, audioAnalysis) {
  const startTime = Date.now();
  logWithTimestamp('🚀 Starting comprehensive analysis (single request optimization)');

  try {
    const videoLength = (frameAnalyses.length / 2).toFixed(1);
    const transcript = audioAnalysis.transcription?.text || 'No audio transcript';
    
    // Extract all on-screen text from frames
    const allFrameText = frameAnalyses.map(frame => {
      const textMatch = frame.analysis.match(/ON_SCREEN_TEXT:\s*([^-\n]+)/i);
      return textMatch ? textMatch[1].trim() : '';
    }).filter(text => text && text !== 'None detected').join(' | ');

    // Get dialogue vs music context
    const dialogueContent = audioAnalysis.separatedAudio?.dialogue?.content || '';
    const musicContent = audioAnalysis.separatedAudio?.musicLyrics?.content || '';
    const contextPriority = audioAnalysis.separatedAudio?.contextPriority || 'unknown';

    const comprehensivePrompt = `You are a premium video content strategist and analysis expert. Analyze this ${videoLength}-second video and provide a comprehensive, detailed analysis matching professional standards.

VIDEO DATA:
Duration: ${videoLength} seconds
Frame Count: ${frameAnalyses.length}
Audio Transcript: "${transcript}"
On-Screen Text: "${allFrameText}"

DETAILED FRAME ANALYSIS:
${frameAnalyses.slice(0, 12).map((frame, i) => 
  `${(i * 0.5).toFixed(1)}s: ${frame.contextualMeaning || frame.analysis.substring(0, 300)}`
).join('\n')}

AUDIO CONTEXT:
${audioAnalysis.separatedAudio ? `
- Dialogue: ${dialogueContent}
- Music/Lyrics: ${musicContent}
- Sound Design: ${audioAnalysis.separatedAudio.soundDesign?.effects || 'Standard'}
- Context Priority: ${contextPriority}
- Audio Summary: ${audioAnalysis.separatedAudio.audioSummary || 'Not available'}
` : `Full Audio: ${transcript}`}

CRITICAL SCENE ANALYSIS REQUIREMENTS:
A SCENE is defined by significant changes in:
- VISUAL CUTS: Camera angle changes, shot type changes, framing shifts
- CONTEXT CHANGES: Color grading shifts (color to black & white), lighting changes
- AUDIO TRANSITIONS: Music changes, volume shifts, silence moments, new audio elements
- TEXT REVEALS: New text overlays, text content changes, punchline reveals
- NARRATIVE BEATS: Setup moments, tension building, ironic reveals, punchlines
- VISUAL EFFECTS: Filters applied/removed, speed changes, transitions

REQUIREMENTS:
1. MUST identify each distinct scene based on these cinematic changes
2. MUST capture the complete narrative arc through scene progression
3. MUST analyze how each scene change serves the story/comedy
4. MUST identify text overlay timing and content changes as scene markers
5. MUST track psychological progression through visual and audio cues

Provide a comprehensive premium analysis in this JSON format:

{
  "videoCategory": {
    "category": "[educational/entertainment/promotional/tutorial/lifestyle/comedy/etc]",
    "confidence": 0.95,
    "subcategory": "[specific type like workplace comedy, tutorial, reaction, etc]",
    "platform": "[optimized for TikTok/Instagram/YouTube/etc]",
    "reasoning": "[detailed explanation of why this category was chosen based on content analysis]"
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "timeRange": "[start time to when first significant change occurs]",
      "title": "[e.g., 'Opening Setup' or 'Initial Statement Scene']",
      "description": "[Describe what happens until the first cinematic change - camera cut, text overlay, audio shift, etc.]",
      "duration": "[actual duration until first scene change]",
      "framing": {
        "shotTypes": ["medium shot", "close-up"],
        "cameraMovement": "[static/pan/zoom/handheld/tracking/etc]",
        "composition": "[detailed composition analysis: rule of thirds, leading lines, depth, etc]"
      },
      "lighting": {
        "style": "[natural/artificial/mixed]",
        "mood": "[bright/dark/moody/dramatic/soft/etc]",
        "direction": "[front-lit/back-lit/side-lit/top-lit/etc]",
        "quality": "[hard/soft/diffused/harsh/etc]"
      },
      "mood": {
        "emotional": "[happy/serious/energetic/calm/tense/amused/optimistic/etc]",
        "atmosphere": "[bright/dark/playful/professional/relaxed/intense/etc]",
        "tone": "[casual/formal/humorous/dramatic/ironic/etc]"
      },
      "actionMovement": {
        "movement": "[detailed description of physical actions and movements]",
        "direction": "[screen direction, eye lines, movement patterns]",
        "pace": "[slow/medium/fast/dynamic/static]"
      },
      "audio": {
        "music": "[description of background music, genre, mood]",
        "soundDesign": "[ambient sounds, effects, audio atmosphere]",
        "dialogue": "[spoken words or voice-over content]"
      },
      "visualEffects": {
        "transitions": "[cuts/fades/wipes/dissolves/etc]",
        "effects": "[filters, color grading, speed changes, overlays, etc]",
        "graphics": "[text overlays, graphics, UI elements, typography]"
      },
      "settingEnvironment": {
        "location": "[specific location description]",
        "environment": "[indoor/outdoor/studio/natural/etc]",
        "background": "[detailed background elements and their significance]"
      },
      "subjectsFocus": {
        "main": "[primary subjects, people, objects of focus]",
        "secondary": "[supporting elements, background subjects]",
        "focus": "[what specifically draws viewer attention and why]"
      },
      "intentImpactAnalysis": {
        "creatorIntent": "[what the creator wants to achieve in this specific scene]",
        "howExecuted": "[specific techniques and methods used to achieve the intent]",
        "viewerImpact": "[expected psychological and emotional effect on viewers]",
        "narrativeSignificance": "[how this scene contributes to the overall story/message - e.g., 'Sets up expectation for ironic payoff']"
      },
      "textDialogue": {
        "content": "[exact text content visible on screen or spoken]",
        "style": "[font style, overlay treatment, visual presentation]"
      }
    },
    {
      "sceneNumber": 2,
      "timeRange": "[when visual/audio/text change occurs]",
      "title": "[e.g., 'Text Overlay Reinforcement' or 'Audio Shift Moment']",
      "description": "[Describe the specific change that defines this new scene - camera cut, text reveal, music change, etc.]",
      "duration": "[actual duration based on when changes occur]",
      [... same structure as scene 1 ...]
    },
    {
      "sceneNumber": 3,
      "timeRange": "[when next significant change occurs]",
      "title": "[e.g., 'Black & White Punchline Reveal' or 'Silent Moment for Impact']",
      "description": "[The specific cinematic change that creates this scene - color shift, text punchline, audio drop, etc.]",
      "duration": "[actual duration based on cinematic changes]",
      [... same structure as scene 1 ...]
    }
  ],
  "hooks": [
    {
      "timestamp": "0.0s",
      "type": "[visual_disrupter/question/positive_statement/negative_statement/action_statement/contrast/irony]",
      "description": "[detailed description of what specifically happens that grabs attention]",
      "impact": "[high/medium/low]",
      "element": "[specific visual, audio, or textual element that creates the hook]",
      "psychologicalTrigger": "[what psychological mechanism this hook activates]"
    }
  ],
  "contextualAnalysis": {
    "creatorIntent": {
      "primaryIntent": "[main goal: educate/entertain/sell/inspire/build community/etc]",
      "targetAudience": "[specific demographic, interests, pain points they address]",
      "desiredAction": "[what creator wants viewer to do: share, comment, follow, buy, etc]",
      "howAchieved": "[specific methods used to achieve the intent]"
    },
    "messageDelivery": {
      "coreMessage": "[main message distilled to one clear sentence]",
      "deliveryMethod": "[storytelling/demonstration/comparison/humor/irony/etc]",
      "persuasionTechniques": ["[specific techniques: social proof, authority, scarcity, etc]"],
      "emotionalJourney": "[how viewer emotions are guided through the content - setup → anticipation → payoff]"
    },
    "themes": ["[key themes like workplace dynamics, expectations vs reality, etc]"],
    "psychologicalAppeal": "[detailed analysis of psychological triggers and why they work]",
    "socialContext": "[cultural references, shared experiences, universal truths addressed]"
  },
  "strategicOverview": {
    "videoOverview": "[comprehensive 3-4 sentence summary covering content, purpose, and execution style]",
    "narrativeArc": {
      "arcType": "[comedy/educational/story/transformation/comparison/reveal/etc - based on video category]",
      "structure": "[detailed breakdown of the complete narrative progression specific to content type]",
      "keyBeats": "[specific story beats that drive the narrative forward - setup, conflict, resolution, etc]",
      "examples": {
        "comedy": "Setup (establishing normal situation) → Escalation (building tension/expectation) → Subversion (unexpected twist) → Punchline (comedic payoff) → Resolution (aftermath/reaction)",
        "educational": "Hook (problem/question) → Context (why it matters) → Steps (tutorial progression) → Demonstration (showing results) → Reinforcement (key takeaways)",
        "story": "Ordinary World → Inciting Incident → Rising Action → Climax → Resolution → New Normal",
        "transformation": "Before State → Catalyst → Process → Obstacles → Breakthrough → After State",
        "comparison": "Option A Introduction → Option B Introduction → Contrast Building → Decisive Moment → Clear Winner → Justification"
      }
    },
    "whyItWorks": "[detailed analysis of core psychological/emotional appeal, focusing on universal human experiences, recognition triggers, and social validation mechanisms that make this content effective]",
    "successFormula": "[detailed step-by-step breakdown with timing: Scene 1 (setup/hook) → Scene 2 (development) → Scene 3 (escalation) → Scene 4 (payoff/punchline), including psychological reasoning for each transition and how it serves the narrative arc]",
    "universalPrinciples": "[underlying psychological and structural patterns that can be adapted across industries - extract the core psychology, not just surface mechanics. Include principles like contrast, expectation management, social proof, etc]",
    "technicalRequirements": "[detailed breakdown of essential vs optional production elements: minimum viable version requirements, professional enhancements, budget considerations, equipment needs]",
    "implementationFramework": {
      "preProduction": "[concept development, scenario planning, script/storyboard creation, location scouting, talent casting, equipment planning, shot list creation]",
      "production": "[filming techniques, camera work, framing, lighting setup, talent direction, audio recording, multiple takes/angles, on-set execution]", 
      "postProduction": "[editing, text overlays, graphics, color grading, audio mixing, transitions, effects, timing adjustments, final output optimization]",
      "successMetrics": "[engagement rates, completion rates, shares, comments, saves, click-through rates, conversion metrics, audience retention graphs]"
    },
    "adaptabilityGuidelines": "[detailed guidance on modifying for different industries/audiences with 3-4 specific industry adaptation examples showing how core principles translate: retail, healthcare, tech, education, etc]",
    "viralPotential": "[comprehensive analysis of shareability factors: social validation triggers, sharing motivations, platform-specific optimization, audience engagement patterns, and viral mechanics]",
    "resourceScaling": "[budget considerations from minimum viable to professional production, including equipment, location, talent, and post-production requirements]"
  },
  "contentStructure": "[detailed analysis of narrative flow, pacing strategies, engagement techniques, escalation patterns, and specific structural elements that create viral potential. Include timing analysis, attention retention techniques, and psychological progression through the content]"
}

CRITICAL INSTRUCTIONS:
1. Identify scenes based on CINEMATIC CHANGES: visual cuts, context shifts, audio transitions, text reveals
2. MUST capture the complete story arc including setup, development, and payoff moments
3. Each scene represents a distinct cinematic or narrative change, not arbitrary time segments
4. Pay special attention to text overlay changes - they often mark new scenes and contain punchlines
5. Analyze how each scene change serves the psychological progression and narrative timing
6. Focus on WHY each cinematic choice works and HOW it contributes to the viral effect
7. NARRATIVE ARC ANALYSIS: Identify the specific narrative structure based on content type:
   - COMEDY: Setup → Build → Subversion → Punchline → Resolution
   - EDUCATIONAL: Hook → Context → Steps → Demo → Reinforcement  
   - STORY: Ordinary World → Inciting Incident → Rising Action → Climax → Resolution
   - TRANSFORMATION: Before → Catalyst → Process → Breakthrough → After
   - COMPARISON: Option A → Option B → Contrast → Decision → Winner
8. In strategicOverview.narrativeArc, provide the COMPLETE narrative progression showing how each scene serves the overall story structure
9. Explain how the narrative arc creates psychological engagement and drives viewer retention
10. PRODUCTION PHASE CATEGORIZATION - Ensure proper separation:
    - PRE-PRODUCTION: Concept development, planning, scripting, casting, location scouting, equipment planning
    - PRODUCTION: Actual filming, camera work, lighting, talent direction, audio recording, on-set execution
    - POST-PRODUCTION: Editing, text overlays, graphics, color grading, audio mixing, effects, transitions
    - SUCCESS METRICS: Engagement rates, completion rates, shares, comments, analytics to track`;

    const response = await handleRateLimit(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a viral content strategist and video analysis expert. Your role is to analyze technical video breakdowns and transform them into actionable content creation strategies. Focus on: 1) Core psychological and structural elements that make content successful 2) Universal patterns adaptable across contexts 3) Step-by-step replication frameworks 4) WHY content works, not just WHAT happens 5) Adaptable templates for different industries. Prioritize underlying psychology, narrative structure, and replicable techniques over surface-level technical details. Always provide valid JSON with no additional text."
          },
          {
            role: "user",
            content: comprehensivePrompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.3
      });
    });

    let result;
    try {
      result = JSON.parse(response.choices[0].message.content);
      logWithTimestamp('✅ JSON parsing successful');
    } catch (parseError) {
      logWithTimestamp('⚠️ JSON parsing failed, attempting to extract JSON', { error: parseError.message });
      
      // Try to extract JSON from response
      const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
        logWithTimestamp('✅ JSON extraction successful');
      } else {
        throw new Error('Failed to parse comprehensive analysis JSON');
      }
    }
    
    const duration = Date.now() - startTime;
    logWithTimestamp('✅ Comprehensive analysis complete', { 
      duration: `${duration}ms`,
      sceneCount: result.scenes?.length || 0,
      hookCount: result.hooks?.length || 0,
      category: result.videoCategory?.category || 'unknown'
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp('❌ Comprehensive analysis failed', { 
      error: error.message,
      duration: `${duration}ms`
    });
    
    // Return fallback structure
    return {
      videoCategory: { category: 'unknown', confidence: 0.5, subcategory: 'analysis failed' },
      scenes: [],
      hooks: [],
      contextualAnalysis: { creatorIntent: { primaryIntent: 'unknown' }, themes: [] },
      strategicOverview: { videoOverview: 'Analysis failed: ' + error.message },
      contentStructure: 'Comprehensive analysis failed due to: ' + error.message,
      error: error.message
    };
  }
}

async function generateStrategicOverview(scenes, audioAnalysis, contextualAnalysis, videoCategory) {
  const startTime = Date.now();
  logWithTimestamp('📊 Starting strategic overview generation');

  try {
    // Prepare comprehensive data for strategic analysis
    const sceneData = scenes.map(scene => ({
      title: scene.title,
      duration: scene.duration,
      description: scene.description,
      mood: scene.mood,
      dialogue: scene.dialogue,
      visualEffects: scene.visualEffects,
      contextualMeaning: scene.contextualMeaning
    }));

    const audioData = {
      transcript: audioAnalysis.transcription?.text || 'No dialogue available',
      musicAnalysis: audioAnalysis.musicAnalysis || { genre: 'Unknown', energy: 'Unknown' },
      audioHierarchy: audioAnalysis.audioHierarchy || { dialogue: [], musicLyrics: [], soundDesign: [] }
    };

    const strategicPrompt = `You are a professional content strategist analyzing this video to identify viral content patterns and provide replication frameworks.

SCENE-BY-SCENE DATA:
${sceneData.map((scene, i) => `
Scene ${i + 1}: ${scene.title} (${scene.duration})
- Description: ${scene.description}
- Mood: ${scene.mood?.emotional} / ${scene.mood?.atmosphere}
- Intent: ${scene.contextualMeaning?.intent || 'Not specified'}
- Execution: ${scene.contextualMeaning?.execution || 'Not specified'}
- Impact: ${scene.contextualMeaning?.impact || 'Not specified'}
- Text Content: ${scene.dialogue?.textContent || 'None'}
`).join('')}

AUDIO CONTEXT:
- Transcript: ${audioData.transcript}
- Music Genre: ${audioData.musicAnalysis.genre}
- Energy Level: ${audioData.musicAnalysis.energy}

CONTENT CATEGORY: ${videoCategory.category}
CONFIDENCE: ${Math.round(videoCategory.confidence * 100)}%

CONTEXTUAL INSIGHTS:
- Creator Intent: ${contextualAnalysis.creatorIntent?.primaryIntent || 'Not analyzed'}
- Target Audience: ${contextualAnalysis.targetAudience || 'General'}
- Core Message: ${contextualAnalysis.messageDelivery?.coreMessage || 'Not specified'}

Your task is to transform this technical analysis into a strategic content document following this structure:

## Video Overview
Brief summary of the video's content and primary purpose.

## Strategic Breakdown

### Why It Works: Universal Relatability
- Identify the core psychological/emotional appeal
- Explain what makes this universally relatable
- Connect to broader human experiences

### Success Formula: Replicable Structure
- Break down the step-by-step content structure
- Identify the key beats and timing
- Explain the progression logic

### Universal Principles: Adaptable Core Concepts  
- Extract the underlying success patterns
- Identify what can be adapted across industries
- Highlight the emotional journey mapping

### Technical Requirements: Execution Specifications
- List the essential production elements
- Identify what's critical vs. optional
- Provide complexity/resource assessment

## Replication Insights

### Implementation Framework
1. Step-by-step creation process
2. Key decision points and alternatives
3. Success metrics to watch for

### Adaptability Guidelines
- How to modify for different industries
- Platform-specific considerations  
- Audience targeting variations

### Resource Scaling
- Minimum viable version requirements
- Professional enhancement options
- Budget consideration factors

Focus on WHY techniques work, not just WHAT is happening. Explain the systematic patterns that make content effective and provide actionable replication strategies.`;

    const response = await handleRateLimit(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: "You are a professional content strategist who transforms technical video analysis into actionable creative intelligence. Your analysis should help content creators understand not just what works, but why it works and how to adapt successful patterns to their own contexts."
          },
          {
            role: "user",
            content: strategicPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });
    });

    const strategicOverview = response.choices[0].message.content;
    
    const duration = Date.now() - startTime;
    logWithTimestamp('✅ Strategic overview generation complete', { 
      duration: `${duration}ms`,
      contentLength: strategicOverview.length
    });

    return strategicOverview;

  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp('❌ Strategic overview generation failed', { 
      error: error.message,
      duration: `${duration}ms`
    });
    
    // Return a fallback overview based on available data
    return `## Video Analysis Overview

**Content Type:** ${videoCategory.category}
**Duration:** ${scenes.length} scenes analyzed
**Primary Appeal:** ${contextualAnalysis.creatorIntent?.primaryIntent || 'Entertainment/Education'}

### Key Success Elements:
${scenes.map((scene, i) => `- Scene ${i + 1}: ${scene.contextualMeaning?.intent || scene.title}`).join('\n')}

### Replication Framework:
1. **Structure**: Follow the ${scenes.length}-scene progression shown
2. **Timing**: Maintain similar pacing (${scenes.map(s => s.duration).join(', ')})
3. **Mood Progression**: ${scenes.map(s => s.mood?.emotional).filter(Boolean).join(' → ')}

*Note: Strategic analysis was limited due to processing constraints. Full analysis recommended for complete insights.*`;
  }
}

async function analyzeVideo(videoPath) {
  const startTime = Date.now();
  logWithTimestamp('🎬 Starting complete video analysis', { videoPath });

  try {
  // Extract frames and audio
    logWithTimestamp('🔄 Phase 1: Extracting frames and audio');
    const framesPromise = extractFrames(videoPath);
    const audioPromise = extractAudio(videoPath);
    
    const [frames, audioPath] = await Promise.all([framesPromise, audioPromise]);
    
    const extractionDuration = Date.now() - startTime;
    logWithTimestamp('✅ Phase 1 complete: Extraction finished', { 
      frameCount: frames.length,
      audioPath,
      duration: `${extractionDuration}ms`
    });

    // Analyze frames in smart batches for efficiency
    logWithTimestamp('🔄 Phase 2: Analyzing frames in batches');
    const frameAnalysisStartTime = Date.now();
    
    const frameAnalyses = await analyzeFramesInBatches(frames);

    const frameAnalysisDuration = Date.now() - frameAnalysisStartTime;
    logWithTimestamp('✅ Phase 2 complete: Frame analysis finished', { 
      frameCount: frameAnalyses.length,
      duration: `${frameAnalysisDuration}ms`,
      avgTimePerFrame: `${(frameAnalysisDuration / frameAnalyses.length).toFixed(0)}ms`
    });

  // Analyze audio
    logWithTimestamp('🔄 Phase 3: Analyzing audio');
    const audioAnalysisStartTime = Date.now();
  const audioAnalysis = await analyzeAudio(audioPath);
    const audioAnalysisDuration = Date.now() - audioAnalysisStartTime;
    
    logWithTimestamp('✅ Phase 3 complete: Audio analysis finished', { 
      duration: `${audioAnalysisDuration}ms`
    });

  // Clean up frames and audio
    logWithTimestamp('🧹 Phase 4: Cleaning up temporary files');
    const cleanupStartTime = Date.now();
    
    frames.forEach((frame, index) => {
      try {
        fs.unlinkSync(frame);
        logWithTimestamp(`🗑️ Deleted frame ${index + 1}`, { frame });
      } catch (error) {
        logWithTimestamp(`⚠️ Failed to delete frame ${index + 1}`, { frame, error: error.message });
      }
    });
    
    try {
  fs.unlinkSync(audioPath);
      logWithTimestamp('🗑️ Deleted audio file', { audioPath });
    } catch (error) {
      logWithTimestamp('⚠️ Failed to delete audio file', { audioPath, error: error.message });
    }

    const cleanupDuration = Date.now() - cleanupStartTime;
    logWithTimestamp('✅ Phase 4 complete: Cleanup finished', { 
      duration: `${cleanupDuration}ms`
    });

    // CONSOLIDATED ANALYSIS - Single API request replaces phases 5-7
    logWithTimestamp('🔄 Phase 5: Comprehensive analysis (single request optimization)');
    const comprehensiveAnalysisStartTime = Date.now();
    
    const comprehensiveResult = await generateComprehensiveAnalysis(frameAnalyses, audioAnalysis);
    
    const comprehensiveAnalysisDuration = Date.now() - comprehensiveAnalysisStartTime;
    const finalTotalDuration = Date.now() - startTime;
    
    logWithTimestamp('✅ Phase 5 complete: Comprehensive analysis finished', { 
      duration: `${comprehensiveAnalysisDuration}ms`,
      sceneCount: comprehensiveResult.scenes?.length || 0,
      hookCount: comprehensiveResult.hooks?.length || 0,
      category: comprehensiveResult.videoCategory?.category || 'unknown'
    });

    const result = {
      contentStructure: comprehensiveResult.contentStructure,
      hook: extractHook(frameAnalyses[0]),
      totalDuration: `${(frames.length / 2).toFixed(1)}s`, // frames.length / 2fps = actual seconds
      scenes: comprehensiveResult.scenes,
      transcript: audioAnalysis.transcription || { text: 'No transcript available', segments: [] },
      hooks: comprehensiveResult.hooks,
      videoCategory: comprehensiveResult.videoCategory,
      contextualAnalysis: comprehensiveResult.contextualAnalysis,
      strategicOverview: comprehensiveResult.strategicOverview,
      videoMetadata: {
        totalFrames: frames.length,
        frameRate: 2, // 2 frames per second
        analysisTimestamp: new Date().toISOString()
      }
    };

    logWithTimestamp('🎉 Video analysis complete! (Optimized with 83% fewer API requests)', { 
      totalDuration: `${finalTotalDuration}ms`,
      frameCount: frames.length,
      sceneCount: comprehensiveResult.scenes?.length || 0,
      phases: {
        extraction: `${extractionDuration}ms`,
        frameAnalysis: `${frameAnalysisDuration}ms`,
        audioAnalysis: `${audioAnalysisDuration}ms`,
        cleanup: `${cleanupDuration}ms`,
        comprehensiveAnalysis: `${comprehensiveAnalysisDuration}ms`
      }
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp('❌ Video analysis failed', { 
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      videoPath
    });
    throw error;
  }
}

function extractShotType(analysis) {
  logWithTimestamp('🔍 Extracting shot type', { analysisLength: analysis?.length || 0 });
  
  // Extract shot type from GPT-4 Vision analysis
  const shotTypes = ['close-up', 'medium shot', 'wide shot', 'extreme close-up', 'long shot'];
  const match = shotTypes.find(type => analysis.toLowerCase().includes(type));
  const result = match ? match.charAt(0).toUpperCase() + match.slice(1) : 'Medium Shot';
  
  logWithTimestamp('📊 Shot type extracted', { result, match });
  return result;
}

function extractDescription(analysis) {
  logWithTimestamp('🔍 Extracting description', { analysisLength: analysis?.length || 0 });
  
  // Extract main visual elements and text overlays
  const result = analysis.split('\n')
    .filter(line => line.includes('visual elements') || line.includes('text overlay'))
    .join(' ');
    
  logWithTimestamp('📊 Description extracted', { resultLength: result.length });
  return result;
}

function detectEffects(frameAnalyses) {
  const startTime = Date.now();
  logWithTimestamp('🎨 Detecting visual effects', { frameCount: frameAnalyses.length });
  
  const effects = [];
  
  frameAnalyses.forEach((analysis, index) => {
    if (analysis.toLowerCase().includes('effect') || analysis.toLowerCase().includes('transition')) {
      const effect = {
        name: 'Visual Effect',
        description: analysis.split('\n').find(line => line.toLowerCase().includes('effect'))?.trim() || 'Visual transition',
        timestamps: [`${index}s`]
      };
      effects.push(effect);
      logWithTimestamp(`🎨 Effect detected at frame ${index + 1}`, effect);
    }
  });

  const duration = Date.now() - startTime;
  logWithTimestamp('✅ Effect detection complete', { 
    effectCount: effects.length,
    duration: `${duration}ms`
  });

  return effects;
}

function parseMusicAnalysis(analysis) {
  logWithTimestamp('🎼 Parsing music analysis', { analysisLength: analysis?.length || 0 });
  
  // Parse the GPT-4 analysis of audio
  const lines = analysis.split('\n');
  const result = {
    genre: lines.find(line => line.includes('genre'))?.split(':')[1]?.trim() || 'Background Music',
    bpm: parseInt(lines.find(line => line.includes('BPM'))?.split(':')[1]?.trim() || '120'),
    energy: lines.find(line => line.includes('Energy'))?.split(':')[1]?.trim() || 'Medium',
    mood: lines.find(line => line.includes('mood'))?.split(':')[1]?.trim() || 'Neutral'
  };
  
  logWithTimestamp('🎼 Music analysis parsed', result);
  return result;
}

async function generateSceneAnalysis(frameAnalyses, audioAnalysis) {
  const startTime = Date.now();
  logWithTimestamp('🎬 Starting scene detection and comprehensive analysis', { 
    frameCount: frameAnalyses.length 
  });

  try {
    // Step 1: Detect scene boundaries by analyzing continuity between frames
    const scenes = detectSceneBoundaries(frameAnalyses);
    logWithTimestamp('🔍 Scene boundaries detected', { sceneCount: scenes.length });

    // Step 2: Generate comprehensive analysis for each scene
    const comprehensiveScenes = await Promise.all(
      scenes.map(async (scene, sceneIndex) => {
        return await generateSceneCard(scene, sceneIndex, audioAnalysis);
      })
    );

    const duration = Date.now() - startTime;
    logWithTimestamp('✅ Scene analysis complete', {
      sceneCount: comprehensiveScenes.length,
      duration: `${duration}ms`
    });

    return comprehensiveScenes;
  } catch (error) {
    logWithTimestamp('❌ Scene analysis failed', { error: error.message });
    throw error;
  }
}

function detectSceneBoundaries(frameAnalyses) {
  logWithTimestamp('🔍 Detecting scene boundaries');
  
  const scenes = [];
  let currentScene = {
    startFrame: 0,
    frames: [frameAnalyses[0]]
  };

  for (let i = 1; i < frameAnalyses.length; i++) {
    const currentFrame = frameAnalyses[i];
    const previousFrame = frameAnalyses[i - 1];
    
    // Simple scene boundary detection based on significant changes
    const isNewScene = detectSceneChange(currentFrame.analysis, previousFrame.analysis);
    
    if (isNewScene && currentScene.frames.length >= 2) {
      // End current scene
      currentScene.endFrame = i - 1;
      currentScene.duration = currentScene.frames.length;
      scenes.push(currentScene);
      
      // Start new scene
      currentScene = {
        startFrame: i,
        frames: [currentFrame]
      };
    } else {
      // Continue current scene
      currentScene.frames.push(currentFrame);
    }
  }

  // Add the last scene
  currentScene.endFrame = frameAnalyses.length - 1;
  currentScene.duration = currentScene.frames.length;
  scenes.push(currentScene);

  logWithTimestamp('📊 Scene detection results', {
    totalScenes: scenes.length,
    avgSceneDuration: (scenes.reduce((sum, s) => sum + s.duration, 0) / scenes.length).toFixed(1) + 's'
  });

  return scenes;
}

function detectSceneChange(currentAnalysis, previousAnalysis) {
  // Look for significant changes that indicate a new scene
  const currentText = currentAnalysis.toLowerCase();
  const previousText = previousAnalysis.toLowerCase();
  
  // Check for setting changes
  const settingChange = (
    currentText.includes('setting:') && previousText.includes('setting:') &&
    extractValue(currentText, 'setting:') !== extractValue(previousText, 'setting:')
  );
  
  // Check for major framing changes
  const framingChange = (
    currentText.includes('framing:') && previousText.includes('framing:') &&
    extractValue(currentText, 'framing:') !== extractValue(previousText, 'framing:')
  );
  
  // Check for subject changes
  const subjectChange = (
    currentText.includes('subjects:') && previousText.includes('subjects:') &&
    !haveSimilarSubjects(extractValue(currentText, 'subjects:'), extractValue(previousText, 'subjects:'))
  );

  return settingChange || (framingChange && subjectChange);
}

function extractValue(text, key) {
  const regex = new RegExp(`${key}\\s*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function haveSimilarSubjects(current, previous) {
  if (!current || !previous) return false;
  
  const currentWords = current.toLowerCase().split(/\s+/);
  const previousWords = previous.toLowerCase().split(/\s+/);
  
  // Check if they share at least 30% of words
  const commonWords = currentWords.filter(word => previousWords.includes(word));
  return commonWords.length / Math.max(currentWords.length, previousWords.length) > 0.3;
}

async function generateSceneCard(scene, sceneIndex, audioAnalysis) {
  logWithTimestamp(`🎬 Generating scene card ${sceneIndex + 1}`, {
    startFrame: scene.startFrame,
    endFrame: scene.endFrame,
    duration: scene.duration
  });

  // Aggregate frame analyses
  const frameData = scene.frames.map(f => f.analysis).join('\n\n');
  
  // Get audio segment for this scene
  const audioSegment = getAudioSegmentForScene(scene, audioAnalysis);
  
  // Generate comprehensive scene analysis including contextual meaning
  const sceneAnalysis = await handleRateLimit(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Analyze this video scene (${scene.duration} seconds, frames ${scene.startFrame}-${scene.endFrame}) and create a comprehensive scene card with deep contextual understanding.

CRITICAL CONTEXT HIERARCHY:
1. DIALOGUE (highest priority): ${audioSegment.audioType === 'dialogue' ? audioSegment.transcription : 'No dialogue detected'}
2. ON-SCREEN TEXT (second priority): Extract ALL visible text from frame analysis
3. MUSIC/LYRICS (lower priority): ${audioSegment.audioType === 'music' ? audioSegment.transcription : 'No music lyrics detected'}

CONTEXTUAL ANALYSIS FOCUS:
- What is the creator trying to achieve in this scene?
- HOW do they achieve their intent? (specific techniques)
- Why are certain visual/audio choices made?
- What impact does this scene have on the viewer?
- How does this scene contribute to the overall narrative/message?
- What do dialogue and on-screen text reveal about the context?

Frame-by-frame analysis (pay special attention to ON_SCREEN_TEXT fields):
${frameData}

Audio context (Priority: ${audioSegment.priorityContext || 'Unknown'}):
Transcription: ${audioSegment.transcription}
Context Analysis: ${audioSegment.contextualAnalysis}
Audio Type: ${audioSegment.audioType}

Create a scene analysis card with the following structure:

{
  "sceneNumber": ${sceneIndex + 1},
  "duration": "${scene.duration}s",
  "timeRange": "${scene.startFrame}s - ${scene.endFrame}s",
  "title": "[Brief descriptive title]",
  "description": "[2-3 sentence overview]",
  "framing": {
    "shotTypes": ["primary shot types used"],
    "cameraMovement": "[static/pan/zoom/etc]",
    "composition": "[visual composition notes]"
  },
  "lighting": {
    "style": "[natural/artificial/dramatic/etc]",
    "mood": "[bright/dark/moody/etc]",
    "direction": "[front/back/side lit]",
    "quality": "[soft/hard/diffused]"
  },
  "mood": {
    "emotional": "[happy/sad/tense/etc]",
    "atmosphere": "[calm/energetic/mysterious/etc]",
    "tone": "[serious/playful/dramatic/etc]"
  },
  "action": {
    "movement": "[description of movement/action]",
    "direction": "[screen direction, eye lines]",
    "pace": "[slow/medium/fast]"
  },
  "dialogue": {
    "hasText": true/false,
    "textContent": "[any visible text or dialogue]",
    "textStyle": "[overlay style, font treatment]"
  },
  "audio": {
    "music": "[music description]",
    "soundDesign": "[sound effects, ambient]",
    "dialogue": "[spoken content if any]"
  },
  "visualEffects": {
    "transitions": "[cuts/fades/wipes/etc]",
    "effects": "[filters, overlays, etc]",
    "graphics": "[text overlays, graphics]"
  },
  "setting": {
    "location": "[where scene takes place]",
    "environment": "[indoor/outdoor/studio/etc]",
    "background": "[background elements]"
  },
  "subjects": {
    "main": "[primary subjects/people]",
    "secondary": "[background elements]",
    "focus": "[what draws attention]"
  },
  "contextualMeaning": {
    "intent": "[what the creator is trying to achieve]",
    "execution": "[HOW they achieve it - specific techniques]",
    "impact": "[effect on viewer - emotional/narrative]",
    "significance": "[why this scene matters to overall message]"
  }
}

Provide only the JSON response with no additional text.`
        }
      ],
      max_tokens: 1500
    });

    return response.choices[0].message.content;
  });

  try {
    // Parse the JSON response
    const sceneCard = JSON.parse(sceneAnalysis);
    logWithTimestamp(`✅ Scene card ${sceneIndex + 1} generated successfully`);
    return sceneCard;
  } catch (parseError) {
    logWithTimestamp(`⚠️ Failed to parse scene card JSON for scene ${sceneIndex + 1}`, {
      error: parseError.message
    });
    
    // Return a fallback structure
    return {
      sceneNumber: sceneIndex + 1,
      duration: `${scene.duration}s`,
      timeRange: `${scene.startFrame}s - ${scene.endFrame}s`,
      title: `Scene ${sceneIndex + 1}`,
      description: "Scene analysis failed to parse",
      error: parseError.message,
      rawAnalysis: sceneAnalysis
    };
  }
}

function getAudioSegmentForScene(scene, audioAnalysis) {
  if (!audioAnalysis?.transcription?.segments) {
    return audioAnalysis?.analysis || 'No audio analysis available';
  }

  // Find audio segments that overlap with this scene (convert to 0.5s intervals for 2fps)
  const sceneStartTime = scene.startFrame * 0.5;
  const sceneEndTime = scene.endFrame * 0.5;
  
  const relevantSegments = audioAnalysis.transcription.segments.filter(segment => {
    const segStart = segment.start || 0;
    const segEnd = segment.end || 0;
    return (segStart >= sceneStartTime && segStart <= sceneEndTime) || 
           (segEnd >= sceneStartTime && segEnd <= sceneEndTime) ||
           (segStart <= sceneStartTime && segEnd >= sceneEndTime);
  });

  if (relevantSegments.length === 0) {
    return {
      transcription: 'No audio detected for this scene',
      contextualAnalysis: audioAnalysis?.separatedAudio?.audioSummary || 'Limited audio context',
      audioType: 'none'
    };
  }

  // Prioritize dialogue over music for context
  const sceneTranscript = relevantSegments.map(seg => seg.text).join(' ');
  
  // Determine if this scene primarily contains dialogue or music
  let audioType = 'mixed';
  let contextualMeaning = '';
  
  if (audioAnalysis.separatedAudio) {
    const dialogueContent = audioAnalysis.separatedAudio.dialogue?.content || '';
    const musicContent = audioAnalysis.separatedAudio.musicLyrics?.content || '';
    
    // Check if scene transcript is primarily dialogue
    if (dialogueContent && sceneTranscript && dialogueContent.includes(sceneTranscript.substring(0, 50))) {
      audioType = 'dialogue';
      contextualMeaning = audioAnalysis.separatedAudio.dialogue?.primaryContext || 'Dialogue provides key context';
    } else if (musicContent && sceneTranscript && musicContent.includes(sceneTranscript.substring(0, 50))) {
      audioType = 'music';
      contextualMeaning = audioAnalysis.separatedAudio.musicLyrics?.role || 'Music supports the mood';
    } else {
      contextualMeaning = audioAnalysis.separatedAudio.audioSummary || 'Mixed audio content';
    }
  }

  return {
    transcription: sceneTranscript,
    contextualAnalysis: contextualMeaning,
    audioType: audioType,
    musicAnalysis: audioAnalysis.analysis,
    priorityContext: audioType === 'dialogue' ? 'HIGH - Contains spoken dialogue' : 'MEDIUM - Music/effects only'
  };
}

async function generateContentStructure(frameAnalyses, audioAnalysis, scenes) {
  const startTime = Date.now();
  logWithTimestamp('📝 Generating strategic content analysis', { 
    frameCount: frameAnalyses.length,
    sceneCount: scenes.length,
    hasAudioAnalysis: !!audioAnalysis?.analysis
  });
  
  try {
    // Compile comprehensive data for strategic analysis
    const videoLength = (frameAnalyses.length / 2).toFixed(1); // 2fps = 0.5s per frame
    
    // Extract all on-screen text from frames
    const allFrameText = frameAnalyses.map(frame => {
      const textMatch = frame.analysis.match(/ON_SCREEN_TEXT:\s*([^-\n]+)/i);
      return textMatch ? textMatch[1].trim() : '';
    }).filter(text => text && text !== 'None' && text !== 'No visible text');
    
    // Get dialogue vs music separation
    const dialogueContent = audioAnalysis.separatedAudio?.dialogue?.content || '';
    const musicContent = audioAnalysis.separatedAudio?.musicLyrics?.content || '';
    const contextPriority = audioAnalysis.separatedAudio?.contextPriority || 'unknown';
    
    // Compile scene progression
    const sceneProgression = scenes.map((scene, index) => ({
      sceneNumber: index + 1,
      title: scene.title || `Scene ${index + 1}`,
      timeRange: scene.timeRange || `${scene.startFrame * 0.5}s-${scene.endFrame * 0.5}s`,
      contextualMeaning: scene.contextualMeaning || {}
    }));

    const strategicAnalysis = await handleRateLimit(async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `Create a strategic video analysis overview in the format of a professional content strategist. Analyze this ${videoLength}-second video for its deeper meaning, viral potential, and systematic structure.

VIDEO DATA:
Duration: ${videoLength} seconds
Scenes: ${scenes.length}
Context Priority: ${contextPriority}

DIALOGUE/NARRATION: "${dialogueContent}"
ON-SCREEN TEXT: ${allFrameText.join(' | ')}
MUSIC/LYRICS: "${musicContent}"

SCENE PROGRESSION:
${sceneProgression.map(scene => `Scene ${scene.sceneNumber}: ${scene.title} (${scene.timeRange})`).join('\n')}

FRAME-BY-FRAME ANALYSIS:
${frameAnalyses.slice(0, 8).map((frame, i) => `${(i * 0.5).toFixed(1)}s: ${frame.contextualMeaning || 'Context analysis available'}`).join('\n')}

Create a comprehensive analysis following this structure:

**VIDEO OVERVIEW**
- Format/Genre classification
- Primary message/theme
- Emotional arc (start → middle → end)
- Why this video works (3-4 key reasons)

**STRATEGIC BREAKDOWN**
- Core message structure
- Escalation pattern (if applicable)
- Narrative techniques used
- Visual storytelling evolution

**REPLICATION INSIGHTS**
- Template/formula identification
- Key success elements
- Adaptable patterns
- Viral mechanics

Focus on WHY this content works, not just WHAT happens. Identify the systematic approach that makes it effective and replicable. Write as if training someone to create similar content.`
          }
        ],
        max_tokens: 8000
      });

      return response.choices[0].message.content;
    });

    const duration = Date.now() - startTime;
    logWithTimestamp('✅ Strategic content analysis complete', { 
      analysisLength: strategicAnalysis?.length || 0,
      duration: `${duration}ms`
    });

    return strategicAnalysis;

  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp('❌ Strategic content analysis failed', { 
      error: error.message,
      duration: `${duration}ms`
    });
    
    // Fallback to basic structure
    const videoLength = (frameAnalyses.length / 2).toFixed(1);
    return `${videoLength}-second video with ${scenes.length} scenes. Strategic analysis failed: ${error.message}`;
  }
}

function extractMultipleValues(text, key) {
  const regex = new RegExp(`${key}\\s*([^\\n]+)`, 'gi');
  const matches = [...text.matchAll(regex)];
  return [...new Set(matches.map(match => match[1].trim()))].slice(0, 5); // Limit to 5 unique values
}

function extractHook(firstFrameAnalysis) {
  logWithTimestamp('🎯 Extracting hook from first frame', { 
    analysisType: typeof firstFrameAnalysis,
    analysisLength: firstFrameAnalysis?.analysis?.length || firstFrameAnalysis?.length || 0 
  });
  
  // Handle both old string format and new object format
  let analysisText = '';
  if (typeof firstFrameAnalysis === 'string') {
    analysisText = firstFrameAnalysis;
  } else if (firstFrameAnalysis?.analysis) {
    analysisText = firstFrameAnalysis.analysis;
  } else {
    logWithTimestamp('⚠️ No valid analysis found for hook extraction');
    return 'Engaging opening';
  }
  
  // Extract hook from the first frame's analysis
  const lines = analysisText.split('\n');
  const actionLine = lines.find(line => line.toLowerCase().includes('action:'));
  const subjectLine = lines.find(line => line.toLowerCase().includes('subjects:'));
  
  let result = 'Engaging opening';
  if (actionLine) {
    result = actionLine.split(':')[1]?.trim() || result;
  } else if (subjectLine) {
    result = `Opening featuring ${subjectLine.split(':')[1]?.trim()}`;
  }
  
  logWithTimestamp('🎯 Hook extracted', { result, actionLine, subjectLine });
  return result;
}

// Extract video hooks from frame analyses and audio
async function extractVideoHooks(frameAnalyses, audioAnalysis) {
  logWithTimestamp('🔍 Analyzing video for hooks...', {
    frameCount: frameAnalyses?.length || 0,
    hasAudio: !!audioAnalysis,
    hasTranscript: !!audioAnalysis?.transcription?.text
  });
  
  try {
    const hookPrompt = `Analyze this video data to identify attention-grabbing hooks. Look for:

VISUAL DISRUPTERS:
- Camera movements (zooms, pans, tilts, shakes, whip pans, speed ramps)
- Zoom punches (rapid zoom in/out for emphasis)
- Speed ramps (slow motion to normal speed transitions)
- Gimbal movements (smooth tracking/following shots)
- Match cuts and creative transitions
- Interesting objects or props appearing
- Actions by talent (gestures, movements, expressions)
- Scene changes or abrupt transitions
- Visual effects, graphics, or overlays
- Rack focus (focus pulling between subjects)

QUESTIONS:
- Direct questions to the viewer
- Breaking the 4th wall moments
- Rhetorical questions that engage

ACTION STATEMENTS:
- Positive statements ("Do these 5 things if you want X")
- Negative statements ("Avoid these if you want to get X")
- Commands or calls to action
- Lists or numbered points

TRANSCRIPT: ${audioAnalysis.transcription?.text || 'No audio transcript available'}

FRAME DATA: ${frameAnalyses.slice(0, 10).map((frame, i) => `Frame ${i+1}s: ${typeof frame === 'string' ? frame : frame.analysis || JSON.stringify(frame)}`).join('\n')}

Return a JSON array of hooks found, each with:
{
  "timestamp": "Xs",
  "type": "visual_disrupter|question|positive_statement|negative_statement",
  "description": "What specifically happens",
  "impact": "high|medium|low",
  "element": "Specific visual or audio element"
}`;

    const response = await handleRateLimit(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: hookPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });
    });

    const hooksText = response.choices[0].message.content;
    logWithTimestamp('🤖 AI hooks response', { 
      responseLength: hooksText?.length || 0,
      response: hooksText?.substring(0, 300) // Log first 300 chars
    });
    
    // Try to parse JSON, fallback to empty array if parsing fails
    try {
      const hooks = JSON.parse(hooksText);
      const validHooks = Array.isArray(hooks) ? hooks : [];
      logWithTimestamp('✅ Hooks parsed successfully', { hookCount: validHooks.length });
      return validHooks;
    } catch (parseError) {
      logWithTimestamp('⚠️ Failed to parse hooks JSON, extracting manually', { 
        error: parseError.message,
        rawResponse: hooksText?.substring(0, 500)
      });
      return extractHooksFromText(hooksText);
    }
    
  } catch (error) {
    logWithTimestamp('❌ Error extracting hooks:', error.message);
    return [];
  }
}

// Fallback hook extraction from text
function extractHooksFromText(text) {
  const hooks = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.includes('timestamp') || line.includes('Frame')) {
      const timestampMatch = line.match(/(\d+)s/);
      if (timestampMatch) {
        hooks.push({
          timestamp: `${timestampMatch[1]}s`,
          type: 'visual_disrupter',
          description: line.trim(),
          impact: 'medium',
          element: 'Detected from analysis'
        });
      }
    }
  });
  
  return hooks;
}

// Categorize video into one of the 7 categories
async function categorizeVideo(frameAnalyses, audioAnalysis, scenes) {
  logWithTimestamp('🏷️ Categorizing video...', {
    frameCount: frameAnalyses?.length || 0,
    hasAudio: !!audioAnalysis,
    hasTranscript: !!audioAnalysis?.transcription?.text,
    sceneCount: scenes?.length || 0
  });
  
  try {
    const categoryPrompt = `Analyze this video content and categorize it into ONE of these 7 categories:

1. DELIGHTFUL MESSAGING
- Surprising/delightful visual or narrative twist
- "You got me" scroll-stopping moment
- Quick pivot to brand message
- Emotional resonance and shareability

2. ENGAGING EDUCATION  
- 2-4 clear educational points
- Mini-disrupters with each point
- Energetic pacing
- Authoritative educator positioning

3. DYNAMIC B-ROLL
- Visually striking footage
- Creative transitions (match cuts, speed ramps)
- Hyperlapses, gimbal moves, camera motion
- Close-ups on textures and movement

4. SITUATIONAL CREATIVE
- Unexpected, relatable context
- Pop-culture analogies or skits
- Subverted expectations
- Brand personality showcase

5. NARRATED NARRATIVE
- Fly-on-the-wall style
- Wide/static shots with voice-over
- Internal monologue style
- Intimate and authentic feel

6. BTS INTERVIEW
- Candid, in-action insights
- Interview while working
- Raw and authentic feel
- Trust-building content

7. TUTORIAL
- Step-by-step instructional content
- Process demonstration and explanation
- "How to" or "Follow along" format
- Clear sequential steps with visual demonstration
- Educational but focused on practical skills/techniques

TRANSCRIPT: ${audioAnalysis.transcription?.text || 'No audio transcript available'}

SCENES: ${scenes.map(scene => `Scene ${scene.sceneNumber}: ${scene.description}`).join('\n')}

VISUAL ELEMENTS: ${frameAnalyses.slice(0, 5).map((frame, i) => `${i+1}s: ${typeof frame === 'string' ? frame.substring(0, 200) : (frame.analysis || JSON.stringify(frame)).substring(0, 200)}`).join('\n')}

Return JSON with:
{
  "category": "delightful_messaging|engaging_education|dynamic_broll|situational_creative|narrated_narrative|bts_interview|tutorial",
  "confidence": 0.0-1.0,
  "reasoning": "Why this category fits",
  "keyIndicators": ["indicator1", "indicator2", "indicator3"]
}`;

    const response = await handleRateLimit(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: categoryPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.2
      });
    });

    const categoryText = response.choices[0].message.content;
    logWithTimestamp('🤖 AI categorization response', { 
      responseLength: categoryText?.length || 0,
      response: categoryText?.substring(0, 500) // Log first 500 chars
    });
    
    try {
      const parsed = JSON.parse(categoryText);
      logWithTimestamp('✅ Category parsed successfully', { category: parsed.category, confidence: parsed.confidence });
      return parsed;
    } catch (parseError) {
      logWithTimestamp('⚠️ Failed to parse category JSON, using fallback', { 
        error: parseError.message,
        rawResponse: categoryText 
      });
      return {
        category: 'dynamic_broll',
        confidence: 0.5,
        reasoning: 'Unable to parse AI response, defaulting to dynamic b-roll',
        keyIndicators: ['Visual content detected']
      };
    }
    
  } catch (error) {
    logWithTimestamp('❌ Error categorizing video:', { 
      error: error.message,
      stack: error.stack
    });
    return {
      category: 'dynamic_broll',
      confidence: 0.0,
      reasoning: `Error during categorization: ${error.message}`,
      keyIndicators: ['Analysis failed']
    };
  }
}

// Analyze the deeper context, narrative, and subtle messaging of the video
async function analyzeVideoContext(frameAnalyses, audioAnalysis, scenes) {
  logWithTimestamp('🧠 Analyzing video context and narrative...', {
    frameCount: frameAnalyses?.length || 0,
    hasAudio: !!audioAnalysis,
    hasTranscript: !!audioAnalysis?.transcription?.text,
    sceneCount: scenes?.length || 0
  });
  
  try {
    const contextPrompt = `Analyze this video's deeper context, narrative, and subtle messaging. Look beyond surface-level content to understand:

INTENT & EXECUTION ANALYSIS:
- What is the creator's specific intent (humor, education, persuasion, etc.)?
- HOW do they achieve this intent? What specific techniques are used?
- What narrative devices, timing, or visual tricks create the desired effect?
- What makes it effective or impactful?

HUMOR MECHANICS (if applicable):
- What specifically makes this funny? (timing, contrast, expectation subversion, irony)
- Are there visual gags, text reveals, timing cuts, or freeze frames?
- How does timing contribute to the humor?
- What expectations are set up and then broken?
- Is it using contradiction, exaggeration, or relatable scenarios?

NARRATIVE STRUCTURE:
- How is the story structured to maximize impact?
- What is the setup, conflict, and resolution/punchline?
- How do visual and audio elements work together?
- What storytelling techniques enhance the message?

VISUAL STORYTELLING TECHNIQUES:
- How do on-screen text, graphics, and timing create meaning?
- What role do freeze frames, transitions, or cuts play?
- How do facial expressions, body language, and reactions contribute?
- What visual contrasts or juxtapositions are used?

CHARACTER DYNAMICS:
- Who are the main subjects and what do they represent?
- How do their situations, reactions, and outcomes convey the message?
- What stereotypes or archetypes are being utilized?
- How do character interactions drive the narrative?

MESSAGE DELIVERY:
- What is the core message and how is it communicated?
- What techniques make the message memorable or shareable?
- How does the creator ensure the audience "gets it"?
- What assumptions about audience knowledge are made?

TRANSCRIPT: ${audioAnalysis.transcription?.text || 'No audio transcript available'}

SCENES SUMMARY: ${scenes.map(scene => `Scene ${scene.sceneNumber}: ${scene.description} (${scene.duration})`).join('\n')}

VISUAL PROGRESSION: ${frameAnalyses.slice(0, 8).map((frame, i) => `${(i * 0.5).toFixed(1)}s: ${typeof frame === 'string' ? frame.substring(0, 150) : (frame.analysis || JSON.stringify(frame)).substring(0, 150)}`).join('\n')}

Return detailed JSON analysis:
{
  "creatorIntent": {
    "primaryIntent": "What the creator wants to achieve",
    "howAchieved": "Specific techniques and methods used",
    "effectivenessFactors": ["factor1", "factor2", "factor3"]
  },
  "humorMechanics": {
    "isHumorous": true/false,
    "humorType": "timing|irony|contrast|exaggeration|relatability|visual_gag",
    "specificTechniques": ["technique1", "technique2"],
    "setupAndPayoff": "How expectations are set and subverted",
    "timingElements": "How timing creates the effect"
  },
  "narrativeStructure": {
    "setup": "Initial situation or premise",
    "conflict": "Problem or tension introduced",
    "resolution": "How it's resolved or punchline delivered",
    "storytellingDevices": ["device1", "device2"]
  },
  "visualTechniques": {
    "textElements": "How on-screen text contributes",
    "visualEffects": "Freeze frames, transitions, cuts",
    "facialExpressions": "How expressions convey meaning",
    "visualContrasts": "Before/after, comparison shots"
  },
  "characters": [
    {
      "description": "Character description",
      "represents": "What they symbolize",
      "narrative_function": "Their role in achieving the intent",
      "key_moments": "Important actions or reactions"
    }
  ],
  "messageDelivery": {
    "coreMessage": "The main point being made",
    "deliveryMethod": "How the message is communicated",
    "memorabilityFactors": ["factor1", "factor2"],
    "audienceAssumptions": ["assumption1", "assumption2"]
  },
  "contextType": "humor|comparison|tutorial|story|commentary|parody",
  "targetAudience": "Who this is made for",
  "keyInsights": [
    "Specific insight about how intent is achieved",
    "Technical insight about the methods used",
    "Strategic insight about why it works"
  ]
}`;

    const response = await handleRateLimit(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: contextPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });
    });

    const contextText = response.choices[0].message.content;
    logWithTimestamp('🤖 AI context analysis response', { 
      responseLength: contextText?.length || 0,
      response: contextText?.substring(0, 500) // Log first 500 chars
    });
    
    try {
      const parsed = JSON.parse(contextText);
      logWithTimestamp('✅ Context analysis parsed successfully', { 
        narrative: parsed.mainNarrative?.substring(0, 100),
        themeCount: parsed.themes?.length || 0,
        characterCount: parsed.characters?.length || 0,
        contextType: parsed.contextType
      });
      return parsed;
    } catch (parseError) {
      logWithTimestamp('⚠️ Failed to parse context JSON, using fallback', { 
        error: parseError.message,
        rawResponse: contextText?.substring(0, 500)
      });
      return extractContextFromText(contextText);
    }
    
  } catch (error) {
    logWithTimestamp('❌ Error analyzing video context:', { 
      error: error.message,
      stack: error.stack
    });
    return {
      creatorIntent: {
        primaryIntent: 'Context analysis failed',
        howAchieved: 'Unable to analyze techniques',
        effectivenessFactors: ['Analysis error']
      },
      humorMechanics: {
        isHumorous: false,
        humorType: 'unknown',
        specificTechniques: ['Analysis failed'],
        setupAndPayoff: 'Unable to analyze',
        timingElements: 'Not available'
      },
      narrativeStructure: {
        setup: 'Analysis failed',
        conflict: 'Analysis failed',
        resolution: 'Analysis failed',
        storytellingDevices: ['Error in analysis']
      },
      visualTechniques: {
        textElements: 'Analysis failed',
        visualEffects: 'Analysis failed',
        facialExpressions: 'Analysis failed',
        visualContrasts: 'Analysis failed'
      },
      characters: [],
      messageDelivery: {
        coreMessage: 'Unable to analyze context',
        deliveryMethod: 'Analysis failed',
        memorabilityFactors: ['Error in analysis'],
        audienceAssumptions: ['Unknown']
      },
      contextType: 'unknown',
      targetAudience: 'Unknown',
      keyInsights: [`Error during analysis: ${error.message}`]
    };
  }
}

// Fallback context extraction from text
function extractContextFromText(text) {
  const lines = text.split('\n');
  
  // Try to extract key information from the text response
  const narrative = lines.find(line => line.toLowerCase().includes('narrative') || line.toLowerCase().includes('story'))?.trim() || 'Unable to parse narrative';
  const themes = lines.filter(line => line.toLowerCase().includes('theme')).map(line => line.trim()).slice(0, 3);
  
  return {
    creatorIntent: {
      primaryIntent: 'Intent analysis failed',
      howAchieved: 'Unable to parse specific techniques',
      effectivenessFactors: ['Fallback analysis']
    },
    humorMechanics: {
      isHumorous: false,
      humorType: 'unknown',
      specificTechniques: ['Unable to analyze'],
      setupAndPayoff: 'Analysis failed',
      timingElements: 'Not available'
    },
    narrativeStructure: {
      setup: 'Unable to parse setup',
      conflict: 'Unable to parse conflict',
      resolution: 'Unable to parse resolution',
      storytellingDevices: ['Fallback analysis']
    },
    visualTechniques: {
      textElements: 'Analysis failed',
      visualEffects: 'Analysis failed',
      facialExpressions: 'Analysis failed',
      visualContrasts: 'Analysis failed'
    },
    characters: [{
      description: 'Characters detected in video',
      represents: 'Various roles',
      narrative_function: 'Unable to analyze',
      key_moments: 'Analysis failed'
    }],
    messageDelivery: {
      coreMessage: 'Complex messaging detected',
      deliveryMethod: 'Multiple techniques',
      memorabilityFactors: ['Fallback analysis'],
      audienceAssumptions: ['General audience']
    },
    contextType: 'comparison',
    targetAudience: 'Content creators and tool users',
    keyInsights: ['Fallback analysis - check logs for details']
  };
}

async function cleanupFile(filePath) {
  const startTime = Date.now();
  logWithTimestamp('🧹 Cleaning up file', { filePath });
  
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      fs.unlinkSync(filePath);
      const duration = Date.now() - startTime;
      logWithTimestamp('✅ File cleanup successful', { 
        filePath,
        fileSize: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`
      });
    } else {
      logWithTimestamp('ℹ️ File does not exist, skipping cleanup', { filePath });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logWithTimestamp('❌ File cleanup failed', { 
      filePath,
      error: error.message,
      duration: `${duration}ms`
    });
  }
}

export async function POST(request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  logWithTimestamp('🚀 Starting new analysis request', { requestId });
  
  let videoPath = '';
  let requestBody = null;
  
  try {
    // Parse request body
    logWithTimestamp('📥 Parsing request body', { requestId });
    requestBody = await request.json();
    const { url } = requestBody;
    
    logWithTimestamp('📋 Request details', { 
      requestId,
      url,
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin')
    });
    
    // Validate input
    if (!url) {
      logWithTimestamp('❌ Missing URL in request', { requestId });
      return NextResponse.json({ 
        error: 'URL is required',
        requestId 
      }, { status: 400 });
    }

    // Validate environment or enable demo mode
    if (!process.env.OPENAI_API_KEY) {
      logWithTimestamp('⚠️ Missing OpenAI API key - using demo mode', { requestId });
      
      // Return demo analysis for testing UI
      const demoAnalysis = {
        contentStructure: "Demo analysis mode - OpenAI API not configured",
        hook: "Demo Hook: This is a sample analysis",
        totalDuration: "6.0s",
        scenes: [
          {
            sceneNumber: 1,
            duration: "3.0s",
            timeRange: "0:00 - 0:03",
            title: "Demo Scene 1",
            description: "Sample scene for testing UI",
            framing: { shotTypes: ["Medium Shot"], cameraMovement: "Static", composition: "Centered" },
            lighting: { style: "Natural", mood: "Neutral", direction: "Front", quality: "Good" },
            mood: { emotional: "Neutral", atmosphere: "Calm", tone: "Professional" },
            action: { movement: "Minimal", direction: "Static", pace: "Slow" },
            dialogue: { hasText: true, textContent: "Demo text content", textStyle: "Simple" },
            audio: { music: "Background", soundDesign: "Minimal", dialogue: "Clear" },
            visualEffects: { transitions: "Cut", effects: "None", graphics: "Text overlay" },
            setting: { location: "Indoor", environment: "Office", background: "Neutral" },
            subjects: { main: "Person", secondary: "Objects", focus: "Center" },
            contextualMeaning: {
              intent: "Demonstrate the UI functionality",
              execution: "Simple demo implementation",
              impact: "Shows how the analysis would appear",
              significance: "Testing interface without API costs"
            }
          },
          {
            sceneNumber: 2,
            duration: "3.0s",
            timeRange: "0:03 - 0:06",
            title: "Demo Scene 2",
            description: "Second sample scene",
            framing: { shotTypes: ["Close-up"], cameraMovement: "Pan", composition: "Off-center" },
            lighting: { style: "Artificial", mood: "Warm", direction: "Side", quality: "Excellent" },
            mood: { emotional: "Positive", atmosphere: "Energetic", tone: "Engaging" },
            action: { movement: "Moderate", direction: "Left to right", pace: "Medium" },
            dialogue: { hasText: false, textContent: "", textStyle: "" },
            audio: { music: "Upbeat", soundDesign: "Enhanced", dialogue: "None" },
            visualEffects: { transitions: "Fade", effects: "Motion blur", graphics: "None" },
            setting: { location: "Outdoor", environment: "Street", background: "Urban" },
            subjects: { main: "Movement", secondary: "Background", focus: "Dynamic" },
            contextualMeaning: {
              intent: "Show scene progression",
              execution: "Smooth transition",
              impact: "Maintains viewer engagement",
              significance: "Demonstrates pacing"
            }
          }
        ],
        transcript: { text: "Demo transcript: This is a sample analysis without actual audio processing.", segments: [] },
        hooks: [],
        videoCategory: { category: "tutorial", confidence: 0.8, reasoning: "Demo mode active", keyIndicators: ["demo", "testing"] },
        contextualAnalysis: {
          creatorIntent: { primaryIntent: "Testing the interface", howAchieved: "Demo mode", effectivenessFactors: ["UI testing"] },
          humorMechanics: { isHumorous: false, humorType: "none", specificTechniques: [], setupAndPayoff: "", timingElements: "" },
          narrativeStructure: { setup: "Demo setup", conflict: "API unavailable", resolution: "Fallback mode", storytellingDevices: ["demo"] },
          visualTechniques: { textElements: "Demo text", visualEffects: "Demo effects", facialExpressions: "N/A", visualContrasts: "Demo contrast" },
          characters: [],
          messageDelivery: { coreMessage: "Demo mode active", deliveryMethod: "Fallback", memorabilityFactors: ["demo"], audienceAssumptions: ["testing"] },
          contextType: "demo",
          targetAudience: "developers",
          keyInsights: ["This is demo mode - configure OpenAI API key for real analysis"]
        },
        strategicOverview: `## Video Analysis Overview (Demo Mode)

**Content Type:** Demo Tutorial
**Duration:** 2 scenes analyzed  
**Primary Appeal:** Interface Testing

### Key Success Elements:
- Scene 1: Demonstrate the UI functionality
- Scene 2: Show scene progression

### Strategic Breakdown

#### Why It Works: Interface Testing
- Provides immediate visual feedback without API costs
- Allows UI testing and development iteration
- Shows the complete analysis structure

#### Success Formula: Demo Implementation
1. **Structure**: 2-scene progression for basic testing
2. **Timing**: Balanced 3-second scenes
3. **Content**: Covers all analysis categories

#### Universal Principles: Development Testing
- Immediate feedback for developers
- Complete UI coverage without external dependencies  
- Safe testing environment

#### Technical Requirements: Configuration Needed
- **Critical**: Valid OpenAI API key for real analysis
- **Optional**: Sufficient API credits for video processing
- **Recommended**: Test with demo mode first

### Replication Insights

#### Implementation Framework
1. Configure OpenAI API key in environment variables
2. Ensure sufficient API credits
3. Test with short videos first
4. Monitor API usage and costs

#### Resource Requirements
- **Demo Mode**: No API costs, instant results
- **Full Analysis**: API credits required (1 credit per 15 seconds)
- **Development**: Use demo mode for UI testing

*Note: This is demo mode. Configure your OpenAI API key for full video analysis capabilities.*`,
        videoMetadata: {
          totalFrames: 12,
          frameRate: 2,
          analysisTimestamp: new Date().toISOString()
        }
      };
      
      return NextResponse.json({
        ...demoAnalysis,
        requestId,
        processingTime: "1ms",
        isDemoMode: true
      });
    }

    logWithTimestamp('✅ Environment validation passed', { requestId });

    // Start video analysis
    logWithTimestamp('🎬 Starting video analysis pipeline', { requestId, url });

    videoPath = await downloadVideo(url);
    logWithTimestamp('✅ Video download completed', { requestId, videoPath });
    
    const analysis = await analyzeVideo(videoPath);
    logWithTimestamp('✅ Video analysis completed', { requestId });
    
    // Final cleanup
    await cleanupFile(videoPath);
    
    const totalDuration = Date.now() - startTime;
    logWithTimestamp('🎉 Request completed successfully!', { 
      requestId,
      totalDuration: `${totalDuration}ms`,
      analysisKeys: Object.keys(analysis)
    });
    
    return NextResponse.json({
      ...analysis,
      requestId,
      processingTime: `${totalDuration}ms`
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logWithTimestamp('💥 Request failed with error', { 
      requestId,
      error: error.message,
      stack: error.stack,
      totalDuration: `${totalDuration}ms`,
      requestBody,
      videoPath
    });
    
    // Ensure cleanup even on error
    if (videoPath) {
      await cleanupFile(videoPath);
    }

    // Clean up frames directory if it exists
    const framesDir = path.join(process.cwd(), 'temp', 'frames');
    if (fs.existsSync(framesDir)) {
      try {
        const frameFiles = fs.readdirSync(framesDir);
        logWithTimestamp('🧹 Emergency cleanup of frames directory', { 
          frameCount: frameFiles.length,
          requestId
        });
      fs.rmSync(framesDir, { recursive: true, force: true });
        logWithTimestamp('✅ Emergency cleanup completed', { requestId });
      } catch (cleanupError) {
        logWithTimestamp('❌ Emergency cleanup failed', { 
          error: cleanupError.message,
          requestId
        });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to analyze video', 
      details: error.message,
      requestId,
      processingTime: `${totalDuration}ms`
    }, { status: 500 });
  }
}
