import { NextResponse } from 'next/server';

// In-memory progress tracking (in production, use Redis or database)
const progressStore = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');
  
  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }
  
  const progress = progressStore.get(requestId) || {
    phase: 'initializing',
    progress: 0,
    message: 'Starting analysis...',
    details: {}
  };
  
  return NextResponse.json(progress);
}

export async function POST(request) {
  const { requestId, phase, progress, message, details } = await request.json();
  
  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }
  
  progressStore.set(requestId, {
    phase,
    progress,
    message,
    details,
    timestamp: Date.now()
  });
  
  return NextResponse.json({ success: true });
}

// Clean up old progress entries (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, value] of progressStore.entries()) {
    if (value.timestamp < oneHourAgo) {
      progressStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes 