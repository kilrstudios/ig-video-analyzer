/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages configuration for Next.js with API routes
  experimental: {
    runtime: 'nodejs',
  },
  
  // Image optimization settings
  images: {
    domains: ['localhost'],
    unoptimized: false
  },
  
  // Environment variables
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
