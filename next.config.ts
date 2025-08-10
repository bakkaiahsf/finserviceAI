import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Docker optimization: Enable standalone mode for container deployment (disabled for dev)
  // output: 'standalone',
  
  // Performance optimizations
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    nodeMiddleware: true
  },

  // Production optimizations
  poweredByHeader: false,
  generateEtags: false,
  
  // Security headers for production
  async headers() {
    return [
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
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // Webpack optimizations for Docker builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
