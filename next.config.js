/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false,
    optimizeServerReact: false,
    turbotrace: {
      logLevel: 'error'
    }
  },
  webpack: (config, { dev, isServer }) => {
    // 🚀 PERFORMANCE FIX: Enable basic caching (simplified to avoid exports issues)
    if (dev) {
      // Development: Use memory cache
      config.cache = {
        type: 'memory'
      };
    } else {
      // Production: Use filesystem cache
      config.cache = {
        type: 'filesystem'
      };
    }
    
    // Basic infrastructure logging
    config.infrastructureLogging = {
      level: 'error'
    };
    
    return config;
  },
  // Ensure proper module resolution
  transpilePackages: [],
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
