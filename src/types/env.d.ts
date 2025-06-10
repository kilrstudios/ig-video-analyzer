declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY: string;
      NODE_ENV: 'development' | 'production' | 'test';
      INSTAGRAM_COOKIES: string;
      // Add other environment variables as needed
    }
  }
} 