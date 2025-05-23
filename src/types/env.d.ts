declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY: string;
      NODE_ENV: 'development' | 'production' | 'test';
      // Add other environment variables as needed
    }
  }
} 