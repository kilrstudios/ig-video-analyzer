// Environment variable validation utility
export const validateEnvironment = () => {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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