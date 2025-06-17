// Shared progress store for tracking video analysis progress
// In-memory progress tracking (in production, use Redis or database)
// Use global to ensure singleton across API routes
if (!global.progressStore) {
  global.progressStore = new Map();
}
const progressStore = global.progressStore;

export function setProgress(requestId, { phase, progress, message, details }) {
  if (!requestId) return false;
  
  progressStore.set(requestId, {
    phase,
    progress,
    message,
    details,
    timestamp: Date.now()
  });
  
  return true;
}

export function getProgress(requestId) {
  if (!requestId) return null;
  
  return progressStore.get(requestId) || {
    phase: 'initializing',
    progress: 0,
    message: 'Starting analysis...',
    details: {}
  };
}

export function clearProgress(requestId) {
  if (!requestId) return false;
  
  return progressStore.delete(requestId);
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

export default progressStore; 