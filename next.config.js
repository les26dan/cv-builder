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
    // Completely disable caching to prevent module errors
    config.cache = false;
    
    // Disable persistent caching
    config.infrastructureLogging = {
      level: 'error'
    };
    
    // Force fresh module resolution
    config.snapshot = {
      managedPaths: [],
      immutablePaths: [],
      buildDependencies: {
        hash: true,
        timestamp: true
      }
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
