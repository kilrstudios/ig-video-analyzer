import { NextResponse } from 'next/server';
import { getProgress, setProgress } from '../../../lib/progressStore.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');
  
  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }
  
  const progress = getProgress(requestId);
  return NextResponse.json(progress);
}

export async function POST(request) {
  const { requestId, phase, progress, message, details } = await request.json();
  
  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }
  
  const success = setProgress(requestId, {
    phase,
    progress,
    message,
    details
  });
  
  return NextResponse.json({ success });
} 