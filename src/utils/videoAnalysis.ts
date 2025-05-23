import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

const execAsync = promisify(exec);

// Configure OpenAI with API key from environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Frame {
  path: string;
  timestamp: number;
  isKeyFrame: boolean;
}

interface ShotAnalysis {
  timestamp: string;
  shotType: string;           // e.g., "Mid shot", "Close-up"
  composition: {
    framing: string;         // Description of how the subject is framed
    background: string;      // Description of the background elements
    lighting: string;        // Lighting analysis
    colors: string[];        // Key colors used
  };
  visualElements: {
    mainSubject: string;     // Description of the main subject
    props: string[];         // Key props or objects in frame
    graphicElements: string[]; // Text overlays, effects, etc.
    clothing: string;        // Description of clothing/styling
  };
  audioElements: {
    dialogue: string | null;  // Transcribed dialogue
    musicStyle: string | null; // Description of music if present
    soundEffects: string[] | null; // Any notable sound effects
  };
  editingTechniques: {
    transitions: string[];    // Types of transitions used
    effects: string[];       // Visual effects or manipulations
    pacing: string;          // Description of editing pace
  };
  purpose: {
    narrative: string;       // How this shot contributes to the story
    emotional: string;       // Intended emotional impact
    technical: string;       // Technical purpose of the shot
  };
}

interface VideoAnalysis {
  title: string;
  duration: string;
  overallStyle: {
    visualTheme: string;
    editingStyle: string;
    musicStyle: string;
    pacing: string;
  };
  shots: ShotAnalysis[];
}

export async function analyzeVideo(videoUrl: string): Promise<VideoAnalysis> {
  const workDir = path.join(process.cwd(), 'temp', Date.now().toString());
  await fs.mkdir(workDir, { recursive: true });

  try {
    // 1. Download video
    const videoPath = await downloadVideo(videoUrl, workDir);

    // 2. Extract audio and transcribe
    const audioPath = path.join(workDir, 'audio.mp3');
    await execAsync(`ffmpeg -i ${videoPath} -q:a 0 -map a ${audioPath}`);
    const transcript = await transcribeAudio(audioPath);

    // 3. Detect scene changes for intelligent frame extraction
    const sceneChanges = await detectSceneChanges(videoPath);
    
    // 4. Extract strategic frames
    const frames = await extractStrategicFrames(videoPath, sceneChanges, workDir);

    // 5. Batch analyze frames
    const analysis = await batchAnalyzeFrames(frames, transcript);

    // 6. Cleanup
    await fs.rm(workDir, { recursive: true, force: true });

    return analysis;
  } catch (error) {
    await fs.rm(workDir, { recursive: true, force: true });
    throw error;
  }
}

async function downloadVideo(url: string, workDir: string): Promise<string> {
  const outputPath = path.join(workDir, 'video.mp4');
  await execAsync(`yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4' '${url}' -o '${outputPath}'`);
  return outputPath;
}

async function transcribeAudio(audioPath: string): Promise<string> {
  const audioFile = await fs.readFile(audioPath);
  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });
  return response.text;
}

async function detectSceneChanges(videoPath: string): Promise<number[]> {
  // Use ffmpeg to detect scene changes
  const { stdout } = await execAsync(
    `ffmpeg -i ${videoPath} -vf "select=gt(scene\\,0.3),showinfo" -f null - 2>&1`
  );
  
  // Parse ffmpeg output to get scene change timestamps
  return stdout
    .split('\n')
    .filter(line => line.includes('pts_time'))
    .map(line => {
      const match = line.match(/pts_time:(\d+\.\d+)/);
      return match ? parseFloat(match[1]) : 0;
    })
    .filter(time => time > 0);
}

async function extractStrategicFrames(
  videoPath: string,
  sceneChanges: number[],
  workDir: string
): Promise<Frame[]> {
  const frames: Frame[] = [];
  
  // Extract frame at each scene change
  for (const timestamp of sceneChanges) {
    const framePath = path.join(workDir, `frame_${timestamp}.jpg`);
    await execAsync(
      `ffmpeg -ss ${timestamp} -i ${videoPath} -vframes 1 -q:v 2 ${framePath}`
    );
    frames.push({
      path: framePath,
      timestamp,
      isKeyFrame: true
    });
  }

  // Add intermediate frames if gap is too large
  for (let i = 0; i < sceneChanges.length - 1; i++) {
    const gap = sceneChanges[i + 1] - sceneChanges[i];
    if (gap > 5) { // If more than 5 seconds between scenes
      const midPoint = sceneChanges[i] + gap / 2;
      const framePath = path.join(workDir, `frame_${midPoint}.jpg`);
      await execAsync(
        `ffmpeg -ss ${midPoint} -i ${videoPath} -vframes 1 -q:v 2 ${framePath}`
      );
      frames.push({
        path: framePath,
        timestamp: midPoint,
        isKeyFrame: false
      });
    }
  }

  return frames.sort((a, b) => a.timestamp - b.timestamp);
}

async function batchAnalyzeFrames(
  frames: Frame[],
  transcript: string
): Promise<VideoAnalysis> {
  const shots: ShotAnalysis[] = [];
  const batchSize = 3;
  const batches = [];
  
  for (let i = 0; i < frames.length; i += batchSize) {
    const batch = frames.slice(i, i + batchSize);
    batches.push(batch);
  }
  
  for (const batch of batches) {
    const images = await Promise.all(
      batch.map(async frame => ({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${await fs.readFile(frame.path, 'base64')}`,
        },
      }))
    );

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze these video frames in extreme detail, focusing on:
1. Shot Composition:
   - Shot type (close-up, mid shot, etc.)
   - Framing and camera angles
   - Background elements and lighting
   - Color palette

2. Visual Elements:
   - Main subject description
   - Props and objects
   - Graphic elements (text, overlays)
   - Clothing and styling

3. Audio Elements (based on transcript):
   - Dialogue context
   - Music style if apparent
   - Sound effects

4. Editing Techniques:
   - Transitions
   - Visual effects
   - Pacing and rhythm

5. Purpose:
   - Narrative contribution
   - Emotional impact
   - Technical objectives

Format your analysis to be detailed and specific, noting how each element contributes to the overall storytelling.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these ${batch.length} sequential frames occurring at ${batch.map(f => f.timestamp + 's').join(', ')}. 
Context: The audio transcript during this segment says: "${getTranscriptSegment(transcript, batch[0].timestamp, batch[batch.length - 1].timestamp)}"

Provide a detailed analysis of the shot composition, visual style, audio elements, and editing techniques. Focus on how these elements work together to create meaning and impact.`,
            },
            ...images,
          ],
        },
      ],
      max_tokens: 1000,
    });

    const analysis = response.choices[0].message.content;
    shots.push(parseAnalysis(analysis, batch[0].timestamp));
  }

  // Final pass for overall style analysis
  const overallAnalysis = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Analyze the overall style and themes of the video based on all shots.',
      },
      {
        role: 'user',
        content: `Based on these shots: ${JSON.stringify(shots)}, provide an analysis of the overall:
1. Visual theme and style
2. Editing approach
3. Music and sound design
4. Pacing and rhythm`,
      },
    ],
  });

  return {
    title: 'Video Analysis', // Could be customized
    duration: `${Math.max(...frames.map(f => f.timestamp))}s`,
    overallStyle: parseOverallStyle(overallAnalysis.choices[0].message.content),
    shots,
  };
}

function parseAnalysis(analysis: string, timestamp: number): ShotAnalysis {
  // Helper function to extract content between markers
  const extract = (text: string, start: string, end: string = '\n') => {
    const regex = new RegExp(`${start}(.*?)${end}`, 's');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  // Extract lists (comma-separated items)
  const extractList = (text: string, marker: string): string[] => {
    const content = extract(text, marker);
    return content
      ? content.split(',').map(item => item.trim()).filter(Boolean)
      : [];
  };

  return {
    timestamp: `${timestamp}s`,
    shotType: extract(analysis, 'Shot type:', '\n') || 'Unknown',
    composition: {
      framing: extract(analysis, 'Framing:', '\n'),
      background: extract(analysis, 'Background:', '\n'),
      lighting: extract(analysis, 'Lighting:', '\n'),
      colors: extractList(analysis, 'Colors:'),
    },
    visualElements: {
      mainSubject: extract(analysis, 'Main subject:', '\n'),
      props: extractList(analysis, 'Props:'),
      graphicElements: extractList(analysis, 'Graphic elements:'),
      clothing: extract(analysis, 'Clothing:', '\n'),
    },
    audioElements: {
      dialogue: extract(analysis, 'Dialogue:', '\n'),
      musicStyle: extract(analysis, 'Music style:', '\n'),
      soundEffects: extractList(analysis, 'Sound effects:'),
    },
    editingTechniques: {
      transitions: extractList(analysis, 'Transitions:'),
      effects: extractList(analysis, 'Effects:'),
      pacing: extract(analysis, 'Pacing:', '\n'),
    },
    purpose: {
      narrative: extract(analysis, 'Narrative purpose:', '\n'),
      emotional: extract(analysis, 'Emotional impact:', '\n'),
      technical: extract(analysis, 'Technical purpose:', '\n'),
    },
  };
}

function parseOverallStyle(analysis: string): {
  visualTheme: string;
  editingStyle: string;
  musicStyle: string;
  pacing: string;
} {
  return {
    visualTheme: extract(analysis, 'Visual theme:', '\n'),
    editingStyle: extract(analysis, 'Editing style:', '\n'),
    musicStyle: extract(analysis, 'Music style:', '\n'),
    pacing: extract(analysis, 'Pacing:', '\n'),
  };
}

function extract(text: string, start: string, end: string = '\n'): string {
  const regex = new RegExp(`${start}(.*?)${end}`, 's');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function getTranscriptSegment(transcript: string, startTime: number, endTime: number): string {
  // Simple implementation - could be improved with proper timestamp parsing
  return transcript;
} 