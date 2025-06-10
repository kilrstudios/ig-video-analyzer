import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import InstagramScraper from 'instagram-scraping';

const execAsync = promisify(exec);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function downloadVideo(url) {
  try {
    console.log('Downloading video from:', url);
    
    // Create a temporary directory for downloads if it doesn't exist
    const downloadDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }

    // Generate a unique filename
    const outputPath = path.join(downloadDir, `${Date.now()}.mp4`);
    
    // Extract video ID from URL
    const videoId = url.split('/').pop()?.split('?')[0];
    if (!videoId) {
      throw new Error('Invalid Instagram URL');
    }

    // Get video info using instagram-scraping
    const result = await InstagramScraper.getMediaByCode(videoId);
    if (!result || !result.video_url) {
      throw new Error('Failed to get video URL');
    }

    // Download the video using curl
    const command = `curl -L "${result.video_url}" -o "${outputPath}"`;
    console.log('Executing command:', command);
    
    const { stdout, stderr } = await execAsync(command);
    if (stderr) console.error('Download stderr:', stderr);

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

async function extractFrames(videoPath) {
  const framesDir = path.join(process.cwd(), 'temp', 'frames');
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  // Get video duration
  const { stdout: durationOutput } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
  );
  const duration = parseFloat(durationOutput);

  // Extract one frame every second
  const outputPattern = path.join(framesDir, 'frame-%d.jpg');
  await execAsync(`ffmpeg -i "${videoPath}" -vf fps=1 "${outputPattern}"`);

  // Get list of extracted frames
  const frames = fs.readdirSync(framesDir)
    .filter(file => file.startsWith('frame-') && file.endsWith('.jpg'))
    .map(file => path.join(framesDir, file))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/frame-(\d+)\.jpg/)?.[1] || '0');
      const bNum = parseInt(b.match(/frame-(\d+)\.jpg/)?.[1] || '0');
      return aNum - bNum;
    });

  return frames;
}

async function extractAudio(videoPath) {
  const audioPath = path.join(process.cwd(), 'temp', `${Date.now()}.mp3`);
  await execAsync(`ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}"`);
  return audioPath;
}

async function analyzeFrame(framePath) {
  const image = fs.readFileSync(framePath);
  const base64Image = Buffer.from(image).toString('base64');

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this frame and provide:\n1. Shot type (close-up, medium, wide, etc)\n2. Main visual elements\n3. Any text overlays\n4. Visual effects or transitions\n5. Overall composition and purpose"
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
    max_tokens: 500
  });

  return response.choices[0].message.content;
}

async function analyzeAudio(audioPath) {
  const audioFile = fs.createReadStream(audioPath);
  
  // First, transcribe the audio
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"]
  });

  // Then, analyze the transcription and audio characteristics
  const analysis = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: `Analyze this audio transcription and provide:\n1. Music genre and style\n2. Estimated BPM\n3. Energy level\n4. Overall mood\n\nTranscription: ${JSON.stringify(transcription)}`
      }
    ]
  });

  return {
    transcription,
    analysis: analysis.choices[0].message.content
  };
}

async function analyzeVideo(videoPath) {
  // Extract frames and audio
  const frames = await extractFrames(videoPath);
  const audioPath = await extractAudio(videoPath);

  // Analyze frames
  const frameAnalyses = await Promise.all(
    frames.map(frame => analyzeFrame(frame))
  );

  // Analyze audio
  const audioAnalysis = await analyzeAudio(audioPath);

  // Clean up frames and audio
  frames.forEach(frame => fs.unlinkSync(frame));
  fs.unlinkSync(audioPath);

  // Process frame analyses to detect shots and effects
  const shots = frameAnalyses.map((analysis, index) => {
    const duration = '1s'; // Each frame represents 1 second
    return {
      type: extractShotType(analysis),
      duration,
      description: extractDescription(analysis)
    };
  });

  const effects = detectEffects(frameAnalyses);
  const music = parseMusicAnalysis(audioAnalysis.analysis);
  const contentStructure = generateContentStructure(frameAnalyses, audioAnalysis);

  return {
    contentStructure,
    hook: extractHook(frameAnalyses[0]),
    duration: `${frames.length}s`,
    shots,
    effects,
    music
  };
}

function extractShotType(analysis) {
  // Extract shot type from GPT-4 Vision analysis
  const shotTypes = ['close-up', 'medium shot', 'wide shot', 'extreme close-up', 'long shot'];
  const match = shotTypes.find(type => analysis.toLowerCase().includes(type));
  return match ? match.charAt(0).toUpperCase() + match.slice(1) : 'Medium Shot';
}

function extractDescription(analysis) {
  // Extract main visual elements and text overlays
  return analysis.split('\n')
    .filter(line => line.includes('visual elements') || line.includes('text overlay'))
    .join(' ');
}

function detectEffects(frameAnalyses) {
  const effects = [];
  
  frameAnalyses.forEach((analysis, index) => {
    if (analysis.toLowerCase().includes('effect') || analysis.toLowerCase().includes('transition')) {
      effects.push({
        name: 'Visual Effect',
        description: analysis.split('\n').find(line => line.toLowerCase().includes('effect'))?.trim() || 'Visual transition',
        timestamps: [`${index}s`]
      });
    }
  });

  return effects;
}

function parseMusicAnalysis(analysis) {
  // Parse the GPT-4 analysis of audio
  const lines = analysis.split('\n');
  return {
    genre: lines.find(line => line.includes('genre'))?.split(':')[1]?.trim() || 'Background Music',
    bpm: parseInt(lines.find(line => line.includes('BPM'))?.split(':')[1]?.trim() || '120'),
    energy: lines.find(line => line.includes('Energy'))?.split(':')[1]?.trim() || 'Medium',
    mood: lines.find(line => line.includes('mood'))?.split(':')[1]?.trim() || 'Neutral'
  };
}

function generateContentStructure(frameAnalyses, audioAnalysis) {
  // Combine frame and audio analyses to generate content structure
  const visualElements = new Set(frameAnalyses.flatMap(analysis => 
    analysis.split('\n')
      .filter(line => line.includes('visual elements') || line.includes('purpose'))
      .map(line => line.split(':')[1]?.trim())
      .filter(Boolean)
  ));

  const audioMood = audioAnalysis.analysis ? parseMusicAnalysis(audioAnalysis.analysis).mood : 'N/A';
  
  return `This video has a ${audioMood} mood, featuring visual elements such as: ${Array.from(visualElements).join(', ')}.`;
}

function extractHook(firstFrameAnalysis) {
  // Extract hook from the first frame's analysis
  const purposeLine = firstFrameAnalysis.split('\n').find(line => line.includes('purpose'));
  return purposeLine ? purposeLine.split(':')[1]?.trim() : 'Engaging opening';
}

async function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Cleaned up:', filePath);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

export async function POST(request) {
  let videoPath = '';
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    videoPath = await downloadVideo(url);
    const analysis = await analyzeVideo(videoPath);
    
    // Final cleanup
    await cleanupFile(videoPath);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('API Error:', error);
    
    // Ensure cleanup even on error
    if (videoPath) {
      await cleanupFile(videoPath);
    }

    // Clean up frames directory if it exists
    const framesDir = path.join(process.cwd(), 'temp', 'frames');
    if (fs.existsSync(framesDir)) {
      fs.rmSync(framesDir, { recursive: true, force: true });
    }
    
    return NextResponse.json({ error: 'Failed to analyze video', details: error.message }, { status: 500 });
  }
}
