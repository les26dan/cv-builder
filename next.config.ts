import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed output: 'export' to support API routes
  // trailingSlash: true, // Disabled — causes 308 redirect on API POST routes, breaking login/auth
  images: {
    unoptimized: true
  },
  
  // PERMANENT FIX: Enhanced webpack configuration for navigation stability
  webpack: (config, { isServer }) => {
    // Fix: Prevent file system access issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Fix: Better module resolution for navigation
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './',
    };

    // Fix: Improved caching for stability
    // Note: Removed explicit cache config to prevent next.config.compiled.js resolution issues
    // Next.js handles filesystem caching automatically

    return config;
  },

  // Fix: Server external packages for PDF/DOCX processing
  serverExternalPackages: ['pdf-parse', 'mammoth'],

  // Fix: TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Fix: ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Fix: Enhanced experimental features for navigation stability
  experimental: {
    optimizePackageImports: ['lodash'],
    optimizeServerReact: false,
  },

  // Fix: Asset optimization to prevent 500 errors
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Fix: Compression and performance
  compress: true,
  poweredByHeader: false,

  // Fix: Headers for better asset loading
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
