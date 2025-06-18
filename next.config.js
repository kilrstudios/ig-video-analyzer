/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Define public runtime config for better environment variable access
  publicRuntimeConfig: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Image optimization settings
  images: {
    domains: [
      'localhost',
      'instagram.com',
      'www.instagram.com',
      'scontent.cdninstagram.com',
      'scontent-atl3-2.cdninstagram.com',
      'scontent-atl3-1.cdninstagram.com',
      'video.xx.fbcdn.net',
      'scontent.xx.fbcdn.net'
    ],
    unoptimized: false
  },
  
  // Polyfill configuration for browser compatibility
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // This helps with client-side environment variable loading
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        child_process: false,
        tls: false,
      };
    }
    
    // Ensure environment variables are properly injected at build time
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL),
        'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      })
    );
    
    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: '/api/proxy/:path*',
      },
    ];
  },
}

module.exports = nextConfig
