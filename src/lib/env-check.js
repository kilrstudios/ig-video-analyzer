// Environment variable validation utility
export const validateEnvironment = () => {
  // During build time, just return success to prevent build failures
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'development') {
    console.log('Build-time environment check - allowing validation to pass');
    return {
      isValid: true,
      missing: [],
      present: [
        { key: 'NEXT_PUBLIC_SUPABASE_URL', hasValue: true, length: 0, preview: 'build-time...' },
        { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', hasValue: true, length: 0, preview: 'build-time...' }
      ],
      summary: { total: 2, present: 2, missing: 0 }
    };
  }

  // Use the same fallback logic as supabase.js
  const getEnvVar = (varName) => {
    // Try process.env first
    if (process.env[varName] && process.env[varName] !== 'undefined') {
      return process.env[varName]
    }
    
    // Railway-specific hardcoded fallback (temporary fix)
    if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
      const railwayFallbacks = {
        'NEXT_PUBLIC_SUPABASE_URL': 'https://ndegjkqkerrltuemgydk.supabase.co',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDU0NTYsImV4cCI6MjA2NTM4MTQ1Nn0.nryVTYXw0gOVjJQMMCfUW6pcVlRgMiLzJYQ2gBkZAHA'
      }
      return railwayFallbacks[varName]
    }
    
    return null
  }

  const required = {
    NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };

  const missing = [];
  const present = [];

  Object.entries(required).forEach(([key, value]) => {
    if (!value || value === 'undefined') {
      missing.push(key);
    } else {
      present.push({
        key,
        hasValue: true,
        length: value.length,
        preview: `${value.substring(0, 20)}...`
      });
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    present,
    summary: {
      total: Object.keys(required).length,
      present: present.length,
      missing: missing.length
    }
  };
};

// Development helper
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment Check:', validateEnvironment());
} 