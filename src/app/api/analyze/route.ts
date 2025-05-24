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

interface UIVideoAnalysis {
  contentStructure: string;
  hook: string;
  duration: string;
  shots: {
    type: string;
    duration: string;
    description: string;
  }[];
  effects: {
    name: string;
    description: string;
    timestamps: string[];
  }[];
  music: {
    genre: string;
    bpm: number;
    energy: string;
    mood: string;
  };
}

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

async function extractFrames(videoPath: string): Promise<string[]> {
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

async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = path.join(process.cwd(), 'temp', `${Date.now()}.mp3`);
  await execAsync(`ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}"`);
  return audioPath;
}

async function analyzeFrame(framePath: string): Promise<any> {
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

async function analyzeAudio(audioPath: string): Promise<any> {
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

async function analyzeVideo(videoPath: string): Promise<UIVideoAnalysis> {
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

function extractShotType(analysis: string): string {
  // Extract shot type from GPT-4 Vision analysis
  const shotTypes = ['close-up', 'medium shot', 'wide shot', 'extreme close-up', 'long shot'];
  const match = shotTypes.find(type => analysis.toLowerCase().includes(type));
  return match ? match.charAt(0).toUpperCase() + match.slice(1) : 'Medium Shot';
}

function extractDescription(analysis: string): string {
  // Extract main visual elements and text overlays
  return analysis.split('\n')
    .filter(line => line.includes('visual elements') || line.includes('text overlay'))
    .join(' ');
}

function detectEffects(frameAnalyses: string[]): any[] {
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

function parseMusicAnalysis(analysis: string): any {
  // Parse the GPT-4 analysis of audio
  const lines = analysis.split('\n');
  return {
    genre: lines.find(line => line.includes('genre'))?.split(':')[1]?.trim() || 'Background Music',
    bpm: parseInt(lines.find(line => line.includes('BPM'))?.split(':')[1]?.trim() || '120'),
    energy: lines.find(line => line.includes('Energy'))?.split(':')[1]?.trim() || 'Medium',
    mood: lines.find(line => line.includes('mood'))?.split(':')[1]?.trim() || 'Neutral'
  };
}

function generateContentStructure(frameAnalyses: string[], audioAnalysis: any): string {
  // Combine frame and audio analyses to generate content structure
  const visualElements = new Set(frameAnalyses.flatMap(analysis => 
    analysis.split('\n')
      .filter(line => line.includes('visual elements') || line.includes('purpose'))
      .map(line => line.split(':')[1]?.trim())
      .filter(Boolean)
  ));

  return Array.from(visualElements).join('. ');
}

function extractHook(firstFrameAnalysis: string): string {
  // Extract hook from the first frame analysis
  return firstFrameAnalysis.split('\n')
    .find(line => line.includes('purpose'))?.split(':')[1]?.trim() || 'Visual opening hook';
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

    // Download video
    downloadedFilePath = await downloadVideo(url);
    console.log('Video downloaded to:', downloadedFilePath);

    // Analyze video using OpenAI
    const analysis = await analyzeVideo(downloadedFilePath);

    // Clean up
    await cleanupFile(downloadedFilePath);

    return NextResponse.json(analysis);
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